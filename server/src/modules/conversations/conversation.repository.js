'use strict';

const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation.model');
const { AppError } = require('../../middlewares/error.middleware');

class ConversationRepository {
  /**
   * Find paginated messages for a given lead, sorted newest-first.
   * @param {string|ObjectId} leadId
   * @param {Object} options - { skip, limit, sort }
   * @returns {{ data: Conversation[], total: number }}
   */
  async findByLead(leadId, options = {}) {
    const { skip = 0, limit = 30, sort = { createdAt: -1 } } = options;

    const filter = { lead: leadId };

    const [data, total] = await Promise.all([
      Conversation.find(filter)
        .populate('sentBy', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(filter),
    ]);

    return { data, total };
  }

  /**
   * Find a single conversation by the external WhatsApp message id.
   * @param {string} waMessageId
   */
  async findByWaMessageId(waMessageId) {
    return Conversation.findOne({ externalMessageId: waMessageId }).lean();
  }

  /**
   * Persist a new conversation document.
   * @param {Object} data
   * @returns {Conversation}
   */
  async create(data) {
    const conversation = new Conversation(data);
    await conversation.save();
    return conversation.toObject();
  }

  /**
   * Update the delivery status of a conversation identified by its
   * externalMessageId (WhatsApp wamid).
   * @param {string} waMessageId
   * @param {string} status  - one of DELIVERY_STATUS values
   * @returns {Conversation|null}
   */
  async updateDeliveryStatus(waMessageId, status) {
    const updated = await Conversation.findOneAndUpdate(
      { externalMessageId: waMessageId },
      { $set: { deliveryStatus: status } },
      { new: true, runValidators: true }
    ).lean();
    return updated;
  }

  /**
   * Inbox view: latest conversation per lead for the current user's scope.
   * Groups by lead, picks the last message and joins lead info.
   *
   * @param {Object} matchStage  - extra $match conditions (e.g. { assignedTo })
   * @param {Object} options     - { skip, limit }
   * @returns {Array}
   */
  async findInbox(matchStage = {}, options = {}) {
    const { skip = 0, limit = 20 } = options;

    const pipeline = [
      // Optional pre-filter (e.g. channel)
      ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),

      // Sort before grouping so $last picks the newest message
      { $sort: { createdAt: -1 } },

      // Group by lead — keep the most-recent message fields
      {
        $group: {
          _id: '$lead',
          lastMessageId: { $first: '$_id' },
          lastContent: { $first: '$content' },
          lastMessageType: { $first: '$messageType' },
          lastDirection: { $first: '$direction' },
          lastDeliveryStatus: { $first: '$deliveryStatus' },
          lastChannel: { $first: '$channel' },
          lastCreatedAt: { $first: '$createdAt' },
          // Count unread inbound messages (no read deliveryStatus on inbound)
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$direction', 'inbound'] },
                    { $ne: ['$deliveryStatus', 'read'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },

      // Join lead information
      {
        $lookup: {
          from: 'leads',
          localField: '_id',
          foreignField: '_id',
          as: 'leadInfo',
        },
      },
      { $unwind: { path: '$leadInfo', preserveNullAndEmpty: false } },

      // Filter out deleted leads
      { $match: { 'leadInfo.isDeleted': false } },

      // Join assignedTo user
      {
        $lookup: {
          from: 'users',
          localField: 'leadInfo.assignedTo',
          foreignField: '_id',
          as: 'assignedToInfo',
        },
      },
      {
        $unwind: {
          path: '$assignedToInfo',
          preserveNullAndEmpty: true,
        },
      },

      // Shape the output
      {
        $project: {
          _id: 0,
          leadId: '$_id',
          lead: {
            _id: '$leadInfo._id',
            leadId: '$leadInfo.leadId',
            contact: '$leadInfo.contact',
            stage: '$leadInfo.stage',
            status: '$leadInfo.status',
            assignedTo: {
              $cond: [
                { $ifNull: ['$assignedToInfo._id', false] },
                {
                  _id: '$assignedToInfo._id',
                  firstName: '$assignedToInfo.firstName',
                  lastName: '$assignedToInfo.lastName',
                  email: '$assignedToInfo.email',
                },
                null,
              ],
            },
          },
          lastMessage: {
            _id: '$lastMessageId',
            content: '$lastContent',
            messageType: '$lastMessageType',
            direction: '$lastDirection',
            deliveryStatus: '$lastDeliveryStatus',
            channel: '$lastChannel',
            createdAt: '$lastCreatedAt',
          },
          unreadCount: 1,
        },
      },

      // Sort inbox by last message time desc
      { $sort: { 'lastMessage.createdAt': -1 } },

      // Facet for pagination
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ];

    const [result] = await Conversation.aggregate(pipeline);
    const data = result ? result.data : [];
    const total = result && result.totalCount.length ? result.totalCount[0].count : 0;

    return { data, total };
  }
}

module.exports = new ConversationRepository();
