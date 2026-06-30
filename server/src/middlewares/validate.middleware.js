'use strict';

const { AppError } = require('./error.middleware');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const data = req[property];

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) =>
        detail.message.replace(/['"]/g, '')
      );
      return next(new AppError('Validation failed', 422, errorMessages));
    }

    req[property] = value;
    next();
  };
};

const validateQuery = (schema) => validate(schema, 'query');
const validateParams = (schema) => validate(schema, 'params');

module.exports = { validate, validateQuery, validateParams };
