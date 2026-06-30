'use strict';

const Product = require('../../models/Product.model');
const { AppError } = require('../../middlewares/error.middleware');

class ProductRepository {
  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options;
    const [data, total] = await Promise.all([
      Product.find(filter).populate('createdBy', 'firstName lastName email').sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);
    return { data, total };
  }

  async findById(id) {
    const product = await Product.findById(id).populate('createdBy', 'firstName lastName email');
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }

  async create(data) {
    const product = new Product(data);
    await product.save();
    await product.populate('createdBy', 'firstName lastName email');
    return product;
  }

  async updateById(id, data) {
    const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate(
      'createdBy',
      'firstName lastName email'
    );
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }

  async deleteById(id) {
    const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true }).populate(
      'createdBy',
      'firstName lastName email'
    );
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }
}

module.exports = new ProductRepository();
