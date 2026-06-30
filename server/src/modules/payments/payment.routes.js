'use strict';

const express = require('express');
const router = express.Router();
const leadPaymentRouter = express.Router({ mergeParams: true });

const paymentController = require('./payment.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createPaymentSchema, updatePaymentSchema } = require('./payment.validation');

// GET /api/payments
router.get(
  '/',
  authenticate,
  authorize('payments:read'),
  paymentController.getAll.bind(paymentController)
);

// GET /api/payments/:id
router.get(
  '/:id',
  authenticate,
  authorize('payments:read'),
  paymentController.getById.bind(paymentController)
);

// POST /api/payments
router.post(
  '/',
  authenticate,
  authorize('payments:create'),
  validate(createPaymentSchema),
  paymentController.create.bind(paymentController)
);

// PUT /api/payments/:id
router.put(
  '/:id',
  authenticate,
  authorize('payments:update'),
  validate(updatePaymentSchema),
  paymentController.update.bind(paymentController)
);

// GET /api/leads/:leadId/payments  (nested route)
leadPaymentRouter.get(
  '/',
  authenticate,
  authorize('payments:read'),
  paymentController.getByLead.bind(paymentController)
);

module.exports = router;
module.exports.leadPaymentRouter = leadPaymentRouter;
