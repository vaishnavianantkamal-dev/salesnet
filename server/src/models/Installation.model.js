'use strict';

const mongoose = require('mongoose');

const installationSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead reference is required'],
    },
    quotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      default: null,
    },
    engineer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Engineer reference is required'],
    },
    visitDate: {
      type: Date,
      required: [true, 'Visit date is required'],
    },
    location: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['scheduled', 'visited', 'completed', 'cancelled'],
        message: 'Invalid installation status: {VALUE}',
      },
      default: 'scheduled',
    },
    remarks: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    signatureUrl: {
      type: String,
      trim: true,
      default: null,
    },
    completedAt: {
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

installationSchema.index({ engineer: 1, visitDate: 1 });
installationSchema.index({ lead: 1 });

const Installation = mongoose.model('Installation', installationSchema);

module.exports = Installation;
