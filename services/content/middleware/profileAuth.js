const { verifyFirebaseToken } = require('./auth');

/**
 * Middleware to validate profile ownership and child profile restrictions
 * Content service specific implementation
 */
const profileAuth = async (req, res, next) => {
  try {
    const { profile_id } = req.query || req.body;

    if (!profile_id) {
      return next(); // Profile ID is optional, continue without profile context
    }

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

    // Check if profile_id is provided in query/body or use the one from Firebase claims
    let activeProfileId = profile_id;

    // If no profile_id provided, try to get from Firebase custom claims
    if (!activeProfileId && decodedToken.profile_id) {
      activeProfileId = decodedToken.profile_id;
    }

    // If still no profile_id, check for default_profile_id in claims
    if (!activeProfileId && decodedToken.default_profile_id) {
      activeProfileId = decodedToken.default_profile_id;
    }

    if (activeProfileId) {
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
        fromClaims: !profile_id // Indicates if profile came from Firebase claims
      };
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Content service profile auth error:', error);
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