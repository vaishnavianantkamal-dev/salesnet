'use strict';

const Joi = require('joi');
const { LEAD_SOURCES, LEAD_STAGES, TEMPERATURES } = require('../../utils/constants');

const mongoIdPattern = /^[0-9a-fA-F]{24}$/;

// ─── Reusable field definitions ──────────────────────────────────────────────

const mongoId = Joi.string().pattern(mongoIdPattern);

const indianPhone = Joi.string()
  .pattern(/^[6-9]\d{9}$/)
  .messages({
    'string.pattern.base': 'Phone must be a valid 10-digit Indian mobile number starting with 6-9',
  });

const sourceEnum = Joi.string().valid(...Object.values(LEAD_SOURCES));
const stageEnum = Joi.string().valid(...Object.values(LEAD_STAGES));
const temperatureEnum = Joi.string().valid(...Object.values(TEMPERATURES));
const priorityEnum = Joi.string().valid('low', 'medium', 'high');

// ─── Contact sub-schema ──────────────────────────────────────────────────────

const contactCreate = Joi.object({
  name: Joi.string().trim().min(1).max(200).required().messages({
    'any.required': 'Contact name is required',
    'string.empty': 'Contact name cannot be empty',
  }),
  phone: indianPhone.required().messages({
    'any.required': 'Contact phone is required',
  }),
  email: Joi.string().email().trim().lowercase().optional().allow('', null),
  altPhone: indianPhone.optional().allow('', null),
  company: Joi.string().trim().max(200).optional().allow('', null),
  designation: Joi.string().trim().max(200).optional().allow('', null),
  address: Joi.string().trim().max(500).optional().allow('', null),
  city: Joi.string().trim().max(100).optional().allow('', null),
  state: Joi.string().trim().max(100).optional().allow('', null),
  pincode: Joi.string().trim().max(10).optional().allow('', null),
  country: Joi.string().trim().max(100).optional().allow('', null),
});

const contactUpdate = Joi.object({
  name: Joi.string().trim().min(1).max(200).optional(),
  phone: indianPhone.optional(),
  email: Joi.string().email().trim().lowercase().optional().allow('', null),
  altPhone: indianPhone.optional().allow('', null),
  company: Joi.string().trim().max(200).optional().allow('', null),
  designation: Joi.string().trim().max(200).optional().allow('', null),
  address: Joi.string().trim().max(500).optional().allow('', null),
  city: Joi.string().trim().max(100).optional().allow('', null),
  state: Joi.string().trim().max(100).optional().allow('', null),
  pincode: Joi.string().trim().max(10).optional().allow('', null),
  country: Joi.string().trim().max(100).optional().allow('', null),
});

// ─── Product sub-schema ──────────────────────────────────────────────────────

const productCreate = Joi.object({
  name: Joi.string().trim().max(200).optional().allow('', null),
  category: Joi.string().trim().max(200).optional().allow('', null),
  quantity: Joi.number().integer().min(0).optional(),
  estimatedValue: Joi.number().min(0).optional(),
});

const productUpdate = productCreate;

// ─── Exported schemas ────────────────────────────────────────────────────────

const createLeadSchema = Joi.object({
  contact: contactCreate.required(),
  product: productCreate.optional(),
  source: sourceEnum.optional(),
  stage: stageEnum.optional(),
  temperature: temperatureEnum.optional(),
  priority: priorityEnum.optional(),
  assignedTo: mongoId.optional().allow('', null),
  notes: Joi.string().trim().max(2000).optional().allow('', null),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  followUpDate: Joi.date().iso().optional().allow(null),
  source_metadata: Joi.object().optional(),
});

const updateLeadSchema = Joi.object({
  contact: contactUpdate.optional(),
  product: productUpdate.optional(),
  source: sourceEnum.optional(),
  stage: stageEnum.optional(),
  temperature: temperatureEnum.optional(),
  priority: priorityEnum.optional(),
  assignedTo: mongoId.optional().allow('', null),
  notes: Joi.string().trim().max(2000).optional().allow('', null),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  followUpDate: Joi.date().iso().optional().allow(null),
  source_metadata: Joi.object().optional(),
}).min(1);

const assignSchema = Joi.object({
  assignedTo: mongoId.required().messages({
    'any.required': 'assignedTo user ID is required',
    'string.pattern.base': 'assignedTo must be a valid MongoDB ObjectId',
  }),
});

const stageSchema = Joi.object({
  stage: stageEnum.required().messages({
    'any.required': 'stage is required',
    'any.only': `stage must be one of: ${Object.values(LEAD_STAGES).join(', ')}`,
  }),
});

const queryLeadSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sort: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').optional(),
  search: Joi.string().trim().max(200).optional().allow(''),
  source: sourceEnum.optional(),
  temperature: temperatureEnum.optional(),
  stage: stageEnum.optional(),
  assignedTo: mongoId.optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional(),
});

/**
 * Schema for validating a single row in a CSV import.
 * Less strict than create — email/phone formats are checked but
 * many optional fields are allowed to be absent.
 */
const importRowSchema = Joi.object({
  contact: Joi.object({
    name: Joi.string().trim().min(1).max(200).required(),
    phone: indianPhone.required(),
    email: Joi.string().email().trim().lowercase().optional().allow('', null),
    altPhone: indianPhone.optional().allow('', null),
    company: Joi.string().trim().max(200).optional().allow('', null),
    designation: Joi.string().trim().max(200).optional().allow('', null),
    address: Joi.string().trim().max(500).optional().allow('', null),
    city: Joi.string().trim().max(100).optional().allow('', null),
    state: Joi.string().trim().max(100).optional().allow('', null),
    pincode: Joi.string().trim().max(10).optional().allow('', null),
    country: Joi.string().trim().max(100).optional().allow('', null),
  }).required(),
  product: productCreate.optional(),
  source: sourceEnum.optional().default('csv'),
  stage: stageEnum.optional(),
  temperature: temperatureEnum.optional(),
  notes: Joi.string().trim().max(2000).optional().allow('', null),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  followUpDate: Joi.date().iso().optional().allow(null),
  assignedTo: mongoId.optional().allow('', null),
});

module.exports = {
  createLeadSchema,
  updateLeadSchema,
  assignSchema,
  stageSchema,
  queryLeadSchema,
  importRowSchema,
};
