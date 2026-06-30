'use strict';

const express = require('express');

const router = express.Router();

const taskController = require('./task.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { validate, validateQuery } = require('../../middlewares/validate.middleware');
const { createTaskSchema, updateTaskSchema, queryTaskSchema } = require('./task.validation');

// GET /api/tasks
router.get(
  '/',
  authenticate,
  authorize('tasks:read'),
  validateQuery(queryTaskSchema),
  taskController.getAll.bind(taskController)
);

// GET /api/tasks/:id
router.get(
  '/:id',
  authenticate,
  authorize('tasks:read'),
  taskController.getById.bind(taskController)
);

// POST /api/tasks
router.post(
  '/',
  authenticate,
  authorize('tasks:create'),
  validate(createTaskSchema),
  taskController.create.bind(taskController)
);

// PUT /api/tasks/:id
router.put(
  '/:id',
  authenticate,
  authorize('tasks:update'),
  validate(updateTaskSchema),
  taskController.update.bind(taskController)
);

// DELETE /api/tasks/:id
router.delete(
  '/:id',
  authenticate,
  authorize('tasks:delete'),
  taskController.delete.bind(taskController)
);

module.exports = router;
