
const profileService = require('../services/profileService');

/**
 * Middleware to validate profile ownership and child profile restrictions
 */
const profileAuth = async (req, res, next) => {
  try {
    const { profile_id } = req.query || req.body;
    
    if (!profile_id) {
      return next(); // Profile ID is optional, continue without profile context
    }

    // Get user's profile IDs from JWT token or session
    // In a real implementation, these would be included in the JWT token
    const userId = req.user.uid;
    const userProfileIds = await profileService.getUserProfileIds(userId);

    // Validate profile ownership without SQL query
    const isValidProfile = profileService.validateProfileOwnership(profile_id, userProfileIds);
    
    if (!isValidProfile) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Profile does not belong to authenticated user.'
      });
    }

    // Get profile details for child restrictions
    const profile = await profileService.getProfileById(profile_id, userId);
    
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
      preferences: profile.preferences
    };

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
