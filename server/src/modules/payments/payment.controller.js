'use strict';

const paymentService = require('./payment.service');
const { sendSuccess } = require('../../utils/response');

class PaymentController {
  async getAll(req, res, next) {
    try {
      const result = await paymentService.getAllPayments(req.query, req.user);
      return sendSuccess(res, result, 'Payments fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const payment = await paymentService.getPaymentById(req.params.id);
      return sendSuccess(res, { payment }, 'Payment fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const payment = await paymentService.createPayment(req.body, req.user._id);
      return sendSuccess(res, { payment }, 'Payment created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const payment = await paymentService.updatePayment(req.params.id, req.body);
      return sendSuccess(res, { payment }, 'Payment updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getByLead(req, res, next) {
    try {
      const result = await paymentService.getByLead(req.params.leadId);
      return sendSuccess(res, result, 'Lead payments fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PaymentController();
