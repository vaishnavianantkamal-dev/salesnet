'use strict';

const Payment = require('../../models/Payment.model');
const { AppError } = require('../../middlewares/error.middleware');

class PaymentRepository {
  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options;
    const [data, total] = await Promise.all([
      Payment.find(filter)
        .populate('lead', 'leadId contact.name contact.phone')
        .populate('quotation', 'quotationNo totalAmount')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(filter),
    ]);
    return { data, total };
  }

  async findById(id) {
    const payment = await Payment.findById(id)
      .populate('lead', 'leadId contact.name contact.phone')
      .populate('quotation', 'quotationNo totalAmount')
      .populate('createdBy', 'name email')
      .lean();
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }
    return payment;
  }

  async create(data) {
    const payment = new Payment(data);
    await payment.save();
    return payment.toObject();
  }

  async updateById(id, data) {
    const updated = await Payment.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate('lead', 'leadId contact.name contact.phone')
      .populate('quotation', 'quotationNo totalAmount')
      .populate('createdBy', 'name email')
      .lean();
    if (!updated) {
      throw new AppError('Payment not found', 404);
    }
    return updated;
  }

  async findByLead(leadId) {
    return Payment.find({ lead: leadId })
      .populate('quotation', 'quotationNo totalAmount')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
  }
}

module.exports = new PaymentRepository();
