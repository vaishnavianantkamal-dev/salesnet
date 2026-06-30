'use strict';

const authService = require('./auth.service');
const { sendSuccess } = require('../../utils/response');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection?.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.login(email, password, ipAddress, userAgent);

      return sendSuccess(
        res,
        { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken },
        'Login successful',
        200
      );
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);

      return sendSuccess(res, result, 'Token refreshed successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const userId = req.user?._id;
      await authService.logout(userId);

      return sendSuccess(res, null, 'Logged out successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const userId = req.user?._id;
      const user = await authService.getMe(userId);

      return sendSuccess(res, { user }, 'User profile fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const userId = req.user?._id;
      const { currentPassword, newPassword } = req.body;

      await authService.changePassword(userId, currentPassword, newPassword);

      return sendSuccess(
        res,
        null,
        'Password changed successfully. Please log in again.',
        200
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
