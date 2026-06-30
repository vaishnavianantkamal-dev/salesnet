'use strict';

const quotationService = require('./quotation.service');
const { sendSuccess } = require('../../utils/response');

class QuotationController {
  async getAll(req, res, next) {
    try {
      const result = await quotationService.getAllQuotations(req.query, req.user);
      return sendSuccess(res, result, 'Quotations fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const quotation = await quotationService.getQuotationById(req.params.id);
      return sendSuccess(res, { quotation }, 'Quotation fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const createdBy = req.user?._id;
      const quotation = await quotationService.createQuotation(req.body, createdBy);
      return sendSuccess(res, { quotation }, 'Quotation created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const quotation = await quotationService.updateQuotation(req.params.id, req.body);
      return sendSuccess(res, { quotation }, 'Quotation updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getByLead(req, res, next) {
    try {
      const result = await quotationService.getQuotationsByLead(req.params.leadId, req.query);
      return sendSuccess(res, result, 'Lead quotations fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getPDF(req, res, next) {
    try {
      const { quotation, html } = await quotationService.generatePDF(req.params.id);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="quotation-${quotation.quotationNo}.html"`
      );
      return res.send(html);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new QuotationController();
