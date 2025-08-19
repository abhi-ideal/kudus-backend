
const express = require('express');
const streamingController = require('./controller');
const { verifyFirebaseToken } = require('./middleware/auth');
const { validate, schemas } = require('./utils/validation');

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

/**
 * @swagger
 * /api/streaming/session/{sessionId}/heartbeat:
 *   post:
 *     summary: Send heartbeat to maintain session and update playback status
 *     tags: [Streaming]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The streaming session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPosition:
 *                 type: number
 *                 description: Current playback position in seconds
 *               bufferHealth:
 *                 type: number
 *                 description: Buffer health percentage (0-100)
 *               networkSpeed:
 *                 type: number
 *                 description: Current network speed in kbps
 *               deviceInfo:
 *                 type: object
 *                 description: Device information
 *     responses:
 *       200:
 *         description: Heartbeat processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 sessionId:
 *                   type: string
 *                 serverTime:
 *                   type: string
 *                 sessionActive:
 *                   type: boolean
 *                 recommendedNextHeartbeat:
 *                   type: number
 *       404:
 *         description: Session not found
 *       403:
 *         description: Access denied
 */
router.post('/session/:sessionId/heartbeat', streamingController.heartbeat);

router.get('/analytics', streamingController.getAnalytics);

module.exports = router;
