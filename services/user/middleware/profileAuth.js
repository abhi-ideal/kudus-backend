
const profileService = require('../services/profileService');

/**
 * Middleware to validate profile ownership and child profile restrictions
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

    // Get user's profile IDs from JWT token or session
    const userProfileIds = await profileService.getUserProfileIds(userId);

    // Validate profile ownership without SQL query
    const isValidProfile = profileService.validateProfileOwnership(activeProfileId, userProfileIds);

    if (!isValidProfile) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Profile does not belong to authenticated user.'
      });
    }

    // Get profile details for child restrictions
    const profile = await profileService.getProfileById(activeProfileId, userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    // Add profile context to request
    req.activeProfile = {
      id: profile.id,
      isChild: profile.isChild,
      preferences: profile.preferences,
      fromToken: !!(decodedToken.profile_id || decodedToken.default_profile_id)
    };

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Profile auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Profile authorization failed'
    });
  }
};

/**
 * Middleware to enforce child profile content restrictions
 */
const childProfileFilter = (req, res, next) => {
  if (req.activeProfile && req.activeProfile.isChild) {
    // Add child profile filtering context
    req.contentFilter = {
      excludeAdultContent: true,
      maxAgeRating: 'PG',
      allowedGenres: ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy']
    };
  }
  next();
};

module.exports = {
  profileAuth,
  childProfileFilter
};
