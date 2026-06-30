'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const { ALL_PERMISSIONS, SCORING_EVENTS } = require('./constants');

const Role = require('../models/Role.model');
const User = require('../models/User.model');
const ScoringRule = require('../models/ScoringRule.model');

const logger = console;

const SEED_ROLES = [
  {
    key: 'super_admin',
    name: 'Super Admin',
    description: 'Full access to all system features',
    permissions: ALL_PERMISSIONS,
    isSystem: true,
    isActive: true,
  },
  {
    key: 'sales_executive',
    name: 'Sales Executive',
    description: 'Manages leads and conversations',
    permissions: [
      'leads:create',
      'leads:read',
      'leads:update',
      'leads:assign',
      'conversations:read',
      'conversations:send',
      'activities:create',
      'activities:read',
    ],
    isSystem: true,
    isActive: true,
  },
  {
    key: 'installation_executive',
    name: 'Installation Executive',
    description: 'Handles installation tasks',
    permissions: ['leads:read', 'activities:create', 'activities:read'],
    isSystem: true,
    isActive: true,
  },
];

const SEED_SCORING_RULES = [
  { event: SCORING_EVENTS.LEAD_CREATED, points: 5, description: 'Points awarded when a new lead is created', isActive: true },
  { event: SCORING_EVENTS.LEAD_CONTACTED, points: 10, description: 'Points awarded when a lead is first contacted', isActive: true },
  { event: SCORING_EVENTS.MEETING_SCHEDULED, points: 20, description: 'Points awarded when a meeting is scheduled', isActive: true },
  { event: SCORING_EVENTS.PROPOSAL_SENT, points: 25, description: 'Points awarded when a proposal is sent', isActive: true },
  { event: SCORING_EVENTS.FOLLOW_UP, points: 5, description: 'Points awarded for each follow-up activity', isActive: true },
  { event: SCORING_EVENTS.WHATSAPP_REPLIED, points: 8, description: 'Points awarded when lead replies via WhatsApp', isActive: true },
  { event: SCORING_EVENTS.EMAIL_OPENED, points: 3, description: 'Points awarded when lead opens an email', isActive: true },
  { event: SCORING_EVENTS.DEMO_DONE, points: 30, description: 'Points awarded when a demo is completed', isActive: true },
];

const seed = async () => {
  try {
    logger.log('Connecting to MongoDB...');
    await mongoose.connect(config.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.log('MongoDB connected');

    // Seed Roles
    logger.log('Seeding roles...');
    for (const roleData of SEED_ROLES) {
      const existing = await Role.findOne({ key: roleData.key });
      if (existing) {
        await Role.findByIdAndUpdate(existing._id, roleData, { new: true });
        logger.log(`  Role updated: ${roleData.key}`);
      } else {
        await Role.create(roleData);
        logger.log(`  Role created: ${roleData.key}`);
      }
    }

    // Seed Super Admin User
    logger.log('Seeding super admin user...');
    const superAdminRole = await Role.findOne({ key: 'super_admin' });
    if (!superAdminRole) {
      throw new Error('Super admin role not found after seeding');
    }

    const adminEmail = 'admin@salesnest.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      logger.log(`  Admin user already exists: ${adminEmail}`);
    } else {
      // Pass plain password — the pre-save hook will hash it once
      const adminUser = new User({
        firstName: 'System',
        lastName: 'Admin',
        email: adminEmail,
        password: 'Admin@123456',
        role: superAdminRole._id,
        isActive: true,
        isEmailVerified: true,
      });
      await adminUser.save();
      logger.log(`  Admin user created: ${adminEmail}`);
    }

    // Seed Scoring Rules
    logger.log('Seeding scoring rules...');
    for (const ruleData of SEED_SCORING_RULES) {
      const existing = await ScoringRule.findOne({ event: ruleData.event });
      if (existing) {
        logger.log(`  Scoring rule already exists: ${ruleData.event}`);
      } else {
        await ScoringRule.create(ruleData);
        logger.log(`  Scoring rule created: ${ruleData.event} (${ruleData.points} pts)`);
      }
    }

    logger.log('\nSeed completed successfully!');
  } catch (error) {
    logger.error('Seed failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.log('MongoDB connection closed');
    process.exit(0);
  }
};

seed();
