'use strict';

const getPaginationOptions = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const sort = query.sort || 'createdAt';
  const order = query.order === 'asc' ? 1 : -1;

  return { page, limit, skip, sort: { [sort]: order } };
};

const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

module.exports = { getPaginationOptions, buildPaginationMeta };
