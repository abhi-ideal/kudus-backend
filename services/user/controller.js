
const User = require('./models/User');
const WatchHistory = require('./models/WatchHistory');
const UserProfile = require('./models/UserProfile');
const profileService = require('./services/profileService');
const logger = require('../../shared/utils/logger');

const userController = {
  async getProfile(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        subscription: user.subscription,
        preferences: user.preferences,
        lastLoginAt: user.lastLoginAt
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        error: 'Failed to retrieve profile',
        message: error.message
      });
    }
  },

  async updateProfile(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const [updatedRows] = await User.update(updates, {
        where: { id },
        returning: true
      });

      if (updatedRows === 0) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      const updatedUser = await User.findByPk(id);
      
      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          displayName: updatedUser.displayName,
          avatar: updatedUser.avatar,
          preferences: updatedUser.preferences
        }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        error: 'Failed to update profile',
        message: error.message
      });
    }
  },

  async getWatchHistory(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const offset = (page - 1) * limit;
      
      const watchHistory = await WatchHistory.findAndCountAll({
        where: { userId: id },
        order: [['watchedAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        watchHistory: watchHistory.rows,
        pagination: {
          total: watchHistory.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(watchHistory.count / limit)
        }
      });
    } catch (error) {
      logger.error('Get watch history error:', error);
      res.status(500).json({
        error: 'Failed to retrieve watch history',
        message: error.message
      });
    }
  },

  async getFavorites(req, res) {
    try {
      const { id } = req.params;
      
      // This would typically join with content table
      // For now, returning placeholder structure
      res.json({
        favorites: [],
        message: 'Favorites functionality - integrate with Content service'
      });
    } catch (error) {
      logger.error('Get favorites error:', error);
      res.status(500).json({
        error: 'Failed to retrieve favorites',
        message: error.message
      });
    }
  },

  async addToFavorites(req, res) {
    try {
      const { id, contentId } = req.params;
      
      // Implementation would add content to user's favorites
      res.json({
        message: `Added content ${contentId} to favorites for user ${id}`
      });
    } catch (error) {
      logger.error('Add to favorites error:', error);
      res.status(500).json({
        error: 'Failed to add to favorites',
        message: error.message
      });
    }
  },

  async removeFromFavorites(req, res) {
    try {
      const { id, contentId } = req.params;
      
      // Implementation would remove content from user's favorites
      res.json({
        message: `Removed content ${contentId} from favorites for user ${id}`
      });
    } catch (error) {
      logger.error('Remove from favorites error:', error);
      res.status(500).json({
        error: 'Failed to remove from favorites',
        message: error.message
      });
    }
  },

  // Profile Management
  async createProfile(req, res) {
    try {
      const userId = req.user.uid;
      const profileData = req.body;

      const profile = await profileService.createProfile(userId, profileData);

      res.status(201).json({
        success: true,
        data: {
          id: profile.id,
          profileName: profile.profileName,
          isChild: profile.isChild,
          avatarUrl: profile.avatarUrl,
          preferences: profile.preferences,
          createdAt: profile.createdAt
        }
      });
    } catch (error) {
      console.error('Create profile error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create profile'
      });
    }
  },

  async getProfiles(req, res) {
    try {
      const userId = req.user.uid;
      const profiles = await profileService.getUserProfiles(userId);

      res.json({
        success: true,
        data: profiles
      });
    } catch (error) {
      console.error('Get profiles error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch profiles'
      });
    }
  },

  async updateProfile(req, res) {
    try {
      const userId = req.user.uid;
      const { profileId } = req.params;
      const updateData = req.body;

      const profile = await profileService.updateProfile(profileId, userId, updateData);

      res.json({
        success: true,
        data: {
          id: profile.id,
          profileName: profile.profileName,
          isChild: profile.isChild,
          avatarUrl: profile.avatarUrl,
          preferences: profile.preferences,
          updatedAt: profile.updatedAt
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update profile'
      });
    }
  },

  async deleteProfile(req, res) {
    try {
      const userId = req.user.uid;
      const { profileId } = req.params;

      const result = await profileService.deleteProfile(profileId, userId);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Delete profile error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete profile'
      });
    }
  }
};

module.exports = userController;
