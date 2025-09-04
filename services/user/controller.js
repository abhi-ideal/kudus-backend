const { Op } = require('sequelize');
const User = require('./models/User');
const UserProfile = require('./models/UserProfile');
const UserFeed = require('./models/UserFeed');
const WatchHistory = require('./models/WatchHistory');
const logger = require('./utils/logger');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    logger.info('Firebase Admin initialized successfully in user service');
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin in user service:', error);
  }
}

// Define associations
User.hasMany(UserProfile, { foreignKey: 'userId', as: 'profiles' });
UserProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(WatchHistory, { foreignKey: 'userId', as: 'watchHistory' });
WatchHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

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
        where: { userId: user.id, isActive: true }
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

  // Update profile
  async updateProfile(req, res) {
    try {
      const { uid } = req.user;
      const { profileId } = req.params;
      const { profileName, isChild, avatarUrl, preferences } = req.body;

      // Find the user first
      const user = await User.findOne({ where: { firebaseUid: uid } });
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User account not found'
        });
      }

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

      res.json({
        success: true,
        data: profile,
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
  },

  // Admin methods
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 10, isActive, subscription } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (isActive !== undefined) whereClause.isActive = isActive === 'true';
      if (subscription) whereClause.subscriptionType = subscription;

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        include: [{
          model: UserProfile,
          as: 'profiles',
          where: { isActive: true },
          required: false
        }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get users'
      });
    }
  },

  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        include: [{
          model: UserProfile,
          as: 'profiles',
          where: { isActive: true },
          required: false
        }]
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Get user statistics
      const statistics = {
        accountAge: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        totalWatchTime: 0, // Placeholder
        profilesCount: user.profiles?.length || 0
      };

      res.json({
        success: true,
        data: {
          user,
          statistics
        }
      });
    } catch (error) {
      logger.error('Get user by ID error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get user'
      });
    }
  },

  async blockUser(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      await user.update({
        isActive: false,
        preferences: {
          ...user.preferences,
          blockedReason: reason,
          blockedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'User blocked successfully'
      });
    } catch (error) {
      logger.error('Block user error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to block user'
      });
    }
  },

  async unblockUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      const updatedPreferences = { ...user.preferences };
      delete updatedPreferences.blockedReason;
      delete updatedPreferences.blockedAt;

      await user.update({
        isActive: true,
        preferences: updatedPreferences
      });

      res.json({
        success: true,
        message: 'User unblocked successfully'
      });
    } catch (error) {
      logger.error('Unblock user error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to unblock user'
      });
    }
  },

  async updateUserSubscription(req, res) {
    try {
      const { id } = req.params;
      const { subscription, subscriptionEndDate } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      await user.update({
        subscriptionType: subscription,
        subscriptionEndDate: subscriptionEndDate ? new Date(subscriptionEndDate) : null,
        subscriptionStatus: subscription === 'free' ? 'inactive' : 'active'
      });

      res.json({
        success: true,
        message: 'Subscription updated successfully',
        data: user
      });
    } catch (error) {
      logger.error('Update subscription error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update subscription'
      });
    }
  },

  async getUserStatistics(req, res) {
    try {
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { isActive: true } });
      const inactiveUsers = await User.count({ where: { isActive: false } });
      const premiumUsers = await User.count({ where: { subscriptionType: 'premium' } });
      const familyUsers = await User.count({ where: { subscriptionType: 'family' } });
      const basicUsers = await User.count({ where: { subscriptionType: 'basic' } });

      const statistics = {
        totalUsers,
        activeUsers,
        inactiveUsers,
        premiumUsers,
        familyUsers,
        basicUsers,
        freeUsers: totalUsers - premiumUsers - familyUsers - basicUsers
      };

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('Get user statistics error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get statistics'
      });
    }
  },

  // Logout user and update session history
  async logout(req, res) {
    try {
      const userId = req.user?.userId || req.params.userId;

      if (!userId) {
        return res.status(400).json({
          error: 'User ID required',
          message: 'User ID must be provided'
        });
      }

      // Find the most recent active login session
      const recentLogin = await LoginHistory.findOne({
        where: {
          userId: userId,
          isActive: true,
          logoutAt: null
        },
        order: [['loginAt', 'DESC']]
      });

      if (recentLogin) {
        const logoutTime = new Date();
        const sessionDuration = Math.floor((logoutTime - recentLogin.loginAt) / 1000);

        await recentLogin.update({
          logoutAt: logoutTime,
          sessionDuration: sessionDuration,
          isActive: false
        });

        logger.info(`User ${userId} logged out successfully`);
      }

      res.json({
        success: true,
        message: 'User logged out successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('User logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: error.message
      });
    }
  },

  // Get user activity summary
  async getUserActivity(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      // Get recent watch history
      const watchHistory = await WatchHistory.findAll({
        where: { userId },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['updatedAt', 'DESC']],
        // Note: Content association would need to be defined separately
        // include: [
        //   {
        //     model: require('../../content/models/Content'),
        //     as: 'content',
        //     attributes: ['id', 'title', 'type', 'poster']
        //   }
        // ]
      });

      // Get recent profile activities
    } catch (error) {
      logger.error('Get user activity error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get user activity'
      });
    }
  },

  async deleteAccount(req, res) {
    try {
      const userId = req.user.uid;
      const { confirmPassword } = req.body;

      // Find user
      const user = await User.findOne({ where: { firebaseUid: userId } });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Delete related data
      await UserProfile.destroy({ where: { userId: user.id } });
      await WatchHistory.destroy({ where: { userId: user.id } });
      await UserFeed.destroy({ where: { profileId: user.id } }); // Assuming UserFeed is related to profileId

      // Delete user record
      await user.destroy();

      // Delete from Firebase Auth
      try {
        await admin.auth().deleteUser(userId);
      } catch (firebaseError) {
        logger.error('Firebase delete user error:', firebaseError);
        // Continue even if Firebase deletion fails
      }

      logger.info(`User account deleted: ${userId}`);

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      logger.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete account',
        message: error.message
      });
    }
  }
};

// Export controller functions, including the new logout function
module.exports = {
  createUser: controller.createUser,
  getProfile: controller.getProfile,
  getProfileById: controller.getProfileById,
  updateProfile: controller.updateProfile,
  deleteProfile: controller.deleteProfile,
  createOrUpdateProfile: controller.createOrUpdateProfile,
  getProfiles: controller.getProfiles,
  getWatchHistory: controller.getWatchHistory,
  updateWatchProgress: controller.updateWatchProgress,
  updateProfileById: controller.updateProfileById,
  getWatchHistoryById: controller.getWatchHistoryById,
  getFavoritesById: controller.getFavoritesById,
  addToFavorites: controller.addToFavorites,
  removeFromFavorites: controller.removeFromFavorites,
  getFeed: controller.getFeed,
  generateFeed: controller.generateFeed,
  markFeedViewed: controller.markFeedViewed,
  getUsers: controller.getUsers,
  getUserById: controller.getUserById,
  blockUser: controller.blockUser,
  unblockUser: controller.unblockUser,
  updateUserSubscription: controller.updateUserSubscription,
  getUserStatistics: controller.getUserStatistics,
  getUserActivity: controller.getUserActivity,
  logout: controller.logout,
  deleteAccount: controller.deleteAccount
};