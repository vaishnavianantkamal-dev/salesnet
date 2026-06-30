'use strict';

const Installation = require('../../models/Installation.model');
const { AppError } = require('../../middlewares/error.middleware');

class InstallationRepository {
  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options;
    const [data, total] = await Promise.all([
      Installation.find(filter)
        .populate('lead', 'leadId contact.name contact.phone')
        .populate('engineer', 'name email')
        .populate('quotation', 'quotationNo totalAmount')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Installation.countDocuments(filter),
    ]);
    return { data, total };
  }

  async findById(id) {
    const installation = await Installation.findById(id)
      .populate('lead', 'leadId contact.name contact.phone')
      .populate('engineer', 'name email')
      .populate('quotation', 'quotationNo totalAmount')
      .populate('createdBy', 'name email')
      .lean();
    if (!installation) {
      throw new AppError('Installation not found', 404);
    }
    return installation;
  }

  async create(data) {
    const installation = new Installation(data);
    await installation.save();
    return installation.toObject();
  }

  async updateById(id, data) {
    const updated = await Installation.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate('lead', 'leadId contact.name contact.phone')
      .populate('engineer', 'name email')
      .populate('quotation', 'quotationNo totalAmount')
      .populate('createdBy', 'name email')
      .lean();
    if (!updated) {
      throw new AppError('Installation not found', 404);
    }
    return updated;
  }

  async findByEngineer(engineerId, query = {}) {
    const filter = { engineer: engineerId, ...query };
    const [data, total] = await Promise.all([
      Installation.find(filter)
        .populate('lead', 'leadId contact.name contact.phone')
        .populate('engineer', 'name email')
        .populate('quotation', 'quotationNo totalAmount')
        .sort({ visitDate: 1 })
        .lean(),
      Installation.countDocuments(filter),
    ]);
    return { data, total };
  }

  async findByLead(leadId) {
    return Installation.find({ lead: leadId })
      .populate('engineer', 'name email')
      .populate('quotation', 'quotationNo totalAmount')
      .populate('createdBy', 'name email')
      .sort({ visitDate: -1 })
      .lean();
  }
}

module.exports = new InstallationRepository();
