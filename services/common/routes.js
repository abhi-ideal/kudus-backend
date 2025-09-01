const express = require('express');
const commonController = require('./controller');
const { validate } = require('./utils/validation');
const { verifyFirebaseToken, verifyAdmin } = require('./middleware/auth');
const { profileAuth } = require('../../user/middleware/profileAuth');

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
 *     summary: Get active genres for users
 *     tags: [Common]
 *     parameters:
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
 *         description: List of active genres
 */
router.get('/genres', verifyFirebaseToken, profileAuth, commonController.getUserGenres);

/**
 * @swagger
 * /api/common/admin/genres:
 *   get:
 *     summary: Get all genres for admin (including inactive)
 *     tags: [Common]
 *     security:
 *       - bearerAuth: []
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
 *         description: List of genres for admin
 */
router.get('/admin/genres', verifyFirebaseToken, verifyAdmin, commonController.getAdminGenres);

/**
 * @swagger
 * /api/common/admin/genres/{id}:
 *   get:
 *     summary: Get genre by ID (Admin)
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
 *         description: Genre details
 */
router.get('/admin/genres/:id', verifyFirebaseToken, verifyAdmin, commonController.getGenreById);

/**
 * @swagger
 * /api/common/admin/genres/{id}:
 *   put:
 *     summary: Update genre (Admin)
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
router.put('/admin/genres/:id', verifyFirebaseToken, verifyAdmin, validate('genreUpdate'), commonController.updateGenre);

/**
 * @swagger
 * /api/common/admin/genres/{id}/child-profile:
 *   patch:
 *     summary: Update genre child profile visibility (Admin)
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
 *             required:
 *               - showOnChildProfile
 *             properties:
 *               showOnChildProfile:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Genre child profile visibility updated successfully
 */
router.patch('/admin/genres/:id/child-profile', verifyFirebaseToken, verifyAdmin, commonController.updateGenreChildProfile);


/**
 * @swagger
 * /api/common/admin/genres/{id}:
 *   delete:
 *     summary: Delete genre (Admin)
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
router.delete('/admin/genres/:id', verifyFirebaseToken, verifyAdmin, commonController.deleteGenre);

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
router.post('/admin/genres', verifyFirebaseToken, verifyAdmin, validate('genre'), commonController.createGenre);



// Support/Contact Form Routes
/**
 * @swagger
 * /api/common/support:
 *   post:
 *     summary: Submit a support/contact request
 *     tags: [Support]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - subject
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [general, technical, billing, account, content, other]
 *     responses:
 *       201:
 *         description: Support ticket created successfully
 */
router.post('/support', validate('supportTicket'), commonController.createSupportTicket);

/**
 * @swagger
 * /api/common/support:
 *   get:
 *     summary: Get all support tickets (Admin only)
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *       - in: query
 *         name: category
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
 *         description: List of support tickets
 */
router.get('/support', verifyFirebaseToken, commonController.getSupportTickets);

/**
 * @swagger
 * /api/common/support/{id}:
 *   get:
 *     summary: Get support ticket by ID (Admin only)
 *     tags: [Support]
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
 *         description: Support ticket details
 */
router.get('/support/:id', verifyFirebaseToken, commonController.getSupportTicketById);

/**
 * @swagger
 * /api/common/support/{id}:
 *   put:
 *     summary: Update support ticket (Admin only)
 *     tags: [Support]
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
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               adminResponse:
 *                 type: string
 *     responses:
 *       200:
 *         description: Support ticket updated successfully
 */
router.put('/support/:id', verifyFirebaseToken, validate('supportTicketUpdate'), commonController.updateSupportTicket);

// Privacy Policy Routes
/**
 * @swagger
 * /api/common/privacy-policy:
 *   get:
 *     summary: Get active privacy policy
 *     tags: [Legal]
 *     responses:
 *       200:
 *         description: Active privacy policy
 */
router.get('/privacy-policy', commonController.getActivePrivacyPolicy);

/**
 * @swagger
 * /api/common/privacy-policies:
 *   get:
 *     summary: Get all privacy policies (Admin only)
 *     tags: [Legal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false]
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
 *         description: List of privacy policies
 */
router.get('/privacy-policies', verifyFirebaseToken, commonController.getPrivacyPolicies);

/**
 * @swagger
 * /api/common/privacy-policies:
 *   post:
 *     summary: Create privacy policy (Admin only)
 *     tags: [Legal]
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
 *               - content
 *               - version
 *               - effectiveDate
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               version:
 *                 type: string
 *               effectiveDate:
 *                 type: string
 *                 format: date
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Privacy policy created successfully
 */
router.post('/privacy-policies', verifyFirebaseToken, validate('privacyPolicy'), commonController.createPrivacyPolicy);

/**
 * @swagger
 * /api/common/privacy-policies/{id}:
 *   put:
 *     summary: Update privacy policy (Admin only)
 *     tags: [Legal]
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
 *         description: Privacy policy updated successfully
 */
router.put('/privacy-policies/:id', verifyFirebaseToken, validate('privacyPolicyUpdate'), commonController.updatePrivacyPolicy);

// Terms and Conditions Routes
/**
 * @swagger
 * /api/common/terms-conditions:
 *   get:
 *     summary: Get active terms and conditions
 *     tags: [Legal]
 *     responses:
 *       200:
 *         description: Active terms and conditions
 */
router.get('/terms-conditions', commonController.getActiveTermsConditions);

/**
 * @swagger
 * /api/common/terms-conditions-list:
 *   get:
 *     summary: Get all terms and conditions (Admin only)
 *     tags: [Legal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false]
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
 *         description: List of terms and conditions
 */
router.get('/terms-conditions-list', verifyFirebaseToken, commonController.getTermsConditions);

/**
 * @swagger
 * /api/common/terms-conditions:
 *   post:
 *     summary: Create terms and conditions (Admin only)
 *     tags: [Legal]
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
 *               - content
 *               - version
 *               - effectiveDate
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               version:
 *                 type: string
 *               effectiveDate:
 *                 type: string
 *                 format: date
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Terms and conditions created successfully
 */
router.post('/terms-conditions', verifyFirebaseToken, validate('termsConditions'), commonController.createTermsConditions);

/**
 * @swagger
 * /api/common/terms-conditions/{id}:
 *   put:
 *     summary: Update terms and conditions (Admin only)
 *     tags: [Legal]
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
 *         description: Terms and conditions updated successfully
 */
router.put('/terms-conditions/:id', verifyFirebaseToken, validate('termsConditionsUpdate'), commonController.updateTermsConditions);

module.exports = router;