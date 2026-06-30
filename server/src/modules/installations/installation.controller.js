'use strict';

const installationService = require('./installation.service');
const { sendSuccess } = require('../../utils/response');

class InstallationController {
  async getAll(req, res, next) {
    try {
      const result = await installationService.getAllInstallations(req.query, req.user);
      return sendSuccess(res, result, 'Installations fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const installation = await installationService.getInstallationById(req.params.id);
      return sendSuccess(res, { installation }, 'Installation fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const installation = await installationService.createInstallation(req.body, req.user._id);
      return sendSuccess(res, { installation }, 'Installation created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const installation = await installationService.updateInstallation(
        req.params.id,
        req.body,
        req.user._id
      );
      return sendSuccess(res, { installation }, 'Installation updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getByLead(req, res, next) {
    try {
      const result = await installationService.getByLead(req.params.leadId);
      return sendSuccess(res, result, 'Lead installations fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new InstallationController();
