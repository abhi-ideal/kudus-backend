
/**
 * Middleware to validate profile ownership and child profile restrictions
 * Content service specific implementation - SECURE VERSION
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

    // SECURITY: Only trust profile_id from Firebase custom claims, never from request
    const activeProfileId = decodedToken.profile_id;
    const isChildProfile = decodedToken.child === true; // Explicit boolean check

    // If no profile in claims, this is optional for some endpoints
    if (!activeProfileId) {
      req.user = decodedToken;
      return next(); // Continue without profile context
    }

    // Validate profile_id format for security
    if (!activeProfileId.match(/^[a-zA-Z0-9-_]{10,50}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID in token claims'
      });
    }

    // Add secure profile context to request
    req.activeProfile = {
      id: activeProfileId,
      userId: userId,
      isChild: isChildProfile,
      preferences: {},
      fromToken: true // Always from token in secure implementation
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
 * Content service specific implementation - SECURE VERSION
 */
const childProfileFilter = (req, res, next) => {
  // Check if this is a child profile from Firebase custom claims
  if (req.activeProfile && req.activeProfile.isChild === true) {
    // Add strict child profile filtering context for content queries
    req.contentFilter = {
      excludeAdultContent: true,
      maxAgeRating: 'PG-13',
      allowedAgeRatings: ['G', 'PG', 'PG-13'],
      allowedGenres: ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy'],
      restrictedGenres: ['Horror', 'Thriller', 'Crime', 'Drama', 'Romance'],
      enforceChildSafety: true
    };
  }
  next();
};

module.exports = {
  profileAuth,
  childProfileFilter
};
