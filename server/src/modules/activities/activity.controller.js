'use strict';

const Activity = require('../../models/Activity.model');
const Lead = require('../../models/Lead.model');
const { sendSuccess } = require('../../utils/response');
const { AppError } = require('../../middlewares/error.middleware');
const { getPaginationOptions, buildPaginationMeta } = require('../../utils/pagination');

class ActivityController {
  /**
   * GET /leads/:leadId/activities
   * Returns a paginated, reverse-chronological activity timeline for a lead.
   */
  async getByLead(req, res, next) {
    try {
      const { leadId } = req.params;

      const lead = await Lead.findOne({ _id: leadId, isDeleted: false }).lean();
      if (!lead) {
        return next(new AppError('Lead not found', 404));
      }

      const { page, limit, skip } = getPaginationOptions(req.query);

      const [activities, total] = await Promise.all([
        Activity.find({ lead: leadId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('performedBy', 'name email')
          .lean(),
        Activity.countDocuments({ lead: leadId }),
      ]);

      const meta = buildPaginationMeta(total, page, limit);

      return sendSuccess(
        res,
        { activities, meta },
        'Activities fetched successfully',
        200
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /leads/:leadId/activities
   * Creates a manual 'note' type activity authored by the authenticated user.
   */
  async createNote(req, res, next) {
    try {
      const { leadId } = req.params;
      const { description } = req.body;

      const lead = await Lead.findOne({ _id: leadId, isDeleted: false }).lean();
      if (!lead) {
        return next(new AppError('Lead not found', 404));
      }

      const activity = await Activity.create({
        lead: leadId,
        type: 'note',
        description,
        performedBy: req.user._id || req.user.userId,
        metadata: {},
      });

      await activity.populate('performedBy', 'name email');

      return sendSuccess(res, { activity }, 'Note created successfully', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ActivityController();
