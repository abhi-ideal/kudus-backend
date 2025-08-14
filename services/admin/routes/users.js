
const express = require('express');
const userController = require('../controllers/userController');
const { authAdmin } = require('../middleware/authAdmin');
const { validate, schemas } = require('../utils/validation');

const router = express.Router();

// Apply admin auth middleware to all routes
router.use(authAdmin);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with filters
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: subscription
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users list retrieved successfully
 */
router.get('/', userController.getUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details by ID
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/:id', userController.getUserById);

/**
 * @swagger
 * /api/admin/users/{id}/block:
 *   patch:
 *     summary: Block a user
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User blocked successfully
 *       404:
 *         description: User not found
 */
router.patch('/:id/block', validate(schemas.blockUser), userController.blockUser);

/**
 * @swagger
 * /api/admin/users/{id}/unblock:
 *   patch:
 *     summary: Unblock a user
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User unblocked successfully
 *       404:
 *         description: User not found
 */
router.patch('/:id/unblock', userController.unblockUser);

/**
 * @swagger
 * /api/admin/users/{id}/activity:
 *   get:
 *     summary: Get user activity history
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: User activity retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/:id/activity', userController.getUserActivity);

/**
 * @swagger
 * /api/admin/users/{id}/subscription:
 *   patch:
 *     summary: Update user subscription
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscription
 *             properties:
 *               subscription:
 *                 type: string
 *                 enum: [free, premium, family]
 *               subscriptionEndDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: User subscription updated successfully
 *       404:
 *         description: User not found
 */
router.patch('/:id/subscription', validate(schemas.updateSubscription), userController.updateUserSubscription);

/**
 * @swagger
 * /api/admin/users/statistics:
 *   get:
 *     summary: Get user statistics
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 */
router.get('/statistics', userController.getUserStatistics);

module.exports = router;
