'use strict';

const Joi = require('joi');

const TASK_TYPES = ['call', 'whatsapp', 'visit', 'email', 'other'];
const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

const createTaskSchema = Joi.object({
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
  title: Joi.string().trim().min(1).max(200).required().messages({
    'any.required': 'title is required',
    'string.empty': 'title cannot be empty',
  }),
  type: Joi.string()
    .valid(...TASK_TYPES)
    .optional()
    .messages({
      'any.only': `type must be one of: ${TASK_TYPES.join(', ')}`,
    }),
  dueAt: Joi.date().iso().required().messages({
    'any.required': 'dueAt is required',
    'date.base': 'dueAt must be a valid date',
  }),
  status: Joi.string()
    .valid(...TASK_STATUSES)
    .optional()
    .messages({
      'any.only': `status must be one of: ${TASK_STATUSES.join(', ')}`,
    }),
  remarks: Joi.string().trim().max(1000).optional().allow(''),
  isActive: Joi.boolean().optional(),
});

const updateTaskSchema = Joi.object({
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
  title: Joi.string().trim().min(1).max(200).optional(),
  type: Joi.string()
    .valid(...TASK_TYPES)
    .optional()
    .messages({
      'any.only': `type must be one of: ${TASK_TYPES.join(', ')}`,
    }),
  dueAt: Joi.date().iso().optional().messages({
    'date.base': 'dueAt must be a valid date',
  }),
  status: Joi.string()
    .valid(...TASK_STATUSES)
    .optional()
    .messages({
      'any.only': `status must be one of: ${TASK_STATUSES.join(', ')}`,
    }),
  remarks: Joi.string().trim().max(1000).optional().allow(''),
  isActive: Joi.boolean().optional(),
});

const queryTaskSchema = Joi.object({
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
    .valid(...TASK_STATUSES)
    .optional(),
  type: Joi.string()
    .valid(...TASK_TYPES)
    .optional(),
  dueAtFrom: Joi.date().iso().optional(),
  dueAtTo: Joi.date().iso().optional(),
});

module.exports = { createTaskSchema, updateTaskSchema, queryTaskSchema };
