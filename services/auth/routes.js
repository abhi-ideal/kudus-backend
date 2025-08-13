
const express = require('express');
const authController = require('./controller');
const { validate, schemas } = require('./utils/validation');

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               displayName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/social-login:
 *   post:
 *     summary: Social login (Google, Facebook, Apple)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Social login successful
 */
router.post('/social-login', authController.socialLogin);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh authentication token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authController.logout);

module.exports = router;
