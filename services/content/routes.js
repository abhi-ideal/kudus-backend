const express = require('express');
const contentController = require('./controller');
const { verifyFirebaseToken } = require('./middleware/auth');
const { detectCountry, applyGeoFilter } = require('./middleware/geoRestriction');
const { validate, schemas } = require('./utils/validation');
const { profileAuth, childProfileFilter } = require('../../user/middleware/profileAuth');

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

module.exports = router;