const admin = require('firebase-admin');
const User = require('../../user/models/User');

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

const logger = require('../utils/logger');

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

    // Fetch user from database to check role
    const user = await User.findOne({
      where: { firebaseUid: decodedToken.uid }
    });

    if (!user) {
      logger.error(`User not found for UID: ${decodedToken.uid}`);
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist in database'
      });
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      logger.warn(`Non-admin user attempted access: ${decodedToken.uid}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn(`Inactive user attempted access: ${decodedToken.uid}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Account is inactive'
      });
    }

    req.user = decodedToken;
    req.adminUser = user;
    next();
  } catch (error) {
    logger.error('Admin auth verification failed:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
};

module.exports = { authAdmin };