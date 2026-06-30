'use strict';

const { Worker } = require('bullmq');
const { createBullMQConnection } = require('../config/redis');
const logger = require('../utils/logger');
const scoringService = require('../services/scoring.service');

let worker = null;

/**
 * Process a scoring queue job.
 */
async function processJob(job) {
  const { type } = job.data;

  logger.info(`[scoring.worker] Processing job id=${job.id} type=${type}`);

  if (type === 'apply_event') {
    const { leadId, eventKey, performedBy } = job.data;

    if (!leadId || !eventKey) {
      throw new Error(`scoring apply_event requires leadId and eventKey; got leadId=${leadId} eventKey=${eventKey}`);
    }

    const result = await scoringService.applyEvent(leadId, eventKey, performedBy || null);

    if (!result) {
      logger.info(`[scoring.worker] apply_event: no active rule for event "${eventKey}", skipped`);
      return { status: 'skipped', reason: 'no_active_rule', leadId, eventKey };
    }

    logger.info(
      `[scoring.worker] apply_event: leadId=${leadId} eventKey=${eventKey} newScore=${result.lead.score}`
    );
    return {
      status: 'applied',
      leadId,
      eventKey,
      newScore: result.lead.score,
      temperature: result.lead.temperature,
    };
  }

  logger.warn(`[scoring.worker] Unknown job type: ${type}`);
  throw new Error(`Unknown scoring job type: ${type}`);
}

try {
  worker = new Worker('scoring', processJob, {
    connection: createBullMQConnection(),
    concurrency: 20,
  });

  worker.on('completed', (job, result) => {
    logger.info(`[scoring.worker] Job ${job.id} completed: ${JSON.stringify(result)}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[scoring.worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.error(`[scoring.worker] Worker error: ${err.message}`);
  });

  logger.info('[scoring.worker] Worker started on queue: scoring');
} catch (err) {
  logger.warn(`[scoring.worker] Worker not started — Redis unavailable: ${err.message}`);
}

// ─── Graceful shutdown ───────────────────────────────────────────────────────

async function shutdown() {
  if (worker) {
    logger.info('[scoring.worker] Shutting down gracefully...');
    try {
      await worker.close();
      logger.info('[scoring.worker] Worker closed');
    } catch (err) {
      logger.error(`[scoring.worker] Error during shutdown: ${err.message}`);
    }
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = { worker, shutdown };
