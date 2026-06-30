'use strict';

const Quotation = require('../../models/Quotation.model');
const { AppError } = require('../../middlewares/error.middleware');

const POPULATE_OPTS = [
  { path: 'lead', select: 'leadId contact.name contact.email contact.phone contact.company' },
  { path: 'items.product', select: 'name category price gstPercent' },
  { path: 'createdBy', select: 'firstName lastName email' },
];

class QuotationRepository {
  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options;
    const [data, total] = await Promise.all([
      Quotation.find(filter).populate(POPULATE_OPTS).sort(sort).skip(skip).limit(limit).lean(),
      Quotation.countDocuments(filter),
    ]);
    return { data, total };
  }

  async findById(id) {
    const quotation = await Quotation.findById(id).populate(POPULATE_OPTS);
    if (!quotation) {
      throw new AppError('Quotation not found', 404);
    }
    return quotation;
  }

  async findByLead(leadId, options = {}) {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options;
    const filter = { lead: leadId };
    const [data, total] = await Promise.all([
      Quotation.find(filter).populate(POPULATE_OPTS).sort(sort).skip(skip).limit(limit).lean(),
      Quotation.countDocuments(filter),
    ]);
    return { data, total };
  }

  async create(data) {
    const quotation = new Quotation(data);
    await quotation.save();
    await quotation.populate(POPULATE_OPTS);
    return quotation;
  }

  async updateById(id, data) {
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      throw new AppError('Quotation not found', 404);
    }

    Object.assign(quotation, data);
    await quotation.save();
    await quotation.populate(POPULATE_OPTS);
    return quotation;
  }
}

module.exports = new QuotationRepository();
