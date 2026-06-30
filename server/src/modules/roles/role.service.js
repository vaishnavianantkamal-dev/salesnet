'use strict';

const roleRepository = require('./role.repository');
const { AppError } = require('../../middlewares/error.middleware');
const { getPaginationOptions, buildPaginationMeta } = require('../../utils/pagination');

class RoleService {
  async getAllRoles(query = {}) {
    const { page, limit, skip, sort } = getPaginationOptions(query);

    const filter = {};
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { key: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true' || query.isActive === true;
    }

    const { data, total } = await roleRepository.findAll(filter, { skip, limit, sort });

    return {
      roles: data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getRoleById(id) {
    return roleRepository.findById(id);
  }

  async getRoleByKey(key) {
    return roleRepository.findByKey(key);
  }

  async createRole(data) {
    const existing = await roleRepository.findByKey(data.key);
    if (existing) {
      throw new AppError(`Role with key '${data.key}' already exists`, 409);
    }
    return roleRepository.create(data);
  }

  async updateRole(id, data) {
    const role = await roleRepository.findById(id);

    if (role.isSystem) {
      if (data.key !== undefined && data.key !== role.key) {
        throw new AppError('Cannot change the key of a system role', 403);
      }
      if (data.isSystem !== undefined) {
        throw new AppError('Cannot change isSystem flag of a system role', 403);
      }
    }

    // Remove protected fields from update
    const updateData = { ...data };
    delete updateData.isSystem;
    if (role.isSystem) {
      delete updateData.key;
    }

    return roleRepository.updateById(id, updateData);
  }

  async deleteRole(id) {
    const role = await roleRepository.findById(id);
    if (role.isSystem) {
      throw new AppError('System roles cannot be deleted', 403);
    }
    return roleRepository.deleteById(id);
  }
}

module.exports = new RoleService();
