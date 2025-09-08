// Import models from the user service
const User = require('../../user/models/User');
const UserProfile = require('../../user/models/UserProfile');
const WatchHistory = require('../../user/models/WatchHistory');
const admin = require('firebase-admin');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Define associations between models
User.hasMany(UserProfile, { foreignKey: 'userId', as: 'profiles' });
UserProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(WatchHistory, { foreignKey: 'userId', as: 'watchHistory' });
WatchHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

const userController = {
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 10, status, subscription, search } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};

      if (status) {
        whereClause.isActive = status === 'active';
      }

      if (subscription) {
        whereClause.subscriptionType = subscription;
      }

      if (search) {
        whereClause[Op.or] = [
          { email: { [Op.like]: `%${search}%` } },
          { displayName: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['password', 'firebaseUid'] },
        include: [{
          model: UserProfile,
          as: 'profiles',
          required: false,
          attributes: ['id', 'profileName', 'avatar', 'isOwner', 'maturityLevel', 'isActive', 'createdAt']
        }]
      });

      res.json({
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          status: user.isActive ? 'active' : 'inactive',
          subscription: user.subscriptionType || 'free',
          subscriptionEndDate: user.subscriptionEndDate,
          createdAt: user.createdAt,
          profiles: user.profiles || []
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({
        error: 'Failed to retrieve users',
        message: error.message
      });
    }
  },

  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        include: [
          {
            model: UserProfile,
            as: 'profiles',
            attributes: ['id', 'profileName', 'avatar', 'isOwner', 'maturityLevel', 'isActive', 'createdAt']
          },
          {
            model: WatchHistory,
            as: 'watchHistory',
            limit: 10,
            order: [['updatedAt', 'DESC']]
          }
        ],
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Get additional statistics
      const totalWatchTime = await WatchHistory.sum('watchTime', {
        where: { userId: id }
      });

      const profilesCount = await UserProfile.count({
        where: { userId: id }
      });

      res.json({
        user,
        statistics: {
          totalWatchTime: totalWatchTime || 0,
          profilesCount,
          accountAge: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
        }
      });
    } catch (error) {
      logger.error('Get user by ID error:', error);
      res.status(500).json({
        error: 'Failed to retrieve user',
        message: error.message
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

      // Update user status in database
      await user.update({
        isActive: false,
        blockedAt: new Date(),
        blockedReason: reason || 'Blocked by admin'
      });

      // Disable user in Firebase Auth
      try {
        await admin.auth().updateUser(user.firebaseUid, {
          disabled: true
        });
      } catch (firebaseError) {
        logger.error('Firebase disable user error:', firebaseError);
        // Continue with local update even if Firebase fails
      }

      logger.info(`Admin blocked user: ${id}, reason: ${reason}`);

      res.json({
        message: 'User blocked successfully',
        user: {
          id: user.id,
          email: user.email,
          status: user.isActive ? 'active' : 'blocked',
          isActive: user.isActive,
          blockedAt: user.blockedAt,
          blockedReason: user.blockedReason
        }
      });
    } catch (error) {
      logger.error('Block user error:', error);
      res.status(500).json({
        error: 'Failed to block user',
        message: error.message
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

      // Update user status in database
      await user.update({
        isActive: true,
        blockedAt: null,
        blockedReason: null
      });

      // Enable user in Firebase Auth
      try {
        await admin.auth().updateUser(user.firebaseUid, {
          disabled: false
        });
      } catch (firebaseError) {
        logger.error('Firebase enable user error:', firebaseError);
        // Continue with local update even if Firebase fails
      }

      logger.info(`Admin unblocked user: ${id}`);

      res.json({
        message: 'User unblocked successfully',
        user: {
          id: user.id,
          email: user.email,
          status: user.isActive ? 'active' : 'inactive',
          isActive: user.isActive
        }
      });
    } catch (error) {
      logger.error('Unblock user error:', error);
      res.status(500).json({
        error: 'Failed to unblock user',
        message: error.message
      });
    }
  },

  async getUserActivity(req, res) {
    try {
      const { id } = req.params;
      const { limit = 50, page = 1 } = req.query;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      const offset = (page - 1) * limit;

      // Get watch history with content details
      const watchHistory = await WatchHistory.findAndCountAll({
        where: { userId: id },
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
      const profiles = await UserProfile.findAll({
        where: { userId: id },
        attributes: ['id', 'name', 'lastActiveAt', 'createdAt'],
        order: [['lastActiveAt', 'DESC']]
      });

      res.json({
        watchHistory: {
          items: watchHistory.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(watchHistory.count / limit),
            totalItems: watchHistory.count,
            itemsPerPage: parseInt(limit)
          }
        },
        profiles,
        lastActivity: user.lastLoginAt
      });
    } catch (error) {
      logger.error('Get user activity error:', error);
      res.status(500).json({
        error: 'Failed to retrieve user activity',
        message: error.message
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
        subscriptionEndDate: subscriptionEndDate ? new Date(subscriptionEndDate) : null
      });

      logger.info(`Admin updated user subscription: ${id} to ${subscription}`);

      res.json({
        message: 'User subscription updated successfully',
        user: {
          id: user.id,
          email: user.email,
          subscription: user.subscriptionType,
          subscriptionEndDate: user.subscriptionEndDate
        }
      });
    } catch (error) {
      logger.error('Update user subscription error:', error);
      res.status(500).json({
        error: 'Failed to update user subscription',
        message: error.message
      });
    }
  },

  async getUserStatistics(req, res) {
    try {
      const [totalUsers, activeUsers, blockedUsers, premiumUsers] = await Promise.all([
      User.count(),
      User.count({ where: { isActive: true } }),
      User.count({ where: { isActive: false } }),
      User.count({ where: { subscription: 'premium' } })
    ]);

      const subscriptionBreakdown = await User.findAll({
        attributes: [
          'subscriptionType',
          [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
        ],
        group: 'subscriptionType'
      });

      const userGrowth = await User.findAll({
        attributes: [
          [User.sequelize.fn('DATE', User.sequelize.col('createdAt')), 'date'],
          [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        group: [User.sequelize.fn('DATE', User.sequelize.col('createdAt'))],
        order: [[User.sequelize.fn('DATE', User.sequelize.col('createdAt')), 'ASC']]
      });

      res.json({
        overview: {
          totalUsers,
          activeUsers,
          blockedUsers,
          activePercentage: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0
        },
        subscriptionBreakdown,
        userGrowth,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Get user statistics error:', error);
      res.status(500).json({
        error: 'Failed to retrieve user statistics',
        message: error.message
      });
    }
  }
};

module.exports = userController;