
const express = require('express');
const recommendationController = require('./controller');
const { verifyFirebaseToken } = require('../../shared/middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/recommendations/trending:
 *   get:
 *     summary: Get trending content
 *     tags: [Recommendations]
 *     responses:
 *       200:
 *         description: Trending content retrieved successfully
 */
router.get('/trending', recommendationController.getTrending);

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
 *     responses:
 *       200:
 *         description: Popular content retrieved successfully
 */
router.get('/popular', recommendationController.getPopular);

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
 *     responses:
 *       200:
 *         description: Personalized recommendations retrieved successfully
 */
router.get('/personalized', recommendationController.getPersonalized);

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
 *     responses:
 *       200:
 *         description: Similar content retrieved successfully
 */
router.get('/similar/:contentId', recommendationController.getSimilar);

module.exports = router;
