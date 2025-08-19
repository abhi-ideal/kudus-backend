const express = require('express');
const adminController = require('./controller');
const { verifyFirebaseToken } = require('./middleware/auth');
const { validate, schemas } = require('./utils/validation');
const multer = require('multer');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

// Apply auth middleware to all admin routes
router.use(verifyFirebaseToken);

/**
 * @swagger
 * /api/admin/logout:
 *   post:
 *     summary: Admin logout
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin logout successful
 */
router.post('/logout', adminController.logout);

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get platform analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 */
router.get('/analytics', adminController.getAnalytics);

/**
 * @swagger
 * /api/admin/content:
 *   post:
 *     summary: Upload and create new content
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *               genre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Content uploaded and transcoding started
 */
// Content management APIs
const contentRoutes = require('./routes/content');
const userRoutes = require('./routes/users');

router.use('/content', contentRoutes);
router.use('/users', userRoutes);

// Legacy upload endpoint for video content
router.post('/upload-content', upload.single('video'), validate(schemas.content), adminController.uploadContent);

/**
 * @swagger
 * /api/admin/transcode:
 *   post:
 *     summary: Start transcoding job for existing content
 *     tags: [Admin]
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
 *               inputFile:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transcoding job started successfully
 */
router.post('/transcode', validate(schemas.mediaConvertJob), adminController.startTranscoding);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get platform analytics and statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', adminController.getStats);

/**
 * @swagger
 * /api/admin/content/{id}/status:
 *   get:
 *     summary: Get content processing status
 *     tags: [Admin]
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
 *         description: Content status retrieved successfully
 */
router.get('/content/:id/status', adminController.getContentStatus);

router.get('/jobs', adminController.getTranscodingJobs);
router.put('/content/:id/geo-restrictions', adminController.updateContentGeoRestrictions);
router.delete('/content/:id', adminController.deleteContent);

module.exports = router;