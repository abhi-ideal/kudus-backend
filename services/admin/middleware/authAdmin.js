
const admin = require('firebase-admin');
const logger = require('../utils/logger');

// Initialize Firebase Admin if not already done
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

const authAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('No token provided');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Check if user has admin role from Firebase custom claims
    if (!decodedToken.admin && decodedToken.role !== 'admin') {
      logger.warn(`Non-admin user attempted access: ${decodedToken.uid}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    // Add user info to request
    req.user = decodedToken;
    req.adminUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'admin',
      isAdmin: true
    };
    
    next();
  } catch (error) {
    logger.error('Admin auth verification failed:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please refresh your token and try again'
      });
    }

    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid'
      });
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
};

module.exports = { authAdmin };
