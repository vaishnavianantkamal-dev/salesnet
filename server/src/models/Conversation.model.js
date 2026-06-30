'use strict';

const mongoose = require('mongoose');
const { CHANNELS, MESSAGE_TYPES, DELIVERY_STATUS } = require('../utils/constants');

const conversationSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead reference is required'],
    },
    channel: {
      type: String,
      enum: {
        values: Object.values(CHANNELS),
        message: 'Invalid channel: {VALUE}',
      },
      required: [true, 'Channel is required'],
    },
    direction: {
      type: String,
      enum: {
        values: ['inbound', 'outbound'],
        message: 'Direction must be inbound or outbound',
      },
      required: [true, 'Direction is required'],
    },
    messageType: {
      type: String,
      enum: {
        values: Object.values(MESSAGE_TYPES),
        message: 'Invalid message type: {VALUE}',
      },
      default: MESSAGE_TYPES.TEXT,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
    },
    mediaUrl: {
      type: String,
      default: null,
    },
    deliveryStatus: {
      type: String,
      enum: {
        values: Object.values(DELIVERY_STATUS),
        message: 'Invalid delivery status: {VALUE}',
      },
      default: DELIVERY_STATUS.SENT,
    },
    externalMessageId: {
      type: String,
      default: null,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    whatsappData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

conversationSchema.index({ lead: 1 });
conversationSchema.index({ channel: 1 });
conversationSchema.index({ createdAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
