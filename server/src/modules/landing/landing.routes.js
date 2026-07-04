const express = require('express');
const { getLandingConfig, updateLandingConfig, uploadMedia } = require('./landing.controller');
const upload = require('../../middlewares/upload.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRole } = require('../../middlewares/rbac.middleware');

const router = express.Router();

// Public route to get landing configuration
router.get('/', getLandingConfig);

// Protected routes (Admin only)
router.put('/', authenticate, authorizeRole('admin', 'super_admin'), updateLandingConfig);

router.post('/upload', authenticate, authorizeRole('admin', 'super_admin'), upload.single('image'), uploadMedia);

module.exports = router;
