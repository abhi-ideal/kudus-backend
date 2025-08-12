
const express = require('express');
const userController = require('./controller');
const { verifyFirebaseToken } = require('../../shared/middleware/auth');
const { validate, schemas } = require('../../shared/utils/validation');

const router = express.Router();

// Apply auth middleware to all user routes
router.use(verifyFirebaseToken);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
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
 *         description: User profile retrieved successfully
 */
router.get('/:id', userController.getProfile);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
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
 *             properties:
 *               displayName:
 *                 type: string
 *               avatar:
 *                 type: string
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/:id', validate(schemas.userProfile), userController.updateProfile);

/**
 * @swagger
 * /api/users/{id}/history:
 *   get:
 *     summary: Get user watch history
 *     tags: [Users]
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
 *         description: Watch history retrieved successfully
 */
router.get('/:id/history', userController.getWatchHistory);

/**
 * @swagger
 * /api/users/{id}/favorites:
 *   get:
 *     summary: Get user favorites
 *     tags: [Users]
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
 *         description: Favorites retrieved successfully
 */
router.get('/:id/favorites', userController.getFavorites);

router.post('/:id/favorites/:contentId', userController.addToFavorites);
router.delete('/:id/favorites/:contentId', userController.removeFromFavorites);

module.exports = router;
