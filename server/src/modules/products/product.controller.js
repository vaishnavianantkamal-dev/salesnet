'use strict';

const productService = require('./product.service');
const { sendSuccess } = require('../../utils/response');

class ProductController {
  async getAll(req, res, next) {
    try {
      const result = await productService.getAllProducts(req.query);
      return sendSuccess(res, result, 'Products fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      return sendSuccess(res, { product }, 'Product fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const createdBy = req.user?._id;
      const product = await productService.createProduct(req.body, createdBy);
      return sendSuccess(res, { product }, 'Product created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      return sendSuccess(res, { product }, 'Product updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const product = await productService.deleteProduct(req.params.id);
      return sendSuccess(res, { product }, 'Product deactivated successfully', 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProductController();
