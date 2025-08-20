const Content = require('../../content/models/Content');
const Season = require('../../content/models/Season');
const Episode = require('../../content/models/Episode');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const contentController = {
  // Content CRUD operations
  async createContent(req, res) {
    try {
      const {
        title,
        description,
        type,
        genre,
        ageRating,
        duration,
        releaseYear,
        director,
        cast,
        language,
        availableCountries,
        restrictedCountries,
        isGloballyAvailable = true,
        poster,
        thumbnail,
        trailerUrl
      } = req.body;

      const content = await Content.create({
        title,
        description,
        type,
        genre: Array.isArray(genre) ? genre : [genre],
        ageRating,
        duration,
        releaseYear,
        director,
        cast: Array.isArray(cast) ? cast : cast ? [cast] : [],
        language,
        availableCountries: Array.isArray(availableCountries) ? availableCountries : [],
        restrictedCountries: Array.isArray(restrictedCountries) ? restrictedCountries : [],
        isGloballyAvailable,
        poster,
        thumbnail,
        trailerUrl,
        isActive: true
      });

      logger.info(`Admin created content: ${content.id}`);

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
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Apply filters
      if (type) where.type = type;
      if (genre) where.genre = { [Op.contains]: [genre] };
      if (ageRating) where.ageRating = ageRating;
      if (language) where.language = language;
      if (isActive !== undefined) where.isActive = isActive === 'true';
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
            include: [{ model: Episode, as: 'episodes' }]
          }
        ]
      });

      res.json({
        content: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Get content error:', error);
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
        include: [
          {
            model: Season,
            as: 'seasons',
            include: [{ model: Episode, as: 'episodes' }]
          }
        ]
      });

      if (!content) {
        return res.status(404).json({
          error: 'Content not found'
        });
      }

      res.json({ content });
    } catch (error) {
      logger.error('Get content by ID error:', error);
      res.status(500).json({
        error: 'Failed to retrieve content',
        message: error.message
      });
    }
  },

  async updateContent(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const content = await Content.findByPk(id);

      if (!content) {
        return res.status(404).json({
          error: 'Content not found'
        });
      }

      // Handle array fields properly
      if (updateData.genre && !Array.isArray(updateData.genre)) {
        updateData.genre = [updateData.genre];
      }
      if (updateData.cast && !Array.isArray(updateData.cast)) {
        updateData.cast = updateData.cast ? [updateData.cast] : [];
      }
      if (updateData.availableCountries && !Array.isArray(updateData.availableCountries)) {
        updateData.availableCountries = [];
      }
      if (updateData.restrictedCountries && !Array.isArray(updateData.restrictedCountries)) {
        updateData.restrictedCountries = [];
      }

      await content.update(updateData);

      logger.info(`Admin updated content: ${id}`);

      res.json({
        message: 'Content updated successfully',
        content
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

      const content = await Content.findByPk(id);

      if (!content) {
        return res.status(404).json({
          error: 'Content not found'
        });
      }

      // Soft delete by setting isActive to false
      await content.update({ isActive: false });

      logger.info(`Admin deleted content: ${id}`);

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

  // Season management
  async createSeason(req, res) {
    try {
      const { contentId, seasonNumber, title, description, releaseYear } = req.body;

      // Verify content exists
      const content = await Content.findByPk(contentId);
      if (!content) {
        return res.status(404).json({
          error: 'Content not found'
        });
      }

      const season = await Season.create({
        contentId,
        seasonNumber,
        title,
        description,
        releaseYear,
        isActive: true
      });

      logger.info(`Admin created season: ${season.id} for content: ${contentId}`);

      res.status(201).json({
        message: 'Season created successfully',
        season
      });
    } catch (error) {
      logger.error('Create season error:', error);
      res.status(500).json({
        error: 'Failed to create season',
        message: error.message
      });
    }
  },

  async updateSeason(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const season = await Season.findByPk(id);

      if (!season) {
        return res.status(404).json({
          error: 'Season not found'
        });
      }

      await season.update(updateData);

      logger.info(`Admin updated season: ${id}`);

      res.json({
        message: 'Season updated successfully',
        season
      });
    } catch (error) {
      logger.error('Update season error:', error);
      res.status(500).json({
        error: 'Failed to update season',
        message: error.message
      });
    }
  },

  // Episode management
  async createEpisode(req, res) {
    try {
      const {
        seasonId,
        episodeNumber,
        title,
        description,
        duration,
        releaseDate,
        thumbnail,
        videoUrl
      } = req.body;

      // Verify season exists
      const season = await Season.findByPk(seasonId);
      if (!season) {
        return res.status(404).json({
          error: 'Season not found'
        });
      }

      const episode = await Episode.create({
        seasonId,
        episodeNumber,
        title,
        description,
        duration,
        releaseDate,
        thumbnail,
        videoUrl,
        isActive: true
      });

      logger.info(`Admin created episode: ${episode.id} for season: ${seasonId}`);

      res.status(201).json({
        message: 'Episode created successfully',
        episode
      });
    } catch (error) {
      logger.error('Create episode error:', error);
      res.status(500).json({
        error: 'Failed to create episode',
        message: error.message
      });
    }
  },

  async updateEpisode(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const episode = await Episode.findByPk(id);

      if (!episode) {
        return res.status(404).json({
          error: 'Episode not found'
        });
      }

      await episode.update(updateData);

      logger.info(`Admin updated episode: ${id}`);

      res.json({
        message: 'Episode updated successfully',
        episode
      });
    } catch (error) {
      logger.error('Update episode error:', error);
      res.status(500).json({
        error: 'Failed to update episode',
        message: error.message
      });
    }
  }
};

module.exports = contentController;