const express = require('express');
const router = express.Router();
const contentController = require('./controller');
const { verifyFirebaseToken: authenticate } = require('./middleware/auth');
const { authAdmin: adminAuth } = require('./middleware/adminAuth');
const { profileAuth, childProfileFilter } = require('./middleware/profileAuth');
const { validate, schemas } = require('./utils/validation');

// Simple profile authentication middleware for content service
const authenticateProfile = async (req, res, next) => {
  try {
    // Add basic profile context if user is authenticated
    if (req.user) {
      // Use profile_id from the decoded Firebase token
      const profileId = req.user.profile_id;
      const isChild = req.user.child || false;

      if (profileId) {
        // Use the profile ID from the Firebase token
        req.activeProfile = {
          id: profileId,
          isChild: isChild,
          userId: req.user.uid || req.user.user_id
        };
      } else {
        // Fallback to user ID if no profile_id is found
        req.activeProfile = {
          id: req.user.uid || req.user.user_id,
          isChild: false,
          userId: req.user.uid || req.user.user_id
        };
      }
    }
    next();
  } catch (error) {
    console.error('Profile authentication error:', error);
    next();
  }
};

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
 *     summary: Get all content with pagination, filtering, and search
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
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search across title, description, director, cast, genre, subtitles
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *       - in: query
 *         name: ageRating
 *         schema:
 *           type: string
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
 *         description: Content list retrieved successfully with search results
 */
router.get('/', authenticate, authenticateProfile, checkGeoRestriction, contentController.getAllContent);

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
 * /api/content/search:
 *   get:
 *     summary: Search content by title, description, cast, or director
 *     tags: [Content]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (minimum 2 characters)
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
 *         name: ageRating
 *         schema:
 *           type: string
 *           description: Comma-separated age ratings (G,PG,PG-13,R)
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *       - in: query
 *         name: releaseYear
 *         schema:
 *           type: string
 *           description: Single year (2023) or range (2020-2023)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, title, releaseYear, createdAt, viewCount]
 *           default: relevance
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
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
 *                     searchResults:
 *                       type: array
 *                       items:
 *                         type: object
 *                     searchQuery:
 *                       type: string
 *                     filters:
 *                       type: object
 *                     pagination:
 *                       type: object
 *       400:
 *         description: Invalid search query
 */
router.get('/search', checkGeoRestriction, contentController.searchContent);

/**
 * @swagger
 * /api/content/search/suggestions:
 *   get:
 *     summary: Get search suggestions for autocomplete
 *     tags: [Content]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query for suggestions
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Search suggestions retrieved successfully
 */
router.get('/search/suggestions', checkGeoRestriction, contentController.getSearchSuggestions);

// Content Like Routes
/**
 * @swagger
 * /api/content/likes:
 *   post:
 *     summary: Like content
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
 *         description: Content liked successfully
 *       409:
 *         description: Content already liked
 */
router.post('/likes', authenticate, authenticateProfile, contentController.likeContent);

/**
 * @swagger
 * /api/content/likes:
 *   get:
 *     summary: Get user's liked content
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
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: likedAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Liked content retrieved successfully
 */
router.get('/likes', authenticate, authenticateProfile, contentController.getLikedContent);

/**
 * @swagger
 * /api/content/likes/{contentId}:
 *   delete:
 *     summary: Unlike content
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
 *         description: Content unliked successfully
 *       404:
 *         description: Like not found
 */
router.delete('/likes/:contentId', authenticate, authenticateProfile, contentController.unlikeContent);

/**
 * @swagger
 * /api/content/{contentId}/like-status:
 *   get:
 *     summary: Check if content is liked
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
 *         description: Like status retrieved successfully
 */
router.get('/:contentId/like-status', authenticate, authenticateProfile, contentController.checkLikeStatus);

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
router.get('/featured', checkGeoRestriction, contentController.getFeaturedContent);

/**
 * @swagger
 * /api/content/upcoming-soon:
 *   get:
 *     summary: Get upcoming soon content
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
 *         description: Upcoming content retrieved successfully
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
 *                     upcomingContent:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                 contentType:
 *                   type: string
 *                   example: upcoming-soon
 */
router.get('/upcoming-soon', authenticate, profileAuth, childProfileFilter, checkGeoRestriction, contentController.getUpcomingSoon);

/**
 * @swagger
 * /api/content/everyones-watching:
 *   get:
 *     summary: Get everyone's watching (popular content)
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
 *         description: Popular content retrieved successfully
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
 *                     popularContent:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                 contentType:
 *                   type: string
 *                   example: everyones-watching
 */
router.get('/everyones-watching', authenticate, profileAuth, childProfileFilter, checkGeoRestriction, contentController.getEveryonesWatching);

/**
 * @swagger
 * /api/content/top-10-series:
 *   get:
 *     summary: Get top 10 video series
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *           description: Comma-separated genres
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *           default: global
 *     responses:
 *       200:
 *         description: Top 10 series retrieved successfully
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
 *                     top10Series:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rank:
 *                             type: integer
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           viewCount:
 *                             type: integer
 *                           totalSeasons:
 *                             type: integer
 *                           totalEpisodes:
 *                             type: integer
 *                     country:
 *                       type: string
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                 contentType:
 *                   type: string
 *                   example: top-10-series
 */
router.get('/top-10-series', authenticate, profileAuth, childProfileFilter, checkGeoRestriction, contentController.getTop10Series);

/**
 * @swagger
 * /api/content/top-10-movies:
 *   get:
 *     summary: Get top 10 video movies
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *           description: Comma-separated genres
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *           default: global
 *     responses:
 *       200:
 *         description: Top 10 movies retrieved successfully
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
 *                     top10Movies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rank:
 *                             type: integer
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           viewCount:
 *                             type: integer
 *                     country:
 *                       type: string
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                 contentType:
 *                   type: string
 *                   example: top-10-movies
 */
router.get('/top-10-movies', authenticate, profileAuth, childProfileFilter, checkGeoRestriction, contentController.getTop10Movies);

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
router.post('/admin/items', adminAuth, validate(schemas.contentItemCreate), contentController.createContentItem);

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
router.put('/admin/items/:id', adminAuth, validate(schemas.contentItemUpdate), contentController.updateContentItem);

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
router.get('/items', authenticate, authenticateProfile, checkGeoRestriction, contentController.getContentGroupedByItems);

/**
 * @swagger
 * /api/content/admin/items/{id}/order:
 *   patch:
 *     summary: Update content item display order (Admin only)
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
 *               position:
 *                 type: integer
 *               newOrder:
 *                 type: integer
 *               oldOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Content item order updated successfully
 *       404:
 *         description: Content item not found
 */
router.patch('/admin/items/:id/order', adminAuth, contentController.updateContentItemOrder);
router.patch('/admin/items/:id/child-profile', adminAuth, contentController.updateContentItemChildProfile);

// Thumbnail Management Routes
/**
 * @swagger
 * /api/content/admin/content/{id}/thumbnails:
 *   patch:
 *     summary: Update content thumbnails (Admin only)
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
 *               thumbnails:
 *                 type: object
 *                 properties:
 *                   banner:
 *                     type: string
 *                     description: 16:4 ratio (1920x480px)
 *                   landscape:
 *                     type: string
 *                     description: 16:9 ratio (1200x675px)
 *                   portrait:
 *                     type: string
 *                     description: 2:3 ratio (500x750px)
 *                   square:
 *                     type: string
 *                     description: 1:1 ratio (500x500px)
 *     responses:
 *       200:
 *         description: Thumbnails updated successfully
 */
router.patch('/admin/content/:id/thumbnails', adminAuth, contentController.updateContentThumbnails);

/**
 * @swagger
 * /api/content/thumbnail-ratios:
 *   get:
 *     summary: Get supported thumbnail ratios and specifications
 *     tags: [Content]
 *     responses:
 *       200:
 *         description: Thumbnail ratio specifications
 */
router.get('/thumbnail-ratios', contentController.getThumbnailRatios);

// Content Item Mappings Routes
router.get('/admin/mappings', adminAuth, contentController.getContentMappings);
router.post('/admin/mappings', adminAuth, contentController.createContentMapping);
router.put('/admin/mappings/:id', adminAuth, contentController.updateContentMapping);
router.delete('/admin/mappings/:id', adminAuth, contentController.deleteContentMapping);

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
router.get('/series/:id/details', checkGeoRestriction, contentController.getSeriesDetails);

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
router.get('/series/:seriesId/season/:seasonNumber/episodes', checkGeoRestriction, contentController.getSeasonEpisodes);

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
router.get('/episode/:episodeId', checkGeoRestriction, contentController.getEpisodeDetails);

/**
 * @swagger
 * /api/content/{id}:
 *   get:
 *     summary: Get content by ID
 *     tags: [Content]
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
 *         description: Content retrieved successfully
 */
router.get('/:id', authenticate, authenticateProfile, checkGeoRestriction, contentController.getContentById);

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
router.get('/:id/stream', authenticate, checkGeoRestriction, contentController.getStreamingUrl);

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

// Admin routes for content management
router.use('/admin', adminAuth);

// Seasons management endpoints
router.get('/admin/series/:seriesId/seasons', contentController.getSeriesSeasons);
router.post('/admin/seasons', contentController.createSeason);
router.put('/admin/seasons/:seasonId', contentController.updateSeason);
router.delete('/admin/seasons/:seasonId', contentController.deleteSeason);

// Episodes management endpoints
router.get('/admin/seasons/:seasonId/episodes', contentController.getSeasonEpisodes);
router.post('/admin/episodes', contentController.createEpisode);
router.put('/admin/episodes/:episodeId', contentController.updateEpisode);
router.delete('/admin/episodes/:episodeId', contentController.deleteEpisode);

// Content management endpoints
module.exports = router;