'use strict';

const taskRepository = require('./task.repository');
const { AppError } = require('../../middlewares/error.middleware');
const { getPaginationOptions, buildPaginationMeta } = require('../../utils/pagination');

const ADMIN_ROLE_KEYS = ['super_admin', 'admin'];

const isAdmin = (user) => ADMIN_ROLE_KEYS.includes(user.role?.key);

class TaskService {
  async getAllTasks(query = {}, user) {
    const { page, limit, skip, sort } = getPaginationOptions(query);

    const filter = { isActive: true };

    // Non-admin users can only see tasks assigned to themselves
    if (!isAdmin(user)) {
      filter.assignedTo = user._id;
    } else if (query.assignedTo) {
      filter.assignedTo = query.assignedTo;
    }

    if (query.lead) {
      filter.lead = query.lead;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.dueAtFrom || query.dueAtTo) {
      filter.dueAt = {};
      if (query.dueAtFrom) {
        filter.dueAt.$gte = new Date(query.dueAtFrom);
      }
      if (query.dueAtTo) {
        filter.dueAt.$lte = new Date(query.dueAtTo);
      }
    }

    const { data, total } = await taskRepository.findAll(filter, { skip, limit, sort });

    return {
      tasks: data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getTaskById(id, user) {
    const task = await taskRepository.findById(id);

    if (!isAdmin(user) && String(task.assignedTo?._id || task.assignedTo) !== String(user._id)) {
      throw new AppError('You are not authorized to view this task', 403);
    }

    return task;
  }

  async createTask(data, createdBy) {
    const taskData = {
      ...data,
      createdBy: createdBy._id,
    };
    return taskRepository.create(taskData);
  }

  async updateTask(id, data, user) {
    const task = await taskRepository.findById(id);

    if (!isAdmin(user) && String(task.assignedTo?._id || task.assignedTo) !== String(user._id)) {
      throw new AppError('You are not authorized to update this task', 403);
    }

    // Prevent changing immutable ownership fields by non-admins
    const updateData = { ...data };
    if (!isAdmin(user)) {
      delete updateData.assignedTo;
      delete updateData.lead;
    }

    return taskRepository.updateById(id, updateData);
  }

  async deleteTask(id, user) {
    const task = await taskRepository.findById(id);

    if (!isAdmin(user) && String(task.assignedTo?._id || task.assignedTo) !== String(user._id)) {
      throw new AppError('You are not authorized to delete this task', 403);
    }

    return taskRepository.deleteById(id);
  }
}

module.exports = new TaskService();
