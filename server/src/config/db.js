'use strict';

const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

let isConnected = false;
const MAX_RETRIES = 5;

const connectDB = async (attempt = 1) => {
  if (isConnected) {
    logger.info('MongoDB already connected');
    return;
  }

  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4, // Force IPv4 to fix Node.js DNS SRV issues
  };

  try {
    const conn = await mongoose.connect(config.MONGO_URI, options);
    isConnected = true;
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection error (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);

    if (attempt < MAX_RETRIES) {
      const delay = Math.pow(2, attempt) * 1000;
      logger.info(`Retrying MongoDB connection in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectDB(attempt + 1);
    } else {
      logger.error('Max MongoDB connection retries reached. Exiting.');
      process.exit(1);
    }
  }
};

mongoose.connection.on('connected', () => {
  isConnected = true;
  logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error(`Mongoose connection error: ${err.message}`);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected from MongoDB');
  isConnected = false;
});

const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('MongoDB connection closed');
  }
};

module.exports = { connectDB, disconnectDB };
