'use strict';

const followupRepository = require('./followup.repository');
const Lead = require('../../models/Lead.model');
const { AppError } = require('../../middlewares/error.middleware');
const { getPaginationOptions, buildPaginationMeta } = require('../../utils/pagination');

const ADMIN_ROLE_KEYS = ['super_admin', 'admin'];

const isAdmin = (user) => ADMIN_ROLE_KEYS.includes(user.role?.key);

class FollowupService {
  async getAllFollowups(query = {}, user) {
    const { page, limit, skip, sort } = getPaginationOptions(query);

    const filter = {};

    // Non-admin users can only see their own followups
    if (!isAdmin(user)) {
      filter.assignedTo = user._id;
    } else if (query.assignedTo) {
      filter.assignedTo = query.assignedTo;
    }

    if (query.lead) {
      filter.lead = query.lead;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.scheduledAtFrom || query.scheduledAtTo) {
      filter.scheduledAt = {};
      if (query.scheduledAtFrom) {
        filter.scheduledAt.$gte = new Date(query.scheduledAtFrom);
      }
      if (query.scheduledAtTo) {
        filter.scheduledAt.$lte = new Date(query.scheduledAtTo);
      }
    }

    const { data, total } = await followupRepository.findAll(filter, { skip, limit, sort });

    return {
      followups: data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getFollowupById(id, user) {
    const followup = await followupRepository.findById(id);

    if (!isAdmin(user) && String(followup.assignedTo?._id || followup.assignedTo) !== String(user._id)) {
      throw new AppError('You are not authorized to view this followup', 403);
    }

    return followup;
  }

  async createFollowup(data, createdBy) {
    const followupData = {
      ...data,
      createdBy: createdBy._id,
    };

    const followup = await followupRepository.create(followupData);

    // Update the lead's followUpDate to keep it in sync with the next scheduled followup
    if (followupData.scheduledAt) {
      await Lead.findByIdAndUpdate(followupData.lead, {
        followUpDate: new Date(followupData.scheduledAt),
      });
    }

    return followup;
  }

  async updateFollowup(id, data, user) {
    const followup = await followupRepository.findById(id);

    if (!isAdmin(user) && String(followup.assignedTo?._id || followup.assignedTo) !== String(user._id)) {
      throw new AppError('You are not authorized to update this followup', 403);
    }

    const updateData = { ...data };
    if (!isAdmin(user)) {
      delete updateData.assignedTo;
      delete updateData.lead;
    }

    const updated = await followupRepository.updateById(id, updateData);

    // Sync lead's followUpDate when scheduledAt changes
    if (updateData.scheduledAt) {
      const leadId = updated.lead?._id || updated.lead || followup.lead?._id || followup.lead;
      await Lead.findByIdAndUpdate(leadId, {
        followUpDate: new Date(updateData.scheduledAt),
      });
    }

    return updated;
  }

  async deleteFollowup(id, user) {
    const followup = await followupRepository.findById(id);

    if (!isAdmin(user) && String(followup.assignedTo?._id || followup.assignedTo) !== String(user._id)) {
      throw new AppError('You are not authorized to delete this followup', 403);
    }

    return followupRepository.deleteById(id);
  }

  /**
   * getUpcoming — returns the next N scheduled followups for a given user,
   * ordered by scheduledAt ascending.
   * @param {string|ObjectId} userId
   * @param {number} [limitCount=10]
   */
  async getUpcoming(userId, limitCount = 10) {
    const filter = {
      assignedTo: userId,
      status: 'scheduled',
      scheduledAt: { $gte: new Date() },
    };

    const { data } = await followupRepository.findAll(filter, {
      skip: 0,
      limit: limitCount,
      sort: { scheduledAt: 1 },
    });

    return data;
  }
}

module.exports = new FollowupService();
