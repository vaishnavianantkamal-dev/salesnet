'use strict';

const mongoose = require('mongoose');
const { LEAD_SOURCES } = require('../utils/constants');

const webhookLogSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: {
        values: Object.values(LEAD_SOURCES),
        message: 'Invalid source: {VALUE}',
      },
      required: [true, 'Source is required'],
    },
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Raw payload is required'],
    },
    parsedData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['received', 'processed', 'failed', 'duplicate'],
        message: 'Invalid status: {VALUE}',
      },
      default: 'received',
    },
    error: {
      type: String,
      default: null,
    },
    leadCreated: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

webhookLogSchema.index({ source: 1 });
webhookLogSchema.index({ status: 1 });
webhookLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days TTL

const WebhookLog = mongoose.model('WebhookLog', webhookLogSchema);

module.exports = WebhookLog;
