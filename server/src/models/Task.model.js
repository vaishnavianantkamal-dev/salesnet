'use strict';

const mongoose = require('mongoose');

const TASK_TYPES = ['call', 'whatsapp', 'visit', 'email', 'other'];
const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

const taskSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    type: {
      type: String,
      enum: {
        values: TASK_TYPES,
        message: 'Invalid task type: {VALUE}',
      },
    },
    dueAt: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    status: {
      type: String,
      enum: {
        values: TASK_STATUSES,
        message: 'Invalid task status: {VALUE}',
      },
      default: 'pending',
    },
    remarks: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

taskSchema.index({ assignedTo: 1, dueAt: 1 });
taskSchema.index({ lead: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
