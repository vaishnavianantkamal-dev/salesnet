'use strict';

const User = require('../../models/User.model');
const { AppError } = require('../../middlewares/error.middleware');

class UserRepository {
  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options;
    const [data, total] = await Promise.all([
      User.find(filter).populate('role').sort(sort).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    return { data, total };
  }

  async findById(id) {
    const user = await User.findById(id).populate('role');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken').populate('role');
  }

  async create(data) {
    const user = new User(data);
    await user.save();
    await user.populate('role');
    return user.toSafeObject();
  }

  async updateById(id, data) {
    const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('role');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user.toSafeObject();
  }

  async deleteById(id) {
    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true }).populate('role');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user.toSafeObject();
  }

  async countByRole(roleId) {
    return User.countDocuments({ role: roleId });
  }
}

module.exports = new UserRepository();
