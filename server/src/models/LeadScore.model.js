'use strict';

const mongoose = require('mongoose');
const { SCORING_EVENTS } = require('../utils/constants');

const leadScoreSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead reference is required'],
    },
    event: {
      type: String,
      enum: {
        values: Object.values(SCORING_EVENTS),
        message: 'Invalid scoring event: {VALUE}',
      },
      required: [true, 'Scoring event is required'],
    },
    points: {
      type: Number,
      required: [true, 'Points are required'],
    },
    previousScore: {
      type: Number,
      default: 0,
    },
    newScore: {
      type: Number,
      default: 0,
    },
    triggeredBy: {
      type: String,
      default: 'system',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

leadScoreSchema.index({ lead: 1 });

const LeadScore = mongoose.model('LeadScore', leadScoreSchema);

module.exports = LeadScore;
