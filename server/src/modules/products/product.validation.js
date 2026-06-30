'use strict';

const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required().messages({
    'any.required': 'Product name is required',
    'string.empty': 'Product name cannot be empty',
  }),
  category: Joi.string().trim().min(1).max(100).required().messages({
    'any.required': 'Product category is required',
    'string.empty': 'Product category cannot be empty',
  }),
  price: Joi.number().min(0).required().messages({
    'any.required': 'Product price is required',
    'number.min': 'Price cannot be negative',
  }),
  gstPercent: Joi.number().min(0).max(28).optional().messages({
    'number.min': 'GST percent cannot be negative',
    'number.max': 'GST percent cannot exceed 28',
  }),
  description: Joi.string().trim().max(2000).optional().allow('', null),
  images: Joi.array().items(Joi.string().uri()).optional(),
  isActive: Joi.boolean().optional(),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).optional(),
  category: Joi.string().trim().min(1).max(100).optional(),
  price: Joi.number().min(0).optional().messages({
    'number.min': 'Price cannot be negative',
  }),
  gstPercent: Joi.number().min(0).max(28).optional().messages({
    'number.min': 'GST percent cannot be negative',
    'number.max': 'GST percent cannot exceed 28',
  }),
  description: Joi.string().trim().max(2000).optional().allow('', null),
  images: Joi.array().items(Joi.string().uri()).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = { createProductSchema, updateProductSchema };
