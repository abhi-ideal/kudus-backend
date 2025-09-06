
const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const logger = require('../utils/logger');

const ownerProfileOnly = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    
    // Get profile_id from query, body, or headers
    const profileId = req.query.profile_id || req.body.profile_id || req.headers['x-profile-id'];
    
    if (!profileId) {
      return res.status(400).json({
        success: false,
        error: 'Profile ID is required for this operation'
      });
    }

    // Find the user
    const user = await User.findOne({ where: { firebaseUid: userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if the profile belongs to the user and is an owner profile
    const profile = await UserProfile.findOne({
      where: {
        id: profileId,
        userId: user.id,
        isOwner: true
      }
    });

    if (!profile) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. This operation is only allowed for account owner profiles.'
      });
    }

    req.ownerProfile = profile;
    next();
  } catch (error) {
    logger.error('Owner profile auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Authorization failed'
    });
  }
};

module.exports = {
  ownerProfileOnly
};
