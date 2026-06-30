'use strict';

const dashboardService = require('./dashboard.service');
const { sendSuccess } = require('../../utils/response');

class DashboardController {
  async getSummary(req, res, next) {
    try {
      const data = await dashboardService.getAdminSummary();
      return sendSuccess(res, data, 'Dashboard summary fetched');
    } catch (err) {
      next(err);
    }
  }

  async getMySummary(req, res, next) {
    try {
      const data = await dashboardService.getMySummary(req.user._id);
      return sendSuccess(res, data, 'My dashboard summary fetched');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DashboardController();
