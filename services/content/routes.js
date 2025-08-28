const express = require('express');
const router = express.Router();
const contentController = require('./controller');
const { authenticate } = require('./middleware/auth');
const { authenticateProfile } = require('./middleware/profileAuth');
const { authAdmin: adminAuth } = require('./middleware/adminAuth');
const { validate, schemas } = require('./utils/validation');

// Simple geo restriction middleware
const checkGeoRestriction = (req, res, next) => {
  req.userCountry = req.headers['cf-ipcountry'] || 'US';
  req.geoFilter = { isContentAvailable: () => true };
  next();
};

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
router.get('/', checkGeoRestriction, authenticateProfile, contentController.getAllContent);

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
router.get('/kids', checkGeoRestriction, contentController.getKidsContent);

/**
 * @swagger
 * /api/content/featured:
 *   get:
 *     summary: Get featured content
 *     tags: [Content]
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
 *           description: Comma-separated content types (movie,series,documentary)
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *           description: Comma-separated genres
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Featured content retrieved successfully
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
 *                     featuredContent:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 */
router.get('/featured', checkGeoRestriction, authenticateProfile, contentController.getFeaturedContent);

// Admin-only Content Items CRUD Routes
/**
 * @swagger
 * /api/content/admin/items:
 *   post:
 *     summary: Create content item (Admin only)
 *     tags: [Content - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Content item created successfully
 *       403:
 *         description: Admin access required
 */
router.post('/admin/items', adminAuth, validate(schemas.contentItem), contentController.createContentItem);

/**
 * @swagger
 * /api/content/admin/items:
 *   get:
 *     summary: Get all content items (Admin only)
 *     tags: [Content - Admin]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Content items retrieved successfully
 */
router.get('/admin/items', adminAuth, contentController.getAllContentItems);

/**
 * @swagger
 * /api/content/admin/items/{id}:
 *   get:
 *     summary: Get content item by ID (Admin only)
 *     tags: [Content - Admin]
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
 *         description: Content item retrieved successfully
 *       404:
 *         description: Content item not found
 */
router.get('/admin/items/:id', adminAuth, contentController.getContentItemById);

/**
 * @swagger
 * /api/content/admin/items/{id}:
 *   put:
 *     summary: Update content item (Admin only)
 *     tags: [Content - Admin]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Content item updated successfully
 *       404:
 *         description: Content item not found
 */
router.put('/admin/items/:id', adminAuth, validate(schemas.updateContentItem), contentController.updateContentItem);

/**
 * @swagger
 * /api/content/admin/items/{id}:
 *   delete:
 *     summary: Delete content item (Admin only)
 *     tags: [Content - Admin]
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
 *         description: Content item deleted successfully
 *       404:
 *         description: Content item not found
 */
router.delete('/admin/items/:id', adminAuth, contentController.deleteContentItem);

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
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
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
router.get('/items', checkGeoRestriction, authenticateProfile, contentController.getContentGroupedByItems);

// Admin routes for content items management
router.patch('/admin/items/:id/order', adminAuth, contentController.updateContentItemOrder);

/**
 * @swagger
 * /api/content/continue-watching:
 *   get:
 *     summary: Get user's continue watching list (incomplete content)
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
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: watchedAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Continue watching list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 continueWatching:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       watchHistoryId:
 *                         type: string
 *                       contentId:
 *                         type: string
 *                       watchedAt:
 *                         type: string
 *                         format: date-time
 *                       progressPercentage:
 *                         type: number
 *                       resumeType:
 *                         type: string
 *                         enum: [movie, episode]
 *                       content:
 *                         type: object
 *                       episode:
 *                         type: object
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Profile required
 */
router.get('/continue-watching', authenticate, authenticateProfile, contentController.getContinueWatching);

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
router.get('/watchlist', authenticate, authenticateProfile, contentController.getWatchlist);

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
router.post('/watchlist', authenticate, authenticateProfile, contentController.addToWatchlist);

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
router.delete('/watchlist/:contentId', authenticate, authenticateProfile, contentController.removeFromWatchlist);

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
router.get('/:contentId/watchlist-status', authenticate, authenticateProfile, contentController.checkWatchlistStatus);

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
router.get('/series/:id/details', checkGeoRestriction, authenticateProfile, contentController.getSeriesDetails);

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
router.get('/series/:seriesId/season/:seasonNumber/episodes', checkGeoRestriction, authenticateProfile, contentController.getSeasonEpisodes);

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
router.get('/episode/:episodeId', checkGeoRestriction, authenticateProfile, contentController.getEpisodeDetails);

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
router.get('/:id', checkGeoRestriction, authenticateProfile, contentController.getContentById);

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
router.get('/:id/stream', authenticate, checkGeoRestriction, authenticateProfile, contentController.getStreamingUrl);

/**
 * @swagger
 * /api/content/admin/health:
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
 * /api/content/admin/stats:
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

// Admin routes (require authentication)
router.use(authenticate);

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

module.exports = router;