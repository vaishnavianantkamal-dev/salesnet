'use strict';

const Joi = require('joi');

const FOLLOWUP_STATUSES = ['scheduled', 'completed', 'missed', 'rescheduled'];

const createFollowupSchema = Joi.object({
  lead: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'lead must be a valid ObjectId',
      'any.required': 'lead is required',
    }),
  assignedTo: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'assignedTo must be a valid ObjectId',
      'any.required': 'assignedTo is required',
    }),
  scheduledAt: Joi.date().iso().required().messages({
    'any.required': 'scheduledAt is required',
    'date.base': 'scheduledAt must be a valid date',
  }),
  remarks: Joi.string().trim().max(1000).optional().allow(''),
  outcome: Joi.string().trim().max(1000).optional().allow(''),
  status: Joi.string()
    .valid(...FOLLOWUP_STATUSES)
    .optional()
    .messages({
      'any.only': `status must be one of: ${FOLLOWUP_STATUSES.join(', ')}`,
    }),
  nextFollowupAt: Joi.date().iso().optional().allow(null).messages({
    'date.base': 'nextFollowupAt must be a valid date',
  }),
  reminderAt: Joi.date().iso().optional().allow(null).messages({
    'date.base': 'reminderAt must be a valid date',
  }),
});

const updateFollowupSchema = Joi.object({
  lead: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'lead must be a valid ObjectId',
    }),
  assignedTo: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'assignedTo must be a valid ObjectId',
    }),
  scheduledAt: Joi.date().iso().optional().messages({
    'date.base': 'scheduledAt must be a valid date',
  }),
  remarks: Joi.string().trim().max(1000).optional().allow(''),
  outcome: Joi.string().trim().max(1000).optional().allow(''),
  status: Joi.string()
    .valid(...FOLLOWUP_STATUSES)
    .optional()
    .messages({
      'any.only': `status must be one of: ${FOLLOWUP_STATUSES.join(', ')}`,
    }),
  nextFollowupAt: Joi.date().iso().optional().allow(null).messages({
    'date.base': 'nextFollowupAt must be a valid date',
  }),
  reminderAt: Joi.date().iso().optional().allow(null).messages({
    'date.base': 'reminderAt must be a valid date',
  }),
});

const queryFollowupSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sort: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').optional(),
  assignedTo: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .optional(),
  lead: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .optional(),
  status: Joi.string()
    .valid(...FOLLOWUP_STATUSES)
    .optional(),
  scheduledAtFrom: Joi.date().iso().optional(),
  scheduledAtTo: Joi.date().iso().optional(),
});

module.exports = { createFollowupSchema, updateFollowupSchema, queryFollowupSchema };
