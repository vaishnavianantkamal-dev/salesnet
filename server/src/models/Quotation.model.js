'use strict';

const mongoose = require('mongoose');

const quotationItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    productName: {
      type: String,
      trim: true,
    },
    qty: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    gstPercent: {
      type: Number,
      required: [true, 'GST percent is required'],
      min: [0, 'GST percent cannot be negative'],
      max: [28, 'GST percent cannot exceed 28'],
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const quotationSchema = new mongoose.Schema(
  {
    quotationNo: {
      type: String,
      unique: true,
      sparse: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead reference is required'],
    },
    items: {
      type: [quotationItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    discountPercent: {
      type: Number,
      min: [0, 'Discount percent cannot be negative'],
      max: [100, 'Discount percent cannot exceed 100'],
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    terms: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'],
        message: 'Invalid quotation status: {VALUE}',
      },
      default: 'draft',
    },
    pdfUrl: {
      type: String,
      trim: true,
    },
    validUntil: {
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

quotationSchema.pre('save', function (next) {
  if (this.isNew && !this.quotationNo) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(100 + Math.random() * 900);
    this.quotationNo = `QT-${yyyy}${mm}${dd}-${random}`;
  }

  if (this.items && this.items.length > 0) {
    let subtotal = 0;
    let totalGst = 0;

    this.items.forEach((item) => {
      const lineBase = item.unitPrice * item.qty;
      const lineGst = (lineBase * item.gstPercent) / 100;
      item.totalPrice = parseFloat((lineBase + lineGst).toFixed(2));
      subtotal += lineBase;
      totalGst += lineGst;
    });

    this.subtotal = parseFloat(subtotal.toFixed(2));
    this.gstAmount = parseFloat(totalGst.toFixed(2));
    this.discountAmount = parseFloat(((subtotal * (this.discountPercent || 0)) / 100).toFixed(2));
    this.total = parseFloat((subtotal + totalGst - this.discountAmount).toFixed(2));
  } else {
    this.subtotal = 0;
    this.gstAmount = 0;
    this.discountAmount = 0;
    this.total = 0;
  }

  next();
});

quotationSchema.index({ lead: 1 });

const Quotation = mongoose.model('Quotation', quotationSchema);

module.exports = Quotation;
