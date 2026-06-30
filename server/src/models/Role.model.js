'use strict';

const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Role key is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index on key is handled by `unique: true` in schema definition above

roleSchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission);
};

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
