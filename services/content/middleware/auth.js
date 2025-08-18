
const admin = require('firebase-admin');

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
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
};

module.exports = { verifyFirebaseToken };
const admin = require('firebase-admin');
const logger = require('../utils/logger');

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
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
