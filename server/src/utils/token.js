'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');

const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.ACCESS_TOKEN_TTL,
    issuer: 'salesnest-crm',
    audience: 'salesnest-client',
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.REFRESH_TOKEN_TTL,
    issuer: 'salesnest-crm',
    audience: 'salesnest-client',
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.JWT_ACCESS_SECRET, {
    issuer: 'salesnest-crm',
    audience: 'salesnest-client',
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.JWT_REFRESH_SECRET, {
    issuer: 'salesnest-crm',
    audience: 'salesnest-client',
  });
};

const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
};
