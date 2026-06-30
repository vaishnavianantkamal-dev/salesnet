'use strict';

const Joi = require('joi');

const mongoIdPattern = /^[0-9a-fA-F]{24}$/;

const passwordComplexity = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()\-_=+])/)
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  });

const createUserSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).required().messages({
    'any.required': 'First name is required',
  }),
  lastName: Joi.string().trim().min(1).max(100).required().messages({
    'any.required': 'Last name is required',
  }),
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  phone: Joi.string().trim().optional().allow(''),
  password: passwordComplexity.required().messages({
    'any.required': 'Password is required',
  }),
  role: Joi.string().pattern(mongoIdPattern).required().messages({
    'any.required': 'Role is required',
    'string.pattern.base': 'Invalid role ID format',
  }),
  isActive: Joi.boolean().optional(),
});

const updateUserSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).optional(),
  lastName: Joi.string().trim().min(1).max(100).optional(),
  email: Joi.string().email().lowercase().trim().optional(),
  phone: Joi.string().trim().optional().allow(''),
  role: Joi.string().pattern(mongoIdPattern).optional(),
  isActive: Joi.boolean().optional(),
  profilePicture: Joi.string().uri().optional().allow('', null),
}).min(1);

const resetPasswordSchema = Joi.object({
  newPassword: passwordComplexity.required().messages({
    'any.required': 'New password is required',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm the new password',
  }),
});

const queryUserSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  role: Joi.string().pattern(mongoIdPattern).optional(),
  isActive: Joi.boolean().optional(),
  search: Joi.string().trim().optional().allow(''),
  sort: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').optional(),
});

module.exports = { createUserSchema, updateUserSchema, resetPasswordSchema, queryUserSchema };
