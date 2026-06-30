'use strict';

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
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
    invoiceNo: {
      type: String,
      unique: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    mode: {
      type: String,
      enum: {
        values: ['cash', 'upi', 'card', 'bank_transfer', 'cheque'],
        message: 'Invalid payment mode: {VALUE}',
      },
      required: [true, 'Payment mode is required'],
    },
    reference: {
      type: String,
      trim: true,
    },
    gstAmount: {
      type: Number,
      default: 0,
      min: [0, 'GST amount cannot be negative'],
    },
    totalAmount: {
      type: Number,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'completed', 'failed', 'refunded'],
        message: 'Invalid payment status: {VALUE}',
      },
      default: 'pending',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
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

paymentSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoiceNo) {
    const now = new Date();
    const datePart =
      String(now.getFullYear()) +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const count = await this.constructor.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    const seq = String(count + 1).padStart(3, '0');
    this.invoiceNo = `INV-${datePart}-${seq}`;
  }

  this.totalAmount = (this.amount || 0) + (this.gstAmount || 0);
  next();
});

paymentSchema.index({ lead: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
