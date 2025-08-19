const Content = require('../content/models/Content');
const User = require('../user/models/User');
const awsService = require('../content/services/awsService');
const logger = require('./utils/logger');
const { v4: uuidv4 } = require('uuid');

const adminController = {
  async uploadContent(req, res) {
    try {
      const { title, description, type, genre, cast, director, rating } = req.body;
      const videoFile = req.file;

      if (!videoFile) {
        return res.status(400).json({
          error: 'Video file is required'
        });
      }

      // Generate unique content ID and S3 key
      const contentId = uuidv4();
      const s3Key = `content/${contentId}/original/${videoFile.originalname}`;

      // Upload original file to S3
      await awsService.uploadToS3(videoFile, s3Key);

      // Create content record
      const content = await Content.create({
        id: contentId,
        title,
        description,
        type,
        genre: Array.isArray(genre) ? genre : [genre],
        cast: Array.isArray(cast) ? cast : cast ? [cast] : [],
        director,
        rating,
        s3Key,
        isActive: false // Will be activated after transcoding
      });

      // Start transcoding job
      const transcodingJob = await awsService.createTranscodingJob(
        s3Key,
        `content/${contentId}/transcoded`,
        contentId
      );

      logger.info(`Content uploaded and transcoding started: ${contentId}`);

      res.status(201).json({
        message: 'Content uploaded successfully, transcoding started',
        contentId,
        transcodingJobId: transcodingJob.Id,
        status: 'processing'
      });
    } catch (error) {
      logger.error('Upload content error:', error);
      res.status(500).json({
        error: 'Failed to upload content',
        message: error.message
      });
    }
  },

  async startTranscoding(req, res) {
    try {
      const { contentId, inputFile } = req.body;

      const content = await Content.findByPk(contentId);

      if (!content) {
        return res.status(404).json({
          error: 'Content not found'
        });
      }

      const transcodingJob = await awsService.createTranscodingJob(
        inputFile,
        `content/${contentId}/transcoded`,
        contentId
      );

      res.json({
        message: 'Transcoding job started successfully',
        jobId: transcodingJob.Id,
        contentId
      });
    } catch (error) {
      logger.error('Start transcoding error:', error);
      res.status(500).json({
        error: 'Failed to start transcoding',
        message: error.message
      });
    }
  },

  async getStats(req, res) {
    try {
      // Get platform statistics
      const totalContent = await Content.count({ where: { isActive: true } });
      const totalUsers = await User.count({ where: { isActive: true } });
      const totalViews = await Content.sum('views');

      // Content by type
      const contentByType = await Content.findAll({
        attributes: [
          'type',
          [Content.sequelize.fn('COUNT', Content.sequelize.col('id')), 'count']
        ],
        where: { isActive: true },
        group: 'type'
      });

      // Top viewed content
      const topContent = await Content.findAll({
        where: { isActive: true },
        order: [['views', 'DESC']],
        limit: 10,
        attributes: ['id', 'title', 'views', 'type']
      });

      // User subscription distribution
      const subscriptionStats = await User.findAll({
        attributes: [
          'subscription',
          [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
        ],
        where: { isActive: true },
        group: 'subscription'
      });

      res.json({
        overview: {
          totalContent,
          totalUsers,
          totalViews,
          averageViewsPerContent: totalContent > 0 ? Math.round(totalViews / totalContent) : 0
        },
        contentByType,
        topContent,
        subscriptionStats,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Get stats error:', error);
      res.status(500).json({
        error: 'Failed to retrieve statistics',
        message: error.message
      });
    }
  },

  async getContentStatus(req, res) {
    try {
      const { id } = req.params;

      const content = await Content.findByPk(id);

      if (!content) {
        return res.status(404).json({
          error: 'Content not found'
        });
      }

      res.json({
        id: content.id,
        title: content.title,
        status: content.isActive ? 'active' : 'processing',
        s3Key: content.s3Key,
        videoQualities: content.videoQualities,
        views: content.views,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt
      });
    } catch (error) {
      logger.error('Get content status error:', error);
      res.status(500).json({
        error: 'Failed to retrieve content status',
        message: error.message
      });
    }
  },

  async getTranscodingJobs(req, res) {
    try {
      // This would typically query MediaConvert for job status
      // For now, return placeholder data
      res.json({
        jobs: [
          {
            id: 'example-job-1',
            status: 'COMPLETE',
            contentId: 'example-content-1',
            createdAt: new Date().toISOString()
          }
        ],
        message: 'Transcoding jobs - integrate with MediaConvert API for real data'
      });
    } catch (error) {
      logger.error('Get transcoding jobs error:', error);
      res.status(500).json({
        error: 'Failed to retrieve transcoding jobs',
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

      logger.info(`Content deleted by admin: ${id}`);

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

  async updateContentGeoRestrictions(req, res) {
    try {
      const { id } = req.params;
      const { 
        availableCountries = [], 
        restrictedCountries = [], 
        isGloballyAvailable = true 
      } = req.body;

      const content = await Content.findByPk(id);

      if (!content) {
        return res.status(404).json({
          error: 'Content not found'
        });
      }

      // Validate country codes (basic validation)
      const allCountries = [...availableCountries, ...restrictedCountries];
      const invalidCountries = allCountries.filter(country => 
        !country.match(/^[A-Z]{2}$/)
      );

      if (invalidCountries.length > 0) {
        return res.status(400).json({
          error: 'Invalid country codes',
          invalidCountries
        });
      }

      await content.update({
        availableCountries,
        restrictedCountries,
        isGloballyAvailable
      });

      logger.info(`Content geo-restrictions updated: ${id}`);

      res.json({
        message: 'Geo-restrictions updated successfully',
        content: {
          id: content.id,
          title: content.title,
          availableCountries: content.availableCountries,
          restrictedCountries: content.restrictedCountries,
          isGloballyAvailable: content.isGloballyAvailable
        }
      });
    } catch (error) {
      logger.error('Update geo-restrictions error:', error);
      res.status(500).json({
        error: 'Failed to update geo-restrictions',
        message: error.message
      });
    }
  },

  async getAnalytics(req, res) {
    try {
      // This would be implemented based on your analytics requirements
      res.json({
        message: 'Analytics endpoint - implementation pending',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Get analytics error:', error);
      res.status(500).json({
        error: 'Failed to get analytics',
        message: error.message
      });
    }
  },

  async logout(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication token required for admin logout'
        });
      }

      const token = authHeader.split(' ')[1];

      // Verify admin token
      const admin = require('firebase-admin');
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Check if user has admin role
      if (!decodedToken.role || decodedToken.role !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Admin access required'
        });
      }

      // Revoke admin tokens
      await admin.auth().revokeRefreshTokens(decodedToken.uid);

      logger.info(`Admin ${decodedToken.uid} logged out successfully`);

      res.json({
        success: true,
        message: 'Admin logout successful',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Admin logout error:', error);
      res.status(500).json({
        error: 'Admin logout failed',
        message: error.message
      });
    }
  }
};

module.exports = adminController;