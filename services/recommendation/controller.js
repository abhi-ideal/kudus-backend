
const Content = require('../content/models/Content');
const logger = require('../../shared/utils/logger');
const { Op } = require('sequelize');

const recommendationController = {
  async getTrending(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      // Get content with highest views in the last 30 days
      const trending = await Content.findAll({
        where: {
          isActive: true,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        order: [['views', 'DESC']],
        limit: parseInt(limit),
        attributes: { exclude: ['s3Key', 'videoQualities'] }
      });

      res.json({
        trending,
        count: trending.length
      });
    } catch (error) {
      logger.error('Get trending error:', error);
      res.status(500).json({
        error: 'Failed to retrieve trending content',
        message: error.message
      });
    }
  },

  async getPopular(req, res) {
    try {
      const { genre, limit = 10 } = req.query;
      const where = { isActive: true };
      
      if (genre) {
        where.genre = {
          [Op.contains]: [genre]
        };
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
        popular,
        genre,
        count: popular.length
      });
    } catch (error) {
      logger.error('Get popular error:', error);
      res.status(500).json({
        error: 'Failed to retrieve popular content',
        message: error.message
      });
    }
  },

  async getPersonalized(req, res) {
    try {
      const userId = req.user.uid;
      const { limit = 20 } = req.query;
      
      // Simple rule-based recommendations
      // In production, this would use ML algorithms
      
      // Get user's watch history and preferences
      // For now, return popular content with some randomization
      const recommendations = await Content.findAll({
        where: { isActive: true },
        order: [
          ['averageRating', 'DESC'],
          ['views', 'DESC']
        ],
        limit: parseInt(limit),
        attributes: { exclude: ['s3Key', 'videoQualities'] }
      });
      
      // Shuffle for basic personalization simulation
      for (let i = recommendations.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [recommendations[i], recommendations[j]] = [recommendations[j], recommendations[i]];
      }

      res.json({
        recommendations: recommendations.slice(0, limit),
        userId,
        algorithm: 'rule-based-v1',
        count: recommendations.length
      });
    } catch (error) {
      logger.error('Get personalized recommendations error:', error);
      res.status(500).json({
        error: 'Failed to retrieve personalized recommendations',
        message: error.message
      });
    }
  },

  async getSimilar(req, res) {
    try {
      const { contentId } = req.params;
      const { limit = 10 } = req.query;
      
      // Get the reference content
      const content = await Content.findByPk(contentId);
      
      if (!content) {
        return res.status(404).json({
          error: 'Content not found'
        });
      }
      
      // Find similar content based on genre and type
      const similar = await Content.findAll({
        where: {
          id: { [Op.ne]: contentId },
          isActive: true,
          type: content.type,
          genre: {
            [Op.overlap]: content.genre
          }
        },
        order: [['averageRating', 'DESC']],
        limit: parseInt(limit),
        attributes: { exclude: ['s3Key', 'videoQualities'] }
      });

      res.json({
        similar,
        referenceContent: {
          id: content.id,
          title: content.title,
          type: content.type,
          genre: content.genre
        },
        count: similar.length
      });
    } catch (error) {
      logger.error('Get similar content error:', error);
      res.status(500).json({
        error: 'Failed to retrieve similar content',
        message: error.message
      });
    }
  }
};

module.exports = recommendationController;
