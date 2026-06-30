'use strict';

const express = require('express');
const router = express.Router();

const reportsController = require('./reports.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');

// All report routes require authentication and reports:view permission
router.use(authenticate, authorize('reports:view'));

// GET /api/reports/lead-source
router.get('/lead-source', reportsController.getLeadSourceReport.bind(reportsController));

// GET /api/reports/sales
router.get('/sales', reportsController.getSalesReport.bind(reportsController));

// GET /api/reports/executive
router.get('/executive', reportsController.getExecutiveReport.bind(reportsController));

// GET /api/reports/campaign-roi
router.get('/campaign-roi', reportsController.getCampaignRoi.bind(reportsController));

module.exports = router;
