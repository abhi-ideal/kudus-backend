
const express = require('express');
const streamingController = require('./controller');
const { verifyFirebaseToken } = require('../../shared/middleware/auth');
const { validate, schemas } = require('../../shared/utils/validation');

const router = express.Router();

// Apply auth middleware to all streaming routes
router.use(verifyFirebaseToken);

/**
 * @swagger
 * /api/streaming/session:
 *   post:
 *     summary: Start a new playback session
 *     tags: [Streaming]
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
 *               quality:
 *                 type: string
 *     responses:
 *       201:
 *         description: Playback session started
 */
router.post('/session', streamingController.startSession);

/**
 * @swagger
 * /api/streaming/session/{sessionId}:
 *   put:
 *     summary: Update playback position
 *     tags: [Streaming]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
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
 *                 type: number
 *               quality:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session updated successfully
 */
router.put('/session/:sessionId', validate(schemas.playbackSession), streamingController.updateSession);

/**
 * @swagger
 * /api/streaming/session/{sessionId}/end:
 *   post:
 *     summary: End playback session
 *     tags: [Streaming]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session ended successfully
 */
router.post('/session/:sessionId/end', streamingController.endSession);

router.get('/analytics', streamingController.getAnalytics);

module.exports = router;
