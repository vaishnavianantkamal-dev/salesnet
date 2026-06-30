'use strict';

const mongoose = require('mongoose');

const FOLLOWUP_STATUSES = ['scheduled', 'completed', 'missed', 'rescheduled'];

const followupSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead is required'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned user is required'],
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    remarks: {
      type: String,
      trim: true,
    },
    outcome: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: FOLLOWUP_STATUSES,
        message: 'Invalid followup status: {VALUE}',
      },
      default: 'scheduled',
    },
    nextFollowupAt: {
      type: Date,
      default: null,
    },
    reminderAt: {
      type: Date,
      default: null,
    },
    createdBy: {
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

followupSchema.index({ assignedTo: 1, scheduledAt: 1 });
followupSchema.index({ lead: 1 });

const Followup = mongoose.model('Followup', followupSchema);

module.exports = Followup;
