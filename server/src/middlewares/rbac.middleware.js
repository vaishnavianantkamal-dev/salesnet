'use strict';

const { AppError } = require('./error.middleware');

const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const role = req.user.role;
    if (!role) {
      return next(new AppError('Role information missing', 403));
    }

    // Super admin bypasses all permission checks
    if (role.key === 'super_admin') return next();

    const userPermissions = role.permissions || [];
    const hasAll = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasAll) {
      return next(
        new AppError(
          `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
          403
        )
      );
    }

    next();
  };
};

const authorizeAny = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const role = req.user.role;
    if (!role) {
      return next(new AppError('Role information missing', 403));
    }

    // Super admin bypasses all permission checks
    if (role.key === 'super_admin') return next();

    const userPermissions = role.permissions || [];
    const hasAny = requiredPermissions.some((perm) => userPermissions.includes(perm));

    if (!hasAny) {
      return next(
        new AppError(
          `Insufficient permissions. Requires one of: ${requiredPermissions.join(', ')}`,
          403
        )
      );
    }

    next();
  };
};

const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const roleKey = req.user.role?.key;
    if (!roles.includes(roleKey)) {
      return next(
        new AppError(`Access restricted to roles: ${roles.join(', ')}`, 403)
      );
    }

    next();
  };
};

module.exports = { authorize, authorizeAny, authorizeRole };
