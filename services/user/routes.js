const express = require('express');
const { verifyFirebaseToken } = require('./middleware/auth');
const { authAdmin } = require('./middleware/adminAuth');
const { validate, schemas } = require('./utils/validation');
const controller = require('./controller');
const { createAdminRouter, standardAdminEndpoints } = require('./utils/adminRoutes');
const { profileAuth, childProfileFilter } = require('./middleware/profileAuth');
const { ownerProfileOnly } = require('./middleware/ownerAuth');

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
 * /api/users/profiles:
 *   post:
 *     summary: Create or update profile (if profileId provided, updates; otherwise creates new)
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
 *               profileId:
 *                 type: string
 *                 description: If provided, updates existing profile; if not provided, creates new profile
 *               profileName:
 *                 type: string
 *               isChild:
 *                 type: boolean
 *               avatarUrl:
 *                 type: string
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       201:
 *         description: Profile created successfully
 */
router.post('/profiles', verifyFirebaseToken, controller.createOrUpdateProfile);

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

// Admin Routes - Must come before parameterized routes
const adminRouter = createAdminRouter('User Service');

// Add standard admin endpoints
adminRouter.get('/health', standardAdminEndpoints.health);
adminRouter.get('/stats', standardAdminEndpoints.stats);

// Add user-specific admin endpoints
adminRouter.get('/users', authAdmin, controller.getUsers);
adminRouter.get('/users/statistics', authAdmin, controller.getUserStatistics);
adminRouter.get('/users/:id', authAdmin, controller.getUserById);
adminRouter.patch('/users/:id/block', authAdmin, controller.blockUser);
adminRouter.patch('/users/:id/unblock', authAdmin, controller.unblockUser);
adminRouter.patch('/users/:id/subscription', authAdmin, controller.updateUserSubscription);

router.use('/admin', adminRouter);

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

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Logout user and update session history
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
router.post('/logout', controller.logout);

/**
 * @swagger
 * /api/users/delete-account:
 *   delete:
 *     summary: Delete user account permanently (Owner profile only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: profile_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Owner profile ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               confirmPassword:
 *                 type: string
 *                 description: Confirmation password (optional)
 *               profile_id:
 *                 type: string
 *                 description: Owner profile ID (can also be passed in query)
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       400:
 *         description: Profile ID required
 *       403:
 *         description: Access denied - Owner profile required
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to delete account
 */
router.delete('/delete-account', verifyFirebaseToken, ownerProfileOnly, controller.deleteAccount);

module.exports = router;