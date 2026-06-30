'use strict';

const https = require('https');
const Integration = require('../../models/Integration.model');
const { AppError } = require('../../middlewares/error.middleware');
const { sendSuccess } = require('../../utils/response');

// ---------------------------------------------------------------------------
// Configuration maps
// ---------------------------------------------------------------------------

/**
 * Defines the canonical type for each named integration document.
 * Used when upserting to keep the `type` field consistent.
 */
const INTEGRATION_TYPE_MAP = {
  meta_whatsapp: 'whatsapp',
  google_leads: 'lead_source',
  indiamart: 'lead_source',
  tradeindia: 'lead_source',
  justdial: 'lead_source',
  aws_s3: 's3',
  openai: 'ai',
  gemini: 'ai',
};

/**
 * Sensitive config keys — their values are replaced with "***SAVED***"
 * when returned in API responses.
 */
const SENSITIVE_FIELDS = new Set([
  'appSecret',
  'accessToken',
  'key',
  'apiKey',
  'secretAccessKey',
  'crmKey',
  'leadKey',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Masks sensitive fields in a plain config object.
 * Returns a new object; does not mutate the original.
 *
 * @param {Record<string, unknown>} config
 * @returns {Record<string, unknown>}
 */
const maskConfig = (config) => {
  if (!config || typeof config !== 'object') return config;

  const masked = {};
  for (const [key, value] of Object.entries(config)) {
    if (SENSITIVE_FIELDS.has(key)) {
      masked[key] = value ? '***SAVED***' : '';
    } else {
      masked[key] = value;
    }
  }
  return masked;
};

/**
 * Converts a Mongoose Integration document to a plain response object
 * with config fields masked appropriately.
 *
 * @param {import('mongoose').Document} doc
 * @returns {object}
 */
const toSafeDoc = (doc) => {
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  plain.config = maskConfig(plain.config || {});
  return plain;
};

/**
 * Performs a simple HTTPS GET and resolves with the parsed JSON body,
 * or rejects with an Error on failure.
 *
 * @param {string} url
 * @param {Record<string, string>} [headers]
 * @returns {Promise<object>}
 */
const httpsGet = (url, headers = {}) =>
  new Promise((resolve, reject) => {
    const options = new URL(url);
    const reqOptions = {
      hostname: options.hostname,
      path: options.pathname + options.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = https.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error?.message || `HTTP ${res.statusCode}`));
          }
        } catch {
          reject(new Error('Invalid JSON response from remote server'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy(new Error('Connection timed out'));
    });
    req.end();
  });

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

class IntegrationController {
  /**
   * GET /integrations
   * Returns all integration documents with sensitive config fields masked.
   */
  async getAll(req, res, next) {
    try {
      const integrations = await Integration.find({}).sort({ name: 1 }).lean();

      const data = integrations.map((doc) => ({
        ...doc,
        config: maskConfig(doc.config || {}),
      }));

      return sendSuccess(res, { integrations: data }, 'Integrations fetched successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /integrations/:name
   * Returns a single integration document (by name) with sensitive fields masked.
   */
  async getByName(req, res, next) {
    try {
      const { name } = req.params;
      const integration = await Integration.findOne({ name }).lean();

      if (!integration) {
        return next(new AppError(`Integration '${name}' not found`, 404));
      }

      const data = { ...integration, config: maskConfig(integration.config || {}) };
      return sendSuccess(res, { integration: data }, 'Integration fetched successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /integrations/:name
   * Creates or updates an integration document.
   * - Merges incoming config fields into existing config (does not delete absent keys).
   * - Marks isActive = true when at least one config field has a non-empty value.
   * - Sets `type` automatically from the INTEGRATION_TYPE_MAP if the doc is new.
   */
  async upsertByName(req, res, next) {
    try {
      const { name } = req.params;
      const { config: incomingConfig = {}, metadata } = req.body;

      // Resolve type for this named integration
      const type = INTEGRATION_TYPE_MAP[name];
      if (!type) {
        return next(
          new AppError(
            `Unknown integration name '${name}'. Supported names: ${Object.keys(INTEGRATION_TYPE_MAP).join(', ')}`,
            400
          )
        );
      }

      // Fetch existing document (if any) to merge config
      const existing = await Integration.findOne({ name }).lean();
      const existingConfig = (existing && existing.config) ? existing.config : {};

      // Merge: existing fields not in the request body are preserved
      const mergedConfig = { ...existingConfig, ...incomingConfig };

      // Mark active when at least one config field has a truthy value
      const hasAnyConfig = Object.values(mergedConfig).some(
        (v) => v !== null && v !== undefined && v !== ''
      );

      const updatePayload = {
        type,
        config: mergedConfig,
        isActive: hasAnyConfig,
        ...(metadata !== undefined ? { metadata } : {}),
      };

      const integration = await Integration.findOneAndUpdate(
        { name },
        { $set: updatePayload },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );

      const data = toSafeDoc(integration);
      const message = existing
        ? `Integration '${name}' updated successfully`
        : `Integration '${name}' created successfully`;

      return sendSuccess(res, { integration: data }, message, existing ? 200 : 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /integrations/:name/toggle
   * Flips the isActive flag on the specified integration.
   */
  async toggleActive(req, res, next) {
    try {
      const { name } = req.params;

      const integration = await Integration.findOne({ name });
      if (!integration) {
        return next(new AppError(`Integration '${name}' not found`, 404));
      }

      integration.isActive = !integration.isActive;
      await integration.save();

      const data = toSafeDoc(integration);
      const status = integration.isActive ? 'activated' : 'deactivated';
      return sendSuccess(res, { integration: data }, `Integration '${name}' ${status} successfully`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /integrations/:name/test
   * Runs a basic connectivity / credential check for the named integration.
   *
   * - meta_whatsapp: calls Graph API to verify the access token.
   * - All others: returns { tested: false, message: 'Manual verification required' }.
   */
  async testConnection(req, res, next) {
    try {
      const { name } = req.params;

      const integration = await Integration.findOne({ name }).lean();
      if (!integration) {
        return next(new AppError(`Integration '${name}' not found`, 404));
      }

      // --- WhatsApp / Meta Graph API test ---
      if (name === 'meta_whatsapp') {
        const { accessToken, phoneNumberId } = integration.config || {};

        if (!accessToken || !phoneNumberId) {
          return next(
            new AppError(
              'meta_whatsapp integration is missing accessToken or phoneNumberId in config',
              422
            )
          );
        }

        try {
          const result = await httpsGet(
            `https://graph.facebook.com/v19.0/${phoneNumberId}?fields=id,display_phone_number,verified_name`,
            { Authorization: `Bearer ${accessToken}` }
          );

          return sendSuccess(
            res,
            {
              tested: true,
              phoneNumberId: result.id,
              displayPhoneNumber: result.display_phone_number,
              verifiedName: result.verified_name,
            },
            'WhatsApp connection verified successfully'
          );
        } catch (apiErr) {
          return sendSuccess(
            res,
            { tested: false, success: false, message: apiErr.message },
            'Connection test completed'
          );
        }
      }

      // --- Default: manual verification required ---
      return sendSuccess(
        res,
        { tested: false, message: 'Manual verification required' },
        `No automated test available for '${name}'`
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new IntegrationController();
