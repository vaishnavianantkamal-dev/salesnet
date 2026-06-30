'use strict';

const { Worker } = require('bullmq');
const { createBullMQConnection } = require('../config/redis');
const logger = require('../utils/logger');
const Followup = require('../models/Followup.model');
const Notification = require('../models/Notification.model');
const Lead = require('../models/Lead.model');
const { SCORING_EVENTS } = require('../utils/constants');

let worker = null;

// ─── Job handlers ─────────────────────────────────────────────────────────────

/**
 * check_followups:
 *   Finds all Followup docs where scheduledAt <= now and status='scheduled'.
 *   Marks each as 'missed' and creates a follow_up_reminder notification
 *   for the assignedTo user.
 */
async function handleCheckFollowups() {
  const now = new Date();

  const overdueFollowups = await Followup.find({
    scheduledAt: { $lte: now },
    status: 'scheduled',
  }).lean();

  if (overdueFollowups.length === 0) {
    logger.info('[reminder.worker] check_followups: no overdue followups found');
    return { processed: 0 };
  }

  logger.info(`[reminder.worker] check_followups: found ${overdueFollowups.length} overdue followup(s)`);

  const ids = overdueFollowups.map((f) => f._id);

  // Bulk mark as missed
  await Followup.updateMany({ _id: { $in: ids } }, { $set: { status: 'missed' } });

  // Create notifications in bulk
  const notifications = overdueFollowups.map((followup) => ({
    recipient: followup.assignedTo,
    type: 'follow_up_reminder',
    title: 'Missed Follow-up',
    body: `A scheduled follow-up was missed. It was due on ${new Date(followup.scheduledAt).toLocaleString()}.`,
    data: {
      followupId: followup._id,
      leadId: followup.lead,
      scheduledAt: followup.scheduledAt,
    },
  }));

  await Notification.insertMany(notifications, { ordered: false });

  logger.info(
    `[reminder.worker] check_followups: marked ${ids.length} followup(s) as missed, created ${notifications.length} notification(s)`
  );

  return { processed: ids.length };
}

/**
 * send_nudge:
 *   Finds leads with no inbound reply for 7+ days and applies
 *   the 'no_reply_7days' scoring event via scoringService.
 *
 *   NOTE: SCORING_EVENTS in constants.js does not currently define 'no_reply_7days'.
 *   The scoring rule for this event must be seeded separately. The worker will
 *   still call applyEvent; it will simply skip if no active rule exists.
 */
async function handleSendNudge() {
  const NO_REPLY_DAYS = 7;
  const cutoffDate = new Date(Date.now() - NO_REPLY_DAYS * 24 * 60 * 60 * 1000);

  // We look for leads that are still active and were created/updated before the cutoff.
  // Checking for "no reply" requires a join with Conversation; we use a subquery approach.
  const Conversation = require('../models/Conversation.model');

  // Get all lead IDs that HAVE an inbound reply
  const leadIdsWithReply = await Conversation.distinct('lead', { direction: 'inbound' });

  // Active leads with no inbound reply, older than cutoff
  const leads = await Lead.find({
    isDeleted: false,
    createdAt: { $lte: cutoffDate },
    _id: { $nin: leadIdsWithReply },
  })
    .select('_id assignedTo')
    .lean();

  if (leads.length === 0) {
    logger.info('[reminder.worker] send_nudge: no leads requiring nudge');
    return { nudged: 0 };
  }

  logger.info(`[reminder.worker] send_nudge: applying no_reply_7days event to ${leads.length} lead(s)`);

  // Dynamic import to avoid circular dependency at module load
  const scoringService = require('../services/scoring.service');

  let nudged = 0;
  for (const lead of leads) {
    try {
      await scoringService.applyEvent(lead._id, 'no_reply_7days', null);
      nudged++;
    } catch (err) {
      logger.warn(`[reminder.worker] send_nudge: failed for leadId=${lead._id}: ${err.message}`);
    }
  }

  logger.info(`[reminder.worker] send_nudge: nudge events applied to ${nudged} lead(s)`);
  return { nudged };
}

// ─── Job dispatcher ───────────────────────────────────────────────────────────

async function processJob(job) {
  const { type } = job.data;

  logger.info(`[reminder.worker] Processing job id=${job.id} type=${type}`);

  if (type === 'check_followups') {
    return handleCheckFollowups();
  }

  if (type === 'send_nudge') {
    return handleSendNudge();
  }

  logger.warn(`[reminder.worker] Unknown job type: ${type}`);
  throw new Error(`Unknown reminder job type: ${type}`);
}

// ─── Worker initialization ────────────────────────────────────────────────────

try {
  worker = new Worker('reminder', processJob, {
    connection: createBullMQConnection(),
    concurrency: 2,
  });

  worker.on('completed', (job, result) => {
    logger.info(`[reminder.worker] Job ${job.id} completed: ${JSON.stringify(result)}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[reminder.worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.error(`[reminder.worker] Worker error: ${err.message}`);
  });

  logger.info('[reminder.worker] Worker started on queue: reminder');
} catch (err) {
  logger.warn(`[reminder.worker] Worker not started — Redis unavailable: ${err.message}`);
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown() {
  if (worker) {
    logger.info('[reminder.worker] Shutting down gracefully...');
    try {
      await worker.close();
      logger.info('[reminder.worker] Worker closed');
    } catch (err) {
      logger.error(`[reminder.worker] Error during shutdown: ${err.message}`);
    }
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = { worker, shutdown };
