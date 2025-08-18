const Content = require('./models/Content');
const Watchlist = require('./models/Watchlist');
const awsService = require('./services/awsService');
const logger = require('../../shared/utils/logger');
const { Op } = require('sequelize');
const { sequelize } = require('sequelize');
const db = require('./config/database');

const contentController = {
  async getAllContent(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type, 
        genre, 
        language,
        sortBy = 'createdAt',
        sortOrder = 'DESC' 
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { isActive: true };

      // Apply profile-based content filtering
      if (req.contentFilter) {
        if (req.contentFilter.excludeAdultContent) {
          whereClause.ageRating = {
            [Op.in]: ['G', 'PG', 'PG-13']
          };
        }

        if (req.contentFilter.allowedGenres) {
          if (genre) {
            // Check if requested genre is allowed for child profiles
            if (!req.contentFilter.allowedGenres.includes(genre)) {
              return res.status(403).json({
                success: false,
                error: 'Content type not allowed for child profile'
              });
            }
          }
          // Filter to only show child-appropriate genres
          whereClause.genre = {
            [Op.overlap]: req.contentFilter.allowedGenres
          };
        }
      }

      // Apply geo-restrictions
      if (req.geoFilter && req.userCountry) {
        const userCountry = req.userCountry;
        whereClause[Op.or] = [
          // Globally available content not restricted in user's country
          {
            isGloballyAvailable: true,
            [Op.not]: {
              restrictedCountries: {
                [Op.contains]: [userCountry]
              }
            }
          },
          // Content specifically available in user's country
          {
            isGloballyAvailable: false,
            availableCountries: {
              [Op.contains]: [userCountry]
            }
          }
        ];
      }

      if (type) whereClause.type = type;
      if (genre && !req.contentFilter) whereClause.genre = { [Op.contains]: [genre] };
      if (language) whereClause.language = language;

      const { count, rows: content } = await Content.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder]],
        attributes: [
          'id', 'title', 'description', 'type', 'genre', 
          'duration', 'releaseYear', 'rating', 'ageRating',
          'language', 'subtitles', 'cast', 'director',
          'thumbnailUrl', 'trailerUrl', 'status', 'views',
          'likes', 'averageRating', 'totalRatings', 'createdAt'
        ]
      });

      res.json({
        success: true,
        data: {
          content,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        },
        profileContext: req.activeProfile ? {
          profileId: req.activeProfile.id,
          isChildProfile: req.activeProfile.isChild
        } : null
      });
    } catch (error) {
      console.error('Get all content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch content'
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

      // Check geo-restrictions for single content
      if (req.geoFilter && !req.geoFilter.isContentAvailable(content)) {
        return res.status(403).json({
          error: 'Content not available in your region',
          message: 'This content is geo-restricted and not available in your country'
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
  },

  async getKidsContent(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type, 
        genre,
        sortBy = 'createdAt',
        sortOrder = 'DESC' 
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { 
        isActive: true,
        // Only kid-friendly age ratings
        ageRating: {
          [Op.in]: ['G', 'PG', 'PG-13']
        },
        // Only kid-friendly genres
        genre: {
          [Op.overlap]: ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy']
        }
      };

      if (type) whereClause.type = type;
      if (genre) {
        // Ensure requested genre is kid-friendly
        const kidFriendlyGenres = ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy'];
        if (kidFriendlyGenres.includes(genre)) {
          whereClause.genre = { [Op.contains]: [genre] };
        } else {
          return res.status(400).json({
            success: false,
            error: 'Requested genre is not available for kids content'
          });
        }
      }

      const { count, rows: content } = await Content.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder]],
        attributes: [
          'id', 'title', 'description', 'type', 'genre', 
          'duration', 'releaseYear', 'rating', 'ageRating',
          'language', 'subtitles', 'cast', 'director',
          'thumbnailUrl', 'trailerUrl', 'status', 'views',
          'likes', 'averageRating', 'totalRatings', 'createdAt'
        ]
      });

      res.json({
        success: true,
        data: {
          content,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        },
        contentType: 'kids-only',
        appliedFilters: {
          ageRatings: ['G', 'PG', 'PG-13'],
          allowedGenres: ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy']
        }
      });
    } catch (error) {
      console.error('Get kids content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch kids content'
      });
    }
  },

  async getSeriesDetails(req, res) {
    try {
      const { id } = req.params;
      const { includeEpisodes = true } = req.query;

      const Content = require('./models/Content');
      const Season = require('./models/Season');
      const Episode = require('./models/Episode');

      const seriesData = await Content.findOne({
        where: { 
          id, 
          type: 'series', 
          isActive: true 
        },
        include: [
          {
            model: Season,
            as: 'seasons',
            where: { isActive: true },
            required: false,
            order: [['seasonNumber', 'ASC']],
            include: includeEpisodes === 'true' ? [
              {
                model: Episode,
                as: 'episodes',
                where: { isActive: true },
                required: false,
                order: [['episodeNumber', 'ASC']],
                attributes: { exclude: ['s3Key'] }
              }
            ] : []
          }
        ]
      });

      if (!seriesData) {
        return res.status(404).json({
          success: false,
          error: 'Series not found'
        });
      }

      // Apply child profile filtering if needed
      if (req.contentFilter && req.contentFilter.excludeAdultContent) {
        const allowedRatings = ['G', 'PG', 'PG-13'];
        if (!allowedRatings.includes(seriesData.ageRating)) {
          return res.status(403).json({
            success: false,
            error: 'Content not available for child profiles'
          });
        }
      }

      res.json({
        success: true,
        data: seriesData
      });
    } catch (error) {
      console.error('Get series details error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch series details'
      });
    }
  },

  async getSeasonEpisodes(req, res) {
    try {
      const { seriesId, seasonNumber } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const Content = require('./models/Content');
      const Season = require('./models/Season');
      const Episode = require('./models/Episode');

      const offset = (page - 1) * limit;

      // Verify series exists and user has access
      const series = await Content.findOne({
        where: { 
          id: seriesId, 
          type: 'series', 
          isActive: true 
        }
      });

      if (!series) {
        return res.status(404).json({
          success: false,
          error: 'Series not found'
        });
      }

      // Apply child profile filtering
      if (req.contentFilter && req.contentFilter.excludeAdultContent) {
        const allowedRatings = ['G', 'PG', 'PG-13'];
        if (!allowedRatings.includes(series.ageRating)) {
          return res.status(403).json({
            success: false,
            error: 'Content not available for child profiles'
          });
        }
      }

      const season = await Season.findOne({
        where: { 
          seriesId, 
          seasonNumber: parseInt(seasonNumber), 
          isActive: true 
        },
        include: [
          {
            model: Episode,
            as: 'episodes',
            where: { isActive: true },
            required: false,
            limit: parseInt(limit),
            offset: offset,
            order: [['episodeNumber', 'ASC']],
            attributes: { exclude: ['s3Key'] }
          }
        ]
      });

      if (!season) {
        return res.status(404).json({
          success: false,
          error: 'Season not found'
        });
      }

      // Get total episodes count for pagination
      const totalEpisodes = await Episode.count({
        where: { 
          seasonId: season.id, 
          isActive: true 
        }
      });

      res.json({
        success: true,
        data: {
          season,
          pagination: {
            total: totalEpisodes,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalEpisodes / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get season episodes error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch season episodes'
      });
    }
  },

  async getEpisodeDetails(req, res) {
    try {
      const { episodeId } = req.params;

      const Episode = require('./models/Episode');
      const Season = require('./models/Season');
      const Content = require('./models/Content');

      const episode = await Episode.findOne({
        where: { 
          id: episodeId, 
          isActive: true 
        },
        include: [
          {
            model: Season,
            as: 'season',
            include: [
              {
                model: Content,
                as: 'series'
              }
            ]
          }
        ],
        attributes: { exclude: ['s3Key'] }
      });

      if (!episode) {
        return res.status(404).json({
          success: false,
          error: 'Episode not found'
        });
      }

      // Apply child profile filtering
      if (req.contentFilter && req.contentFilter.excludeAdultContent) {
        const allowedRatings = ['G', 'PG', 'PG-13'];
        if (!allowedRatings.includes(episode.season.series.ageRating)) {
          return res.status(403).json({
            success: false,
            error: 'Content not available for child profiles'
          });
        }
      }

      res.json({
        success: true,
        data: episode
      });
    } catch (error) {
      console.error('Get episode details error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch episode details'
      });
    }
  },

  async addToWatchlist(req, res) {
    try {
      const { contentId } = req.body;
      const profileId = req.activeProfile?.id;

      if (!profileId) {
        return res.status(401).json({
          success: false,
          error: 'Profile required',
          message: 'Please select a profile to add to watchlist'
        });
      }

      if (!contentId) {
        return res.status(400).json({
          success: false,
          error: 'Content ID required'
        });
      }

      // Check if content exists and is active
      const content = await Content.findOne({
        where: { 
          id: contentId, 
          isActive: true 
        }
      });

      if (!content) {
        return res.status(404).json({
          success: false,
          error: 'Content not found'
        });
      }

      // Apply content filtering for child profiles
      if (req.contentFilter && req.contentFilter.excludeAdultContent) {
        const allowedRatings = ['G', 'PG', 'PG-13'];
        if (!allowedRatings.includes(content.ageRating)) {
          return res.status(403).json({
            success: false,
            error: 'Content not available for child profiles'
          });
        }
      }

      // Check if already in watchlist
      const existingEntry = await Watchlist.findOne({
        where: { 
          profileId, 
          contentId 
        }
      });

      if (existingEntry) {
        return res.status(409).json({
          success: false,
          error: 'Content already in watchlist'
        });
      }

      // Add to watchlist
      const watchlistEntry = await Watchlist.create({
        profileId,
        contentId
      });

      res.status(201).json({
        success: true,
        message: 'Content added to watchlist successfully',
        data: {
          watchlistId: watchlistEntry.id,
          contentId,
          contentTitle: content.title,
          addedAt: watchlistEntry.addedAt
        }
      });
    } catch (error) {
      console.error('Add to watchlist error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add content to watchlist'
      });
    }
  },

  async removeFromWatchlist(req, res) {
    try {
      const { contentId } = req.params;
      const profileId = req.activeProfile?.id;

      if (!profileId) {
        return res.status(401).json({
          success: false,
          error: 'Profile required'
        });
      }

      const deletedRows = await Watchlist.destroy({
        where: { 
          profileId, 
          contentId 
        }
      });

      if (deletedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Content not found in watchlist'
        });
      }

      res.json({
        success: true,
        message: 'Content removed from watchlist successfully'
      });
    } catch (error) {
      console.error('Remove from watchlist error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove content from watchlist'
      });
    }
  },

  async getWatchlist(req, res) {
    try {
      const profileId = req.activeProfile?.id;
      const { 
        page = 1, 
        limit = 20, 
        type,
        sortBy = 'addedAt',
        sortOrder = 'DESC' 
      } = req.query;

      if (!profileId) {
        return res.status(401).json({
          success: false,
          error: 'Profile required'
        });
      }

      const offset = (page - 1) * limit;
      const whereClause = { isActive: true };

      // Apply content filtering for child profiles
      if (req.contentFilter && req.contentFilter.excludeAdultContent) {
        whereClause.ageRating = {
          [Op.in]: ['G', 'PG', 'PG-13']
        };
      }

      if (type) whereClause.type = type;

      const { count, rows: watchlistItems } = await Watchlist.findAndCountAll({
        where: { profileId },
        include: [
          {
            model: Content,
            as: 'content',
            where: whereClause,
            attributes: [
              'id', 'title', 'description', 'type', 'genre', 
              'duration', 'releaseYear', 'rating', 'ageRating',
              'language', 'thumbnailUrl', 'trailerUrl', 'status',
              'views', 'likes', 'averageRating', 'totalRatings',
              'posterImages', 'characters'
            ]
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder]],
        distinct: true
      });

      res.json({
        success: true,
        data: {
          watchlist: watchlistItems.map(item => ({
            watchlistId: item.id,
            addedAt: item.addedAt,
            content: item.content
          })),
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        },
        profileContext: {
          profileId: profileId,
          isChildProfile: req.activeProfile?.isChild || false
        }
      });
    } catch (error) {
      console.error('Get watchlist error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch watchlist'
      });
    }
  },

  async checkWatchlistStatus(req, res) {
    try {
      const { contentId } = req.params;
      const profileId = req.activeProfile?.id;

      if (!profileId) {
        return res.status(401).json({
          success: false,
          error: 'Profile required'
        });
      }

      const watchlistEntry = await Watchlist.findOne({
        where: { 
          profileId, 
          contentId 
        }
      });

      res.json({
        success: true,
        data: {
          inWatchlist: !!watchlistEntry,
          addedAt: watchlistEntry?.addedAt || null
        }
      });
    } catch (error) {
      console.error('Check watchlist status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check watchlist status'
      });
    }
  },

  // Admin functions
  async getContent(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type, 
        genre, 
        status,
        sortBy = 'createdAt',
        sortOrder = 'DESC' 
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      if (type) whereClause.type = type;
      if (genre) whereClause.genre = { [Op.contains]: [genre] };
      if (status) whereClause.status = status;

      const { count, rows: content } = await Content.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder]],
        attributes: [
          'id', 'title', 'description', 'type', 'genre', 
          'duration', 'releaseYear', 'rating', 'ageRating',
          'language', 'subtitles', 'cast', 'director',
          'thumbnailUrl', 'trailerUrl', 'status', 'views',
          'likes', 'averageRating', 'totalRatings', 'createdAt',
          'isActive', 'isGloballyAvailable', 'availableCountries',
          'restrictedCountries'
        ]
      });

      res.json({
        success: true,
        data: {
          content,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Admin get content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch content for admin'
      });
    }
  },

  async getContentStatistics(req, res) {
    try {
      const totalContent = await Content.count({
        where: { isActive: true }
      });

      const totalMovies = await Content.count({
        where: { type: 'movie', isActive: true }
      });

      const totalSeries = await Content.count({
        where: { type: 'series', isActive: true }
      });

      const totalViews = await Content.sum('views', {
        where: { isActive: true }
      }) || 0;

      const averageRating = await Content.findOne({
        attributes: [
          [db.sequelize.fn('AVG', db.sequelize.col('averageRating')), 'avgRating']
        ],
        where: { 
          isActive: true,
          averageRating: { [Op.gt]: 0 }
        }
      });

      const topGenres = await Content.findAll({
        attributes: [
          [db.sequelize.fn('UNNEST', db.sequelize.col('genre')), 'genre'],
          [db.sequelize.fn('COUNT', '*'), 'count']
        ],
        where: { isActive: true },
        group: [db.sequelize.fn('UNNEST', db.sequelize.col('genre'))],
        order: [[db.sequelize.fn('COUNT', '*'), 'DESC']],
        limit: 10,
        raw: true
      });

      res.json({
        success: true,
        data: {
          overview: {
            totalContent,
            totalMovies,
            totalSeries,
            totalViews,
            averageRating: parseFloat(averageRating?.getDataValue('avgRating') || 0).toFixed(2)
          },
          topGenres: topGenres || []
        }
      });
    } catch (error) {
      logger.error('Content statistics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch content statistics'
      });
    }
  }
};

module.exports = contentController;