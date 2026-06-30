'use strict';

const paymentRepository = require('./payment.repository');
const { getPaginationOptions, buildPaginationMeta } = require('../../utils/pagination');

class PaymentService {
  async getAllPayments(query = {}, user) {
    const { page, limit, skip, sort } = getPaginationOptions(query);

    const filter = {};

    if (query.lead) {
      filter.lead = query.lead;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.mode) {
      filter.mode = query.mode;
    }

    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = new Date(query.from);
      if (query.to) filter.createdAt.$lte = new Date(query.to);
    }

    const { data, total } = await paymentRepository.findAll(filter, { skip, limit, sort });

    return {
      payments: data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getPaymentById(id) {
    return paymentRepository.findById(id);
  }

  async createPayment(data, createdBy) {
    const payload = { ...data, createdBy };

    if (payload.status === 'completed' && !payload.paidAt) {
      payload.paidAt = new Date();
    }

    const payment = await paymentRepository.create(payload);
    return payment;
  }

  async updatePayment(id, data) {
    const existing = await paymentRepository.findById(id);

    const updatePayload = { ...data };

    const becomingCompleted =
      data.status === 'completed' && existing.status !== 'completed';

    if (becomingCompleted && !updatePayload.paidAt) {
      updatePayload.paidAt = new Date();
    }

    return paymentRepository.updateById(id, updatePayload);
  }

  async getByLead(leadId) {
    const payments = await paymentRepository.findByLead(leadId);
    return { payments };
  }
}

module.exports = new PaymentService();
