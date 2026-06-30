'use strict';

require('dotenv').config();

const http = require('http');
const app = require('./app');
const { initWorkers } = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { connectRedis, disconnectRedis } = require('./config/redis');
const { initSocket } = require('./config/socket');
const config = require('./config/env');
const logger = require('./utils/logger');

const server = http.createServer(app);

const startServer = async () => {
  try {
    await connectDB();

    let redisConnected = false;
    try {
      await connectRedis();
      redisConnected = true;
    } catch (redisError) {
      logger.warn(`Redis connection failed (non-fatal): ${redisError.message}`);
    }

    if (redisConnected) {
      initWorkers();
    } else {
      logger.warn('[server] BullMQ workers not started — Redis unavailable');
    }

    initSocket(server);

    server.listen(config.PORT, () => {
      logger.info(`SalesNest CRM API running on port ${config.PORT} [${config.NODE_ENV}]`);
      logger.info(`Health check: http://localhost:${config.PORT}/health`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await disconnectDB();
    } catch (err) {
      logger.error(`Error during DB disconnect: ${err.message}`);
    }

    try {
      await disconnectRedis();
    } catch (err) {
      logger.error(`Error during Redis disconnect: ${err.message}`);
    }

    logger.info('All connections closed. Exiting process.');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Graceful shutdown timeout. Forcing exit.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', { reason, promise });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { message: error.message, stack: error.stack });
  process.exit(1);
});

startServer();
