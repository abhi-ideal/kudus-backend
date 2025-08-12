
const Content = require('./models/Content');
const awsService = require('./services/awsService');
const logger = require('../../shared/utils/logger');
const { Op } = require('sequelize');

const contentController = {
  async getAllContent(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type, 
        genre, 
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;
      
      const offset = (page - 1) * limit;
      const where = { isActive: true };
      
      if (type) {
        where.type = type;
      }
      
      if (genre) {
        where.genre = {
          [Op.contains]: [genre]
        };
      }
      
      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }
      
      const content = await Content.findAndCountAll({
        where,
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset,
        attributes: { exclude: ['s3Key', 'videoQualities'] }
      });

      res.json({
        content: content.rows,
        pagination: {
          total: content.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(content.count / limit)
        }
      });
    } catch (error) {
      logger.error('Get all content error:', error);
      res.status(500).json({
        error: 'Failed to retrieve content',
        message: error.message
      });
    }
  },

  async getContentById(req, res) {
    try {
      const { id } = req.params;
      const content = await Content.findByPk(id, {
        attributes: { exclude: ['s3Key', 'videoQualities'] }
      });
      
      if (!content || !content.isActive) {
        return res.status(404).json({
          error: 'Content not found'
        });
      }

      // Increment view count
      await content.increment('views');

      res.json(content);
    } catch (error) {
      logger.error('Get content by ID error:', error);
      res.status(500).json({
        error: 'Failed to retrieve content',
        message: error.message
      });
    }
  },

  async createContent(req, res) {
    try {
      const contentData = req.body;
      const content = await Content.create(contentData);
      
      logger.info(`Content created: ${content.id}`);
      
      res.status(201).json({
        message: 'Content created successfully',
        content
      });
    } catch (error) {
      logger.error('Create content error:', error);
      res.status(500).json({
        error: 'Failed to create content',
        message: error.message
      });
    }
  },

  async updateContent(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const [updatedRows] = await Content.update(updates, {
        where: { id }
      });

      if (updatedRows === 0) {
        return res.status(404).json({
          error: 'Content not found'
        });
      }

      const updatedContent = await Content.findByPk(id);
      
      res.json({
        message: 'Content updated successfully',
        content: updatedContent
      });
    } catch (error) {
      logger.error('Update content error:', error);
      res.status(500).json({
        error: 'Failed to update content',
        message: error.message
      });
    }
  },

  async deleteContent(req, res) {
    try {
      const { id } = req.params;
      
      const deletedRows = await Content.update(
        { isActive: false },
        { where: { id } }
      );

      if (deletedRows[0] === 0) {
        return res.status(404).json({
          error: 'Content not found'
        });
      }

      res.json({
        message: 'Content deleted successfully'
      });
    } catch (error) {
      logger.error('Delete content error:', error);
      res.status(500).json({
        error: 'Failed to delete content',
        message: error.message
      });
    }
  },

  async getStreamingUrl(req, res) {
    try {
      const { id } = req.params;
      const { quality = '720p' } = req.query;
      
      const content = await Content.findByPk(id);
      
      if (!content || !content.isActive) {
        return res.status(404).json({
          error: 'Content not found'
        });
      }

      // Generate signed CloudFront URL
      const streamingUrl = await awsService.generateSignedUrl(content.s3Key, quality);
      
      res.json({
        streamingUrl,
        quality,
        duration: content.duration,
        availableQualities: Object.keys(content.videoQualities || {})
      });
    } catch (error) {
      logger.error('Get streaming URL error:', error);
      res.status(500).json({
        error: 'Failed to generate streaming URL',
        message: error.message
      });
    }
  }
};

module.exports = contentController;
