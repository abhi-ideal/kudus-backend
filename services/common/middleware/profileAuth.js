
const profileService = require('../../user/services/profileService');

/**
 * Middleware to validate profile ownership and child profile restrictions
 * Common service specific implementation
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

    // For common service, we'll use a simplified approach to avoid cross-service dependencies
    // Add profile context to request based on token claims
    req.activeProfile = {
      id: activeProfileId,
      isChild: decodedToken.isChild || false, // Get from token claims
      fromToken: !!(decodedToken.profile_id || decodedToken.default_profile_id)
    };

    req.user = decodedToken;
    console.log('Common service - Active profile set:', req.activeProfile);
    next();
  } catch (error) {
    console.error('Common service profile auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Profile authorization failed'
    });
  }
};

module.exports = {
  profileAuth
};
