'use strict';

const Joi = require('joi');

/**
 * Schema for sending a WhatsApp template message.
 * templateName  - required; must be a valid identifier (letters, digits, underscores)
 * languageCode  - optional; defaults to 'en'
 * params        - optional array of string/number values to inject into the template body
 */
const sendTemplateSchema = Joi.object({
  templateName: Joi.string()
    .trim()
    .min(1)
    .max(512)
    .required()
    .messages({
      'any.required': 'templateName is required',
      'string.empty': 'templateName cannot be empty',
    }),
  languageCode: Joi.string()
    .trim()
    .min(2)
    .max(10)
    .default('en')
    .optional(),
  params: Joi.array()
    .items(Joi.alternatives().try(Joi.string(), Joi.number()))
    .optional()
    .default([]),
});

/**
 * Schema for sending a free-text WhatsApp message.
 * message - required; 1–4096 characters (WhatsApp text message limit)
 */
const sendMessageSchema = Joi.object({
  message: Joi.string()
    .trim()
    .min(1)
    .max(4096)
    .optional()
    .messages({
      'string.empty': 'message cannot be empty',
      'string.min': 'message must be at least 1 character',
      'string.max': 'message cannot exceed 4096 characters',
    }),
  body: Joi.string()
    .trim()
    .min(1)
    .max(4096)
    .optional()
    .messages({
      'string.empty': 'body cannot be empty',
      'string.min': 'body must be at least 1 character',
      'string.max': 'body cannot exceed 4096 characters',
    }),
  channel: Joi.string()
    .trim()
    .optional(),
}).or('message', 'body');

module.exports = { sendTemplateSchema, sendMessageSchema };
