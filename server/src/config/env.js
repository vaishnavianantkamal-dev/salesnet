'use strict';

const required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key, defaultValue = '') => process.env[key] || defaultValue;

const config = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '5000'), 10),
  isDev: optional('NODE_ENV', 'development') === 'development',
  isProd: optional('NODE_ENV', 'development') === 'production',

  MONGO_URI: required('MONGO_URI'),
  REDIS_URL: optional('REDIS_URL', 'redis://localhost:6379'),

  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  ACCESS_TOKEN_TTL: optional('ACCESS_TOKEN_TTL', '15m'),
  REFRESH_TOKEN_TTL: optional('REFRESH_TOKEN_TTL', '7d'),

  CLIENT_URL: optional('CLIENT_URL', 'http://localhost:3000'),

  META_APP_SECRET: optional('META_APP_SECRET'),
  META_VERIFY_TOKEN: optional('META_VERIFY_TOKEN'),
  WA_PHONE_NUMBER_ID: optional('WA_PHONE_NUMBER_ID'),
  WA_ACCESS_TOKEN: optional('WA_ACCESS_TOKEN'),
  WA_BUSINESS_ACCOUNT_ID: optional('WA_BUSINESS_ACCOUNT_ID'),

  GOOGLE_LEAD_KEY: optional('GOOGLE_LEAD_KEY'),
  INDIAMART_CRM_KEY: optional('INDIAMART_CRM_KEY'),
  TRADEINDIA_USERID: optional('TRADEINDIA_USERID'),
  TRADEINDIA_KEY: optional('TRADEINDIA_KEY'),
  TRADEINDIA_PROFILE_ID: optional('TRADEINDIA_PROFILE_ID'),
  JUSTDIAL_TOKEN: optional('JUSTDIAL_TOKEN'),

  AWS_S3_BUCKET: optional('AWS_S3_BUCKET'),
  AWS_ACCESS_KEY_ID: optional('AWS_ACCESS_KEY_ID'),
  AWS_SECRET_ACCESS_KEY: optional('AWS_SECRET_ACCESS_KEY'),
  AWS_REGION: optional('AWS_REGION', 'ap-south-1'),

  OPENAI_API_KEY: optional('OPENAI_API_KEY'),
  GEMINI_API_KEY: optional('GEMINI_API_KEY'),

  // Aliases for internal use
  get mongo() { return { uri: this.MONGO_URI }; },
  get redis() { return { url: this.REDIS_URL }; },
  get jwt() {
    return {
      accessSecret: this.JWT_ACCESS_SECRET,
      refreshSecret: this.JWT_REFRESH_SECRET,
      accessTTL: this.ACCESS_TOKEN_TTL,
      refreshTTL: this.REFRESH_TOKEN_TTL,
    };
  },
  get cors() { return { clientUrl: this.CLIENT_URL }; },
};

module.exports = config;
