'use strict';

const { Redis } = require('ioredis');
const config = require('./env');
const logger = require('../utils/logger');

let redisClient = null;

const createBullMQConnection = () => {
  const client = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  client.on('connect', () => logger.info('BullMQ Redis connection established'));
  client.on('error', (err) => logger.error(`BullMQ Redis error: ${err.message}`));
  client.on('close', () => logger.warn('BullMQ Redis connection closed'));

  return client;
};

const connectRedis = async () => {
  if (redisClient) return redisClient;

  redisClient = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('ready', () => logger.info('Redis ready'));
  redisClient.on('error', (err) => logger.error(`Redis error: ${err.message}`));
  redisClient.on('close', () => logger.warn('Redis connection closed'));
  redisClient.on('reconnecting', () => logger.info('Redis reconnecting...'));

  try {
    await redisClient.connect();
    logger.info('Redis client initialized');
    return redisClient;
  } catch (error) {
    logger.error(`Redis connection failed: ${error.message}`);
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
};

module.exports = { connectRedis, getRedisClient, createBullMQConnection, disconnectRedis };
