'use strict';

const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message = 'Internal server error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };
  if (errors !== null) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
