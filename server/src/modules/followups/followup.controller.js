'use strict';

const followupService = require('./followup.service');
const { sendSuccess } = require('../../utils/response');

class FollowupController {
  async getAll(req, res, next) {
    try {
      const result = await followupService.getAllFollowups(req.query, req.user);
      return sendSuccess(res, result, 'Followups fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const followup = await followupService.getFollowupById(req.params.id, req.user);
      return sendSuccess(res, { followup }, 'Followup fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const followup = await followupService.createFollowup(req.body, req.user);
      return sendSuccess(res, { followup }, 'Followup created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const followup = await followupService.updateFollowup(req.params.id, req.body, req.user);
      return sendSuccess(res, { followup }, 'Followup updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await followupService.deleteFollowup(req.params.id, req.user);
      return sendSuccess(res, null, 'Followup deleted successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getUpcoming(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 10;
      const followups = await followupService.getUpcoming(req.user._id, limit);
      return sendSuccess(res, { followups }, 'Upcoming followups fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FollowupController();
