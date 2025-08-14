const express = require('express');
const recommendationController = require('./controller');
const { verifyFirebaseToken } = require('./middleware/auth');
const { profileAuth, childRecommendationFilter } = require('./middleware/profileAuth');

const router = express.Router();

/**
 * @swagger
 * /api/recommendations/trending:
 *   get:
 *     summary: Get trending content
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: profile_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Trending content retrieved successfully
 */
router.get('/trending', profileAuth, childRecommendationFilter, recommendationController.getTrending);

/**
 * @swagger
 * /api/recommendations/popular:
 *   get:
 *     summary: Get popular content by genre
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *       - in: query
 *         name: profile_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Popular content retrieved successfully
 */
router.get('/popular', profileAuth, childRecommendationFilter, recommendationController.getPopular);

// Authenticated routes
router.use(verifyFirebaseToken);

/**
 * @swagger
 * /api/recommendations/personalized:
 *   get:
 *     summary: Get personalized recommendations for user
 *     tags: [Recommendations]
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
 *           default: 20
 *     responses:
 *       200:
 *         description: Personalized recommendations retrieved successfully
 */
router.get('/personalized', profileAuth, childRecommendationFilter, recommendationController.getPersonalized);

/**
 * @swagger
 * /api/recommendations/similar/{contentId}:
 *   get:
 *     summary: Get similar content recommendations
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: profile_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Similar content retrieved successfully
 */
router.get('/similar/:contentId', profileAuth, childRecommendationFilter, recommendationController.getSimilar);

module.exports = router;