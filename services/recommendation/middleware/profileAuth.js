
const admin = require('firebase-admin');

const profileAuth = async (req, res, next) => {
  try {
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

    // Priority order: token claims > query/body parameters
    let activeProfileId = decodedToken.profile_id || decodedToken.default_profile_id;
    
    // Fallback to query/body parameters if not in token
    if (!activeProfileId) {
      const { profile_id } = req.query || req.body;
      activeProfileId = profile_id;
    }

    if (!activeProfileId) {
      return res.status(400).json({
        success: false,
        error: 'Profile ID is required for recommendations'
      });
    }

    // Basic profile validation
    if (!activeProfileId.match(/^[a-zA-Z0-9-_]{10,50}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID format'
      });
    }

    const isChildProfile = activeProfileId.toLowerCase().includes('child');

    req.activeProfile = {
      id: activeProfileId,
      userId: userId,
      isChild: isChildProfile,
      fromToken: !!(decodedToken.profile_id || decodedToken.default_profile_id)
    };

    req.user = decodedToken;
    next();
  } catch (error) {
    const logger = require('../utils/logger');
    logger.error('Recommendation service profile auth error:', error);
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
