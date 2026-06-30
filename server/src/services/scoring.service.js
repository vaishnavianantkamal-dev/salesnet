'use strict';

const Lead = require('../models/Lead.model');
const LeadScore = require('../models/LeadScore.model');
const ScoringRule = require('../models/ScoringRule.model');
const Activity = require('../models/Activity.model');
const { AppError } = require('../middlewares/error.middleware');
const { ACTIVITY_TYPES, TEMPERATURES } = require('../utils/constants');
const { getIO } = require('../config/socket');
const logger = require('../utils/logger');

// ─── Temperature classification thresholds ───────────────────────────────────

const HOT_THRESHOLD = 90;
const WARM_THRESHOLD = 60;

/**
 * Classify a numeric score (0-100) into a temperature label.
 * @param {number} score
 * @returns {'hot'|'warm'|'cold'}
 */
function classifyTemperature(score) {
  if (score >= HOT_THRESHOLD) return TEMPERATURES.HOT;
  if (score >= WARM_THRESHOLD) return TEMPERATURES.WARM;
  return TEMPERATURES.COLD;
}

// ─── Service class ───────────────────────────────────────────────────────────

class ScoringService {
  /**
   * Apply a scoring event to a lead.
   *
   * Steps:
   *  1. Look up the ScoringRule for the given event key.
   *  2. Compute new score (clamped to [0, 100]).
   *  3. Classify temperature.
   *  4. Persist score + temperature on the Lead document.
   *  5. Create a LeadScore history entry.
   *  6. Create an Activity record (score_update type).
   *  7. Emit socket event lead:scoreUpdated.
   *
   * @param {string|ObjectId} leadId      - MongoDB _id of the lead
   * @param {string}          eventKey    - One of SCORING_EVENTS values
   * @param {string|null}     performedBy - User _id performing the action (null = system)
   * @returns {Promise<{ lead, leadScore }>}
   */
  async applyEvent(leadId, eventKey, performedBy = null) {
    // 1. Fetch the lead
    const lead = await Lead.findOne({ _id: leadId, isDeleted: false });
    if (!lead) {
      throw new AppError('Lead not found for scoring', 404);
    }

    // 2. Fetch the scoring rule; skip gracefully if none configured
    const rule = await ScoringRule.findOne({ event: eventKey, isActive: true });
    if (!rule) {
      logger.debug(`ScoringService: no active rule for event "${eventKey}", skipping`);
      return null;
    }

    const previousScore = lead.score || 0;
    const rawNewScore = previousScore + rule.points;

    // 3. Clamp to [0, 100]
    const newScore = Math.max(0, Math.min(100, rawNewScore));

    // 4. Classify temperature
    const newTemperature = classifyTemperature(newScore);

    // 5. Save lead
    lead.score = newScore;
    lead.temperature = newTemperature;
    await lead.save();

    // 6. Persist LeadScore history entry
    const leadScore = await LeadScore.create({
      lead: leadId,
      event: eventKey,
      points: rule.points,
      previousScore,
      newScore,
      triggeredBy: performedBy ? 'user' : 'system',
      performedBy: performedBy || null,
    });

    // 7. Create Activity
    try {
      await Activity.create({
        lead: leadId,
        type: ACTIVITY_TYPES.SCORE_UPDATE,
        description: `Score updated from ${previousScore} to ${newScore} (event: ${eventKey}, points: ${rule.points >= 0 ? '+' : ''}${rule.points})`,
        performedBy: performedBy || lead.createdBy || lead.assignedTo,
        metadata: {
          event: eventKey,
          previousScore,
          newScore,
          points: rule.points,
          previousTemperature: null,
          newTemperature,
        },
      });
    } catch (activityErr) {
      // Activity logging must not break scoring
      logger.warn(`ScoringService: failed to create activity — ${activityErr.message}`);
    }

    // 8. Emit socket event
    try {
      const io = getIO();
      const payload = {
        leadId: leadId.toString(),
        leadScore: lead.leadId,
        previousScore,
        newScore,
        temperature: newTemperature,
        event: eventKey,
        points: rule.points,
      };
      // Emit to anyone watching this specific lead room
      io.to(`lead:${leadId}`).emit('lead:scoreUpdated', payload);
      // Also emit to the assigned user's room
      if (lead.assignedTo) {
        io.to(`user:${lead.assignedTo}`).emit('lead:scoreUpdated', payload);
      }
      // Notify super admins
      io.to('role:super_admin').emit('lead:scoreUpdated', payload);
    } catch (socketErr) {
      // Socket may not be initialized in test environments
      logger.debug(`ScoringService: socket emit skipped — ${socketErr.message}`);
    }

    return { lead, leadScore };
  }
}

module.exports = new ScoringService();
