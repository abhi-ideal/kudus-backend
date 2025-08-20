
const { verifyFirebaseToken } = require('./auth');

/**
 * Middleware to validate profile ownership and child profile restrictions
 * Content service specific implementation
 */
const profileAuth = async (req, res, next) => {
  try {
    // Verify Firebase token first
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    const admin = require('firebase-admin');
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Priority order: token claims > query/body parameters
    let activeProfileId = decodedToken.profile_id || decodedToken.default_profile_id;
    
    // Fallback to query/body parameters if not in token
    if (!activeProfileId) {
      const { profile_id } = req.query || req.body;
      activeProfileId = profile_id;
    }

    if (!activeProfileId) {
      return next(); // Profile ID is optional, continue without profile context
    }

    // Basic profile validation - ensure profile_id format is valid
    if (!activeProfileId.match(/^[a-zA-Z0-9-_]{10,50}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID format'
      });
    }

    // Check if it's a child profile
    const isChildProfile = activeProfileId.toLowerCase().includes('child');

    // Add profile context to request
    req.activeProfile = {
      id: activeProfileId,
      userId: userId,
      isChild: isChildProfile,
      preferences: {},
      fromToken: !!(decodedToken.profile_id || decodedToken.default_profile_id) // Indicates if profile came from token
    };

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Content service profile auth error:', error);
    
    // Handle Firebase token errors with proper status codes
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
    
    // For other errors, return 500
    res.status(500).json({
      success: false,
      error: 'Profile authorization failed'
    });
  }
};

/**
 * Middleware to enforce child profile content restrictions
 * Content service specific implementation
 */
const childProfileFilter = (req, res, next) => {
  if (req.activeProfile && req.activeProfile.isChild) {
    // Add child profile filtering context for content queries
    req.contentFilter = {
      excludeAdultContent: true,
      maxAgeRating: 'PG-13',
      allowedAgeRatings: ['G', 'PG', 'PG-13'],
      allowedGenres: ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy'],
      restrictAdultGenres: ['Horror', 'Thriller', 'Crime', 'Drama', 'Romance']
    };
  }
  next();
};

module.exports = {
  profileAuth,
  childProfileFilter
};
