'use strict';

const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Integration name is required'],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: [
          'whatsapp',
          'crm_portal',
          'google_ads',
          's3',
          'email',
          'ai',
          'lead_source',
        ],
        message: 'Invalid integration type: {VALUE}',
      },
      required: [true, 'Integration type is required'],
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    lastSyncAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

integrationSchema.index({ name: 1 }, { unique: true });
integrationSchema.index({ type: 1 });
integrationSchema.index({ isActive: 1 });

const Integration = mongoose.model('Integration', integrationSchema);

module.exports = Integration;
