'use strict';

const productRepository = require('./product.repository');
const { AppError } = require('../../middlewares/error.middleware');
const { getPaginationOptions, buildPaginationMeta } = require('../../utils/pagination');

class ProductService {
  async getAllProducts(query = {}) {
    const { page, limit, skip, sort } = getPaginationOptions(query);

    const filter = {};

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true' || query.isActive === true;
    } else {
      filter.isActive = true;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) filter.price.$gte = Number(query.minPrice);
      if (query.maxPrice !== undefined) filter.price.$lte = Number(query.maxPrice);
    }

    const { data, total } = await productRepository.findAll(filter, { skip, limit, sort });

    return {
      products: data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getProductById(id) {
    return productRepository.findById(id);
  }

  async createProduct(data, createdBy = null) {
    return productRepository.create({ ...data, createdBy });
  }

  async updateProduct(id, data) {
    await productRepository.findById(id);
    const safeUpdate = { ...data };
    return productRepository.updateById(id, safeUpdate);
  }

  async deleteProduct(id) {
    await productRepository.findById(id);
    return productRepository.deleteById(id);
  }
}

module.exports = new ProductService();
