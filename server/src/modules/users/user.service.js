'use strict';

const User = require('../../models/User.model');
const Role = require('../../models/Role.model');
const userRepository = require('./user.repository');
const { AppError } = require('../../middlewares/error.middleware');
const { getPaginationOptions, buildPaginationMeta } = require('../../utils/pagination');

class UserService {
  async getAllUsers(query = {}, currentUser = null) {
    const { page, limit, skip, sort } = getPaginationOptions(query);

    const filter = {};
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
      ];
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true' || query.isActive === true;
    }
    if (query.role) {
      filter.role = query.role;
    }

    const { data, total } = await userRepository.findAll(filter, { skip, limit, sort });

    const safeData = data.map((user) => {
      const u = new User(user);
      return u.toSafeObject ? u.toSafeObject() : user;
    });

    return {
      users: safeData,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    return user.toSafeObject ? user.toSafeObject() : user;
  }

  async createUser(data, createdBy = null) {
    const existingEmail = await userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new AppError('A user with this email already exists', 409);
    }

    const role = await Role.findById(data.role);
    if (!role) {
      throw new AppError('Invalid role specified', 400);
    }

    return userRepository.create({
      ...data,
      createdBy,
    });
  }

  async updateUser(id, data, updatedBy = null) {
    const existingUser = await userRepository.findById(id);

    if (data.email && data.email !== existingUser.email) {
      const emailTaken = await userRepository.findByEmail(data.email);
      if (emailTaken && emailTaken._id.toString() !== id) {
        throw new AppError('Email already in use by another account', 409);
      }
    }

    if (data.role) {
      // Prevent non-super-admin from assigning super_admin role
      if (updatedBy) {
        const performingUser = await userRepository.findById(updatedBy.toString());
        const performingRole = performingUser.role;
        if (performingRole?.key !== 'super_admin') {
          const targetRole = await Role.findById(data.role);
          if (targetRole?.key === 'super_admin') {
            throw new AppError('Only super admins can assign the super_admin role', 403);
          }
        }
      }

      const role = await Role.findById(data.role);
      if (!role) {
        throw new AppError('Invalid role specified', 400);
      }
    }

    const safeUpdate = { ...data };
    delete safeUpdate.password;
    delete safeUpdate.refreshToken;

    return userRepository.updateById(id, safeUpdate);
  }

  async deactivateUser(id, currentUser) {
    if (id === currentUser._id.toString()) {
      throw new AppError('You cannot deactivate your own account', 400);
    }

    const targetUser = await userRepository.findById(id);
    const targetRole = targetUser.role;

    // Prevent deactivating another super admin unless caller is also super admin
    if (targetRole?.key === 'super_admin') {
      const callerRole = currentUser.role;
      if (callerRole?.key !== 'super_admin') {
        throw new AppError('Only super admins can deactivate other super admins', 403);
      }
    }

    return userRepository.deleteById(id);
  }

  async resetUserPassword(id, newPassword, currentUser) {
    const user = await User.findById(id).select('+password');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.password = newPassword; // pre-save hook will hash it
    user.refreshToken = null;
    await user.save();

    return userRepository.findById(id).then((u) => u.toSafeObject());
  }
}

module.exports = new UserService();
