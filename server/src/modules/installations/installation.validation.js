'use strict';

const Joi = require('joi');

const createInstallationSchema = Joi.object({
  lead: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'lead must be a valid ObjectId',
      'any.required': 'lead is required',
    }),
  quotation: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'quotation must be a valid ObjectId',
    }),
  engineer: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'engineer must be a valid ObjectId',
      'any.required': 'engineer is required',
    }),
  visitDate: Joi.date().iso().required().messages({
    'any.required': 'visitDate is required',
    'date.base': 'visitDate must be a valid date',
  }),
  location: Joi.string().trim().max(500).optional().allow(''),
  status: Joi.string()
    .valid('scheduled', 'visited', 'completed', 'cancelled')
    .optional()
    .default('scheduled'),
  remarks: Joi.string().trim().max(2000).optional().allow(''),
  images: Joi.array().items(Joi.string().uri()).optional().default([]),
  signatureUrl: Joi.string().uri().optional().allow(null, ''),
});

const updateInstallationSchema = Joi.object({
  quotation: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'quotation must be a valid ObjectId',
    }),
  engineer: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'engineer must be a valid ObjectId',
    }),
  visitDate: Joi.date().iso().optional().messages({
    'date.base': 'visitDate must be a valid date',
  }),
  location: Joi.string().trim().max(500).optional().allow(''),
  status: Joi.string()
    .valid('scheduled', 'visited', 'completed', 'cancelled')
    .optional(),
  remarks: Joi.string().trim().max(2000).optional().allow(''),
  images: Joi.array().items(Joi.string().uri()).optional(),
  signatureUrl: Joi.string().uri().optional().allow(null, ''),
});

module.exports = { createInstallationSchema, updateInstallationSchema };
