'use strict';

const Joi = require('joi');

const createPaymentSchema = Joi.object({
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
  amount: Joi.number().min(0).required().messages({
    'any.required': 'amount is required',
    'number.base': 'amount must be a number',
    'number.min': 'amount cannot be negative',
  }),
  mode: Joi.string()
    .valid('cash', 'upi', 'card', 'bank_transfer', 'cheque')
    .required()
    .messages({
      'any.required': 'mode is required',
      'any.only': 'mode must be one of: cash, upi, card, bank_transfer, cheque',
    }),
  reference: Joi.string().trim().max(200).optional().allow(''),
  gstAmount: Joi.number().min(0).optional().default(0),
  status: Joi.string()
    .valid('pending', 'completed', 'failed', 'refunded')
    .optional()
    .default('pending'),
  paidAt: Joi.date().iso().optional().allow(null),
  notes: Joi.string().trim().max(2000).optional().allow(''),
});

const updatePaymentSchema = Joi.object({
  quotation: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'quotation must be a valid ObjectId',
    }),
  amount: Joi.number().min(0).optional().messages({
    'number.base': 'amount must be a number',
    'number.min': 'amount cannot be negative',
  }),
  mode: Joi.string()
    .valid('cash', 'upi', 'card', 'bank_transfer', 'cheque')
    .optional()
    .messages({
      'any.only': 'mode must be one of: cash, upi, card, bank_transfer, cheque',
    }),
  reference: Joi.string().trim().max(200).optional().allow(''),
  gstAmount: Joi.number().min(0).optional(),
  status: Joi.string()
    .valid('pending', 'completed', 'failed', 'refunded')
    .optional(),
  paidAt: Joi.date().iso().optional().allow(null),
  notes: Joi.string().trim().max(2000).optional().allow(''),
});

module.exports = { createPaymentSchema, updatePaymentSchema };
