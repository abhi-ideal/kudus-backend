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

// Profile Management Routes
/**
 * @swagger
 * /api/users/profiles:
 *   get:
 *     summary: Get all profiles for the authenticated user
 *     tags: [User Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profiles retrieved successfully
 */
router.get('/profiles', verifyFirebaseToken, userController.getProfiles);

/**
 * @swagger
 * /api/users/profiles:
 *   post:
 *     summary: Create a new profile
 *     tags: [User Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileName:
 *                 type: string
 *               isChild:
 *                 type: boolean
 *               avatarUrl:
 *                 type: string
 *               preferences:
 *                 type: object
 *     responses:
 *       201:
 *         description: Profile created successfully
 */
router.post('/profiles', verifyFirebaseToken, userController.createProfile);

/**
 * @swagger
 * /api/users/profiles/{profileId}:
 *   put:
 *     summary: Update a profile
 *     tags: [User Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profiles/:profileId', verifyFirebaseToken, userController.updateProfile);

/**
 * @swagger
 * /api/users/profiles/{profileId}:
 *   delete:
 *     summary: Delete a profile
 *     tags: [User Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 */
router.delete('/profiles/:profileId', verifyFirebaseToken, userController.deleteProfile);

/**
 * @swagger
 * /api/users/feed:
 *   get:
 *     summary: Get user's personalized feed for a specific profile
 *     tags: [User Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: profile_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Feed retrieved successfully
 *       400:
 *         description: Profile ID required
 *       403:
 *         description: Access denied
 */
router.get('/feed', verifyFirebaseToken, userController.getFeed);

/**
 * @swagger
 * /api/users/feed/generate:
 *   post:
 *     summary: Generate new feed content for a profile
 *     tags: [User Feed]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Feed generated successfully
 */
router.post('/feed/generate', verifyFirebaseToken, userController.generateFeed);

/**
 * @swagger
 * /api/users/feed/{feedItemId}/viewed:
 *   put:
 *     summary: Mark a feed item as viewed
 *     tags: [User Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedItemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Feed item marked as viewed
 */
router.put('/feed/:feedItemId/viewed', verifyFirebaseToken, userController.markFeedViewed);

module.exports = router;