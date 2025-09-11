const { Op, Sequelize } = require('sequelize');
const { Content, ContentItem, ContentItemMapping, Watchlist, WatchHistory, ContentLike, Season, Episode } = require('./models');
const adminEndpoints = require('./utils/adminRoutes');
const sequelize = require('./config/database');
const logger = require('./utils/logger');

// Initialize associations only once
const models = { Content, ContentItem, ContentItemMapping, Episode, Season, Watchlist, WatchHistory, ContentLike };

// Check if associations are already initialized to prevent duplicates
if (!Content.associations || Object.keys(Content.associations).length === 0) {
  Object.keys(models).forEach(modelName => {
    if (models[modelName].associate && typeof models[modelName].associate === 'function') {
      models[modelName].associate(models);
    }
  });
}

const contentController = {
  // Get all content with pagination and filtering
  async getAllContent(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        genre,
        language,
        ageRating,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { isActive: true };

      // Apply child profile filtering based on token
      if (req.activeProfile && req.activeProfile.isChild === true) {
        whereClause.ageRating = { [Op.in]: ['G', 'PG', 'PG-13'] };

        // Add genre filter for child profiles
        const allowedGenres = ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy'];
        const allowedGenreConditions = allowedGenres.map(g => 
          `JSON_CONTAINS(genre, JSON_QUOTE('${g}'))`
        );

        if (whereClause[Op.and]) {
          whereClause[Op.and].push(sequelize.literal(`(${allowedGenreConditions.join(' OR ')})`));
        } else {
          whereClause[Op.and] = [sequelize.literal(`(${allowedGenreConditions.join(' OR ')})`)];
        }
      }

      // Add comprehensive search functionality with relevance
      if (search && search.trim().length > 0) {
        const searchTerm = search.trim();

        const searchConditions = [
          { title: { [Op.like]: `%${searchTerm}%` } },
          { description: { [Op.like]: `%${searchTerm}%` } },
          { director: { [Op.like]: `%${searchTerm}%` } },
          { type: { [Op.like]: `%${searchTerm}%` } }
        ];

        // Search in JSON fields (cast, genre, subtitles, characters)
        if (sequelize.getDialect() === 'mysql') {
          searchConditions.push(
            // Search in cast array
            sequelize.literal(`JSON_SEARCH(LOWER(cast), 'one', '%${searchTerm.toLowerCase()}%') IS NOT NULL`),
            // Search in genre array
            sequelize.literal(`JSON_SEARCH(LOWER(genre), 'one', '%${searchTerm.toLowerCase()}%') IS NOT NULL`),
            // Search in subtitles
            sequelize.literal(`JSON_SEARCH(LOWER(subtitles), 'one', '%${searchTerm.toLowerCase()}%') IS NOT NULL`),
            // Search in characters (if exists)
            sequelize.literal(`JSON_SEARCH(LOWER(characters), 'one', '%${searchTerm.toLowerCase()}%') IS NOT NULL`)
          );
        }

        if (whereClause[Op.and]) {
          whereClause[Op.and].push({ [Op.or]: searchConditions });
        } else {
          whereClause[Op.and] = [{ [Op.or]: searchConditions }];
        }
      }

      // Apply filters
      if (type) {
        whereClause.type = type;
      }

      if (genre) {
        const genres = genre.split(',').map(g => g.trim());
        const genreConditions = genres.map(g => 
          `JSON_CONTAINS(genre, JSON_QUOTE('${g}'))`
        );

        if (whereClause[Op.and]) {
          whereClause[Op.and].push(sequelize.literal(`(${genreConditions.join(' OR ')})`));
        } else {
          whereClause[Op.and] = [sequelize.literal(`(${genreConditions.join(' OR ')})`)];
        }
      }

      if (language) {
        whereClause.language = language;
      }

      if (ageRating) {
        whereClause.ageRating = ageRating;
      }

      // Check geo restrictions
      if (req.userCountry && req.userCountry !== 'US') {
        const geoCondition = {
          [Op.or]: [
            { availableCountries: { [Op.is]: null } },
            { availableCountries: { [Op.contains]: [req.userCountry] } }
          ]
        };

        if (whereClause[Op.and]) {
          whereClause[Op.and].push(geoCondition);
        } else {
          whereClause[Op.and] = [geoCondition];
        }
      }

      // Determine order clause - use relevance scoring if searching
      let orderClause;
      if (search && search.trim().length > 0 && sortBy === 'createdAt') {
        const searchTerm = search.trim();
        const relevanceScore = `
          CASE 
            WHEN LOWER(title) LIKE '%${searchTerm.toLowerCase()}%' THEN 8
            WHEN JSON_SEARCH(LOWER(subtitles), 'one', '%${searchTerm.toLowerCase()}%') IS NOT NULL THEN 7
            WHEN JSON_SEARCH(LOWER(cast), 'one', '%${searchTerm.toLowerCase()}%') IS NOT NULL THEN 6
            WHEN JSON_SEARCH(LOWER(characters), 'one', '%${searchTerm.toLowerCase()}%') IS NOT NULL THEN 5
            WHEN LOWER(director) LIKE '%${searchTerm.toLowerCase()}%' THEN 4
            WHEN LOWER(description) LIKE '%${searchTerm.toLowerCase()}%' THEN 3
            WHEN LOWER(type) LIKE '%${searchTerm.toLowerCase()}%' THEN 2
            WHEN JSON_SEARCH(LOWER(genre), 'one', '%${searchTerm.toLowerCase()}%') IS NOT NULL THEN 1
            ELSE 0
          END
        `;

        orderClause = [
          [sequelize.literal(relevanceScore), 'DESC'],
          [sortBy, sortOrder.toUpperCase()]
        ];
      } else {
        orderClause = [[sortBy, sortOrder.toUpperCase()]];
      }

      const { count, rows: content } = await Content.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: orderClause,
        attributes: {
          exclude: ['streamingUrl', 'downloadUrl']
        }
      });

      const totalPages = Math.ceil(count / limit);

      // Add search highlights if search term is provided
      let processedContent = content;
      if (search && search.trim().length > 0) {
        const searchTerm = search.trim();
        const highlightText = (text) => {
          if (!text) return text;
          const regex = new RegExp(`(${searchTerm})`, 'gi');
          return text.replace(regex, '<mark>$1</mark>');
        };

        processedContent = content.map(item => {
          const contentData = item.toJSON();
          contentData.highlightedTitle = highlightText(contentData.title);
          contentData.highlightedDescription = highlightText(contentData.description);
          return contentData;
        });
      }

      res.json({
        success: true,
        data: {
          content: processedContent,
          searchQuery: search || null,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit),
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
          }
        },
        profileContext: req.activeProfile ? {
          profileId: req.activeProfile.id,
          isChildProfile: req.activeProfile.isChild || false
        } : null,
        appliedFilters: {
          search: search || null,
          type: type || null,
          genre: genre || null,
          language: language || null,
          ageRating: ageRating || null,
          childProfileFilter: req.activeProfile?.isChild || false
        }
      });
    } catch (error) {
      logger.error('Error getting all content:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve content'
      });
    }
  },

  async getContentById(req, res) {
    try {
      const { id } = req.params;

      const content = await Content.findOne({
        where: {
          id,
          isActive: true
        },
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
                    as: 'episodeWatchHistory',
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

      // Check like status if profile is provided
      let likeStatus = null;
      if (req.activeProfile?.id) {
        const contentLike = await ContentLike.findOne({
          where: {
            profileId: req.activeProfile.id,
            contentId: id
          }
        });

        likeStatus = {
          isLiked: !!contentLike,
          likedAt: contentLike?.likedAt || null
        };
      }

      // Format response with additional metadata
      const response = {
        success: true,
        data: {
          ...content.toJSON(),
          streamingInfo,
          likeStatus,
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
                as: 'episodeWatchHistory',
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
              as: 'episodeWatchHistory',
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

  // Admin content management - includes inactive content
  async getContent(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        genre,
        ageRating,
        language,
        isActive,
        search,
        featured,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Apply filters
      if (type) {
        const typeArray = type.split(',');
        where.type = { [Op.in]: typeArray };
      }

      if (genre) {
        const genreArray = genre.split(',').map(g => g.trim());
        // Use raw SQL with proper MySQL JSON syntax
        const genreConditions = genreArray.map(g => 
          `JSON_CONTAINS(genre, JSON_QUOTE('${g}'))`
        );

        // Add as a raw where condition
        if (where[Op.and]) {
          where[Op.and].push(sequelize.literal(`(${genreConditions.join(' OR ')})`));
        } else {
          where[Op.and] = [sequelize.literal(`(${genreConditions.join(' OR ')})`)];
        }
      }

      if (ageRating) {
        const ageRatingArray = ageRating.split(',').map(ar => ar.trim());
        where.ageRating = { [Op.in]: ageRatingArray };
      }

      if (language) where.language = language;
      if (isActive !== undefined) where.isActive = isActive === 'true';
      if (featured !== undefined) {
        if (featured === 'featured') {
          where.featuredAt = { [Op.not]: null };
        } else if (featured === 'not-featured') {
          where.featuredAt = null;
        }
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
        order: [[sortBy, sortOrder]],
        include: [
          {
            model: Season,
            as: 'seasons',
            include: [{ model: Episode, as: 'episodes' }]
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
          pages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Get admin content error:', error);
      res.status(500).json({
        error: 'Failed to retrieve content',
        message: error.message
      });
    }
  },

  // Admin-only CRUD operations for Content Items
  async createContentItem(req, res) {
    try {
      const { name, description, isActive = true, displayOrder = 0 } = req.body;

      // Generate slug from name
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const contentItem = await ContentItem.create({
        name,
        slug,
        description,
        isActive,
        displayOrder
      });

      logger.info(`Admin created content item: ${contentItem.id}`);

      res.status(201).json({
        success: true,
        message: 'Content item created successfully',
        data: contentItem
      });
    } catch (error) {
      logger.error('Create content item error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create content item',
        message: error.message
      });
    }
  },

  async getAllContentItems(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        active,
        sortBy = 'displayOrder',
        sortOrder = 'ASC'
      } = req.query;

      // Handle offset parameter
      const offset = req.query.offset ? parseInt(req.query.offset) : (page - 1) * limit;
      const where = {};

      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      // Handle active filter
      if (active !== undefined && active !== 'all') {
        where.isActive = active === 'true';
      }

      const { count, rows: contentItems } = await ContentItem.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['displayOrder', 'ASC'], ['name', 'ASC']],
        attributes: ['id', 'name', 'slug', 'description', 'displayOrder', 'showOnChildProfile', 'isActive', 'createdAt', 'updatedAt'],
        distinct: true
      });

      res.json({
        success: true,
        items: contentItems,
        total: count,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Get all content items error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve content items',
        message: error.message
      });
    }
  },

  async getContentItemById(req, res) {
    try {
      const { id } = req.params;

      const contentItem = await ContentItem.findByPk(id, {
        include: [{
          model: ContentItemMapping,
          as: 'itemMappings',
          include: [{
            model: Content,
            as: 'content'
          }]
        }]
      });

      if (!contentItem) {
        return res.status(404).json({
          success: false,
          error: 'Content item not found'
        });
      }

      res.json({
        success: true,
        data: contentItem
      });
    } catch (error) {
      logger.error('Get content item by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve content item',
        message: error.message
      });
    }
  },

  async updateContentItem(req, res) {
    try {
      const { id } = req.params;
      const { name, description, isActive, displayOrder } = req.body;

      logger.info(`Attempting to update content item with ID: ${id}`);
      logger.info(`Request body:`, req.body);

      const contentItem = await ContentItem.findByPk(id);

      if (!contentItem) {
        logger.warn(`Content item not found with ID: ${id}`);
        return res.status(404).json({
          success: false,
          error: 'Content item not found',
          providedId: id
        });
      }

      const updateData = {};
      if (name !== undefined) {
        updateData.name = name;
        updateData.slug = name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

      logger.info(`Updating content item with data:`, updateData);

      await contentItem.update(updateData);

      // Reload to get updated data
      await contentItem.reload();

      logger.info(`Successfully updated content item: ${id}`);

      res.json({
        success: true,
        message: 'Content item updated successfully',
        data: contentItem
      });
    } catch (error) {
      logger.error('Update content item error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update content item',
        message: error.message
      });
    }
  },

  async deleteContentItem(req, res) {
    try {
      const { id } = req.params;

      const contentItem = await ContentItem.findByPk(id);

      if (!contentItem) {
        return res.status(404).json({
          success: false,
          error: 'Content item not found'
        });
      }

      // Soft delete by setting isActive to false
      await contentItem.update({ isActive: false });

      logger.info(`Admin deleted content item: ${id}`);

      res.json({
        success: true,
        message: 'Content item deleted successfully'
      });
    } catch (error) {
      logger.error('Delete content item error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete content item',
        message: error.message
      });
    }
  },

  async getContentGroupedByItems(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        genre,
        type,
        sortBy = 'displayOrder',
        sortOrder = 'ASC'
      } = req.query;

      const offset = (page - 1) * limit;
      const profileId = req.activeProfile?.id;

      // Build content where clause for filtering
      const contentWhere = { isActive: true };

      // Apply genre and type filters to content
      if (genre) {
        const genreArray = genre.split(',').map(g => g.trim());
        // Use proper JSON syntax for MySQL
        const genreConditions = genreArray.map(g => 
          `JSON_CONTAINS(genre, JSON_QUOTE('${g}'))`
        );
        contentWhere[Op.and] = [sequelize.literal(`(${genreConditions.join(' OR ')})`)];
      }

      if (type) {
        const typeArray = type.split(',');
        contentWhere.type = { [Op.in]: typeArray };
      }

      // For child profiles, add content filtering
      if (req.contentFilter && req.contentFilter.excludeAdultContent) {
        contentWhere.ageRating = { [Op.in]: ['G', 'PG', 'PG-13'] };
      }

      // Build where clause for content items
      const itemWhere = { isActive: true };

      console.log('Content filter:', req.contentFilter);
      console.log('Exclude adult content:', req.contentFilter?.excludeAdultContent);
      console.log('Active profile is child:', req.activeProfile?.isChild);

      // For child profiles, only show items marked for child profiles
      if (req.activeProfile && req.activeProfile.isChild === true) {
        itemWhere.showOnChildProfile = true;
        console.log('Applied child profile filter - showOnChildProfile: true');
      }

      // Get content items with their mappings and content
      const contentItems = await ContentItem.findAll({
        where: itemWhere,
        order: [[sortBy, sortOrder]],
        attributes: ['id', 'name', 'slug', 'description', 'displayOrder', 'showOnChildProfile', 'isActive', 'createdAt', 'updatedAt'],
        include: [{
          model: ContentItemMapping,
          as: 'itemMappings',
          required: false,
          include: [{
            model: Content,
            as: 'content',
            where: contentWhere,
            required: true,
            attributes: [
              'id', 'title', 'description', 'type', 'genre',
              'duration', 'releaseYear', 'rating', 'ageRating',
              'language', 'thumbnailUrl', 'posterImages', 'trailerUrl',
              'status', 'createdAt'
            ]
          }],
          order: [['displayOrder', 'ASC']],
          limit: 10
        }]
      });

      // Get user's liked content and watchlist if profile exists
      let userLikes = [];
      let userWatchlist = [];

      if (profileId) {
        const [likes, watchlist] = await Promise.all([
          ContentLike.findAll({
            where: { profileId },
            attributes: ['contentId']
          }),
          Watchlist.findAll({
            where: { profileId },
            attributes: ['contentId']
          })
        ]);

        userLikes = likes.map(like => like.contentId);
        userWatchlist = watchlist.map(item => item.contentId);
      }

      // Filter items that have content and transform data
      let itemsWithContent = contentItems
        .filter(item => item.itemMappings && item.itemMappings.length > 0)
        .map(item => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          displayOrder: item.displayOrder,
          showOnChildProfile: item.showOnChildProfile,
          isActive: item.isActive,
          contentCount: item.itemMappings.length,
          content: item.itemMappings.map(mapping => {
            const content = mapping.content;
            return {
              ...content.toJSON(),
              isLiked: profileId ? userLikes.includes(content.id) : false,
              isWatchlist: profileId ? userWatchlist.includes(content.id) : false
            };
          }).filter(Boolean)
        }));

      // For child profiles, apply additional filtering
      if (req.contentFilter && req.contentFilter.excludeAdultContent) {
        const allowedGenres = ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy'];

        itemsWithContent = itemsWithContent.filter(item => {
          const hasKidFriendlyContent = item.content.some(content => {
            return content.genre && content.genre.some(g => allowedGenres.includes(g));
          });
          return hasKidFriendlyContent;
        });

        // Also filter content within each item
        itemsWithContent = itemsWithContent.map(item => ({
          ...item,
          content: item.content.filter(content => 
            content.genre && content.genre.some(g => allowedGenres.includes(g))
          ),
          contentCount: item.content.filter(content => 
            content.genre && content.genre.some(g => allowedGenres.includes(g))
          ).length
        }));
      }

      const totalItems = itemsWithContent.length;
      const startIndex = offset;
      const endIndex = startIndex + parseInt(limit);
      const paginatedItems = itemsWithContent.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          items: paginatedItems,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalItems / limit),
            totalItems: totalItems,
            itemsPerPage: parseInt(limit)
          }
        },
        profileContext: req.activeProfile ? {
          profileId: req.activeProfile.id,
          isChildProfile: req.activeProfile.isChild || false
        } : null
      });
    } catch (error) {
      logger.error('Get content grouped by items error:', error);
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
        featuredAt: { [Op.not]: null },
        isActive: true
      };

      // Apply geo-restriction filter if available
      if (req.geoFilter && req.geoFilter.restrictedContent) {
        where.id = { [Op.notIn]: req.geoFilter.restrictedContent };
      }

      console.log('Featured content - Content filter:', req.contentFilter);
      console.log('Featured content - Active profile is child:', req.activeProfile?.isChild);

      // Apply child profile filtering at database level
      if (req.activeProfile && req.activeProfile.isChild === true) {
        where.ageRating = { [Op.in]: ['G', 'PG', 'PG-13'] };
        console.log('Applied child profile filter for featured content - ageRating:', where.ageRating);

        // Add genre filter for child profiles
        const allowedGenres = ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy'];
        const allowedGenreConditions = allowedGenres.map(g => 
          `JSON_CONTAINS(genre, JSON_QUOTE('${g}'))`
        );

        if (where[Op.and]) {
          where[Op.and].push(sequelize.literal(`(${allowedGenreConditions.join(' OR ')})`));
        } else {
          where[Op.and] = [sequelize.literal(`(${allowedGenreConditions.join(' OR ')})`)];
        }

        console.log('Applied child profile genre filter for featured content');
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

      res.json({
        success: true,
        data: {
          featuredContent: rows,
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

  async updateContentItemOrder(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { newOrder, oldOrder } = req.body;

      // Validate input
      const position = parseInt(newOrder);
      if (isNaN(position) || position < 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Invalid position value'
        });
      }

      // Find the content item to update
      const contentItem = await ContentItem.findByPk(id);
      if (!contentItem) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Content item not found'
        });
      }

      // Update all items to prevent duplicates by temporarily setting high values
      await ContentItem.update(
        { 
          displayOrder: sequelize.literal('displayOrder + 10000')
        },
        { 
          where: {},
          transaction 
        }
      );

      // Update the target item
      await contentItem.update(
        { displayOrder: position },
        { transaction }
      );

      // Reorder all items sequentially
      const allItems = await ContentItem.findAll({
        order: [['displayOrder', 'ASC']],
        transaction
      });

      for (let i = 0; i < allItems.length; i++) {
        if (allItems[i].id !== id) {
          const newOrder = allItems[i].id === id ? position : (i >= position ? i + 1 : i);
          await allItems[i].update(
            { displayOrder: newOrder },
            { transaction }
          );
        }
      }

      await transaction.commit();

      res.json({
        success: true,
        message: 'Content item order updated successfully'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Update content item order error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update content item order',
        message: error.message
      });
    }
  },

  // Admin: Update content item child profile visibility
  async updateContentItemChildProfile(req, res) {
    try {
      const { id } = req.params;
      const { showOnChildProfile } = req.body;

      const contentItem = await ContentItem.findByPk(id);

      if (!contentItem) {
        return res.status(404).json({
          success: false,
          error: 'Content item not found'
        });
      }

      await contentItem.update({ showOnChildProfile });

      logger.info(`Admin updated content item child profile: ${id}`);

      res.json({
        success: true,
        message: 'Content item child profile updated successfully',
        contentItem
      });
    } catch (error) {
      logger.error('Update content item child profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update content item child profile',
        message: error.message
      });
    }
  },

  // Content Item Mappings Management
  async getContentMappings(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        contentId,
        itemId,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const where = {};

      if (contentId) where.contentId = contentId;
      if (itemId) where.itemId = itemId;

      const { count, rows } = await ContentItemMapping.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder]],
        include: [
          {
            model: Content,
            as: 'content',
            attributes: ['id', 'title', 'type'],
            where: search ? {
              title: { [Op.like]: `%${search}%` }
            } : undefined
          },
          {
            model: ContentItem,
            as: 'item',
            attributes: ['id', 'name', 'slug']
          }
        ]
      });

      res.json({
        success: true,
        mappings: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Get content mappings error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve content mappings',
        message: error.message
      });
    }
  },

  async createContentMapping(req, res) {
    try {
      const { contentId, itemId, displayOrder = 0, isFeatured = false } = req.body;

      // Check if mapping already exists
      const existingMapping = await ContentItemMapping.findOne({
        where: { contentId, itemId }
      });

      if (existingMapping) {
        return res.status(409).json({
          success: false,
          error: 'Content is already mapped to this item'
        });
      }

      // Verify content and item exist
      const [content, item] = await Promise.all([
        Content.findByPk(contentId),
        ContentItem.findByPk(itemId)
      ]);

      if (!content) {
        return res.status(404).json({
          success: false,
          error: 'Content not found'
        });
      }

      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'Content item not found'
        });
      }

      const mapping = await ContentItemMapping.create({
        contentId,
        itemId,
        displayOrder,
        isFeatured
      });

      logger.info(`Admin created content mapping: ${mapping.id}`);

      res.status(201).json({
        success: true,
        message: 'Content mapping created successfully',
        mapping
      });
    } catch (error) {
      logger.error('Create content mapping error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create content mapping',
        message: error.message
      });
    }
  },

  async updateContentMapping(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const mapping = await ContentItemMapping.findByPk(id);

      if (!mapping) {
        return res.status(404).json({
          success: false,
          error: 'Content mapping not found'
        });
      }

      // If changing contentId or itemId, check for duplicates
      if (updateData.contentId || updateData.itemId) {
        const contentId = updateData.contentId || mapping.contentId;
        const itemId = updateData.itemId || mapping.itemId;

        const existingMapping = await ContentItemMapping.findOne({
          where: { 
            contentId, 
            itemId,
            id: { [Op.ne]: id } // Exclude current mapping
          }
        });

        if (existingMapping) {
          return res.status(409).json({
            success: false,
            error: 'Content is already mapped to this item'
          });
        }
      }

      await mapping.update(updateData);

      logger.info(`Admin updated content mapping: ${id}`);

      res.json({
        success: true,
        message: 'Content mapping updated successfully',
        mapping
      });
    } catch (error) {
      logger.error('Update content mapping error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update content mapping',
        message: error.message
      });
    }
  },

  async deleteContentMapping(req, res) {
    try {
      const { id } = req.params;

      const mapping = await ContentItemMapping.findByPk(id);

      if (!mapping) {
        return res.status(404).json({
          success: false,
          error: 'Content mapping not found'
        });
      }

      await mapping.destroy();

      logger.info(`Admin deleted content mapping: ${id}`);

      res.json({
        success: true,
        message: 'Content mapping deleted successfully'
      });
    } catch (error) {
      logger.error('Delete content mapping error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete content mapping',
        message: error.message
      });
    }
  },

  // Thumbnail Management APIs
  async updateContentThumbnails(req, res) {
    try {
      const { id } = req.params;
      const { thumbnails } = req.body;

      // Validate thumbnail structure
      const validRatios = ['banner', 'landscape', 'portrait', 'square'];
      const thumbnailData = {};

      for (const ratio of validRatios) {
        if (thumbnails[ratio]) {
          thumbnailData[ratio] = thumbnails[ratio];
        }
      }

      const content = await Content.findByPk(id);
      if (!content) {
        return res.status(404).json({
          success: false,
          error: 'Content not found'
        });
      }

      await content.update({
        thumbnailUrl: {
          ...content.thumbnailUrl,
          ...thumbnailData
        }
      });

      logger.info(`Updated thumbnails for content: ${id}`);

      res.json({
        success: true,
        message: 'Thumbnails updated successfully',
        thumbnails: content.thumbnailUrl
      });
    } catch (error) {
      logger.error('Update thumbnails error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update thumbnails',
        message: error.message
      });
    }
  },

  async getThumbnailRatios(req, res) {
    try {
      const ratios = {
        banner: {
          ratio: '16:4',
          recommendedSize: '1920x480px',
          description: 'Banner images for hero sections'
        },
        landscape: {
          ratio: '16:9',
          recommendedSize: '1200x675px',
          description: 'Landscape images for grid displays'
        },
        portrait: {
          ratio: '2:3',
          recommendedSize: '500x750px',
          description: 'Portrait images for mobile views'
        },
        square: {
          ratio: '1:1',
          recommendedSize: '500x500px',
          description: 'Square images for thumbnails'
        }
      };

      res.json({
        success: true,
        ratios
      });
    } catch (error) {
      logger.error('Get thumbnail ratios error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get thumbnail ratios'
      });
    }
  },

  async getUpcomingSoon(req, res) {
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
        isActive: true,
        status: 'published',
        releaseYear: {
          [Op.gte]: new Date().getFullYear()
        }
      };

      // Apply child profile filtering
      if (req.activeProfile && req.activeProfile.isChild === true) {
        where.ageRating = { [Op.in]: ['G', 'PG', 'PG-13'] };
        console.log('Applied child profile filter for upcoming soon content');
      }

      // Apply content filtering for child profiles
      if (req.contentFilter && req.contentFilter.excludeAdultContent) {
        where.ageRating = { [Op.in]: ['G', 'PG', 'PG-13'] };

        const allowedGenres = ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy'];
        const allowedGenreConditions = allowedGenres.map(g => 
          `JSON_CONTAINS(genre, JSON_QUOTE('${g}'))`
        );

        if (where[Op.and]) {
          where[Op.and].push(sequelize.literal(`(${allowedGenreConditions.join(' OR ')})`));
        } else {
          where[Op.and] = [sequelize.literal(`(${allowedGenreConditions.join(' OR ')})`)];
        }
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
        order: [['releaseYear', 'ASC'], ['createdAt', 'DESC']],
        attributes: [
          'id', 'title', 'description', 'type', 'genre',
          'duration', 'releaseYear', 'rating', 'ageRating',
          'language', 'thumbnailUrl', 'posterImages', 'trailerUrl',
          'status', 'createdAt'
        ]
      });

      res.json({
        success: true,
        data: {
          upcomingContent: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        },
        contentType: 'upcoming-soon',
        profileContext: req.activeProfile ? {
          profileId: req.activeProfile.id,
          isChildProfile: req.activeProfile.isChild || false
        } : null
      });
    } catch (error) {
      logger.error('Get upcoming soon content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve upcoming content',
        message: error.message
      });
    }
  },

  async getEveryonesWatching(req, res) {
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
        isActive: true,
        status: 'published'
      };

      // Apply child profile filtering
      if (req.activeProfile && req.activeProfile.isChild === true) {
        where.ageRating = { [Op.in]: ['G', 'PG', 'PG-13'] };
        console.log('Applied child profile filter for everyone\'s watching content');
      }

      // Apply content filtering for child profiles
      if (req.contentFilter && req.contentFilter.excludeAdultContent) {
        where.ageRating = { [Op.in]: ['G', 'PG', 'PG-13'] };

        const allowedGenres = ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy'];
        const allowedGenreConditions = allowedGenres.map(g => 
          `JSON_CONTAINS(genre, JSON_QUOTE('${g}'))`
        );

        if (where[Op.and]) {
          where[Op.and].push(sequelize.literal(`(${allowedGenreConditions.join(' OR ')})`));
        } else {
          where[Op.and] = [sequelize.literal(`(${allowedGenreConditions.join(' OR ')})`)];
        }
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

      // Get content with watch history count (simulating popularity)
      const rows = await Content.findAll({
        where,
        include: [
          {
            model: WatchHistory,
            as: 'watchHistory',
            attributes: [],
            required: false
          }
        ],
        attributes: [
          'id', 'title', 'description', 'type', 'genre',
          'duration', 'releaseYear', 'rating', 'ageRating',
          'language', 'thumbnailUrl', 'posterImages', 'trailerUrl',
          'status', 'createdAt',
          [sequelize.fn('COUNT', sequelize.col('watchHistory.id')), 'viewCount']
        ],
        group: ['Content.id'],
        order: [[sequelize.literal('viewCount'), 'DESC'], ['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        subQuery: false
      });

      // Get total count separately to avoid GROUP BY issues with findAndCountAll
      const totalCount = await Content.count({ where });

      res.json({
        success: true,
        data: {
          popularContent: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: parseInt(limit)
          }
        },
        contentType: 'everyones-watching',
        profileContext: req.activeProfile ? {
          profileId: req.activeProfile.id,
          isChildProfile: req.activeProfile.isChild || false
        } : null
      });
    } catch (error) {
      logger.error('Get everyone\'s watching content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve popular content',
        message: error.message
      });
    }
  },

  async getTop10Series(req, res) {
    try {
      const {
        genre,
        language,
        country = 'global'
      } = req.query;

      const where = {
        isActive: true,
        status: 'published',
        type: 'series'
      };

      // Apply child profile filtering
      if (req.activeProfile && req.activeProfile.isChild === true) {
        where.ageRating = { [Op.in]: ['G', 'PG', 'PG-13'] };
        console.log('Applied child profile filter for top 10 series');
      }

      // Apply content filtering for child profiles
      if (req.contentFilter && req.contentFilter.excludeAdultContent) {
        where.ageRating = { [Op.in]: ['G', 'PG', 'PG-13'] };

        const allowedGenres = ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy'];
        const allowedGenreConditions = allowedGenres.map(g => 
          `JSON_CONTAINS(genre, JSON_QUOTE('${g}'))`
        );

        if (where[Op.and]) {
          where[Op.and].push(sequelize.literal(`(${allowedGenreConditions.join(' OR ')})`));
        } else {
          where[Op.and] = [sequelize.literal(`(${allowedGenreConditions.join(' OR ')})`)];
        }
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

      // Get top 10 series based on watch history and ratings (without includes to avoid GROUP BY issues)
      const seriesData = await Content.findAll({
        where,
        include: [
          {
            model: WatchHistory,
            as: 'contentWatchHistory',
            attributes: [],
            required: false
          }
        ],
        attributes: [
          'id', 'title', 'description', 'type', 'genre',
          'duration', 'releaseYear', 'rating', 'ageRating',
          'language', 'thumbnailUrl', 'posterImages', 'trailerUrl',
          'status', 'createdAt',
          [sequelize.fn('COUNT', sequelize.col('contentWatchHistory.id')), 'viewCount']
        ],
        group: ['Content.id'],
        order: [[sequelize.literal('viewCount'), 'DESC'], ['rating', 'DESC'], ['createdAt', 'DESC']],
        limit: 10,
        subQuery: false
      });

      // Fetch seasons and episodes separately for each series
      const rankedSeries = await Promise.all(
        seriesData.map(async (item, index) => {
          const seasons = await Season.findAll({
            where: { 
              seriesId: item.id,
              isActive: true 
            },
            include: [{
              model: Episode,
              as: 'episodes',
              where: { isActive: true },
              required: false
            }]
          });

          return {
            rank: index + 1,
            ...item.toJSON(),
            totalSeasons: seasons.length,
            totalEpisodes: seasons.reduce((total, season) => total + (season.episodes?.length || 0), 0),
            seasons: seasons
          };
        })
      );

      res.json({
        success: true,
        data: {
          top10Series: rankedSeries,
          country: country,
          generatedAt: new Date().toISOString()
        },
        contentType: 'top-10-series',
        profileContext: req.activeProfile ? {
          profileId: req.activeProfile.id,
          isChildProfile: req.activeProfile.isChild || false
        } : null
      });
    } catch (error) {
      logger.error('Get top 10 series error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve top 10 series',
        message: error.message
      });
    }
  },

  async getTop10Movies(req, res) {
    try {
      const {
        genre,
        language,
        country = 'global'
      } = req.query;

      const where = {
        isActive: true,
        status: 'published',
        type: 'movie'
      };

      // Apply child profile filtering
      if (req.activeProfile && req.activeProfile.isChild === true) {
        where.ageRating = { [Op.in]: ['G', 'PG', 'PG-13'] };
        console.log('Applied child profile filter for top 10 movies');
      }

      // Apply content filtering for child profiles
      if (req.contentFilter && req.contentFilter.excludeAdultContent) {
        where.ageRating = { [Op.in]: ['G', 'PG', 'PG-13'] };

        const allowedGenres = ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy'];
        const allowedGenreConditions = allowedGenres.map(g => 
          `JSON_CONTAINS(genre, JSON_QUOTE('${g}'))`
        );

        if (where[Op.and]) {
          where[Op.and].push(sequelize.literal(`(${allowedGenreConditions.join(' OR ')})`));
        } else {
          where[Op.and] = [sequelize.literal(`(${allowedGenreConditions.join(' OR ')})`)];
        }
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

      // Get top 10 movies based on watch history and ratings
      const moviesData = await Content.findAll({
        where,
        include: [
          {
            model: WatchHistory,
            as: 'contentWatchHistory',
            attributes: [],
            required: false
          }
        ],
        attributes: [
          'id', 'title', 'description', 'type', 'genre',
          'duration', 'releaseYear', 'rating', 'ageRating',
          'language', 'thumbnailUrl', 'posterImages', 'trailerUrl',
          'status', 'createdAt',
          [sequelize.fn('COUNT', sequelize.col('contentWatchHistory.id')), 'viewCount']
        ],
        group: ['Content.id'],
        order: [[sequelize.literal('viewCount'), 'DESC'], ['rating', 'DESC'], ['createdAt', 'DESC']],
        limit: 10,
        subQuery: false
      });

      // Add ranking position
      const rankedMovies = moviesData.map((item, index) => ({
        rank: index + 1,
        ...item.toJSON()
      }));

      res.json({
        success: true,
        data: {
          top10Movies: rankedMovies,
          country: country,
          generatedAt: new Date().toISOString()
        },
        contentType: 'top-10-movies',
        profileContext: req.activeProfile ? {
          profileId: req.activeProfile.id,
          isChildProfile: req.activeProfile.isChild || false
        } : null
      });
    } catch (error) {
      logger.error('Get top 10 movies error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve top 10 movies',
        message: error.message
      });
    }
  },

  async searchContent(req, res) {
    try {
      const {
        q: query,
        page = 1,
        limit = 20,
        type,
        genre,
        ageRating,
        language,
        releaseYear,
        sortBy = 'relevance',
        sortOrder = 'DESC'
      } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters long'
        });
      }

      const offset = (page - 1) * limit;
      const searchTerm = query.trim();

      // Build where conditions
      const where = {
        isActive: true,
        [Op.and]: []
      };

      // Search in title, description, director, and cast
      const searchCondition = {
        [Op.or]: [
          { title: { [Op.like]: `%${searchTerm}%` } },
          { description: { [Op.like]: `%${searchTerm}%` } },
          { director: { [Op.like]: `%${searchTerm}%` } }
        ]
      };

      // Search in cast array (JSON field)
      if (sequelize.getDialect() === 'mysql') {
        searchCondition[Op.or].push(
          Sequelize.literal(`JSON_SEARCH(LOWER(cast), 'one', '%${searchTerm.toLowerCase()}%') IS NOT NULL`)
        );
      }

      where[Op.and].push(searchCondition);

      // Apply filters
      if (type) {
        const typeArray = type.split(',').map(t => t.trim());
        where.type = { [Op.in]: typeArray };
      }

      if (genre) {
        const genreArray = genre.split(',').map(g => g.trim());
        const genreConditions = genreArray.map(g => 
          `JSON_CONTAINS(LOWER(genre), JSON_QUOTE('${g.toLowerCase()}'))`
        );

        where[Op.and].push(Sequelize.literal(`(${genreConditions.join(' OR ')})`));
      }

      if (ageRating) {
        const ageRatingArray = ageRating.split(',').map(ar => ar.trim());
        where.ageRating = { [Op.in]: ageRatingArray };
      }

      if (language) {
        where.language = language;
      }

      if (releaseYear) {
        if (releaseYear.includes('-')) {
          const [startYear, endYear] = releaseYear.split('-').map(y => parseInt(y.trim()));
          where.releaseYear = { [Op.between]: [startYear, endYear] };
        } else {
          where.releaseYear = parseInt(releaseYear);
        }
      }

      // Handle geo restrictions if user is available
      if (req.userCountry && req.userCountry !== 'US') {
        where[Op.and].push({
          [Op.or]: [
            { isGloballyAvailable: true },
            { 
              [Op.and]: [
                Sequelize.literal(`JSON_CONTAINS(availableCountries, JSON_QUOTE('${req.userCountry}'))`),
                { 
                  [Op.or]: [
                    { restrictedCountries: { [Op.is]: null } },
                    Sequelize.literal(`NOT JSON_CONTAINS(restrictedCountries, JSON_QUOTE('${req.userCountry}'))`)
                  ]
                }
              ]
            }
          ]
        });
      }

      // Child profile filtering
      if (req.activeProfile?.isChild) {
        where.showOnChildProfile = true;
        where.ageRating = { [Op.in]: ['G', 'PG'] };
      }

      // Build order clause based on sortBy
      let orderClause = [];
      switch (sortBy) {
        case 'title':
          orderClause = [[sequelize.col('Content.title'), sortOrder]];
          break;
        case 'releaseYear':
          orderClause = [[sequelize.col('Content.releaseYear'), sortOrder]];
          break;
        case 'createdAt':
          orderClause = [[sequelize.col('Content.createdAt'), sortOrder]];
          break;
        case 'viewCount':
          // If you have viewCount tracking, add it here
          orderClause = [[sequelize.col('Content.createdAt'), sortOrder]];
          break;
        case 'relevance':
        default:
          // Calculate relevance score based on field priority
          // Priority: title > subtitles > cast > characters > director > description > type > genre
          const relevanceScore = `
            CASE 
              WHEN LOWER(title) LIKE '%${searchTerm.toLowerCase()}%' THEN 8
              WHEN JSON_SEARCH(LOWER(subtitles), 'one', '%${searchTerm.toLowerCase()}%') IS NOT NULL THEN 7
              WHEN JSON_SEARCH(LOWER(cast), 'one', '%${searchTerm.toLowerCase()}%') IS NOT NULL THEN 6
              WHEN JSON_SEARCH(LOWER(characters), 'one', '%${searchTerm.toLowerCase()}%') IS NOT NULL THEN 5
              WHEN LOWER(director) LIKE '%${searchTerm.toLowerCase()}%' THEN 4
              WHEN LOWER(description) LIKE '%${searchTerm.toLowerCase()}%' THEN 3
              WHEN LOWER(type) LIKE '%${searchTerm.toLowerCase()}%' THEN 2
              WHEN JSON_SEARCH(LOWER(genre), 'one', '%${searchTerm.toLowerCase()}%') IS NOT NULL THEN 1
              ELSE 0
            END
          `;

          orderClause = [
            [sequelize.literal(relevanceScore), 'DESC'],
            [sequelize.col('Content.createdAt'), 'DESC']
          ];
          break;
      }

      const { count, rows } = await Content.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: orderClause,
        include: [
          {
            model: Season,
            as: 'seasons',
            required: false,
            include: [{ 
              model: Episode, 
              as: 'episodes',
              required: false,
              limit: 1 // Only get first episode for preview
            }]
          }
        ]
      });

      // Add search highlights to results
      const highlightedResults = rows.map(content => {
        const contentData = content.toJSON();

        // Highlight search term in title and description
        const highlightText = (text) => {
          if (!text) return text;
          const regex = new RegExp(`(${searchTerm})`, 'gi');
          return text.replace(regex, '<mark>$1</mark>');
        };

        contentData.highlightedTitle = highlightText(contentData.title);
        contentData.highlightedDescription = highlightText(contentData.description);

        return contentData;
      });

      res.json({
        success: true,
        data: {
          searchResults: highlightedResults,
          searchQuery: searchTerm,
          filters: {
            type: type || null,
            genre: genre || null,
            ageRating: ageRating || null,
            language: language || null,
            releaseYear: releaseYear || null
          },
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit),
            hasNext: page * limit < count,
            hasPrevious: page > 1
          },
          sortBy,
          sortOrder
        }
      });
    } catch (error) {
      logger.error('Search content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search content',
        message: error.message
      });
    }
  },

  async getSearchSuggestions(req, res) {
    try {
      const { q: query, limit = 10 } = req.query;

      if (!query || query.trim().length < 1) {
        return res.json({
          success: true,
          suggestions: []
        });
      }

      const searchTerm = query.trim();

      // Get content titles and directors for suggestions
      const suggestions = await Content.findAll({
        where: {
          isActive: true,
          [Op.or]: [
            { title: { [Op.like]: `${searchTerm}%` } },
            { director: { [Op.like]: `${searchTerm}%` } }
          ]
        },
        attributes: ['title', 'director', 'type'],
        limit: parseInt(limit),
        order: [['title', 'ASC']]
      });

      // Extract unique suggestions
      const suggestionSet = new Set();

      suggestions.forEach(content => {
        if (content.title.toLowerCase().startsWith(searchTerm.toLowerCase())) {
          suggestionSet.add(content.title);
        }
        if (content.director && content.director.toLowerCase().startsWith(searchTerm.toLowerCase())) {
          suggestionSet.add(content.director);
        }
      });

      const suggestionArray = Array.from(suggestionSet).slice(0, parseInt(limit));

      res.json({
        success: true,
        suggestions: suggestionArray.map(suggestion => ({
          text: suggestion,
          type: 'content'
        }))
      });
    } catch (error) {
      logger.error('Get search suggestions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get search suggestions',
        message: error.message
      });
    }
  },

  // Content Like functionality
  async likeContent(req, res) {
    try {
      const { contentId } = req.body;
      const profileId = req.activeProfile?.id;

      if (!profileId) {
        return res.status(401).json({
          success: false,
          error: 'Profile required',
          message: 'Please select a profile to like content'
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

      // Check if already liked
      const existingLike = await ContentLike.findOne({
        where: {
          profileId,
          contentId
        }
      });

      if (existingLike) {
        return res.status(409).json({
          success: false,
          error: 'Content already liked'
        });
      }

      // Create like
      const like = await ContentLike.create({
        profileId,
        contentId
      });

      res.status(201).json({
        success: true,
        message: 'Content liked successfully',
        data: {
          likeId: like.id,
          contentId,
          contentTitle: content.title,
          likedAt: like.likedAt
        }
      });
    } catch (error) {
      logger.error('Like content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to like content',
        message: error.message
      });
    }
  },

  async unlikeContent(req, res) {
    try {
      const { contentId } = req.params;
      const profileId = req.activeProfile?.id;

      if (!profileId) {
        return res.status(401).json({
          success: false,
          error: 'Profile required'
        });
      }

      const deletedRows = await ContentLike.destroy({
        where: {
          profileId,
          contentId
        }
      });

      if (deletedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Like not found'
        });
      }

      res.json({
        success: true,
        message: 'Content unliked successfully'
      });
    } catch (error) {
      logger.error('Unlike content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unlike content',
        message: error.message
      });
    }
  },

  async getLikedContent(req, res) {
    try {
      const profileId = req.activeProfile?.id;
      const {
        page = 1,
        limit = 20,
        type,
        sortBy = 'likedAt',
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

      if (type) whereClause.type = type;

      const { count, rows: likedContent } = await ContentLike.findAndCountAll({
        where: { profileId },
        include: [
          {
            model: Content,
            as: 'content',
            where: whereClause,
            attributes: [
              'id', 'title', 'description', 'type', 'genre',
              'duration', 'releaseYear', 'rating', 'ageRating',
              'language', 'thumbnailUrl', 'trailerUrl', 'status'
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
          likedContent: likedContent.map(item => ({
            likeId: item.id,
            likedAt: item.likedAt,
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
      logger.error('Get liked content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch liked content',
        message: error.message
      });
    }
  },

  async checkLikeStatus(req, res) {
    try {
      const { contentId } = req.params;
      const profileId = req.activeProfile?.id;

      if (!profileId) {
        return res.status(401).json({
          success: false,
          error: 'Profile required'
        });
      }

      const like = await ContentLike.findOne({
        where: {
          profileId,
          contentId
        }
      });

      res.json({
        success: true,
        data: {
          isLiked: !!like,
          likedAt: like?.likedAt || null
        }
      });
    } catch (error) {
      logger.error('Check like status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check like status',
        message: error.message
      });
    }
  },
};

// Export controller functions
module.exports = {
  getAllContent: contentController.getAllContent,
  getContentById: contentController.getContentById,
  createContent: contentController.createContent,
  updateContent: contentController.updateContent,
  deleteContent: contentController.deleteContent,
  getStreamingUrl: contentController.getStreamingUrl,
  getKidsContent: contentController.getKidsContent,
  getSeriesDetails: contentController.getSeriesDetails,
  getSeasonEpisodes: contentController.getSeasonEpisodes, // Renamed from getSeasonEpisodes to avoid conflict
  getEpisodeDetails: contentController.getEpisodeDetails,
  addToWatchlist: contentController.addToWatchlist,
  removeFromWatchlist: contentController.removeFromWatchlist,
  getWatchlist: contentController.getWatchlist,
  checkWatchlistStatus: contentController.checkWatchlistStatus,
  getContent: contentController.getContent,
  createContentItem: contentController.createContentItem,
  getAllContentItems: contentController.getAllContentItems,
  getContentItemById: contentController.getContentItemById,
  updateContentItem: contentController.updateContentItem,
  deleteContentItem: contentController.deleteContentItem,
  getContentGroupedByItems: contentController.getContentGroupedByItems,
  getContinueWatching: contentController.getContinueWatching,
  getContentStatistics: contentController.getContentStatistics,
  getFeaturedContent: contentController.getFeaturedContent,
  updateContentItemOrder: contentController.updateContentItemOrder,
  updateContentItemChildProfile: contentController.updateContentItemChildProfile, // Added this line
  getContentItems: contentController.getAllContentItems, // Alias for content items management
  getContentMappings: contentController.getContentMappings,
  createContentMapping: contentController.createContentMapping,
  updateContentMapping: contentController.updateContentMapping,
  deleteContentMapping: contentController.deleteContentMapping,
  updateContentThumbnails: contentController.updateContentThumbnails,
  getThumbnailRatios: contentController.getThumbnailRatios,
  getUpcomingSoon: contentController.getUpcomingSoon,
  getEveryonesWatching: contentController.getEveryonesWatching,
  getTop10Series: contentController.getTop10Series,
  getTop10Movies: contentController.getTop10Movies,
  searchContent: contentController.searchContent,
  getSearchSuggestions: contentController.getSearchSuggestions,
  likeContent: contentController.likeContent,
  unlikeContent: contentController.unlikeContent,
  getLikedContent: contentController.getLikedContent,
  checkLikeStatus: contentController.checkLikeStatus,

  // Seasons management
  getSeriesSeasons: contentController.getSeriesSeasons,
  createSeason: contentController.createSeason,
  updateSeason: contentController.updateSeason,
  deleteSeason: contentController.deleteSeason,

  // Episodes management
  createEpisode: contentController.createEpisode,
  updateEpisode: contentController.updateEpisode,
  deleteEpisode: contentController.deleteEpisode,
};