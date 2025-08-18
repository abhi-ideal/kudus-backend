const express = require('express');
const { createAdminRouter, standardAdminEndpoints } = require('../../shared/utils/adminRoutes');
const contentController = require('./controller');
const { verifyFirebaseToken } = require('./middleware/auth');
const { detectCountry, applyGeoFilter } = require('./middleware/geoRestriction');
const { validate, schemas } = require('./utils/validation');
const { profileAuth, childProfileFilter } = require('./middleware/profileAuth');

const router = express.Router();

/**
 * @swagger
 * /api/content:
 *   get:
 *     summary: Get all content with pagination and filtering
 *     tags: [Content]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content list retrieved successfully
 */
router.get('/', detectCountry, applyGeoFilter, profileAuth, childProfileFilter, contentController.getAllContent);

/**
 * @swagger
 * /api/content/kids:
 *   get:
 *     summary: Get kids-only content
 *     tags: [Content]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kids content retrieved successfully
 */
router.get('/kids', detectCountry, applyGeoFilter, contentController.getKidsContent);

/**
 * @swagger
 * /api/content/{id}:
 *   get:
 *     summary: Get content by ID
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content retrieved successfully
 */
router.get('/:id', detectCountry, applyGeoFilter, profileAuth, childProfileFilter, contentController.getContentById);

/**
 * @swagger
 * /api/content/series/{id}/details:
 *   get:
 *     summary: Get series details with seasons and episodes
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeEpisodes
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Series details retrieved successfully
 */
router.get('/series/:id/details', detectCountry, applyGeoFilter, profileAuth, childProfileFilter, contentController.getSeriesDetails);

/**
 * @swagger
 * /api/content/series/{seriesId}/season/{seasonNumber}/episodes:
 *   get:
 *     summary: Get episodes for a specific season
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: seasonNumber
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Season episodes retrieved successfully
 */
router.get('/series/:seriesId/season/:seasonNumber/episodes', detectCountry, applyGeoFilter, profileAuth, childProfileFilter, contentController.getSeasonEpisodes);

/**
 * @swagger
 * /api/content/episode/{episodeId}:
 *   get:
 *     summary: Get episode details
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Episode details retrieved successfully
 */
router.get('/episode/:episodeId', detectCountry, applyGeoFilter, profileAuth, childProfileFilter, contentController.getEpisodeDetails);

/**
 * @swagger
 * /api/content/watchlist:
 *   get:
 *     summary: Get user's watchlist
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Watchlist retrieved successfully
 */
router.get('/watchlist', verifyFirebaseToken, profileAuth, childProfileFilter, contentController.getWatchlist);

/**
 * @swagger
 * /api/content/watchlist:
 *   post:
 *     summary: Add content to watchlist
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Content added to watchlist successfully
 */
router.post('/watchlist', verifyFirebaseToken, profileAuth, childProfileFilter, contentController.addToWatchlist);

/**
 * @swagger
 * /api/content/watchlist/{contentId}:
 *   delete:
 *     summary: Remove content from watchlist
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content removed from watchlist successfully
 */
router.delete('/watchlist/:contentId', verifyFirebaseToken, profileAuth, childProfileFilter, contentController.removeFromWatchlist);

/**
 * @swagger
 * /api/content/{contentId}/watchlist-status:
 *   get:
 *     summary: Check if content is in watchlist
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Watchlist status retrieved successfully
 */
router.get('/:contentId/watchlist-status', verifyFirebaseToken, profileAuth, contentController.checkWatchlistStatus);

/**
 * @swagger
 * /api/content/{id}/stream:
 *   get:
 *     summary: Get streaming URL for content
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: quality
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Streaming URL generated successfully
 */
router.get('/:id/stream', verifyFirebaseToken, detectCountry, applyGeoFilter, profileAuth, childProfileFilter, contentController.getStreamingUrl);

// Admin routes (require authentication)
router.use(verifyFirebaseToken);

/**
 * @swagger
 * /api/content:
 *   post:
 *     summary: Create new content
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Content created successfully
 */
router.post('/', validate(schemas.content), contentController.createContent);

router.put('/:id', validate(schemas.content), contentController.updateContent);
router.delete('/:id', contentController.deleteContent);

// Admin routes using shared utility
const adminRouter = createAdminRouter('Content Service');

// Add standard admin endpoints
adminRouter.get('/health', standardAdminEndpoints.health);
adminRouter.get('/stats', standardAdminEndpoints.stats);

// Add content-specific admin endpoints
adminRouter.get('/content', contentController.getContent);
adminRouter.get('/content/statistics', contentController.getContentStatistics);
adminRouter.get('/content/:id', contentController.getContentById);
adminRouter.post('/content', contentController.createContent);
adminRouter.put('/content/:id', contentController.updateContent);
adminRouter.delete('/content/:id', contentController.deleteContent);

router.use('/admin', adminRouter);


module.exports = router;