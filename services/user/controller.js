
const logger = require('./utils/logger');
const User = require('./models/User');
const UserProfile = require('./models/UserProfile');
const WatchHistory = require('./models/WatchHistory');

const controller = {
  // Get user profile
  async getProfile(req, res) {
    try {
      const { uid } = req.user;
      
      let user = await User.findOne({ where: { firebaseUid: uid } });
      
      if (!user) {
        // Create user if doesn't exist
        user = await User.create({
          firebaseUid: uid,
          email: req.user.email,
          displayName: req.user.name || req.user.email,
          photoURL: req.user.picture
        });
      }

      const profiles = await UserProfile.findAll({ 
        where: { userId: user.id } 
      });

      res.json({
        success: true,
        data: {
          user,
          profiles
        }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get user profile'
      });
    }
  },

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { uid } = req.user;
      const { displayName, avatar, preferences } = req.body;

      let user = await User.findOne({ where: { firebaseUid: uid } });
      
      if (!user) {
        user = await User.create({
          firebaseUid: uid,
          email: req.user.email,
          displayName: displayName || req.user.email,
          photoURL: avatar
        });
      } else {
        await user.update({
          displayName: displayName || user.displayName,
          photoURL: avatar || user.photoURL,
          preferences: preferences || user.preferences
        });
      }

      res.json({
        success: true,
        data: user,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update profile'
      });
    }
  },

  // Create user profile
  async createProfile(req, res) {
    try {
      const { uid } = req.user;
      const { profileName, isChild, avatarUrl, preferences } = req.body;

      const user = await User.findOne({ where: { firebaseUid: uid } });
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'Please create user account first'
        });
      }

      const profile = await UserProfile.create({
        userId: user.id,
        profileName,
        isChild: isChild || false,
        avatarUrl,
        preferences: preferences || {}
      });

      res.status(201).json({
        success: true,
        data: profile,
        message: 'Profile created successfully'
      });
    } catch (error) {
      logger.error('Create profile error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create profile'
      });
    }
  },

  // Get user profiles
  async getProfiles(req, res) {
    try {
      const { uid } = req.user;

      const user = await User.findOne({ where: { firebaseUid: uid } });
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      const profiles = await UserProfile.findAll({ 
        where: { userId: user.id } 
      });

      res.json({
        success: true,
        data: profiles
      });
    } catch (error) {
      logger.error('Get profiles error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get profiles'
      });
    }
  },

  // Get watch history
  async getWatchHistory(req, res) {
    try {
      const { uid } = req.user;
      const { profileId } = req.params;

      const user = await User.findOne({ where: { firebaseUid: uid } });
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      const watchHistory = await WatchHistory.findAll({
        where: { 
          userId: user.id,
          profileId: profileId || null
        },
        order: [['updatedAt', 'DESC']],
        limit: 50
      });

      res.json({
        success: true,
        data: watchHistory
      });
    } catch (error) {
      logger.error('Get watch history error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get watch history'
      });
    }
  },

  // Update watch progress
  async updateWatchProgress(req, res) {
    try {
      const { uid } = req.user;
      const { contentId, watchTime, totalDuration, completed } = req.body;

      const user = await User.findOne({ where: { firebaseUid: uid } });
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      const [watchRecord, created] = await WatchHistory.findOrCreate({
        where: { 
          userId: user.id, 
          contentId 
        },
        defaults: {
          userId: user.id,
          contentId,
          watchTime,
          totalDuration,
          completed: completed || false
        }
      });

      if (!created) {
        await watchRecord.update({
          watchTime,
          totalDuration,
          completed: completed || false
        });
      }

      res.json({
        success: true,
        data: watchRecord,
        message: 'Watch progress updated'
      });
    } catch (error) {
      logger.error('Update watch progress error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update watch progress'
      });
    }
  }
};

module.exports = controller;
