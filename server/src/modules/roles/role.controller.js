'use strict';

const roleService = require('./role.service');
const { sendSuccess } = require('../../utils/response');

class RoleController {
  async getAll(req, res, next) {
    try {
      const result = await roleService.getAllRoles(req.query);
      return sendSuccess(res, result, 'Roles fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const role = await roleService.getRoleById(req.params.id);
      return sendSuccess(res, { role }, 'Role fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const role = await roleService.createRole(req.body);
      return sendSuccess(res, { role }, 'Role created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const role = await roleService.updateRole(req.params.id, req.body);
      return sendSuccess(res, { role }, 'Role updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await roleService.deleteRole(req.params.id);
      return sendSuccess(res, null, 'Role deleted successfully', 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RoleController();
