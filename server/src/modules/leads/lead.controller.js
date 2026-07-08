'use strict';

const leadService = require('./lead.service');
const lead360Service = require('./lead360.service');
const { importRowSchema } = require('./lead.validation');
const { sendSuccess } = require('../../utils/response');
const { AppError } = require('../../middlewares/error.middleware');

class LeadController {
  /**
   * GET /leads
   * Returns paginated lead list with search and filter support.
   */
  async getAll(req, res, next) {
    try {
      const result = await leadService.getAllLeads(req.query, req.user);
      return sendSuccess(res, result, 'Leads fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /leads/:id
   */
  async getById(req, res, next) {
    try {
      const lead = await leadService.getLeadById(req.params.id, req.user);
      return sendSuccess(res, { lead }, 'Lead fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /leads
   */
  async create(req, res, next) {
    try {
      const createdBy = req.user._id;
      const { lead, isDuplicate } = await leadService.createLead(req.body, createdBy);
      const statusCode = isDuplicate ? 200 : 201;
      const message = isDuplicate
        ? 'Duplicate lead detected — returning existing lead'
        : 'Lead created successfully';
      return sendSuccess(res, { lead, isDuplicate }, message, statusCode);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /leads/:id
   */
  async update(req, res, next) {
    try {
      const updatedBy = req.user._id;
      const lead = await leadService.updateLead(req.params.id, req.body, updatedBy);
      return sendSuccess(res, { lead }, 'Lead updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /leads/:id/assign
   */
  async assign(req, res, next) {
    try {
      const assignedBy = req.user._id;
      const { assignedTo } = req.body;
      const lead = await leadService.assignLead(req.params.id, assignedTo, assignedBy);
      return sendSuccess(res, { lead }, 'Lead assigned successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /leads/:id/stage
   */
  async changeStage(req, res, next) {
    try {
      const changedBy = req.user._id;
      const { stage } = req.body;
      const lead = await leadService.changeStage(req.params.id, stage, changedBy);
      return sendSuccess(res, { lead }, 'Lead stage updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /leads/:id
   */
  async delete(req, res, next) {
    try {
      const deletedBy = req.user._id;
      await leadService.deleteLead(req.params.id, deletedBy);
      return sendSuccess(res, null, 'Lead deleted successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /leads/action-queue
   * Returns hot leads and overdue follow-ups for the authenticated user.
   */
  async getActionQueue(req, res, next) {
    try {
      const userId = req.user._id;
      const result = await leadService.getActionQueue(userId);
      return sendSuccess(res, result, 'Action queue fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /leads/import
   * Expects req.body.rows — an array of lead row objects.
   * Each row is validated with importRowSchema before processing.
   */
  async importLeads(req, res, next) {
    try {
      const rows = req.body.rows;
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new AppError('Request body must contain a non-empty "rows" array', 400);
      }

      // Per-row validation
      const validatedRows = [];
      const validationErrors = [];

      for (let i = 0; i < rows.length; i++) {
        const { error, value } = importRowSchema.validate(rows[i], {
          abortEarly: false,
          allowUnknown: false,
          stripUnknown: true,
        });
        if (error) {
          validationErrors.push({
            row: i + 1,
            errors: error.details.map((d) => d.message.replace(/['"]/g, '')),
          });
        } else {
          validatedRows.push(value);
        }
      }

      const createdBy = req.user._id;
      const result = await leadService.importLeads(validatedRows, createdBy);

      return sendSuccess(
        res,
        {
          created: result.created,
          skipped: result.skipped,
          processingErrors: result.errors,
          validationErrors,
        },
        'Import completed',
        200
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /leads/public
   * No authentication required — public web form submission.
   */
  async createPublic(req, res, next) {
    try {
      const { lead, isDuplicate } = await leadService.createPublicLead(req.body);
      const statusCode = isDuplicate ? 200 : 201;
      const message = isDuplicate
        ? 'We already have your details — our team will reach out soon'
        : 'Thank you! Our team will contact you shortly';
      return sendSuccess(res, { isDuplicate }, message, statusCode);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /leads/:id/360
   * Returns the full Lead 360° intelligence profile.
   */
  async get360(req, res, next) {
    try {
      const data = await lead360Service.get360(req.params.id, req.user);
      return sendSuccess(res, data, 'Lead 360° profile fetched successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /leads/ingest
   * Ingest endpoint for n8n integration. Bypasses JWT auth.
   * Expects x-webhook-secret header.
   */
  async ingest(req, res, next) {
    try {
      const secret = req.headers['x-webhook-secret'];
      if (!secret || secret !== process.env.LEAD_WEBHOOK_SECRET) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
      }

      const { name, company, phone, email, city, address, product, quantity, usage, description, source, images, allFields } = req.body;

      if (!phone) {
        return res.status(400).json({ ok: false, error: 'Phone is required' });
      }

      // Helper to escape regex
      const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Check duplicate by phone AND product (robust matching)
      let existing = null;
      try {
        const LeadModel = require('../../models/Lead.model');
        const query = { 'contact.phone': new RegExp(`^${escapeRegex(phone.trim())}$`, 'i') };
        
        if (product) {
          query['product.name'] = new RegExp(`^${escapeRegex(product.trim())}$`, 'i');
        } else {
          // If no product provided, check for either missing product OR empty product
          query['product.name'] = { $in: [null, '', { $exists: false }] };
        }
        
        existing = await LeadModel.findOne(query).lean();
      } catch (dupErr) {
        console.warn('Duplicate check query failed (non-fatal):', dupErr.message);
      }

      // If we found a duplicate, return 200 immediately
      if (existing) {
        console.info(`Duplicate lead skipped (phone: ${phone}): ${existing._id}`);
        return res.status(200).json({ ok: true, duplicate: true, id: existing._id });
      }

      // Normalize source
      const validSources = Object.values(require('../../utils/constants').LEAD_SOURCES);
      let normalizedSource = 'other';
      
      if (source) {
        const lowerSource = source.toLowerCase().trim();
        if (validSources.includes(lowerSource)) {
          normalizedSource = lowerSource;
        } else if (lowerSource === 'meta') {
          normalizedSource = 'facebook';
        }
      } else {
        normalizedSource = 'other';
      }

      // Parse quantity safely (handle strings like "57 sq ft")
      let parsedQuantity = undefined;
      if (quantity) {
        const num = parseInt(quantity, 10);
        if (!isNaN(num)) {
          parsedQuantity = num;
        }
      }

      // Map flat payload to nested Lead schema
      const mappedData = {
        source: normalizedSource,
        stage: require('../../utils/constants').LEAD_STAGES.NEW,
        contact: {
          name,
          company,
          phone,
          email,
          city,
          address,
        },
        product: {
          name: product,
          quantity: parsedQuantity,
        },
        usage,
        description,
        images: Array.isArray(images) ? images : (typeof images === 'string' ? images.split(',').map(s => s.trim()).filter(Boolean) : undefined),
        allFields: allFields || {},
      };

      // 1. SAVE TO MONGODB FIRST
      const Lead = require('../../models/Lead.model');
      
      // Auto-assign via round-robin if possible
      let lead = new Lead({
        ...mappedData,
        createdBy: null,
      });

      // Try to auto-assign safely
      try {
        const Role = require('../../models/Role.model');
        const User = require('../../models/User.model');
        const leadRepository = require('./lead.repository');
        
        const salesExecRole = await Role.findOne({ key: 'sales_executive' }).lean();
        if (salesExecRole) {
          const executives = await User.find({ role: salesExecRole._id, isActive: true }).select('_id').lean();
          if (executives.length > 0) {
            const counts = await Promise.all(executives.map(u => leadRepository.countByFilter({ assignedTo: u._id })));
            let minCount = Infinity;
            let chosenId = null;
            for (let i = 0; i < executives.length; i++) {
              if (counts[i] < minCount) { minCount = counts[i]; chosenId = executives[i]._id; }
            }
            if (chosenId) {
              lead.assignedTo = chosenId;
              lead.assignedAt = new Date();
            }
          }
        }
      } catch (err) {
        console.warn('Auto-assign failed (non-fatal):', err.message);
      }

      try {
        await lead.save();
      } catch (saveErr) {
        // Fallback: If MongoDB throws E11000 duplicate key error because of a DB unique index,
        // treat it as a duplicate and return 200 OK.
        if (saveErr.code === 11000) {
          console.info(`MongoDB duplicate key skipped (phone: ${phone})`);
          return res.status(200).json({ ok: true, duplicate: true, id: null });
        }
        // If it's a different save error, throw it so the outer catch can log it.
        throw saveErr;
      }

      // 2. RETURN RESPONSE IMMEDIATELY
      res.status(200).json({ ok: true, id: lead._id });

      // 3. BACKGROUND TASKS (Fire and forget, strictly safe)
      setImmediate(async () => {
        try {
          // Scoring event
          const scoringService = require('../../services/scoring.service');
          const { SCORING_EVENTS } = require('../../utils/constants');
          await scoringService.applyEvent(lead._id, SCORING_EVENTS.LEAD_CREATED, null);
        } catch (bgErr) {
          console.warn('Background scoring skipped - error or redis unavailable:', bgErr.message);
        }
        
        try {
          // Add to webhook queue if needed
          const { webhookQueue } = require('../../jobs/queues');
          if (webhookQueue) {
            await webhookQueue.add('process_lead', { leadId: lead._id });
          } else {
            console.warn('queue skipped - redis unavailable');
          }
        } catch (qErr) {
          console.warn('Queue addition skipped:', qErr.message);
        }
      });

    } catch (err) {
      console.error('Ingest error:', err.stack || err);
      if (!res.headersSent) {
        return res.status(500).json({ ok: false, error: 'Internal Server Error' });
      }
    }
  }
}

module.exports = new LeadController();
