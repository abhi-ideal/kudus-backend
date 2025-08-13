
const Genre = require('./models/Genre');
const s3Service = require('./services/s3Service');
const { Op } = require('sequelize');

const commonController = {
  // S3 Upload URL Generation
  async generateUploadUrl(req, res) {
    try {
      const { fileType, fileSize, uploadType = 'general' } = req.body;
      
      if (!fileType || !fileSize) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'fileType and fileSize are required'
        });
      }

      let uploadData;
      
      switch (uploadType) {
        case 'video':
          uploadData = await s3Service.generateVideoUploadUrl(fileSize);
          break;
        case 'image':
          uploadData = await s3Service.generateImageUploadUrl(fileSize, fileType);
          break;
        case 'thumbnail':
          uploadData = await s3Service.generateThumbnailUploadUrl(fileSize, fileType);
          break;
        default:
          uploadData = await s3Service.generateSignedPostUrl(fileType, fileSize);
      }

      res.status(200).json({
        message: 'Upload URL generated successfully',
        ...uploadData
      });
    } catch (error) {
      console.error('Generate upload URL error:', error);
      res.status(500).json({
        error: 'Failed to generate upload URL',
        message: error.message
      });
    }
  },

  // Genre CRUD Operations
  async createGenre(req, res) {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({
          error: 'Missing required field',
          message: 'name is required'
        });
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const genre = await Genre.create({
        name,
        slug,
        description
      });

      res.status(201).json({
        message: 'Genre created successfully',
        genre
      });
    } catch (error) {
      console.error('Create genre error:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          error: 'Genre already exists',
          message: 'A genre with this name already exists'
        });
      }
      
      res.status(500).json({
        error: 'Failed to create genre',
        message: error.message
      });
    }
  },

  async getAllGenres(req, res) {
    try {
      const { active = true, search, limit = 50, offset = 0 } = req.query;
      
      const whereClause = {};
      
      if (active !== 'all') {
        whereClause.isActive = active === 'true';
      }
      
      if (search) {
        whereClause.name = {
          [Op.like]: `%${search}%`
        };
      }

      const genres = await Genre.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['name', 'ASC']]
      });

      res.status(200).json({
        genres: genres.rows,
        total: genres.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Get genres error:', error);
      res.status(500).json({
        error: 'Failed to retrieve genres',
        message: error.message
      });
    }
  },

  async getGenreById(req, res) {
    try {
      const { id } = req.params;
      
      const genre = await Genre.findByPk(id);
      
      if (!genre) {
        return res.status(404).json({
          error: 'Genre not found',
          message: 'The requested genre does not exist'
        });
      }

      res.status(200).json({ genre });
    } catch (error) {
      console.error('Get genre error:', error);
      res.status(500).json({
        error: 'Failed to retrieve genre',
        message: error.message
      });
    }
  },

  async updateGenre(req, res) {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;
      
      const genre = await Genre.findByPk(id);
      
      if (!genre) {
        return res.status(404).json({
          error: 'Genre not found',
          message: 'The requested genre does not exist'
        });
      }

      const updateData = {};
      
      if (name) {
        updateData.name = name;
        updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      
      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.isActive = isActive;

      await genre.update(updateData);

      res.status(200).json({
        message: 'Genre updated successfully',
        genre
      });
    } catch (error) {
      console.error('Update genre error:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          error: 'Genre name already exists',
          message: 'A genre with this name already exists'
        });
      }
      
      res.status(500).json({
        error: 'Failed to update genre',
        message: error.message
      });
    }
  },

  async deleteGenre(req, res) {
    try {
      const { id } = req.params;
      
      const genre = await Genre.findByPk(id);
      
      if (!genre) {
        return res.status(404).json({
          error: 'Genre not found',
          message: 'The requested genre does not exist'
        });
      }

      await genre.destroy();

      res.status(200).json({
        message: 'Genre deleted successfully'
      });
    } catch (error) {
      console.error('Delete genre error:', error);
      res.status(500).json({
        error: 'Failed to delete genre',
        message: error.message
      });
    }
  }
};

module.exports = commonController;
