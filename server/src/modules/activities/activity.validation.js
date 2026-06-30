'use strict';

const Joi = require('joi');

const createNoteSchema = Joi.object({
  description: Joi.string().trim().min(1).max(2000).required().messages({
    'string.base': 'Description must be a string',
    'string.empty': 'Description is required',
    'string.min': 'Description must be at least 1 character',
    'string.max': 'Description must not exceed 2000 characters',
    'any.required': 'Description is required',
  }),
});

module.exports = { createNoteSchema };
