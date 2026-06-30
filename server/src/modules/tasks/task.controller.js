'use strict';

const taskService = require('./task.service');
const { sendSuccess } = require('../../utils/response');

class TaskController {
  async getAll(req, res, next) {
    try {
      const result = await taskService.getAllTasks(req.query, req.user);
      return sendSuccess(res, result, 'Tasks fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const task = await taskService.getTaskById(req.params.id, req.user);
      return sendSuccess(res, { task }, 'Task fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const task = await taskService.createTask(req.body, req.user);
      return sendSuccess(res, { task }, 'Task created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const task = await taskService.updateTask(req.params.id, req.body, req.user);
      return sendSuccess(res, { task }, 'Task updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await taskService.deleteTask(req.params.id, req.user);
      return sendSuccess(res, null, 'Task deleted successfully', 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TaskController();
