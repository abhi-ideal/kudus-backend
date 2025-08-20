const express = require('express');
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
 * /api/content/items:
 *   get:
 *     summary: Get content grouped by items (max 10 content per item)
 *     tags: [Content]
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
 *           default: 10
 *     responses:
 *       200:
 *         description: Content grouped by items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                           content:
 *                             type: array
 *                             maxItems: 10
 */
router.get('/items', detectCountry, applyGeoFilter, profileAuth, childProfileFilter, contentController.getContentGroupedByItems);

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
 *     tags: [Admin Content]
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

/**
 * @swagger
 * /api/content/{id}:
 *   put:
 *     summary: Update content
 *     tags: [Admin Content]
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
 *       200:
 *         description: Content updated successfully
 */
router.put('/:id', validate(schemas.content), contentController.updateContent);

/**
 * @swagger
 * /api/content/{id}:
 *   delete:
 *     summary: Delete content (soft delete)
 *     tags: [Admin Content]
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
 *         description: Content deleted successfully
 */
router.delete('/:id', contentController.deleteContent);

// Admin-specific endpoints
/**
 * @swagger
 * /api/admin/content:
 *   get:
 *     summary: Get all content for admin (includes inactive)
 *     tags: [Admin Content]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [movie, series]
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Content list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     content:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 */
router.get('/admin/content', contentController.getContent);

/**
 * @swagger
 * /api/admin/content/statistics:
 *   get:
 *     summary: Get content statistics for admin dashboard
 *     tags: [Admin Content]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Content statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalContent:
 *                           type: integer
 *                         totalMovies:
 *                           type: integer
 *                         totalSeries:
 *                           type: integer
 *                         totalViews:
 *                           type: integer
 *                         averageRating:
 *                           type: string
 *                     topGenres:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           genre:
 *                             type: string
 *                           count:
 *                             type: integer
 */
router.get('/admin/content/statistics', contentController.getContentStatistics);

/**
 * @swagger
 * /api/admin/content/{id}:
 *   get:
 *     summary: Get content details by ID for admin
 *     tags: [Admin Content]
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
 *         description: Content details retrieved successfully
 *       404:
 *         description: Content not found
 */
router.get('/admin/content/:id', contentController.getContentById);

/**
 * @swagger
 * /api/admin/content:
 *   post:
 *     summary: Create new content (admin)
 *     tags: [Admin Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - type
 *               - genre
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [movie, series]
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *               ageRating:
 *                 type: string
 *                 enum: [G, PG, PG-13, R, NC-17]
 *               duration:
 *                 type: integer
 *               releaseYear:
 *                 type: integer
 *               director:
 *                 type: string
 *               cast:
 *                 type: array
 *                 items:
 *                   type: string
 *               language:
 *                 type: string
 *               availableCountries:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Content created successfully
 */
router.post('/admin/content', validate(schemas.content), contentController.createContent);

/**
 * @swagger
 * /api/admin/content/{id}:
 *   put:
 *     summary: Update content (admin)
 *     tags: [Admin Content]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [movie, series]
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *               ageRating:
 *                 type: string
 *                 enum: [G, PG, PG-13, R, NC-17]
 *               duration:
 *                 type: integer
 *               releaseYear:
 *                 type: integer
 *               director:
 *                 type: string
 *               cast:
 *                 type: array
 *                 items:
 *                   type: string
 *               language:
 *                 type: string
 *               availableCountries:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Content updated successfully
 *       404:
 *         description: Content not found
 */
router.put('/admin/content/:id', validate(schemas.content), contentController.updateContent);

/**
 * @swagger
 * /api/admin/content/{id}:
 *   delete:
 *     summary: Delete content (admin soft delete)
 *     tags: [Admin Content]
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
 *         description: Content deleted successfully
 *       404:
 *         description: Content not found
 */
router.delete('/admin/content/:id', contentController.deleteContent);

/**
 * @swagger
 * /api/admin/health:
 *   get:
 *     summary: Health check for Content Service
 *     tags: [Admin Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 service:
 *                   type: string
 *                   example: Content Service
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/admin/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Content Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get service statistics
 *     tags: [Admin Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service:
 *                   type: string
 *                 uptime:
 *                   type: number
 *                 memory:
 *                   type: object
 *                 database:
 *                   type: object
 */
router.get('/admin/stats', async (req, res) => {
  try {
    const Content = require('./models/Content');

    const stats = {
      service: 'Content Service',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        connected: true,
        totalContent: await Content.count()
      },
      timestamp: new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({
      service: 'Content Service',
      error: 'Failed to get stats',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;