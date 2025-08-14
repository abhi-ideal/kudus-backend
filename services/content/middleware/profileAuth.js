
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

    // For content service, we'll make a simple validation
    // In production, you might want to call user service API or cache profile data
    
    // Basic profile validation - ensure profile_id format is valid
    if (!profile_id.match(/^[a-zA-Z0-9-_]{10,50}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID format'
      });
    }

    // Mock profile data - in production, fetch from user service
    // For now, we'll assume child profiles have 'child' in their ID
    const isChildProfile = profile_id.toLowerCase().includes('child');
    
    // Add profile context to request
    req.activeProfile = {
      id: profile_id,
      userId: userId,
      isChild: isChildProfile,
      preferences: {}
    };

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
