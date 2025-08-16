const { Op } = require('sequelize');
const User = require('./models/User');
const UserProfile = require('./models/UserProfile');
const UserFeed = require('./models/UserFeed');
const logger = require('./utils/logger');

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

  // Create or update user profile
  async createOrUpdateProfile(req, res) {
    try {
      const { uid } = req.user;
      const { profileId, profileName, isChild, avatarUrl, preferences } = req.body;

      // Find the user first
      const user = await User.findOne({ where: { firebaseUid: uid } });
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User account not found'
        });
      }

      // If profileId is provided, update existing profile
      if (profileId) {
        // Find the profile to update
        const profile = await UserProfile.findOne({ 
          where: { 
            id: profileId,
            userId: user.id,
            isActive: true 
          } 
        });

        if (!profile) {
          return res.status(404).json({
            error: 'Profile not found',
            message: 'Profile not found or does not belong to user'
          });
        }

        // Check if new profile name conflicts with existing ones
        if (profileName && profileName.trim() !== profile.name) {
          const existingProfile = await UserProfile.findOne({
            where: { 
              userId: user.id, 
              name: profileName.trim(),
              isActive: true,
              id: { [Op.ne]: profileId }
            }
          });

          if (existingProfile) {
            return res.status(400).json({
              error: 'Profile name already exists',
              message: 'A profile with this name already exists'
            });
          }
        }

        // Prepare update data
        const updateData = {};
        if (profileName !== undefined) updateData.name = profileName.trim();
        if (typeof isChild === 'boolean') updateData.isKidsProfile = isChild;
        if (avatarUrl !== undefined) updateData.avatar = avatarUrl;
        if (preferences !== undefined) updateData.preferences = preferences;

        await profile.update(updateData);

        return res.json({
          success: true,
          data: profile,
          message: 'Profile updated successfully'
        });
      } else {
        // Create new profile
        if (!profileName || !profileName.trim()) {
          return res.status(400).json({
            error: 'Profile name required',
            message: 'Profile name is required for creating a new profile'
          });
        }

        // Check if profile name already exists
        const existingProfile = await UserProfile.findOne({
          where: { 
            userId: user.id, 
            name: profileName.trim(),
            isActive: true
          }
        });

        if (existingProfile) {
          return res.status(400).json({
            error: 'Profile name already exists',
            message: 'A profile with this name already exists'
          });
        }

        const profile = await UserProfile.create({
          userId: user.id,
          name: profileName.trim(),
          isKidsProfile: isChild || false,
          avatar: avatarUrl,
          preferences: preferences || {}
        });

        return res.status(201).json({
          success: true,
          data: profile,
          message: 'Profile created successfully'
        });
      }
    } catch (error) {
      logger.error('Create or update profile error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create or update profile'
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
  },

  // Create user (internal service)
  async createUser(req, res) {
    try {
      const { firebaseUid, email, firstName, lastName, displayName } = req.body;

      const existingUser = await User.findOne({ where: { firebaseUid } });
      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'User with this Firebase UID already exists'
        });
      }

      const user = await User.create({
        firebaseUid,
        email,
        firstName,
        lastName,
        displayName: displayName || `${firstName} ${lastName}`.trim() || email
      });

      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
      });
    } catch (error) {
      logger.error('Create user error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create user'
      });
    }
  },

  // Get profile by ID
  async getProfileById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
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
        data: {
          user,
          profiles
        }
      });
    } catch (error) {
      logger.error('Get profile by ID error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get user profile'
      });
    }
  },

  // Update profile by ID
  async updateProfileById(req, res) {
    try {
      const { id } = req.params;
      const { displayName, avatar, preferences } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      await user.update({
        displayName: displayName || user.displayName,
        photoURL: avatar || user.photoURL,
        preferences: preferences || user.preferences
      });

      res.json({
        success: true,
        data: user,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      logger.error('Update profile by ID error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update profile'
      });
    }
  },

  // Get watch history by ID
  async getWatchHistoryById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      const watchHistory = await WatchHistory.findAll({
        where: { userId: user.id },
        order: [['updatedAt', 'DESC']],
        limit: 50
      });

      res.json({
        success: true,
        data: watchHistory
      });
    } catch (error) {
      logger.error('Get watch history by ID error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get watch history'
      });
    }
  },

  // Get favorites by ID
  async getFavoritesById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Assuming favorites are stored in user preferences or a separate table
      const favorites = user.preferences?.favorites || [];

      res.json({
        success: true,
        data: favorites
      });
    } catch (error) {
      logger.error('Get favorites by ID error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get favorites'
      });
    }
  },

  // Add to favorites
  async addToFavorites(req, res) {
    try {
      const { id, contentId } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      const preferences = user.preferences || {};
      const favorites = preferences.favorites || [];

      if (!favorites.includes(contentId)) {
        favorites.push(contentId);
        preferences.favorites = favorites;

        await user.update({ preferences });
      }

      res.json({
        success: true,
        message: 'Added to favorites'
      });
    } catch (error) {
      logger.error('Add to favorites error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to add to favorites'
      });
    }
  },

  // Remove from favorites
  async removeFromFavorites(req, res) {
    try {
      const { id, contentId } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      const preferences = user.preferences || {};
      const favorites = preferences.favorites || [];

      const index = favorites.indexOf(contentId);
      if (index > -1) {
        favorites.splice(index, 1);
        preferences.favorites = favorites;

        await user.update({ preferences });
      }

      res.json({
        success: true,
        message: 'Removed from favorites'
      });
    } catch (error) {
      logger.error('Remove from favorites error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to remove from favorites'
      });
    }
  },

  // Delete profile
  async deleteProfile(req, res) {
    try {
      const { uid } = req.user;
      const { profileId } = req.params;

      const user = await User.findOne({ where: { firebaseUid: uid } });
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      const profile = await UserProfile.findOne({
        where: { id: profileId, userId: user.id }
      });

      if (!profile) {
        return res.status(404).json({
          error: 'Profile not found'
        });
      }

      await profile.destroy();

      res.json({
        success: true,
        message: 'Profile deleted successfully'
      });
    } catch (error) {
      logger.error('Delete profile error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete profile'
      });
    }
  },

  // Get feed
  async getFeed(req, res) {
    try {
      const { uid } = req.user;
      const { profile_id, limit = 50 } = req.query;

      if (!profile_id) {
        return res.status(400).json({
          error: 'Profile ID required'
        });
      }

      const user = await User.findOne({ where: { firebaseUid: uid } });
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Verify profile belongs to user
      const profile = await UserProfile.findOne({
        where: { id: profile_id, userId: user.id }
      });

      if (!profile) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      // Get feed items (placeholder implementation)
      const feedItems = [];

      res.json({
        success: true,
        data: feedItems
      });
    } catch (error) {
      logger.error('Get feed error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get feed'
      });
    }
  },

  // Generate feed
  async generateFeed(req, res) {
    try {
      const { uid } = req.user;
      const { profile_id } = req.body;

      const user = await User.findOne({ where: { firebaseUid: uid } });
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Verify profile belongs to user
      const profile = await UserProfile.findOne({
        where: { id: profile_id, userId: user.id }
      });

      if (!profile) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      // Generate feed logic (placeholder)
      res.json({
        success: true,
        message: 'Feed generated successfully'
      });
    } catch (error) {
      logger.error('Generate feed error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to generate feed'
      });
    }
  },

  // Mark feed as viewed
  async markFeedViewed(req, res) {
    try {
      const { uid } = req.user;
      const { feedItemId } = req.params;

      const user = await User.findOne({ where: { firebaseUid: uid } });
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Mark feed item as viewed logic (placeholder)
      res.json({
        success: true,
        message: 'Feed item marked as viewed'
      });
    } catch (error) {
      logger.error('Mark feed viewed error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to mark feed as viewed'
      });
    }
  }
};

module.exports = controller;