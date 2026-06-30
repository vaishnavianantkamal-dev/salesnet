'use strict';

const quotationRepository = require('./quotation.repository');
const { AppError } = require('../../middlewares/error.middleware');
const { getPaginationOptions, buildPaginationMeta } = require('../../utils/pagination');

class QuotationService {
  async getAllQuotations(query = {}, user = null) {
    const { page, limit, skip, sort } = getPaginationOptions(query);

    const filter = {};

    if (query.lead) {
      filter.lead = query.lead;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.createdBy) {
      filter.createdBy = query.createdBy;
    }

    const { data, total } = await quotationRepository.findAll(filter, { skip, limit, sort });

    return {
      quotations: data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getQuotationById(id) {
    return quotationRepository.findById(id);
  }

  async getQuotationsByLead(leadId, query = {}) {
    const { page, limit, skip, sort } = getPaginationOptions(query);
    const { data, total } = await quotationRepository.findByLead(leadId, { skip, limit, sort });
    return {
      quotations: data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async createQuotation(data, createdBy = null) {
    return quotationRepository.create({ ...data, createdBy });
  }

  async updateQuotation(id, data) {
    await quotationRepository.findById(id);

    const allowedFields = ['items', 'discountPercent', 'terms', 'status', 'pdfUrl', 'validUntil', 'lead'];
    const safeUpdate = {};
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        safeUpdate[field] = data[field];
      }
    });

    return quotationRepository.updateById(id, safeUpdate);
  }

  async generatePDF(id) {
    // TODO: Actual PDF generation requires pdfkit or puppeteer.
    // This method returns a structured HTML string representing the quotation.
    // To produce a real PDF, pipe the HTML through puppeteer's page.pdf()
    // or render with pdfkit and return a Buffer.

    const quotation = await quotationRepository.findById(id);
    const lead = quotation.lead || {};
    const contactName = lead.contact ? lead.contact.name || '' : '';
    const contactCompany = lead.contact ? lead.contact.company || '' : '';

    const itemRows = (quotation.items || [])
      .map(
        (item, idx) =>
          `<tr>
            <td>${idx + 1}</td>
            <td>${item.productName || (item.product && item.product.name) || ''}</td>
            <td>${item.qty}</td>
            <td>${item.unitPrice.toFixed(2)}</td>
            <td>${item.gstPercent}%</td>
            <td>${item.totalPrice.toFixed(2)}</td>
          </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Quotation ${quotation.quotationNo}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #2c3e50; }
    .meta { margin-bottom: 20px; }
    .meta span { display: inline-block; width: 160px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f5f5f5; }
    .totals { margin-top: 20px; text-align: right; }
    .totals div { margin: 4px 0; }
    .totals .grand-total { font-size: 1.2em; font-weight: bold; }
    .terms { margin-top: 30px; font-size: 0.9em; color: #555; }
  </style>
</head>
<body>
  <h1>Quotation</h1>
  <div class="meta">
    <div><span>Quotation No:</span> ${quotation.quotationNo}</div>
    <div><span>Date:</span> ${new Date(quotation.createdAt).toLocaleDateString('en-IN')}</div>
    ${quotation.validUntil ? `<div><span>Valid Until:</span> ${new Date(quotation.validUntil).toLocaleDateString('en-IN')}</div>` : ''}
    <div><span>Status:</span> ${quotation.status}</div>
    <div><span>Client:</span> ${contactName}${contactCompany ? ` (${contactCompany})` : ''}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Product / Service</th>
        <th>Qty</th>
        <th>Unit Price (₹)</th>
        <th>GST %</th>
        <th>Total (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal: </span>₹${quotation.subtotal.toFixed(2)}</div>
    <div><span>Discount (${quotation.discountPercent}%): </span>-₹${quotation.discountAmount.toFixed(2)}</div>
    <div><span>GST: </span>₹${quotation.gstAmount.toFixed(2)}</div>
    <div class="grand-total"><span>Total: </span>₹${quotation.total.toFixed(2)}</div>
  </div>

  ${quotation.terms ? `<div class="terms"><strong>Terms &amp; Conditions:</strong><br/>${quotation.terms}</div>` : ''}
</body>
</html>`;

    return { quotation, html };
  }
}

module.exports = new QuotationService();
