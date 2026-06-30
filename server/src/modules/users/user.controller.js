'use strict';

const userService = require('./user.service');
const { sendSuccess } = require('../../utils/response');

class UserController {
  async getAll(req, res, next) {
    try {
      const result = await userService.getAllUsers(req.query, req.user);
      return sendSuccess(res, result, 'Users fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      return sendSuccess(res, { user }, 'User fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const createdBy = req.user?._id;
      const user = await userService.createUser(req.body, createdBy);
      return sendSuccess(res, { user }, 'User created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const updatedBy = req.user?._id;
      const user = await userService.updateUser(req.params.id, req.body, updatedBy);
      return sendSuccess(res, { user }, 'User updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async deactivate(req, res, next) {
    try {
      const user = await userService.deactivateUser(req.params.id, req.user);
      return sendSuccess(res, { user }, 'User deactivated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const user = await userService.resetUserPassword(req.params.id, req.body.newPassword, req.user);
      return sendSuccess(res, { user }, 'Password reset successfully', 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
