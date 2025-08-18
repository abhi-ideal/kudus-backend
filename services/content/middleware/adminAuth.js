
const admin = require('firebase-admin');

// Initialize Firebase Admin for content service if not already initialized
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

/**
 * Middleware to authenticate admin users using Firebase Admin SDK
 * Content service specific implementation
 */
const authAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No valid authorization token provided'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Check if user has admin role
    if (!decodedToken.admin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    // Add admin user info to request
    req.adminUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isAdmin: true
    };
    
    next();
  } catch (error) {
    console.error('Content service admin auth error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Please refresh your token and try again'
      });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'The provided token is invalid'
      });
    }
    
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Failed to verify admin token'
    });
  }
};

module.exports = { authAdmin };
