
const express = require('express');
const commonController = require('./controller');
const { validate } = require('./utils/validation');
const { verifyFirebaseToken } = require('./middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Genre:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         description:
 *           type: string
 *         isActive:
 *           type: boolean
 *     UploadUrl:
 *       type: object
 *       properties:
 *         uploadUrl:
 *           type: string
 *         fields:
 *           type: object
 *         fileName:
 *           type: string
 *         expiresIn:
 *           type: number
 */

// S3 Upload URL Generation Routes
/**
 * @swagger
 * /api/common/upload-url:
 *   post:
 *     summary: Generate signed POST URL for file upload
 *     tags: [Common]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileType
 *               - fileSize
 *             properties:
 *               fileType:
 *                 type: string
 *               fileSize:
 *                 type: number
 *               uploadType:
 *                 type: string
 *                 enum: [general, video, image, thumbnail]
 *     responses:
 *       200:
 *         description: Upload URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadUrl'
 */
router.post('/upload-url', verifyFirebaseToken, validate('uploadUrl'), commonController.generateUploadUrl);

// Genre CRUD Routes
/**
 * @swagger
 * /api/common/genres:
 *   get:
 *     summary: Get all genres
 *     tags: [Common]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of genres
 */
router.get('/genres', commonController.getAllGenres);

/**
 * @swagger
 * /api/common/genres:
 *   post:
 *     summary: Create a new genre
 *     tags: [Common]
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
 *     responses:
 *       201:
 *         description: Genre created successfully
 */
router.post('/genres', verifyFirebaseToken, validate('genre'), commonController.createGenre);

/**
 * @swagger
 * /api/common/genres/{id}:
 *   get:
 *     summary: Get genre by ID
 *     tags: [Common]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Genre details
 */
router.get('/genres/:id', commonController.getGenreById);

/**
 * @swagger
 * /api/common/genres/{id}:
 *   put:
 *     summary: Update genre
 *     tags: [Common]
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
 *     responses:
 *       200:
 *         description: Genre updated successfully
 */
router.put('/genres/:id', verifyFirebaseToken, validate('genreUpdate'), commonController.updateGenre);

/**
 * @swagger
 * /api/common/genres/{id}:
 *   delete:
 *     summary: Delete genre
 *     tags: [Common]
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
 *         description: Genre deleted successfully
 */
router.delete('/genres/:id', verifyFirebaseToken, commonController.deleteGenre);

module.exports = router;
