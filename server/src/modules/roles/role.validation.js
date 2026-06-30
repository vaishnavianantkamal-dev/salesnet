'use strict';

const Joi = require('joi');

const createRoleSchema = Joi.object({
  key: Joi.string()
    .pattern(/^[a-z0-9_]+$/)
    .min(2)
    .max(50)
    .lowercase()
    .required()
    .messages({
      'string.pattern.base': 'Role key must contain only lowercase letters, numbers, and underscores',
      'any.required': 'Role key is required',
    }),
  name: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Role name is required',
  }),
  description: Joi.string().trim().max(500).optional().allow(''),
  permissions: Joi.array().items(Joi.string()).default([]),
  isActive: Joi.boolean().optional(),
});

const updateRoleSchema = Joi.object({
  key: Joi.string()
    .pattern(/^[a-z0-9_]+$/)
    .min(2)
    .max(50)
    .lowercase()
    .optional(),
  name: Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().trim().max(500).optional().allow(''),
  permissions: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional(),
});

const queryRoleSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().trim().optional().allow(''),
  isActive: Joi.boolean().optional(),
});

module.exports = { createRoleSchema, updateRoleSchema, queryRoleSchema };
