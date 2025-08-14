
const admin = require('firebase-admin');

// Initialize Firebase Admin for recommendation service if not already initialized
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
 * Recommendation service profile authentication middleware
 */
const profileAuth = async (req, res, next) => {
  try {
    const { profile_id } = req.query || req.body;
    
    if (!profile_id) {
      return res.status(400).json({
        success: false,
        error: 'Profile ID is required for recommendations'
      });
    }

    // Verify Firebase token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Basic profile validation
    if (!profile_id.match(/^[a-zA-Z0-9-_]{10,50}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID format'
      });
    }

    const isChildProfile = profile_id.toLowerCase().includes('child');
    
    req.activeProfile = {
      id: profile_id,
      userId: userId,
      isChild: isChildProfile
    };

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Recommendation service profile auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Profile authorization failed'
    });
  }
};

/**
 * Child profile recommendation filtering
 */
const childRecommendationFilter = (req, res, next) => {
  if (req.activeProfile && req.activeProfile.isChild) {
    req.recommendationFilter = {
      excludeAdultContent: true,
      preferredGenres: ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy'],
      maxAgeRating: 'PG-13',
      excludeViolentContent: true,
      prioritizeEducational: true
    };
  }
  next();
};

module.exports = {
  profileAuth,
  childRecommendationFilter
};
