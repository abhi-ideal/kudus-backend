
const Content = require('../content/models/Content');
const { Op } = require('sequelize');

const recommendationController = {
  async getTrending(req, res) {
    try {
      const { limit = 10, profile_id } = req.query;
      
      let whereClause = {
        isActive: true,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      };

      // Apply child profile filters if applicable
      if (req.contentFilter && req.contentFilter.excludeAdultContent) {
        whereClause.ageRating = {
          [Op.in]: ['G', 'PG', 'PG-13']
        };
        whereClause.genre = {
          [Op.overlap]: req.contentFilter.allowedGenres
        };
      }
      
      const trending = await Content.findAll({
        where: whereClause,
        order: [['views', 'DESC']],
        limit: parseInt(limit),
        attributes: { exclude: ['s3Key', 'videoQualities'] }
      });

      res.json({
        success: true,
        trending,
        profile_id,
        isChildProfile: req.activeProfile ? req.activeProfile.isChild : false,
        count: trending.length
      });
    } catch (error) {
      console.error('Get trending error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve trending content',
        message: error.message
      });
    }
  },

  async getPopular(req, res) {
    try {
      const { genre, limit = 10, profile_id } = req.query;
      let where = { isActive: true };
      
      if (genre) {
        where.genre = {
          [Op.contains]: [genre]
        };
      }

      // Apply child profile filters if applicable
      if (req.contentFilter && req.contentFilter.excludeAdultContent) {
        where.ageRating = {
          [Op.in]: ['G', 'PG', 'PG-13']
        };
        
        // Filter genres for child profiles
        if (req.contentFilter.allowedGenres) {
          where.genre = where.genre ? {
            [Op.and]: [
              where.genre,
              { [Op.overlap]: req.contentFilter.allowedGenres }
            ]
          } : {
            [Op.overlap]: req.contentFilter.allowedGenres
          };
        }
      }
      
      const popular = await Content.findAll({
        where,
        order: [
          ['averageRating', 'DESC'],
          ['views', 'DESC']
        ],
        limit: parseInt(limit),
        attributes: { exclude: ['s3Key', 'videoQualities'] }
      });

      res.json({
        success: true,
        popular,
        profile_id,
        genre,
        isChildProfile: req.activeProfile ? req.activeProfile.isChild : false,
        appliedFilters: req.contentFilter || null,
        count: popular.length
      });
    } catch (error) {
      console.error('Get popular error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve popular content',
        message: error.message
      });
    }
  },

  async getPersonalized(req, res) {
    try {
      const userId = req.user.uid;
      const { limit = 20, profile_id } = req.query;
      
      let where = { isActive: true };

      // Apply child profile filters if applicable
      if (req.contentFilter && req.contentFilter.excludeAdultContent) {
        where.ageRating = {
          [Op.in]: ['G', 'PG', 'PG-13']
        };
        where.genre = {
          [Op.overlap]: req.contentFilter.allowedGenres
        };
      }
      
      // Simple rule-based recommendations
      // In production, this would use ML algorithms
      const recommendations = await Content.findAll({
        where,
        order: [
          ['averageRating', 'DESC'],
          ['views', 'DESC']
        ],
        limit: parseInt(limit * 2), // Get more for shuffling
        attributes: { exclude: ['s3Key', 'videoQualities'] }
      });
      
      // Shuffle for basic personalization simulation
      for (let i = recommendations.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [recommendations[i], recommendations[j]] = [recommendations[j], recommendations[i]];
      }

      const finalRecommendations = recommendations.slice(0, limit);

      res.json({
        success: true,
        recommendations: finalRecommendations,
        userId,
        profile_id,
        isChildProfile: req.activeProfile ? req.activeProfile.isChild : false,
        appliedFilters: req.contentFilter || null,
        algorithm: req.activeProfile && req.activeProfile.isChild ? 'child-safe-v1' : 'rule-based-v1',
        count: finalRecommendations.length
      });
    } catch (error) {
      console.error('Get personalized recommendations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve personalized recommendations',
        message: error.message
      });
    }
  },

  async getSimilar(req, res) {
    try {
      const { contentId } = req.params;
      const { limit = 10, profile_id } = req.query;
      
      // Get the reference content
      const content = await Content.findByPk(contentId);
      
      if (!content) {
        return res.status(404).json({
          success: false,
          error: 'Content not found'
        });
      }
      
      let where = {
        id: { [Op.ne]: contentId },
        isActive: true,
        type: content.type,
        genre: {
          [Op.overlap]: content.genre
        }
      };

      // Apply child profile filters if applicable
      if (req.contentFilter && req.contentFilter.excludeAdultContent) {
        where.ageRating = {
          [Op.in]: ['G', 'PG', 'PG-13']
        };
        where.genre = {
          [Op.and]: [
            where.genre,
            { [Op.overlap]: req.contentFilter.allowedGenres }
          ]
        };
      }
      
      // Find similar content based on genre and type
      const similar = await Content.findAll({
        where,
        order: [['averageRating', 'DESC']],
        limit: parseInt(limit),
        attributes: { exclude: ['s3Key', 'videoQualities'] }
      });

      res.json({
        success: true,
        similar,
        profile_id,
        isChildProfile: req.activeProfile ? req.activeProfile.isChild : false,
        appliedFilters: req.contentFilter || null,
        referenceContent: {
          id: content.id,
          title: content.title,
          type: content.type,
          genre: content.genre
        },
        count: similar.length
      });
    } catch (error) {
      console.error('Get similar content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve similar content',
        message: error.message
      });
    }
  }
};

module.exports = recommendationController;
