const express = require('express');
const { verifyFirebaseToken } = require('../../shared/middleware/auth');
const { validate, schemas } = require('../../shared/utils/validation');
const controller = require('./controller');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         displayName:
 *           type: string
 *         photoURL:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 */
router.get('/profile', verifyFirebaseToken, controller.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   post:
 *     summary: Create or update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.post('/profile', verifyFirebaseToken, validate(schemas.userProfile), controller.updateProfile);

/**
 * @swagger
 * /api/users/create-user:
 *   post:
 *     summary: Create user record (internal service only)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firebaseUid:
 *                 type: string
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               displayName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/create-user', controller.createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user profile by ID
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
router.get('/:id', controller.getProfileById); // Renamed to getProfileById for clarity

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user profile by ID
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
router.put('/:id', validate(schemas.userProfile), controller.updateProfileById); // Renamed to updateProfileById for clarity

/**
 * @swagger
 * /api/users/{id}/history:
 *   get:
 *     summary: Get user watch history by ID
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
router.get('/:id/history', controller.getWatchHistoryById); // Renamed to getWatchHistoryById for clarity

/**
 * @swagger
 * /api/users/{id}/favorites:
 *   get:
 *     summary: Get user favorites by ID
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
router.get('/:id/favorites', controller.getFavoritesById); // Renamed to getFavoritesById for clarity

router.post('/:id/favorites/:contentId', controller.addToFavorites);
router.delete('/:id/favorites/:contentId', controller.removeFromFavorites);

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
router.get('/profiles', verifyFirebaseToken, controller.getProfiles);

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
router.post('/profiles', verifyFirebaseToken, controller.createProfile);

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
router.put('/profiles/:profileId', verifyFirebaseToken, controller.updateProfile);

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
router.delete('/profiles/:profileId', verifyFirebaseToken, controller.deleteProfile);

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
router.get('/feed', verifyFirebaseToken, controller.getFeed);

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
router.post('/feed/generate', verifyFirebaseToken, controller.generateFeed);

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
router.put('/feed/:feedItemId/viewed', verifyFirebaseToken, controller.markFeedViewed);

module.exports = router;