'use strict';

const Lead = require('../../models/Lead.model');
const User = require('../../models/User.model');

class DashboardService {
  async getAdminSummary() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      todayLeads,
      yesterdayLeads,
      hotLeads,
      hotLeadsLastWeek,
      warmLeads,
      coldLeads,
      openDeals,
      openDealsLastMonth,
      wonDeals,
      wonDealsLastMonth,
      lostDeals,
      revenueResult,
      revenueLastMonthResult,
    ] = await Promise.all([
      Lead.countDocuments({ createdAt: { $gte: startOfToday }, isDeleted: { $ne: true } }),
      Lead.countDocuments({ createdAt: { $gte: startOfYesterday, $lt: startOfToday }, isDeleted: { $ne: true } }),
      Lead.countDocuments({ temperature: 'hot', isDeleted: { $ne: true } }),
      Lead.countDocuments({ temperature: 'hot', createdAt: { $lt: startOfWeek }, isDeleted: { $ne: true } }),
      Lead.countDocuments({ temperature: 'warm', isDeleted: { $ne: true } }),
      Lead.countDocuments({ temperature: 'cold', isDeleted: { $ne: true } }),
      Lead.countDocuments({ stage: { $nin: ['won', 'lost', 'junk'] }, isDeleted: { $ne: true } }),
      Lead.countDocuments({ stage: { $nin: ['won', 'lost', 'junk'] }, createdAt: { $lt: startOfMonth }, isDeleted: { $ne: true } }),
      Lead.countDocuments({ stage: 'won', createdAt: { $gte: startOfMonth }, isDeleted: { $ne: true } }),
      Lead.countDocuments({ stage: 'won', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, isDeleted: { $ne: true } }),
      Lead.countDocuments({ stage: 'lost', isDeleted: { $ne: true } }),
      Lead.aggregate([
        { $match: { stage: 'won', createdAt: { $gte: startOfMonth }, isDeleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$product.estimatedValue' } } },
      ]),
      Lead.aggregate([
        { $match: { stage: 'won', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, isDeleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$product.estimatedValue' } } },
      ]),
    ]);

    const revenue = revenueResult[0]?.total || 0;
    const revenueLastMonth = revenueLastMonthResult[0]?.total || 0;

    const pct = (current, previous) => {
      if (!previous) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const STAGE_ORDER = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'junk'];
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Lead Pipeline by stage (bar chart)
    let pipeline = STAGE_ORDER.map((s) => ({ stage: s.charAt(0).toUpperCase() + s.slice(1), count: 0 }));
    try {
      const pipelineRaw = await Lead.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
      ]);
      const pipelineMap = Object.fromEntries(pipelineRaw.map((r) => [r._id, r.count]));
      pipeline = STAGE_ORDER.map((stage) => ({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        count: pipelineMap[stage] || 0,
      }));
    } catch (_) {}

    // Monthly revenue — last 6 months (line chart)
    let monthly = [];
    try {
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const monthlyRaw = await Lead.aggregate([
        { $match: { stage: 'won', createdAt: { $gte: sixMonthsAgo }, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: { $ifNull: ['$product.estimatedValue', 0] } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);
      monthly = monthlyRaw.map((r) => ({
        month: MONTHS[r._id.month - 1],
        revenue: r.revenue || 0,
        deals: r.count,
      }));
    } catch (_) {}

    // Team leaderboard — top 8 by leads assigned this month
    let team = [];
    try {
      team = await Lead.aggregate([
        { $match: { assignedTo: { $ne: null }, createdAt: { $gte: startOfMonth }, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: '$assignedTo',
            leads: { $sum: 1 },
            won: { $sum: { $cond: [{ $eq: ['$stage', 'won'] }, 1, 0] } },
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ['$stage', 'won'] },
                  { $ifNull: ['$product.estimatedValue', 0] },
                  0,
                ],
              },
            },
          },
        },
        { $sort: { leads: -1 } },
        { $limit: 8 },
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
            name: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ['$user.firstName', ''] },
                    ' ',
                    { $ifNull: ['$user.lastName', ''] },
                  ],
                },
              },
            },
            leads: 1,
            won: 1,
            revenue: 1,
          },
        },
      ]);
    } catch (_) {}

    return {
      todayLeads,
      todayLeadsTrend: pct(todayLeads, yesterdayLeads),
      hotLeads,
      hotLeadsTrend: pct(hotLeads, hotLeadsLastWeek),
      warmLeads,
      coldLeads,
      openDeals,
      openDealsTrend: pct(openDeals, openDealsLastMonth),
      wonDeals,
      wonTrend: pct(wonDeals, wonDealsLastMonth),
      lostDeals,
      revenue,
      revenueTrend: pct(revenue, revenueLastMonth),
      // Chart data
      pipeline,
      monthly,
      team,
    };
  }

  async getMySummary(userId) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const baseFilter = { assignedTo: userId, isDeleted: { $ne: true } };

    const [myLeads, myHotLeads, myWon, myOpen, followUps] = await Promise.all([
      Lead.countDocuments({ ...baseFilter, createdAt: { $gte: startOfToday } }),
      Lead.countDocuments({ ...baseFilter, temperature: 'hot' }),
      Lead.countDocuments({ ...baseFilter, stage: 'won', createdAt: { $gte: startOfWeek } }),
      Lead.countDocuments({ ...baseFilter, stage: { $nin: ['won', 'lost', 'junk'] } }),
      Lead.find({ ...baseFilter, stage: { $nin: ['won', 'lost', 'junk'] } })
        .sort({ updatedAt: 1 })
        .limit(10)
        .select('contact.name contact.phone temperature stage updatedAt score'),
    ]);

    return {
      myLeads,
      myHotLeads,
      myWon,
      myOpen,
      followUps: followUps.map((l) => ({
        _id: l._id,
        name: l.contact?.name,
        phone: l.contact?.phone,
        temperature: l.temperature,
        stage: l.stage,
        score: l.score,
        nextAction: `Follow up • ${l.stage}`,
      })),
    };
  }
}

module.exports = new DashboardService();
