'use strict';

const { Queue } = require('bullmq');
const { createBullMQConnection } = require('../config/redis');
const logger = require('../utils/logger');

let whatsappQueue = null;
let webhookQueue = null;
let scoringQueue = null;
let reminderQueue = null;

try {
  const connection = createBullMQConnection();

  whatsappQueue = new Queue('whatsapp', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 200 },
    },
  });

  webhookQueue = new Queue('webhook', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 500 },
    },
  });

  scoringQueue = new Queue('scoring', {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 200 },
    },
  });

  reminderQueue = new Queue('reminder', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'fixed', delay: 10000 },
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 100 },
    },
  });

  logger.info('BullMQ queues initialized: whatsapp, webhook, scoring, reminder');
} catch (err) {
  logger.warn(`BullMQ queues not initialized — Redis unavailable: ${err.message}`);
}

// ─── Helper: addWhatsAppJob ──────────────────────────────────────────────────

/**
 * Add a job to the whatsapp queue.
 * @param {Object} data  - Job payload (must include `type`)
 * @param {Object} [opts] - BullMQ job options
 */
const addWhatsAppJob = async (data, opts = {}) => {
  if (!whatsappQueue) {
    logger.warn('addWhatsAppJob: whatsapp queue is not available (Redis offline)');
    return null;
  }
  return whatsappQueue.add(data.type || 'send_template', data, opts);
};

// ─── Helper: addWebhookJob ───────────────────────────────────────────────────

/**
 * Add a job to the webhook queue.
 * @param {Object} data - Job payload (must include `type`)
 */
const addWebhookJob = async (data) => {
  if (!webhookQueue) {
    logger.warn('addWebhookJob: webhook queue is not available (Redis offline)');
    return null;
  }
  return webhookQueue.add(data.type || 'process_lead', data);
};

// ─── Helper: addScoringJob ───────────────────────────────────────────────────

/**
 * Add a job to the scoring queue.
 * @param {Object} data - Job payload (must include `type`)
 */
const addScoringJob = async (data) => {
  if (!scoringQueue) {
    logger.warn('addScoringJob: scoring queue is not available (Redis offline)');
    return null;
  }
  return scoringQueue.add(data.type || 'apply_event', data);
};

// ─── Helper: addReminderJob ──────────────────────────────────────────────────

/**
 * Add a job to the reminder queue.
 * @param {Object} data  - Job payload (must include `type`)
 * @param {Object} [opts] - BullMQ job options
 */
const addReminderJob = async (data, opts = {}) => {
  if (!reminderQueue) {
    logger.warn('addReminderJob: reminder queue is not available (Redis offline)');
    return null;
  }
  return reminderQueue.add(data.type || 'check_followups', data, opts);
};

module.exports = {
  whatsappQueue,
  webhookQueue,
  scoringQueue,
  reminderQueue,
  addWhatsAppJob,
  addWebhookJob,
  addScoringJob,
  addReminderJob,
};
