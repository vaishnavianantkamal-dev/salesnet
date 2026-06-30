'use strict';

const express = require('express');
const router = express.Router();

const productController = require('./product.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createProductSchema, updateProductSchema } = require('./product.validation');

// GET /api/products
router.get('/', authenticate, authorize('products:read'), productController.getAll.bind(productController));

// GET /api/products/:id
router.get('/:id', authenticate, authorize('products:read'), productController.getById.bind(productController));

// POST /api/products
router.post(
  '/',
  authenticate,
  authorize('products:create'),
  validate(createProductSchema),
  productController.create.bind(productController)
);

// PUT /api/products/:id
router.put(
  '/:id',
  authenticate,
  authorize('products:update'),
  validate(updateProductSchema),
  productController.update.bind(productController)
);

// DELETE /api/products/:id (soft delete — sets isActive: false)
router.delete('/:id', authenticate, authorize('products:delete'), productController.remove.bind(productController));

module.exports = router;
