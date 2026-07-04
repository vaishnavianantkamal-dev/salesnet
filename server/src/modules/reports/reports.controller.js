'use strict';

const mongoose = require('mongoose');
const Lead = require('../../models/Lead.model');
const Activity = require('../../models/Activity.model');
const Conversation = require('../../models/Conversation.model');
const User = require('../../models/User.model');
const { sendSuccess } = require('../../utils/response');
const { LEAD_STAGES, LEAD_SOURCES } = require('../../utils/constants');

/**
 * Build a $match stage that filters by createdAt within an optional date range.
 * Query params: startDate, endDate (ISO date strings).
 */
const buildDateMatch = (query, fieldName = 'createdAt') => {
  const match = {};
  if (query.startDate || query.endDate) {
    match[fieldName] = {};
    if (query.startDate) match[fieldName].$gte = new Date(query.startDate);
    if (query.endDate) match[fieldName].$lte = new Date(query.endDate);
  }
  return match;
};

class ReportsController {
  /**
   * GET /api/reports/lead-source
   * Count leads grouped by source with won/lost breakdown and optional date range.
   */
  async getLeadSourceReport(req, res, next) {
    try {
      const dateMatch = buildDateMatch(req.query);
      const baseMatch = { isDeleted: false, ...dateMatch };

      const pipeline = [
        { $match: baseMatch },
        {
          $group: {
            _id: '$source',
            total: { $sum: 1 },
            won: {
              $sum: { $cond: [{ $eq: ['$stage', LEAD_STAGES.WON] }, 1, 0] },
            },
            lost: {
              $sum: { $cond: [{ $eq: ['$stage', LEAD_STAGES.LOST] }, 1, 0] },
            },
            estimatedRevenue: {
              $sum: {
                $cond: [
                  { $eq: ['$stage', LEAD_STAGES.WON] },
                  { $ifNull: ['$product.estimatedValue', 0] },
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            source: { $ifNull: ['$_id', 'unknown'] },
            total: 1,
            won: 1,
            lost: 1,
            active: { $subtract: ['$total', { $add: ['$won', '$lost'] }] },
            estimatedRevenue: 1,
            conversionRate: {
              $cond: [
                { $gt: ['$total', 0] },
                {
                  $round: [
                    { $multiply: [{ $divide: ['$won', '$total'] }, 100] },
                    2,
                  ],
                },
                0,
              ],
            },
          },
        },
        { $sort: { total: -1 } },
      ];

      const data = await Lead.aggregate(pipeline);

      // Ensure every known source appears in the result
      const sources = Object.values(LEAD_SOURCES);
      const sourceMap = new Map(data.map((d) => [d.source, d]));
      const report = sources.map((src) =>
        sourceMap.get(src) || {
          source: src,
          total: 0,
          won: 0,
          lost: 0,
          active: 0,
          estimatedRevenue: 0,
          conversionRate: 0,
        }
      );

      return sendSuccess(res, { report }, 'Lead source report fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/reports/sales
   * Summary totals + month-by-month breakdown + conversion rate.
   */
  async getSalesReport(req, res, next) {
    try {
      const dateMatch = buildDateMatch(req.query);
      const baseMatch = { isDeleted: false, ...dateMatch };

      // Overall summary
      const [summary] = await Lead.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalLeads: { $sum: 1 },
            won: { $sum: { $cond: [{ $eq: ['$stage', LEAD_STAGES.WON] }, 1, 0] } },
            lost: { $sum: { $cond: [{ $eq: ['$stage', LEAD_STAGES.LOST] }, 1, 0] } },
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ['$stage', LEAD_STAGES.WON] },
                  { $ifNull: ['$product.estimatedValue', 0] },
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalLeads: 1,
            won: 1,
            lost: 1,
            revenue: 1,
            conversionRate: {
              $cond: [
                { $gt: ['$totalLeads', 0] },
                { $round: [{ $multiply: [{ $divide: ['$won', '$totalLeads'] }, 100] }, 2] },
                0,
              ],
            },
          },
        },
      ]);

      // Month-by-month breakdown
      const monthly = await Lead.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            total: { $sum: 1 },
            won: { $sum: { $cond: [{ $eq: ['$stage', LEAD_STAGES.WON] }, 1, 0] } },
            lost: { $sum: { $cond: [{ $eq: ['$stage', LEAD_STAGES.LOST] }, 1, 0] } },
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ['$stage', LEAD_STAGES.WON] },
                  { $ifNull: ['$product.estimatedValue', 0] },
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            year: '$_id.year',
            month: '$_id.month',
            total: 1,
            won: 1,
            lost: 1,
            revenue: 1,
            conversionRate: {
              $cond: [
                { $gt: ['$total', 0] },
                { $round: [{ $multiply: [{ $divide: ['$won', '$total'] }, 100] }, 2] },
                0,
              ],
            },
          },
        },
        { $sort: { year: 1, month: 1 } },
      ]);

      // Stage breakdown
      const stageGroups = await Lead.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$stage', total: { $sum: 1 } } },
        { $project: { _id: 0, stage: '$_id', total: 1 } },
        { $sort: { total: -1 } },
      ]);

      return sendSuccess(
        res,
        {
          summary: summary || {
            totalLeads: 0, won: 0, lost: 0, revenue: 0, conversionRate: 0,
          },
          monthly,
          stages: stageGroups,
        },
        'Sales report fetched successfully',
        200
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/reports/executive
   * Per sales executive: leads assigned, contacted, won, revenue.
   */
  async getExecutiveReport(req, res, next) {
    try {
      const dateMatch = buildDateMatch(req.query);
      const baseMatch = {
        isDeleted: false,
        assignedTo: { $ne: null },
        ...dateMatch,
      };

      const executives = await Lead.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$assignedTo',
            leadsAssigned: { $sum: 1 },
            contacted: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      '$stage',
                      [
                        LEAD_STAGES.CONTACTED,
                        LEAD_STAGES.QUALIFIED,
                        LEAD_STAGES.PROPOSAL,
                        LEAD_STAGES.NEGOTIATION,
                        LEAD_STAGES.WON,
                        LEAD_STAGES.LOST,
                      ],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            won: {
              $sum: { $cond: [{ $eq: ['$stage', LEAD_STAGES.WON] }, 1, 0] },
            },
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ['$stage', LEAD_STAGES.WON] },
                  { $ifNull: ['$product.estimatedValue', 0] },
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
        {
          $project: {
            _id: 0,
            executiveId: '$_id',
            name: {
              $trim: {
                input: { $concat: [
                  { $ifNull: ['$user.firstName', ''] },
                  ' ',
                  { $ifNull: ['$user.lastName', ''] },
                ] },
              },
            },
            email: '$user.email',
            leadsAssigned: 1,
            contacted: 1,
            won: 1,
            revenue: 1,
            conversionRate: {
              $cond: [
                { $gt: ['$leadsAssigned', 0] },
                {
                  $round: [
                    { $multiply: [{ $divide: ['$won', '$leadsAssigned'] }, 100] },
                    2,
                  ],
                },
                0,
              ],
            },
          },
        },
        { $sort: { revenue: -1 } },
      ]);

      return sendSuccess(
        res,
        { executives },
        'Executive report fetched successfully',
        200
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/reports/campaign-roi
   * Leads by source with estimated revenue (won leads).
   */
  async getCampaignRoi(req, res, next) {
    try {
      const dateMatch = buildDateMatch(req.query);
      const baseMatch = { isDeleted: false, ...dateMatch };

      const data = await Lead.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$source',
            totalLeads: { $sum: 1 },
            wonLeads: {
              $sum: { $cond: [{ $eq: ['$stage', LEAD_STAGES.WON] }, 1, 0] },
            },
            estimatedRevenue: {
              $sum: {
                $cond: [
                  { $eq: ['$stage', LEAD_STAGES.WON] },
                  { $ifNull: ['$product.estimatedValue', 0] },
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            source: { $ifNull: ['$_id', 'unknown'] },
            totalLeads: 1,
            wonLeads: 1,
            estimatedRevenue: 1,
            revenuePerLead: {
              $cond: [
                { $gt: ['$totalLeads', 0] },
                { $round: [{ $divide: ['$estimatedRevenue', '$totalLeads'] }, 2] },
                0,
              ],
            },
            conversionRate: {
              $cond: [
                { $gt: ['$totalLeads', 0] },
                {
                  $round: [
                    { $multiply: [{ $divide: ['$wonLeads', '$totalLeads'] }, 100] },
                    2,
                  ],
                },
                0,
              ],
            },
          },
        },
        { $sort: { estimatedRevenue: -1 } },
      ]);

      return sendSuccess(
        res,
        { campaigns: data },
        'Campaign ROI report fetched successfully',
        200
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportsController();
