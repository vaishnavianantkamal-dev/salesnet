'use strict';

const express = require('express');
const router = express.Router();

const dashboardController = require('./dashboard.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

// GET /api/dashboard/summary — admin/super_admin view
router.get('/summary', authenticate, dashboardController.getSummary.bind(dashboardController));

// GET /api/dashboard/my-summary — per-user view (sales exec, installer)
router.get('/my-summary', authenticate, dashboardController.getMySummary.bind(dashboardController));

module.exports = router;
