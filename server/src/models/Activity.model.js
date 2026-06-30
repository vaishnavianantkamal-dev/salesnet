'use strict';

const mongoose = require('mongoose');
const { ACTIVITY_TYPES } = require('../utils/constants');

const activitySchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead reference is required'],
    },
    type: {
      type: String,
      enum: {
        values: Object.values(ACTIVITY_TYPES),
        message: 'Invalid activity type: {VALUE}',
      },
      required: [true, 'Activity type is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performer reference is required'],
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

activitySchema.index({ lead: 1 });
activitySchema.index({ type: 1 });
activitySchema.index({ performedBy: 1 });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
