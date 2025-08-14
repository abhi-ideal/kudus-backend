
const express = require('express');
const contentController = require('../controllers/contentController');
const { authAdmin } = require('../middleware/authAdmin');
const { validate, schemas } = require('../utils/validation');

const router = express.Router();

// Apply admin auth middleware to all routes
router.use(authAdmin);

/**
 * @swagger
 * /api/admin/content:
 *   post:
 *     summary: Create new content
 *     tags: [Admin - Content]
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
 *     responses:
 *       201:
 *         description: Content created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admin access required
 */
router.post('/', validate(schemas.content), contentController.createContent);

/**
 * @swagger
 * /api/admin/content:
 *   get:
 *     summary: Get all content with filters
 *     tags: [Admin - Content]
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
 *         name: genre
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content list retrieved successfully
 */
router.get('/', contentController.getContent);

/**
 * @swagger
 * /api/admin/content/{id}:
 *   get:
 *     summary: Get content by ID
 *     tags: [Admin - Content]
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
router.get('/:id', contentController.getContentById);

/**
 * @swagger
 * /api/admin/content/{id}:
 *   put:
 *     summary: Update content
 *     tags: [Admin - Content]
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
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Content updated successfully
 *       404:
 *         description: Content not found
 */
router.put('/:id', validate(schemas.updateContent), contentController.updateContent);

/**
 * @swagger
 * /api/admin/content/{id}:
 *   delete:
 *     summary: Delete content (soft delete)
 *     tags: [Admin - Content]
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
router.delete('/:id', contentController.deleteContent);

// Season management routes
router.post('/seasons', validate(schemas.season), contentController.createSeason);
router.put('/seasons/:id', validate(schemas.updateSeason), contentController.updateSeason);

// Episode management routes
router.post('/episodes', validate(schemas.episode), contentController.createEpisode);
router.put('/episodes/:id', validate(schemas.updateEpisode), contentController.updateEpisode);

module.exports = router;
