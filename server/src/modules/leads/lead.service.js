'use strict';

const mongoose = require('mongoose');
const leadRepository = require('./lead.repository');
const Activity = require('../../models/Activity.model');
const User = require('../../models/User.model');
const Role = require('../../models/Role.model');
const { AppError } = require('../../middlewares/error.middleware');
const { getPaginationOptions, buildPaginationMeta } = require('../../utils/pagination');
const { LEAD_STAGES, ACTIVITY_TYPES, SCORING_EVENTS } = require('../../utils/constants');
const scoringService = require('../../services/scoring.service');

// ─── Internal helpers ───────────────────────────────────────────────────────

/**
 * Create an Activity document for a given lead.
 */
async function _createActivity(leadId, type, description, performedBy, metadata = {}) {
  const activityData = {
    lead: leadId,
    type,
    description,
    performedBy,
    metadata,
  };
  await Activity.create(activityData);
}

/**
 * Round-robin assignment: pick the active sales_executive who currently has
 * the fewest assigned (non-deleted) leads.
 * Returns null if no eligible user is found.
 */
async function _roundRobinAssignee() {
  const salesExecRole = await Role.findOne({ key: 'sales_executive' }).lean();
  if (!salesExecRole) return null;

  const executives = await User.find({
    role: salesExecRole._id,
    isActive: true,
  })
    .select('_id')
    .lean();

  if (!executives.length) return null;

  // Count leads per executive in parallel
  const counts = await Promise.all(
    executives.map((u) => leadRepository.countByFilter({ assignedTo: u._id }))
  );

  let minCount = Infinity;
  let chosenId = null;
  for (let i = 0; i < executives.length; i++) {
    if (counts[i] < minCount) {
      minCount = counts[i];
      chosenId = executives[i]._id;
    }
  }

  return chosenId;
}

// ─── Service class ───────────────────────────────────────────────────────────

class LeadService {
  /**
   * Paginated list with search, filters, and RBAC scoping.
   * Non-super_admin users only see leads they are assigned to or created.
   */
  async getAllLeads(query = {}, currentUser) {
    const { page, limit, skip, sort } = getPaginationOptions(query);

    const filter = {};

    // RBAC scoping
    const roleKey = currentUser.role?.key;
    if (roleKey !== 'super_admin') {
      filter.$or = [
        { assignedTo: currentUser._id },
        { createdBy: currentUser._id },
      ];
    }

    // Search across contact fields
    if (query.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      const searchConditions = [
        { 'contact.name': regex },
        { 'contact.phone': regex },
        { 'contact.email': regex },
        { 'contact.company': regex },
      ];
      // Merge search with existing $or via $and
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    // Discrete filters
    if (query.source) filter.source = query.source;
    if (query.temperature) filter.temperature = query.temperature;
    if (query.stage) filter.stage = query.stage;
    if (query.assignedTo) filter.assignedTo = query.assignedTo;
    if (query.dateFrom || query.dateTo) {
      filter.createdAt = {};
      if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
    }

    const { data, total } = await leadRepository.findAll(filter, { skip, limit, sort });

    return {
      leads: data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Fetch a single lead. Non-super_admin users may only access leads they are
   * assigned to or created.
   */
  async getLeadById(id, currentUser) {
    const lead = await leadRepository.findById(id);

    const roleKey = currentUser.role?.key;
    if (roleKey !== 'super_admin') {
      const assignedId = lead.assignedTo?._id?.toString() || lead.assignedTo?.toString();
      const createdId = lead.createdBy?._id?.toString() || lead.createdBy?.toString();
      const userId = currentUser._id.toString();
      if (assignedId !== userId && createdId !== userId) {
        throw new AppError('You do not have permission to view this lead', 403);
      }
    }

    return lead;
  }

  /**
   * Create a new lead with duplicate detection, auto-assignment, and scoring.
   */
  async createLead(data, createdBy) {
    // Duplicate check by phone
    if (data.contact && data.contact.phone) {
      const existing = await leadRepository.findByPhone(data.contact.phone);
      if (existing) {
        return { lead: existing, isDuplicate: true };
      }
    }

    // Auto-assign via round-robin if not explicitly provided
    let assignedTo = data.assignedTo || null;
    let assignedAt = null;
    if (!assignedTo) {
      assignedTo = await _roundRobinAssignee();
      if (assignedTo) assignedAt = new Date();
    } else {
      assignedAt = new Date();
    }

    const lead = await leadRepository.create({
      ...data,
      assignedTo,
      assignedAt,
      createdBy,
    });

    // Activity: lead created
    await _createActivity(
      lead._id,
      ACTIVITY_TYPES.NOTE,
      `Lead created for ${lead.contact?.name || lead.contact?.phone}`,
      createdBy,
      { action: 'lead_created' }
    );

    // Scoring: apply lead source event
    try {
      await scoringService.applyEvent(lead._id, SCORING_EVENTS.LEAD_CREATED, createdBy);
    } catch (_err) {
      // Scoring failure must not block lead creation
    }

    // Emit real-time notification
    const { emitToAll } = require('../../config/socket');
    emitToAll('new_lead', lead);

    return { lead, isDuplicate: false };
  }

  /**
   * Update lead fields. If stage changes, creates a stage_changed activity.
   */
  async updateLead(id, data, updatedBy) {
    const existing = await leadRepository.findById(id);

    const updates = { ...data, updatedBy };

    const stageChanged =
      data.stage && data.stage !== existing.stage;

    const lead = await leadRepository.updateById(id, updates);

    if (stageChanged) {
      await _createActivity(
        lead._id,
        ACTIVITY_TYPES.STATUS_CHANGE,
        `Stage changed from "${existing.stage}" to "${data.stage}"`,
        updatedBy,
        { previousStage: existing.stage, newStage: data.stage }
      );
    }

    return lead;
  }

  /**
   * Assign a lead to a specific user. Validates user exists and is active.
   */
  async assignLead(id, assignedToId, assignedBy) {
    const targetUser = await User.findById(assignedToId).populate('role');
    if (!targetUser) {
      throw new AppError('Assigned user not found', 404);
    }
    if (!targetUser.isActive) {
      throw new AppError('Cannot assign lead to an inactive user', 400);
    }

    const lead = await leadRepository.updateById(id, {
      assignedTo: assignedToId,
      assignedAt: new Date(),
      updatedBy: assignedBy,
    });

    await _createActivity(
      lead._id,
      ACTIVITY_TYPES.ASSIGNMENT,
      `Lead assigned to ${targetUser.firstName} ${targetUser.lastName}`,
      assignedBy,
      {
        assignedTo: assignedToId,
        assignedToName: `${targetUser.firstName} ${targetUser.lastName}`,
      }
    );

    return lead;
  }

  /**
   * Change the stage of a lead. Validates against the allowed enum values.
   */
  async changeStage(id, stage, changedBy) {
    const validStages = Object.values(LEAD_STAGES);
    if (!validStages.includes(stage)) {
      throw new AppError(
        `Invalid stage. Must be one of: ${validStages.join(', ')}`,
        400
      );
    }

    const existing = await leadRepository.findById(id);
    const previousStage = existing.stage;

    const lead = await leadRepository.updateById(id, {
      stage,
      updatedBy: changedBy,
    });

    await _createActivity(
      lead._id,
      ACTIVITY_TYPES.STATUS_CHANGE,
      `Stage changed from "${previousStage}" to "${stage}"`,
      changedBy,
      { previousStage, newStage: stage }
    );

    return lead;
  }

  /**
   * Soft-delete a lead.
   */
  async deleteLead(id, deletedBy) {
    return leadRepository.softDelete(id, deletedBy);
  }

  /**
   * Action queue for a sales executive: hot leads + overdue/due follow-ups.
   * Limit: 50 records.
   */
  async getActionQueue(userId) {
    const now = new Date();

    const [hotLeads, followupLeads] = await Promise.all([
      // Hot leads assigned to user
      leadRepository.findAll(
        { assignedTo: userId, temperature: 'hot' },
        { limit: 50, sort: { score: -1 } }
      ),
      // Due or missed follow-ups
      leadRepository.findAll(
        {
          assignedTo: userId,
          followUpDate: { $lte: now },
          stage: {
            $nin: [LEAD_STAGES.WON, LEAD_STAGES.LOST, LEAD_STAGES.JUNK],
          },
        },
        { limit: 50, sort: { followUpDate: 1 } }
      ),
    ]);

    // Merge, deduplicate by _id, cap at 50
    const seen = new Set();
    const merged = [];
    for (const lead of [...hotLeads.data, ...followupLeads.data]) {
      const key = lead._id.toString();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(lead);
        if (merged.length === 50) break;
      }
    }

    return { leads: merged, total: merged.length };
  }

  /**
   * Bulk import leads from an array of row objects (e.g. from CSV parsing).
   * Returns { created, skipped, errors }.
   */
  async importLeads(rows, createdBy) {
    let created = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const result = await this.createLead(row, createdBy);
        if (result.isDuplicate) {
          skipped++;
        } else {
          created++;
        }
      } catch (err) {
        errors.push({
          row: i + 1,
          data: row,
          error: err.message || 'Unknown error',
        });
      }
    }

    return { created, skipped, errors };
  }

  /**
   * Public form submission (no auth). Runs the same pipeline as createLead.
   * The rate-limiting is handled at the route level.
   */
  async createPublicLead(data) {
    // Public submissions use a system actor id (null means system)
    const systemCreator = null;

    // Duplicate check
    if (data.contact && data.contact.phone) {
      const existing = await leadRepository.findByPhone(data.contact.phone);
      if (existing) {
        return { lead: existing, isDuplicate: true };
      }
    }

    // Auto-assign via round-robin
    let assignedTo = null;
    let assignedAt = null;
    const autoAssigned = await _roundRobinAssignee();
    if (autoAssigned) {
      assignedTo = autoAssigned;
      assignedAt = new Date();
    }

    const lead = await leadRepository.create({
      ...data,
      source: data.source || 'website',
      assignedTo,
      assignedAt,
      createdBy: systemCreator,
    });

    // Scoring: no performer for public leads
    try {
      await scoringService.applyEvent(lead._id, SCORING_EVENTS.LEAD_CREATED, null);
    } catch (_err) {
      // Non-blocking
    }

    return { lead, isDuplicate: false };
  }
}

module.exports = new LeadService();
