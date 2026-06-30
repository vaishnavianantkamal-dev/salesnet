'use strict';

const { Worker } = require('bullmq');
const { createBullMQConnection } = require('../config/redis');
const logger = require('../utils/logger');

let worker = null;

/**
 * Process a whatsapp queue job.
 * Dynamic imports are used for services to avoid circular dependency issues.
 */
async function processJob(job) {
  const { type } = job.data;

  logger.info(`[whatsapp.worker] Processing job id=${job.id} type=${type}`);

  if (type === 'send_template') {
    // Dynamic import to avoid circular dependencies at module load time
    const conversationService = require('../services/conversation.service');
    const { leadId, templateName, templateParams, phoneNumber } = job.data;

    await conversationService.sendWhatsAppTemplate({
      leadId,
      templateName,
      templateParams,
      phoneNumber,
    });

    logger.info(`[whatsapp.worker] send_template completed for leadId=${leadId}`);
    return { status: 'sent', leadId };
  }

  if (type === 'send_reminder') {
    const { leadId, phoneNumber, templateName, templateParams } = job.data;

    // Only send follow-up if lead still has no reply
    const Conversation = require('../models/Conversation.model');
    const Lead = require('../models/Lead.model');

    const lead = await Lead.findOne({ _id: leadId, isDeleted: false });
    if (!lead) {
      logger.warn(`[whatsapp.worker] send_reminder: lead ${leadId} not found, skipping`);
      return { status: 'skipped', reason: 'lead_not_found' };
    }

    // Check for any inbound message from lead
    const hasReply = await Conversation.findOne({
      lead: leadId,
      direction: 'inbound',
    }).lean();

    if (hasReply) {
      logger.info(`[whatsapp.worker] send_reminder: lead ${leadId} already replied, skipping`);
      return { status: 'skipped', reason: 'already_replied' };
    }

    const conversationService = require('../services/conversation.service');
    await conversationService.sendWhatsAppTemplate({
      leadId,
      templateName: templateName || 'follow_up_reminder',
      templateParams: templateParams || [],
      phoneNumber,
    });

    logger.info(`[whatsapp.worker] send_reminder completed for leadId=${leadId}`);
    return { status: 'sent', leadId };
  }

  logger.warn(`[whatsapp.worker] Unknown job type: ${type}`);
  throw new Error(`Unknown whatsapp job type: ${type}`);
}

try {
  worker = new Worker('whatsapp', processJob, {
    connection: createBullMQConnection(),
    concurrency: 5,
  });

  worker.on('completed', (job, result) => {
    logger.info(`[whatsapp.worker] Job ${job.id} completed: ${JSON.stringify(result)}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[whatsapp.worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.error(`[whatsapp.worker] Worker error: ${err.message}`);
  });

  logger.info('[whatsapp.worker] Worker started on queue: whatsapp');
} catch (err) {
  logger.warn(`[whatsapp.worker] Worker not started — Redis unavailable: ${err.message}`);
}

// ─── Graceful shutdown ───────────────────────────────────────────────────────

async function shutdown() {
  if (worker) {
    logger.info('[whatsapp.worker] Shutting down gracefully...');
    try {
      await worker.close();
      logger.info('[whatsapp.worker] Worker closed');
    } catch (err) {
      logger.error(`[whatsapp.worker] Error during shutdown: ${err.message}`);
    }
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = { worker, shutdown };
