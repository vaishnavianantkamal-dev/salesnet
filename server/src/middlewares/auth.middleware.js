"use strict";

const { verifyAccessToken } = require("../utils/token");
const { AppError } = require("./error.middleware");
const User = require("../models/User.model");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Access token required", 401));
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next(new AppError("Access token required", 401));
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(
      decoded.userId || decoded._id || decoded.id,
    )
      .select("+password")
      .populate("role");

    if (!user) {
      return next(new AppError("User not found", 401));
    }

    if (!user.isActive) {
      return next(
        new AppError(
          "Account is deactivated. Contact your administrator.",
          401,
        ),
      );
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Access token has expired", 401));
    }
    if (err.name === "JsonWebTokenError") {
      return next(new AppError("Invalid access token", 401));
    }
    next(new AppError("Authentication failed", 401));
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }
    const token = authHeader.split(" ")[1];
    if (!token) return next();

    const decoded = verifyAccessToken(token);
    const user = await User.findById(
      decoded.userId || decoded._id || decoded.id,
    ).populate("role");
    if (user && user.isActive) {
      req.user = user;
    }
    next();
  } catch {
    next();
  }
};

module.exports = { authenticate, optionalAuth };
