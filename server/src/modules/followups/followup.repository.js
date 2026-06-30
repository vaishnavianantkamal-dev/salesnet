'use strict';

const Followup = require('../../models/Followup.model');
const { AppError } = require('../../middlewares/error.middleware');

class FollowupRepository {
  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 20, sort = { scheduledAt: 1 } } = options;
    const [data, total] = await Promise.all([
      Followup.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('lead', 'leadId contact.name contact.phone')
        .populate('assignedTo', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .lean(),
      Followup.countDocuments(filter),
    ]);
    return { data, total };
  }

  async findById(id) {
    const followup = await Followup.findById(id)
      .populate('lead', 'leadId contact.name contact.phone')
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .lean();
    if (!followup) {
      throw new AppError('Followup not found', 404);
    }
    return followup;
  }

  async create(data) {
    const followup = new Followup(data);
    await followup.save();
    return followup.toObject();
  }

  async updateById(id, data) {
    const updated = await Followup.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate('lead', 'leadId contact.name contact.phone')
      .populate('assignedTo', 'firstName lastName email')
      .lean();
    if (!updated) {
      throw new AppError('Followup not found', 404);
    }
    return updated;
  }

  async deleteById(id) {
    const followup = await Followup.findById(id);
    if (!followup) {
      throw new AppError('Followup not found', 404);
    }
    await Followup.deleteOne({ _id: id });
    return { deleted: true };
  }

  /**
   * findDue — returns all scheduled followups whose reminderAt is in the past
   * and have not yet been acted upon. Used by the reminder worker.
   * @param {Date} now
   */
  async findDue(now) {
    return Followup.find({
      status: 'scheduled',
      reminderAt: { $lte: now },
    })
      .populate('lead', 'leadId contact.name contact.phone')
      .populate('assignedTo', 'firstName lastName email')
      .lean();
  }
}

module.exports = new FollowupRepository();
