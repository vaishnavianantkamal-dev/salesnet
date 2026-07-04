'use strict';

const mongoose = require('mongoose');
const { LEAD_SOURCES, LEAD_STAGES, LEAD_STATUS, TEMPERATURES } = require('../utils/constants');

const leadSchema = new mongoose.Schema(
  {
    leadId: {
      type: String,
      unique: true,
      sparse: true,
    },
    source: {
      type: String,
      enum: {
        values: Object.values(LEAD_SOURCES),
        message: 'Invalid lead source: {VALUE}',
      },
    },
    stage: {
      type: String,
      enum: {
        values: Object.values(LEAD_STAGES),
        message: 'Invalid lead stage: {VALUE}',
      },
      default: LEAD_STAGES.NEW,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(LEAD_STATUS),
        message: 'Invalid lead status: {VALUE}',
      },
      default: LEAD_STATUS.ACTIVE,
    },
    temperature: {
      type: String,
      enum: {
        values: Object.values(TEMPERATURES),
        message: 'Invalid temperature: {VALUE}',
      },
      default: TEMPERATURES.COLD,
    },
    contact: {
      name: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, required: [true, 'Contact phone is required'], trim: true },
      altPhone: { type: String, trim: true },
      company: { type: String, trim: true },
      designation: { type: String, trim: true },
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
    },
    product: {
      name: { type: String, trim: true },
      category: { type: String, trim: true },
      quantity: { type: Number, min: 0 },
      estimatedValue: { type: Number, min: 0 },
    },
    usage: { type: String, trim: true },
    description: { type: String, trim: true },
    images: {
      type: [String],
      default: [],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    source_metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
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

leadSchema.pre('save', function (next) {
  if (this.isNew && !this.leadId) {
    const random = Math.floor(1000 + Math.random() * 9000);
    this.leadId = `LD-${Date.now()}-${random}`;
  }
  next();
});

leadSchema.index({ 'contact.phone': 1 });
leadSchema.index({ stage: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ isDeleted: 1 });
leadSchema.index({ createdAt: -1 });

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
