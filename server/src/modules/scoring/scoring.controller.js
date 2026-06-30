'use strict';

const ScoringRule = require('../../models/ScoringRule.model');
const { sendSuccess } = require('../../utils/response');
const { AppError } = require('../../middlewares/error.middleware');

class ScoringController {
  async getRules(req, res, next) {
    try {
      const rules = await ScoringRule.find().sort({ event: 1 }).lean();
      return sendSuccess(res, { rules }, 'Scoring rules fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async createRule(req, res, next) {
    try {
      const { event, points, description, isActive } = req.body;
      const rule = await ScoringRule.create({ event, points, description, isActive });
      return sendSuccess(res, { rule }, 'Scoring rule created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateRule(req, res, next) {
    try {
      const { id } = req.params;

      // Only allow updating points, isActive, description — not event key
      const allowedFields = {};
      if (req.body.points !== undefined) allowedFields.points = req.body.points;
      if (req.body.isActive !== undefined) allowedFields.isActive = req.body.isActive;
      if (req.body.description !== undefined) allowedFields.description = req.body.description;

      if (Object.keys(allowedFields).length === 0) {
        return next(new AppError('No updatable fields provided', 400));
      }

      const rule = await ScoringRule.findByIdAndUpdate(
        id,
        { $set: allowedFields },
        { new: true, runValidators: true }
      );

      if (!rule) {
        return next(new AppError('Scoring rule not found', 404));
      }

      return sendSuccess(res, { rule }, 'Scoring rule updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ScoringController();
