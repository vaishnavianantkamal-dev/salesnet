'use strict';

const installationRepository = require('./installation.repository');
const Activity = require('../../models/Activity.model');
const { AppError } = require('../../middlewares/error.middleware');
const { getPaginationOptions, buildPaginationMeta } = require('../../utils/pagination');
const { ROLES } = require('../../utils/constants');

const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALES_MANAGER];

class InstallationService {
  async getAllInstallations(query = {}, user) {
    const { page, limit, skip, sort } = getPaginationOptions(query);

    const filter = {};

    const roleKey = user.role?.key;
    const isAdmin = ADMIN_ROLES.includes(roleKey);

    if (!isAdmin) {
      filter.engineer = user._id;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.engineer && isAdmin) {
      filter.engineer = query.engineer;
    }

    if (query.lead) {
      filter.lead = query.lead;
    }

    if (query.from || query.to) {
      filter.visitDate = {};
      if (query.from) filter.visitDate.$gte = new Date(query.from);
      if (query.to) filter.visitDate.$lte = new Date(query.to);
    }

    const { data, total } = await installationRepository.findAll(filter, { skip, limit, sort });

    return {
      installations: data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getInstallationById(id) {
    return installationRepository.findById(id);
  }

  async createInstallation(data, createdBy) {
    const payload = { ...data, createdBy };
    const installation = await installationRepository.create(payload);
    return installation;
  }

  async updateInstallation(id, data, updatedBy) {
    const existing = await installationRepository.findById(id);

    const updatePayload = { ...data };

    const becomingCompleted =
      data.status === 'completed' && existing.status !== 'completed';

    if (becomingCompleted) {
      updatePayload.completedAt = new Date();

      await Activity.create({
        lead: existing.lead._id || existing.lead,
        type: 'note',
        description: `Installation completed by engineer. Installation ID: ${id}`,
        performedBy: updatedBy,
        metadata: { installationId: id, status: 'completed' },
      });
    }

    return installationRepository.updateById(id, updatePayload);
  }

  async getByLead(leadId) {
    const installations = await installationRepository.findByLead(leadId);
    return { installations };
  }
}

module.exports = new InstallationService();
