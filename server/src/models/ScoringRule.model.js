'use strict';

const mongoose = require('mongoose');
const { SCORING_EVENTS } = require('../utils/constants');

const scoringRuleSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      enum: {
        values: Object.values(SCORING_EVENTS),
        message: 'Invalid scoring event: {VALUE}',
      },
      required: [true, 'Event is required'],
      unique: true,
    },
    points: {
      type: Number,
      required: [true, 'Points are required'],
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const ScoringRule = mongoose.model('ScoringRule', scoringRuleSchema);

module.exports = ScoringRule;
