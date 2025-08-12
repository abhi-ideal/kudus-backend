
const admin = require('firebase-admin');
const logger = require('../../shared/utils/logger');

const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Note: Firebase Auth handles login on client side
      // This endpoint can be used for custom validation or logging
      
      res.status(200).json({
        message: 'Login endpoint - use Firebase Auth SDK on frontend',
        instructions: 'Use Firebase signInWithEmailAndPassword() method'
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: error.message
      });
    }
  },

  async register(req, res) {
    try {
      const { email, password, displayName } = req.body;
      
      // Create user in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName
      });

      logger.info(`User registered: ${userRecord.uid}`);
      
      res.status(201).json({
        message: 'User registered successfully',
        uid: userRecord.uid,
        email: userRecord.email
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(400).json({
        error: 'Registration failed',
        message: error.message
      });
    }
  },

  async socialLogin(req, res) {
    try {
      const { provider, token } = req.body;
      
      // Verify the social provider token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      res.status(200).json({
        message: 'Social login successful',
        uid: decodedToken.uid,
        provider: decodedToken.firebase.sign_in_provider
      });
    } catch (error) {
      logger.error('Social login error:', error);
      res.status(401).json({
        error: 'Social login failed',
        message: error.message
      });
    }
  },

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      // Firebase handles token refresh on client side
      res.status(200).json({
        message: 'Use Firebase Auth SDK for token refresh',
        instructions: 'Call getIdToken(true) to refresh token'
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        error: 'Token refresh failed',
        message: error.message
      });
    }
  },

  async logout(req, res) {
    try {
      const { uid } = req.user;
      
      // Revoke refresh tokens for the user
      await admin.auth().revokeRefreshTokens(uid);
      
      logger.info(`User logged out: ${uid}`);
      
      res.status(200).json({
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: error.message
      });
    }
  }
};

module.exports = authController;
