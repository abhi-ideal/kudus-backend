const admin = require('firebase-admin');
const logger = require('../utils/logger');

// Initialize Firebase Admin for content service
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Validate required claims structure
    if (decodedToken.profile_id) {
      // Validate profile_id format
      if (!decodedToken.profile_id.match(/^[a-zA-Z0-9-_]{10,50}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid profile_id format in token claims'
        });
      }
      
      // Validate child claim is a boolean
      if (decodedToken.child !== undefined && typeof decodedToken.child !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Invalid child claim format in token'
        });
      }
    }
    
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Please refresh your token and try again'
      });
    }
    
    if (error.code === 'auth/invalid-id-token' || error.code === 'auth/argument-error') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'The provided token is invalid'
      });
    }
    
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No admin token provided'
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);

    // Check if user has admin role
    if (!decodedToken.admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error('Admin token verification failed:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid admin token'
    });
  }
};

module.exports = {
  verifyFirebaseToken,
  verifyAdminToken
};