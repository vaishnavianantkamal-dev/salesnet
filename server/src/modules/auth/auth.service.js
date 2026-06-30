'use strict';

const bcrypt = require('bcryptjs');
const User = require('../../models/User.model');
const AuditLog = require('../../models/AuditLog.model');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/token');
const { AppError } = require('../../middlewares/error.middleware');

class AuthService {
  async login(email, password, ipAddress, userAgent) {
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password +refreshToken')
      .populate('role');

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated. Contact your administrator.', 401);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      roleKey: user.role?.key,
      permissions: user.role?.permissions || [],
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ userId: user._id.toString() });

    // Hash refresh token before storing
    const salt = await bcrypt.genSalt(10);
    user.refreshToken = await bcrypt.hash(refreshToken, salt);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Log audit
    await AuditLog.create({
      action: 'auth.login',
      performedBy: user._id,
      targetModel: 'User',
      targetId: user._id,
      changes: { email: user.email },
      ipAddress,
      userAgent,
    });

    return {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    };
  }

  async refresh(rawRefreshToken) {
    if (!rawRefreshToken) {
      throw new AppError('Refresh token required', 401);
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(rawRefreshToken);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await User.findOne({
      _id: decoded.userId,
      isActive: true,
    })
      .select('+refreshToken')
      .populate('role');

    if (!user || !user.refreshToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Compare provided token against stored hash
    const isValid = await bcrypt.compare(rawRefreshToken, user.refreshToken);
    if (!isValid) {
      throw new AppError('Invalid refresh token', 401);
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      roleKey: user.role?.key,
      permissions: user.role?.permissions || [],
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken({ userId: user._id.toString() });

    // Rotate refresh token
    const salt = await bcrypt.genSalt(10);
    user.refreshToken = await bcrypt.hash(newRefreshToken, salt);
    await user.save({ validateBeforeSave: false });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });

    await AuditLog.create({
      action: 'auth.logout',
      performedBy: userId,
      targetModel: 'User',
      targetId: userId,
    });
  }

  async getMe(userId) {
    const user = await User.findById(userId).populate('role');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user.toSafeObject();
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isCurrentValid = await user.comparePassword(currentPassword);
    if (!isCurrentValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    user.password = newPassword; // pre-save hook will hash it
    user.refreshToken = null; // invalidate all sessions
    user.passwordChangedAt = new Date();
    await user.save();

    await AuditLog.create({
      action: 'auth.changePassword',
      performedBy: userId,
      targetModel: 'User',
      targetId: userId,
    });
  }
}

module.exports = new AuthService();
