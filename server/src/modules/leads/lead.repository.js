'use strict';

const Lead = require('../../models/Lead.model');
const { AppError } = require('../../middlewares/error.middleware');

class LeadRepository {
  /**
   * Find all leads matching filter with pagination/sort options.
   * @param {Object} filter - Mongoose filter object
   * @param {Object} options - { skip, limit, sort }
   * @returns {{ data: Lead[], total: number }}
   */
  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options;

    const baseFilter = { isDeleted: false, ...filter };

    const [data, total] = await Promise.all([
      Lead.find(baseFilter)
        .populate('assignedTo', 'firstName lastName email phone')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments(baseFilter),
    ]);

    return { data, total };
  }

  /**
   * Find a single lead by its MongoDB _id.
   * Throws 404 if not found or soft-deleted.
   */
  async findById(id) {
    const lead = await Lead.findOne({ _id: id, isDeleted: false })
      .populate('assignedTo', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('deletedBy', 'firstName lastName email');

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    return lead;
  }

  /**
   * Persist a new lead document.
   */
  async create(data) {
    const lead = new Lead(data);
    await lead.save();
    return lead;
  }

  /**
   * Update a lead by id, return the updated document.
   * Throws 404 if not found.
   */
  async updateById(id, data) {
    const lead = await Lead.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email');

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    return lead;
  }

  /**
   * Soft-delete a lead by setting isDeleted=true.
   */
  async softDelete(id, deletedBy) {
    const lead = await Lead.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy,
        },
      },
      { new: true }
    );

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    return lead;
  }

  /**
   * Find the first active (non-deleted) lead by contact phone.
   * Used for duplicate detection.
   */
  async findByPhone(phone) {
    return Lead.findOne({
      'contact.phone': phone,
      isDeleted: false,
    }).lean();
  }

  /**
   * Count documents matching filter (isDeleted:false is always applied).
   */
  async countByFilter(filter = {}) {
    return Lead.countDocuments({ isDeleted: false, ...filter });
  }
}

module.exports = new LeadRepository();
