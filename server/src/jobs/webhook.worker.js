'use strict';

const { Worker } = require('bullmq');
const { createBullMQConnection } = require('../config/redis');
const logger = require('../utils/logger');
const WebhookLog = require('../models/WebhookLog.model');

let worker = null;

/**
 * Process a webhook queue job.
 */
async function processJob(job) {
  const { type } = job.data;

  logger.info(`[webhook.worker] Processing job id=${job.id} type=${type}`);

  if (type === 'process_lead') {
    const { source, rawPayload, normalizedData } = job.data;

    // Create an initial WebhookLog entry (received state)
    const webhookLog = await WebhookLog.create({
      source,
      rawPayload,
      parsedData: normalizedData,
      status: 'received',
    });

    try {
      // Dynamic import to avoid circular dependency issues
      const leadService = require('../services/lead.service');

      const lead = await leadService.createLead(normalizedData);

      // Update log to processed
      webhookLog.status = 'processed';
      webhookLog.leadCreated = lead._id;
      await webhookLog.save();

      logger.info(`[webhook.worker] process_lead: lead created _id=${lead._id} from source=${source}`);
      return { status: 'processed', leadId: lead._id, webhookLogId: webhookLog._id };
    } catch (err) {
      // Mark log as failed, store error message
      webhookLog.status = 'failed';
      webhookLog.error = err.message;
      await webhookLog.save();

      logger.error(`[webhook.worker] process_lead failed for source=${source}: ${err.message}`);
      // Re-throw so BullMQ can retry according to job options
      throw err;
    }
  }

  logger.warn(`[webhook.worker] Unknown job type: ${type}`);
  throw new Error(`Unknown webhook job type: ${type}`);
}

try {
  worker = new Worker('webhook', processJob, {
    connection: createBullMQConnection(),
    concurrency: 10,
  });

  worker.on('completed', (job, result) => {
    logger.info(`[webhook.worker] Job ${job.id} completed: ${JSON.stringify(result)}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[webhook.worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.error(`[webhook.worker] Worker error: ${err.message}`);
  });

  logger.info('[webhook.worker] Worker started on queue: webhook');
} catch (err) {
  logger.warn(`[webhook.worker] Worker not started — Redis unavailable: ${err.message}`);
}

// ─── Graceful shutdown ───────────────────────────────────────────────────────

async function shutdown() {
  if (worker) {
    logger.info('[webhook.worker] Shutting down gracefully...');
    try {
      await worker.close();
      logger.info('[webhook.worker] Worker closed');
    } catch (err) {
      logger.error(`[webhook.worker] Error during shutdown: ${err.message}`);
    }
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = { worker, shutdown };
