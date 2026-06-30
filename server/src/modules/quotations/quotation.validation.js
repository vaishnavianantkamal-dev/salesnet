'use strict';

const Joi = require('joi');

const mongoIdPattern = /^[0-9a-fA-F]{24}$/;

const quotationItemSchema = Joi.object({
  product: Joi.string().pattern(mongoIdPattern).optional().allow(null).messages({
    'string.pattern.base': 'Invalid product ID format',
  }),
  productName: Joi.string().trim().min(1).max(300).required().messages({
    'any.required': 'Product name is required for each line item',
    'string.empty': 'Product name cannot be empty',
  }),
  qty: Joi.number().integer().min(1).required().messages({
    'any.required': 'Quantity is required for each line item',
    'number.min': 'Quantity must be at least 1',
  }),
  unitPrice: Joi.number().min(0).required().messages({
    'any.required': 'Unit price is required for each line item',
    'number.min': 'Unit price cannot be negative',
  }),
  gstPercent: Joi.number().min(0).max(28).required().messages({
    'any.required': 'GST percent is required for each line item',
    'number.min': 'GST percent cannot be negative',
    'number.max': 'GST percent cannot exceed 28',
  }),
});

const createQuotationSchema = Joi.object({
  lead: Joi.string().pattern(mongoIdPattern).required().messages({
    'any.required': 'Lead reference is required',
    'string.pattern.base': 'Invalid lead ID format',
  }),
  items: Joi.array().items(quotationItemSchema).min(1).required().messages({
    'any.required': 'At least one line item is required',
    'array.min': 'At least one line item is required',
  }),
  discountPercent: Joi.number().min(0).max(100).optional().messages({
    'number.min': 'Discount percent cannot be negative',
    'number.max': 'Discount percent cannot exceed 100',
  }),
  terms: Joi.string().trim().max(5000).optional().allow('', null),
  status: Joi.string().valid('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired').optional(),
  validUntil: Joi.date().iso().optional().allow(null),
  pdfUrl: Joi.string().uri().optional().allow('', null),
});

const updateQuotationSchema = Joi.object({
  lead: Joi.string().pattern(mongoIdPattern).optional().messages({
    'string.pattern.base': 'Invalid lead ID format',
  }),
  items: Joi.array().items(quotationItemSchema).min(1).optional().messages({
    'array.min': 'At least one line item is required',
  }),
  discountPercent: Joi.number().min(0).max(100).optional().messages({
    'number.min': 'Discount percent cannot be negative',
    'number.max': 'Discount percent cannot exceed 100',
  }),
  terms: Joi.string().trim().max(5000).optional().allow('', null),
  status: Joi.string().valid('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired').optional(),
  validUntil: Joi.date().iso().optional().allow(null),
  pdfUrl: Joi.string().uri().optional().allow('', null),
}).min(1);

module.exports = { createQuotationSchema, updateQuotationSchema };
