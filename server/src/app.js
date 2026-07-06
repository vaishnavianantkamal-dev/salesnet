'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const config = require('./config/env');
const logger = require('./utils/logger');
const { errorHandler, AppError } = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rateLimit.middleware');

const authRoutes = require('./modules/auth/auth.routes');
const roleRoutes = require('./modules/roles/role.routes');
const userRoutes = require('./modules/users/user.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const leadRoutes = require('./modules/leads/lead.routes');
const conversationRoutes = require('./modules/conversations/conversation.routes');
const activityRoutes = require('./modules/activities/activity.routes');
const taskRoutes = require('./modules/tasks/task.routes');
const followupRoutes = require('./modules/followups/followup.routes');
const productRoutes = require('./modules/products/product.routes');
const quotationRoutes = require('./modules/quotations/quotation.routes');
const { leadQuotationRouter } = require('./modules/quotations/quotation.routes');
const installationRoutes = require('./modules/installations/installation.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const { leadPaymentRouter } = require('./modules/payments/payment.routes');
const scoringRoutes = require('./modules/scoring/scoring.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');
const integrationRoutes = require('./modules/integrations/integration.routes');
const webhookRoutes = require('./modules/webhooks/webhook.routes');
const landingRoutes = require('./modules/landing/landing.routes');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: [
    config.CLIENT_URL,
    config.CLIENT_URL && config.CLIENT_URL.replace(/\/$/, '')
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

if (config.NODE_ENV !== 'test') {
  app.use(morgan('dev', {
    stream: logger.stream,
    skip: (req) => req.url === '/health',
  }));
}

app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (req, res) => res.status(200).json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  environment: config.NODE_ENV,
  version: '1.0.0',
}));

// Root endpoint for friendly message
app.get('/', (req, res) => res.status(200).json({
  success: true,
  message: 'SalesNest CRM API is running! 🚀',
  version: '1.0.0'
}));

// Webhooks bypass rate limiter (verified via signature)
app.use('/api/webhooks', webhookRoutes);
app.use('/api/webhook', webhookRoutes); // Alias for singular route

// Rate limit all other API routes
app.use('/api', apiLimiter);

// Auth
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Lead CRUD
app.use('/api/leads', leadRoutes);

// Nested lead routes (activity routes use mergeParams + root path '/')
app.use('/api/leads/:leadId/activities', activityRoutes);
app.use('/api/leads/:leadId/payments', leadPaymentRouter);
app.use('/api/leads/:leadId/quotations', leadQuotationRouter);

// Conversation routes define their own full paths like /leads/:leadId/conversations and /inbox
// Mount at /api so paths resolve correctly
app.use('/api', conversationRoutes);

// Resource routes
app.use('/api/tasks', taskRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/products', productRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/installations', installationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/scoring', scoringRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/landing', landingRoutes);

// 404
app.use((req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
});

app.use(errorHandler);

/**
 * Initialize BullMQ workers only when Redis is confirmed connected.
 * Each worker module self-initializes on require() and handles its own
 * try/catch internally, so requiring them here is safe even if Redis
 * becomes unavailable after the initial connect check.
 *
 * Call this function from server.js after a successful connectRedis().
 */
const initWorkers = () => {
  try {
    require('./jobs/whatsapp.worker');
    logger.info('[app] whatsapp worker loaded');
  } catch (err) {
    logger.warn(`[app] whatsapp worker failed to load: ${err.message}`);
  }

  try {
    require('./jobs/webhook.worker');
    logger.info('[app] webhook worker loaded');
  } catch (err) {
    logger.warn(`[app] webhook worker failed to load: ${err.message}`);
  }

  try {
    require('./jobs/scoring.worker');
    logger.info('[app] scoring worker loaded');
  } catch (err) {
    logger.warn(`[app] scoring worker failed to load: ${err.message}`);
  }

  try {
    require('./jobs/reminder.worker');
    logger.info('[app] reminder worker loaded');
  } catch (err) {
    logger.warn(`[app] reminder worker failed to load: ${err.message}`);
  }
};

module.exports = app;
module.exports.initWorkers = initWorkers;
