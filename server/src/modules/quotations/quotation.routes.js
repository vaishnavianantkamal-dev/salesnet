'use strict';

const express = require('express');
const router = express.Router();
const leadQuotationRouter = express.Router({ mergeParams: true });

const quotationController = require('./quotation.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createQuotationSchema, updateQuotationSchema } = require('./quotation.validation');

// ── /api/quotations ──────────────────────────────────────────────────────────

router.get('/', authenticate, authorize('quotations:read'), quotationController.getAll.bind(quotationController));
router.post('/', authenticate, authorize('quotations:create'), validate(createQuotationSchema), quotationController.create.bind(quotationController));
router.get('/:id', authenticate, authorize('quotations:read'), quotationController.getById.bind(quotationController));
router.get('/:id/pdf', authenticate, authorize('quotations:read'), quotationController.getPDF.bind(quotationController));
router.put('/:id', authenticate, authorize('quotations:update'), validate(updateQuotationSchema), quotationController.update.bind(quotationController));

// ── /api/leads/:leadId/quotations ────────────────────────────────────────────
// leadQuotationRouter is mounted separately in app.js with mergeParams enabled

leadQuotationRouter.get('/', authenticate, authorize('quotations:read'), quotationController.getByLead.bind(quotationController));

module.exports = router;
module.exports.leadQuotationRouter = leadQuotationRouter;
