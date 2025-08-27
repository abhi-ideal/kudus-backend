const { Op } = require('sequelize');
const sequelize = require('./config/database');
const logger = require('./utils/logger');
const Content = require('./models/Content');
const Season = require('./models/Season');
const Episode = require('./models/Episode');
const Watchlist = require('./models/Watchlist');
const WatchHistory = require('./models/WatchHistory');
const ContentItem = require('./models/ContentItem');
const ContentItemMapping = require('./models/ContentItemMapping');

// Initialize associations
const models = { Content, ContentItem, ContentItemMapping, Episode, Season, Watchlist, WatchHistory };
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

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

      // Apply profile-based content filtering for child profiles
      if (req.contentFilter && req.contentFilter.enforceChildSafety) {
        // Strict age rating filtering for child profiles
        whereClause.ageRating = {
          [Op.in]: req.contentFilter.allowedAgeRatings
        };

        // Enforce child-appropriate genres only
        whereClause.genre = {
          [Op.overlap]: req.contentFilter.allowedGenres
        };

        // Check if requested genre is allowed for child profiles
        if (genre && !req.contentFilter.allowedGenres.includes(genre)) {
          return res.status(403).json({
            success: false,
            error: 'Content type not allowed for child profile',
            requestedGenre: genre,
            allowedGenres: req.contentFilter.allowedGenres
          });
        }
      }

      // Apply geo-restrictions
      if (req.geoFilter && req.userCountry) {
        const userCountry = req.userCountry;
        whereClause[Op.or] = [
          // Globally available content not restricted in user's country
          {
            isGloballyAvailable: true,
            restrictedCountries: {
              [Op.notLike]: `%${userCountry}%`
            }
          },
          // Content specifically available in user's country
          {
            isGloballyAvailable: false,
            availableCountries: {
              [Op.like]: `%${userCountry}%`
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
          'thumbnailUrl', 'trailerUrl', 'status', 'createdAt'
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
        attributes: { exclude: ['s3Key', 'videoQualities'] },
        include: [
          {
            model: Season,
            as: 'seasons',
            where: { isActive: true },
            required: false,
            order: [['seasonNumber', 'ASC']],
            include: [
              {
                model: Episode,
                as: 'episodes',
                where: { isActive: true },
                required: false,
                order: [['episodeNumber', 'ASC']],
                attributes: {
                  exclude: ['s3Key']
                },
                include: req.activeProfile?.id ? [
                  {
                    model: models.WatchHistory,
                    as: 'watchHistory',
                    where: {
                      profileId: req.activeProfile.id
                    },
                    required: false,
                    order: [['watchedAt', 'DESC']],
                    limit: 1,
                    attributes: ['id', 'watchedAt', 'watchDuration', 'totalDuration', 'progressPercentage', 'isCompleted']
                  }
                ] : []
              }
            ]
          }
        ]
      });

      if (!content || !content.isActive) {
        return res.status(404).json({
          error: 'Content not found'
        });
      }

      // Apply child profile filtering if needed
      if (req.contentFilter && req.contentFilter.excludeAdultContent) {
        const allowedRatings = ['G', 'PG', 'PG-13'];
        if (!allowedRatings.includes(content.ageRating)) {
          return res.status(403).json({
            success: false,
            error: 'Content not available for child profiles'
          });
        }
      }

      // Add streaming session information if profile is provided
      let streamingInfo = null;
      if (req.activeProfile?.id) {
        // Get current streaming session info (you may need to adjust this based on your streaming service)
        streamingInfo = {
          hasActiveSession: false, // This would come from streaming service
          lastWatchPosition: 0,    // This would come from watch history
          availableQualities: ['480p', '720p', '1080p', '4K'], // Default qualities
          profileId: req.activeProfile.id
        };
      }

      // Format response with additional metadata
      const response = {
        success: true,
        data: {
          ...content.toJSON(),
          streamingInfo,
          totalSeasons: content.seasons ? content.seasons.length : 0,
          totalEpisodes: content.seasons
            ? content.seasons.reduce((total, season) => total + (season.episodes?.length || 0), 0)
            : 0,
          contentType: content.type,
          isSeriesComplete: content.type === 'series'
            ? content.seasons?.every(season => season.status === 'completed')
            : null
        },
        profileContext: req.activeProfile ? {
          profileId: req.activeProfile.id,
          isChildProfile: req.activeProfile.isChild || false
        } : null
      };

      res.json(response);
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
        // Only kid-friendly genres - use JSON overlap for array fields
        genre: {
          [Op.overlap]: ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy']
        }
      };

      // Apply geo-restrictions if applicable
      if (req.geoFilter && req.userCountry) {
        const userCountry = req.userCountry;
        whereClause[Op.or] = [
          {
            isGloballyAvailable: true,
            [Op.not]: sequelize.literal(`JSON_CONTAINS(restrictedCountries, '"${userCountry}"')`)
          },
          {
            isGloballyAvailable: false,
            [Op.and]: sequelize.literal(`JSON_CONTAINS(availableCountries, '"${userCountry}"')`)
          }
        ];
      }

      if (type) whereClause.type = type;

      if (genre) {
        // Ensure requested genre is kid-friendly
        const kidFriendlyGenres = ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy'];
        if (kidFriendlyGenres.includes(genre)) {
          whereClause.genre = {
            [Op.contains]: [genre]
          };
        } else {
          return res.status(400).json({
            success: false,
            error: 'Requested genre is not available for kids content',
            allowedGenres: kidFriendlyGenres
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
          'thumbnailUrl', 'trailerUrl', 'status', 'createdAt'
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
          allowedGenres: ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy'],
          excludedGenres: ['Horror', 'Thriller', 'Crime', 'Drama', 'Romance']
        }
      });
    } catch (error) {
      logger.error('Get kids content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch kids content',
        message: error.message
      });
    }
  },

  async getSeriesDetails(req, res) {
    try {
      const { id } = req.params;
      const { includeEpisodes = true } = req.query;

      // Re-importing models here is not ideal, they should be loaded once at the top.
      // Keeping it as per the original code for now, but this is a point for refactoring.
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

      // Re-importing models here is not ideal, they should be loaded once at the top.
      // Keeping it as per the original code for now, but this is a point for refactoring.
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
            attributes: { exclude: ['s3Key'] },
            include: req.activeProfile?.id ? [
              {
                model: models.WatchHistory,
                as: 'watchHistory',
                where: {
                  profileId: req.activeProfile.id
                },
                required: false,
                order: [['watchedAt', 'DESC']],
                limit: 1,
                attributes: ['id', 'watchedAt', 'watchDuration', 'totalDuration', 'progressPercentage', 'isCompleted']
              }
            ] : []
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

      // Re-importing models here is not ideal, they should be loaded once at the top.
      // Keeping it as per the original code for now, but this is a point for refactoring.
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
          },
          ...(req.activeProfile?.id ? [
            {
              model: models.WatchHistory,
              as: 'watchHistory',
              where: {
                profileId: req.activeProfile.id,
                episodeId: episodeId
              },
              required: false,
              order: [['watchedAt', 'DESC']],
              limit: 1,
              attributes: ['id', 'watchedAt', 'watchDuration', 'totalDuration', 'progressPercentage', 'isCompleted']
            }
          ] : [])
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
        limit = 10,
        type,
        genre,
        ageRating,
        search,
        isActive = true
      } = req.query;

      const offset = (page - 1) * limit;
      const where = { isActive };

      // Add filters
      if (type) {
        const typeArray = type.split(',').map(t => t.trim());
        where.type = { [Op.in]: typeArray };
      }

      if (genre) {
        const genreArray = genre.split(',').map(g => g.trim());
        // Use MySQL JSON_CONTAINS for genre filtering
        const genreConditions = genreArray.map(g =>
          `JSON_CONTAINS(genre, JSON_QUOTE('${g}'))`
        );

        if (where[Op.and]) {
          where[Op.and].push(sequelize.literal(`(${genreConditions.join(' OR ')})`));
        } else {
          where[Op.and] = [sequelize.literal(`(${genreConditions.join(' OR ')})`)];
        }
      }

      if (ageRating) {
        const ageRatingArray = ageRating.split(',').map(r => r.trim());
        where.ageRating = { [Op.in]: ageRatingArray };
      }

      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Content.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Season,
            as: 'seasons',
            required: false,
            include: [
              {
                model: Episode,
                as: 'episodes',
                required: false
              }
            ]
          }
        ]
      });

      res.json({
        success: true,
        content: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Get content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve content'
      });
    }
  },

  async getContentGroupedByItems(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const ContentItem = require('./models/ContentItem');

      // Get items with their associated content (max 10 per item)
      const items = await ContentItem.findAll({
        where: { isActive: true },
        limit: parseInt(limit),
        offset: offset,
        order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']],
        include: [
          {
            model: Content,
            as: 'content',
            through: {
              attributes: ['displayOrder', 'isFeatured'],
              where: {}
            },
            where: { isActive: true },
            required: false, // Include items even if they have no content
            attributes: [
              'id', 'title', 'description', 'type', 'genre',
              'duration', 'releaseYear', 'rating', 'ageRating',
              'language', 'subtitles', 'cast', 'director',
              'thumbnailUrl', 'posterImages', 'trailerUrl',
              'status', 'createdAt'
            ]
          }
        ]
      });

      // Get total count for pagination
      const totalItems = await ContentItem.count({
        where: { isActive: true }
      });

      // Process items to ensure max 10 content per item and apply filters
      let filteredItems = items.map(item => {
        let content = item.content || [];

        // Sort content by featured status and display order
        content = content.sort((a, b) => {
          const aMapping = a.ContentItemMapping || {};
          const bMapping = b.ContentItemMapping || {};

          // Featured content first
          if (aMapping.isFeatured && !bMapping.isFeatured) return -1;
          if (!aMapping.isFeatured && bMapping.isFeatured) return 1;

          // Then by display order
          return (aMapping.displayOrder || 0) - (bMapping.displayOrder || 0);
        });

        // Apply profile-based filters if applicable
        if (req.contentFilter && req.contentFilter.excludeAdultContent) {
          content = content.filter(content =>
            ['G', 'PG', 'PG-13'].includes(content.ageRating) &&
            content.genre.some(g => req.contentFilter.allowedGenres.includes(g))
          );
        }

        // Limit to 10 content per item
        content = content.slice(0, 10);

        return {
          ...item.toJSON(),
          content: content.map(c => ({
            ...c.toJSON(),
            isFeatured: c.ContentItemMapping?.isFeatured || false,
            displayOrder: c.ContentItemMapping?.displayOrder || 0
          }))
        };
      });

      res.json({
        success: true,
        data: {
          items: filteredItems,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalItems / limit),
            totalItems: totalItems,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get content grouped by items error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve content grouped by items',
        message: error.message
      });
    }
  },

  async getContinueWatching(req, res) {
    try {
      const profileId = req.activeProfile?.id;
      const {
        page = 1,
        limit = 20,
        sortBy = 'watchedAt',
        sortOrder = 'DESC'
      } = req.query;

      if (!profileId) {
        return res.status(401).json({
          success: false,
          error: 'Profile required'
        });
      }

      const offset = (page - 1) * limit;

      // Get watch history where content is not completed
      const continueWatchingData = await WatchHistory.findAndCountAll({
        where: {
          profileId,
          isCompleted: false,
          progressPercentage: {
            [Op.gt]: 0, // Only show content that has been started
            [Op.lt]: 95 // Consider 95%+ as completed
          }
        },
        include: [
          {
            model: Content,
            as: 'content',
            where: { isActive: true },
            attributes: [
              'id', 'title', 'description', 'type', 'genre',
              'duration', 'releaseYear', 'rating', 'ageRating',
              'language', 'thumbnailUrl', 'trailerUrl', 'status'
            ],
            include: req.contentFilter && req.contentFilter.excludeAdultContent ? [] : []
          },
          {
            model: Episode,
            as: 'episode',
            required: false,
            where: { isActive: true },
            attributes: [
              'id', 'title', 'episodeNumber', 'seasonId', 'seriesId',
              'duration', 'thumbnailUrl', 'description'
            ],
            include: [
              {
                model: Season,
                as: 'season',
                attributes: ['id', 'seasonNumber', 'title']
              }
            ]
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder]],
        distinct: true
      });

      // Apply content filtering for child profiles
      let filteredData = continueWatchingData.rows;
      if (req.contentFilter && req.contentFilter.excludeAdultContent) {
        filteredData = filteredData.filter(item => {
          const content = item.content;
          return content &&
                 ['G', 'PG', 'PG-13'].includes(content.ageRating) &&
                 content.genre.some(g => req.contentFilter.allowedGenres.includes(g));
        });
      }

      // Format response data
      const continueWatchingList = filteredData.map(item => {
        const baseData = {
          watchHistoryId: item.id,
          contentId: item.contentId,
          watchedAt: item.watchedAt,
          watchDuration: item.watchDuration,
          totalDuration: item.totalDuration,
          progressPercentage: parseFloat(item.progressPercentage),
          deviceType: item.deviceType,
          content: item.content
        };

        // Add episode information if it's a series
        if (item.episodeId && item.episode) {
          baseData.episode = {
            id: item.episode.id,
            title: item.episode.title,
            episodeNumber: item.episode.episodeNumber,
            duration: item.episode.duration,
            thumbnailUrl: item.episode.thumbnailUrl,
            description: item.episode.description,
            season: item.episode.season
          };
          baseData.resumeType = 'episode';
        } else {
          baseData.resumeType = 'movie';
        }

        return baseData;
      });

      res.json({
        success: true,
        data: {
          continueWatching: continueWatchingList,
          pagination: {
            total: continueWatchingData.count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(continueWatchingData.count / limit)
          }
        },
        profileContext: {
          profileId: profileId,
          isChildProfile: req.activeProfile?.isChild || false
        }
      });
    } catch (error) {
      logger.error('Get continue watching error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch continue watching list',
        message: error.message
      });
    }
  },

  async getContentStatistics(req, res) {
    try {
      const Content = require('./models/Content');
      const WatchHistory = require('./models/WatchHistory');

      // Get total content count
      const totalContent = await Content.count({
        where: { isActive: true }
      });

      // Get content by type
      const contentByType = await Content.findAll({
        where: { isActive: true },
        attributes: [
          'type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['type']
      });

      // Get total views from watch history
      const totalViews = await WatchHistory.count();

      // Get top genres (requires JSON handling)
      const topGenres = await sequelize.query(`
        SELECT 
          genre_item,
          COUNT(*) as count
        FROM (
          SELECT JSON_UNQUOTE(JSON_EXTRACT(genre, CONCAT('$[', numbers.n, ']'))) as genre_item
          FROM content
          CROSS JOIN (
            SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
          ) numbers
          WHERE JSON_EXTRACT(genre, CONCAT('$[', numbers.n, ']')) IS NOT NULL
          AND isActive = true
        ) genre_extracted
        WHERE genre_item IS NOT NULL
        GROUP BY genre_item
        ORDER BY count DESC
        LIMIT 10
      `, { type: sequelize.QueryTypes.SELECT });

      const stats = {
        totalContent,
        contentByType: contentByType.reduce((acc, item) => {
          acc[item.type] = parseInt(item.dataValues.count);
          return acc;
        }, {}),
        totalViews,
        topGenres: topGenres || []
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Get content statistics error:', error);
      res.status(500).json({
        error: 'Failed to retrieve content statistics',
        message: error.message
      });
    }
  },

  async getFeaturedContent(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        genre,
        language
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {
        isFeatured: true,
        isActive: true
      };

      // Apply geo-restriction filter if available
      if (req.geoFilter && req.geoFilter.restrictedContent) {
        where.id = { [Op.notIn]: req.geoFilter.restrictedContent };
      }

      // Apply filters
      if (type) {
        const typeArray = type.split(',');
        where.type = { [Op.in]: typeArray };
      }

      if (genre) {
        const genreArray = genre.split(',').map(g => g.trim());
        const genreConditions = genreArray.map(g => 
          `JSON_CONTAINS(genre, JSON_QUOTE('${g}'))`
        );

        if (where[Op.and]) {
          where[Op.and].push(sequelize.literal(`(${genreConditions.join(' OR ')})`));
        } else {
          where[Op.and] = [sequelize.literal(`(${genreConditions.join(' OR ')})`)];
        }
      }

      if (language) {
        where.language = language;
      }

      const { count, rows } = await Content.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['featuredAt', 'DESC']],
        include: [
          {
            model: Season,
            as: 'seasons',
            where: { isActive: true },
            required: false,
            include: [{
              model: Episode,
              as: 'episodes',
              where: { isActive: true },
              required: false
            }]
          }
        ]
      });

      // Apply child profile filtering if needed
      let filteredRows = rows;
      if (req.contentFilter && req.contentFilter.excludeAdultContent) {
        filteredRows = rows.filter(content =>
          ['G', 'PG', 'PG-13'].includes(content.ageRating) &&
          content.genre.some(g => req.contentFilter.allowedGenres.includes(g))
        );
      }

      res.json({
        success: true,
        data: {
          featuredContent: filteredRows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get featured content error:', error);
      res.status(500).json({
        error: 'Failed to retrieve featured content',
        message: error.message
      });
    }
  },
};

module.exports = contentController;