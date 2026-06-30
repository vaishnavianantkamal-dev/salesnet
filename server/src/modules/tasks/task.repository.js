'use strict';

const Task = require('../../models/Task.model');
const { AppError } = require('../../middlewares/error.middleware');

class TaskRepository {
  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options;
    const [data, total] = await Promise.all([
      Task.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('lead', 'leadId contact.name contact.phone')
        .populate('assignedTo', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .lean(),
      Task.countDocuments(filter),
    ]);
    return { data, total };
  }

  async findById(id) {
    const task = await Task.findById(id)
      .populate('lead', 'leadId contact.name contact.phone')
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .lean();
    if (!task) {
      throw new AppError('Task not found', 404);
    }
    return task;
  }

  async create(data) {
    const task = new Task(data);
    await task.save();
    return task.toObject();
  }

  async updateById(id, data) {
    const updated = await Task.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate('lead', 'leadId contact.name contact.phone')
      .populate('assignedTo', 'firstName lastName email')
      .lean();
    if (!updated) {
      throw new AppError('Task not found', 404);
    }
    return updated;
  }

  async deleteById(id) {
    const task = await Task.findById(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }
    await Task.deleteOne({ _id: id });
    return { deleted: true };
  }
}

module.exports = new TaskRepository();
