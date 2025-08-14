
const UserFeed = require('../models/UserFeed');
const UserProfile = require('../models/UserProfile');
const { Op } = require('sequelize');

const feedService = {
  /**
   * Generate personalized feed for a profile
   */
  async generateProfileFeed(userId, profileId) {
    try {
      // Validate profile ownership
      const profile = await UserProfile.findOne({
        where: { id: profileId, userId }
      });

      if (!profile) {
        throw new Error('Profile not found or access denied');
      }

      // Clear existing feed items that are expired
      await UserFeed.destroy({
        where: {
          userId,
          profileId,
          expiresAt: {
            [Op.lt]: new Date()
          }
        }
      });

      const feedItems = [];
      
      // Add trending content (higher priority for child profiles)
      const trendingPriority = profile.isChild ? 100 : 80;
      feedItems.push({
        userId,
        profileId,
        contentId: 'trending-placeholder', // This would be actual content IDs
        feedType: 'trending',
        priority: trendingPriority,
        metadata: { reason: 'Currently trending' },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      // Add recommended content
      feedItems.push({
        userId,
        profileId,
        contentId: 'recommended-placeholder',
        feedType: 'recommended',
        priority: 90,
        metadata: { 
          reason: profile.isChild ? 'Kid-friendly recommendations' : 'Personalized for you',
          isChildSafe: profile.isChild
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      // Bulk create feed items
      await UserFeed.bulkCreate(feedItems);

      return { success: true, itemsCreated: feedItems.length };
    } catch (error) {
      console.error('Generate profile feed error:', error);
      throw error;
    }
  },

  /**
   * Get feed for a specific profile
   */
  async getProfileFeed(userId, profileId, limit = 50) {
    try {
      const profile = await UserProfile.findOne({
        where: { id: profileId, userId }
      });

      if (!profile) {
        throw new Error('Profile not found or access denied');
      }

      const feedItems = await UserFeed.findAll({
        where: {
          userId,
          profileId,
          [Op.or]: [
            { expiresAt: null },
            { expiresAt: { [Op.gt]: new Date() } }
          ]
        },
        order: [
          ['priority', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit,
        include: [
          {
            model: UserProfile,
            as: 'profile',
            attributes: ['profileName', 'isChild']
          }
        ]
      });

      return feedItems;
    } catch (error) {
      console.error('Get profile feed error:', error);
      throw error;
    }
  },

  /**
   * Mark feed item as viewed
   */
  async markFeedItemViewed(userId, feedItemId) {
    try {
      const result = await UserFeed.update(
        {
          isViewed: true,
          viewedAt: new Date()
        },
        {
          where: {
            id: feedItemId,
            userId
          }
        }
      );

      return result[0] > 0;
    } catch (error) {
      console.error('Mark feed item viewed error:', error);
      throw error;
    }
  },

  /**
   * Add content to user's feed
   */
  async addToFeed(userId, profileId, contentId, feedType, metadata = {}) {
    try {
      const profile = await UserProfile.findOne({
        where: { id: profileId, userId }
      });

      if (!profile) {
        throw new Error('Profile not found or access denied');
      }

      const feedItem = await UserFeed.create({
        userId,
        profileId,
        contentId,
        feedType,
        metadata,
        priority: this.getPriorityByType(feedType),
        expiresAt: this.getExpirationByType(feedType)
      });

      return feedItem;
    } catch (error) {
      console.error('Add to feed error:', error);
      throw error;
    }
  },

  getPriorityByType(feedType) {
    const priorities = {
      'continue_watching': 100,
      'trending': 90,
      'recommended': 80,
      'new_release': 70,
      'watchlist': 60
    };
    return priorities[feedType] || 50;
  },

  getExpirationByType(feedType) {
    const now = new Date();
    const expirations = {
      'continue_watching': null, // Never expires
      'trending': new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
      'recommended': new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
      'new_release': new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      'watchlist': null // Never expires
    };
    return expirations[feedType];
  }
};

module.exports = feedService;
