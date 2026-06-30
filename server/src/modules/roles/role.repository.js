'use strict';

const Role = require('../../models/Role.model');
const { AppError } = require('../../middlewares/error.middleware');

class RoleRepository {
  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options;
    const [data, total] = await Promise.all([
      Role.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Role.countDocuments(filter),
    ]);
    return { data, total };
  }

  async findById(id) {
    const role = await Role.findById(id).lean();
    if (!role) {
      throw new AppError('Role not found', 404);
    }
    return role;
  }

  async findByKey(key) {
    return Role.findOne({ key }).lean();
  }

  async create(data) {
    const role = new Role(data);
    await role.save();
    return role.toObject();
  }

  async updateById(id, data) {
    const updated = await Role.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) {
      throw new AppError('Role not found', 404);
    }
    return updated;
  }

  async deleteById(id) {
    const role = await Role.findById(id);
    if (!role) {
      throw new AppError('Role not found', 404);
    }
    if (role.isSystem) {
      throw new AppError('System roles cannot be deleted', 403);
    }
    await Role.deleteOne({ _id: id });
    return { deleted: true };
  }
}

module.exports = new RoleRepository();
