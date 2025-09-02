const Genre = require('./models/Genre');
const Support = require('./models/Support');
const PrivacyPolicy = require('./models/PrivacyPolicy');
const TermsConditions = require('./models/TermsConditions');
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
      const { name, slug, description, isActive } = req.body;

      const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const genre = await Genre.create({
        name,
        slug: finalSlug,
        description,
        isActive: isActive !== undefined ? isActive : true
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

  // Get active genres for users
  async getUserGenres(req, res) {
    try {
      const { search = '', limit = 50, offset = 0 } = req.query;

      let whereClause = {
        isActive: true
      };

      if (search) {
        whereClause.name = { [Op.iLike]: `%${search}%` };
      }

      console.log('Active profile in getUserGenres:', req.activeProfile);
      console.log('Is child profile:', req.activeProfile?.isChild);

      // Apply child profile filtering
      if (req.activeProfile && req.activeProfile.isChild === true) {
        whereClause.showOnChildProfile = true;
        console.log('Applied child profile filter for genres');
      }

      console.log('Where clause for genres:', whereClause);

      const genres = await Genre.findAll({
        where: whereClause,
        order: [['name', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      console.log('Found genres:', genres.length);

      res.json({
        success: true,
        data: genres,
        total: genres.length,
        isChildProfile: req.activeProfile ? req.activeProfile.isChild : false,
        profileInfo: req.activeProfile || null
      });
    } catch (error) {
      console.error('Get genres error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve genres'
      });
    }
  },

  async getAdminGenres(req, res) {
    try {
      const { active = 'all', search, limit = 50, offset = 0 } = req.query;

      const whereClause = {};

      // Admin can filter by active status or see all
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
        success: true,
        genres: genres.rows,
        total: genres.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Get admin genres error:', error);
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
  },

  // Get all genres
  async getGenres(req, res) {
    try {
      let whereClause = { isActive: true };

      // Apply child profile filtering
      if (req.activeProfile && req.activeProfile.isChild) {
        whereClause.showOnChildProfile = true;
      }

      const genres = await Genre.findAll({
        where: whereClause,
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: genres,
        isChildProfile: req.activeProfile ? req.activeProfile.isChild : false
      });
    } catch (error) {
      console.error('Get genres error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve genres'
      });
    }
  },

  // Admin: Get all genres with child profile settings
  async getAllGenresAdmin(req, res) {
    try {
      const { page = 1, limit = 50, search = '' } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = {};
      if (search) {
        whereClause.name = { [Op.iLike]: `%${search}%` };
      }

      const { count, rows: genres } = await Genre.findAndCountAll({
        where: whereClause,
        order: [['name', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: genres,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Get all genres admin error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve genres'
      });
    }
  },

  // Admin: Update genre child profile visibility
  async updateGenreChildProfile(req, res) {
    try {
      const { id } = req.params;
      const { showOnChildProfile } = req.body;

      const genre = await Genre.findByPk(id);
      if (!genre) {
        return res.status(404).json({
          success: false,
          error: 'Genre not found'
        });
      }

      await genre.update({ showOnChildProfile });

      res.json({
        success: true,
        data: genre,
        message: 'Genre child profile visibility updated successfully'
      });
    } catch (error) {
      console.error('Update genre child profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update genre child profile visibility'
      });
    }
  },


  // Support/Contact Form Operations
  async createSupportTicket(req, res) {
    try {
      const { name, email, subject, message, category = 'general' } = req.body;

      if (!name || !email || !subject || !message) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'name, email, subject, and message are required'
        });
      }

      const supportTicket = await Support.create({
        name,
        email,
        subject,
        message,
        category
      });

      res.status(201).json({
        message: 'Support ticket created successfully',
        ticket: {
          id: supportTicket.id,
          name: supportTicket.name,
          email: supportTicket.email,
          subject: supportTicket.subject,
          category: supportTicket.category,
          status: supportTicket.status,
          createdAt: supportTicket.createdAt
        }
      });
    } catch (error) {
      console.error('Create support ticket error:', error);
      res.status(500).json({
        error: 'Failed to create support ticket',
        message: error.message
      });
    }
  },

  async getSupportTickets(req, res) {
    try {
      const { status, category, limit = 50, offset = 0 } = req.query;

      const whereClause = {};

      if (status) whereClause.status = status;
      if (category) whereClause.category = category;

      const tickets = await Support.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['adminResponse'] }
      });

      res.status(200).json({
        tickets: tickets.rows,
        total: tickets.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Get support tickets error:', error);
      res.status(500).json({
        error: 'Failed to retrieve support tickets',
        message: error.message
      });
    }
  },

  async getSupportTicketById(req, res) {
    try {
      const { id } = req.params;

      const ticket = await Support.findByPk(id);

      if (!ticket) {
        return res.status(404).json({
          error: 'Support ticket not found',
          message: 'The requested support ticket does not exist'
        });
      }

      res.status(200).json({ ticket });
    } catch (error) {
      console.error('Get support ticket error:', error);
      res.status(500).json({
        error: 'Failed to retrieve support ticket',
        message: error.message
      });
    }
  },

  async updateSupportTicket(req, res) {
    try {
      const { id } = req.params;
      const { status, priority, adminResponse } = req.body;

      const ticket = await Support.findByPk(id);

      if (!ticket) {
        return res.status(404).json({
          error: 'Support ticket not found',
          message: 'The requested support ticket does not exist'
        });
      }

      const updateData = {};

      if (status) updateData.status = status;
      if (priority) updateData.priority = priority;
      if (adminResponse) updateData.adminResponse = adminResponse;

      if (status === 'resolved' || status === 'closed') {
        updateData.resolvedAt = new Date();
      }

      await ticket.update(updateData);

      res.status(200).json({
        message: 'Support ticket updated successfully',
        ticket
      });
    } catch (error) {
      console.error('Update support ticket error:', error);
      res.status(500).json({
        error: 'Failed to update support ticket',
        message: error.message
      });
    }
  },

  // Privacy Policy Operations
  async createPrivacyPolicy(req, res) {
    try {
      const { title, content, version, effectiveDate, isActive = false } = req.body;
      const createdBy = req.user?.email || 'admin';

      if (!title || !content || !version || !effectiveDate) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'title, content, version, and effectiveDate are required'
        });
      }

      const privacyPolicy = await PrivacyPolicy.create({
        title,
        content,
        version,
        effectiveDate: new Date(effectiveDate),
        isActive,
        createdBy
      });

      res.status(201).json({
        message: 'Privacy policy created successfully',
        privacyPolicy
      });
    } catch (error) {
      console.error('Create privacy policy error:', error);
      res.status(500).json({
        error: 'Failed to create privacy policy',
        message: error.message
      });
    }
  },

  async getPrivacyPolicies(req, res) {
    try {
      const { active, limit = 10, offset = 0 } = req.query;

      const whereClause = {};

      if (active !== undefined) {
        whereClause.isActive = active === 'true';
      }

      const policies = await PrivacyPolicy.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['effectiveDate', 'DESC']]
      });

      res.status(200).json({
        policies: policies.rows,
        total: policies.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Get privacy policies error:', error);
      res.status(500).json({
        error: 'Failed to retrieve privacy policies',
        message: error.message
      });
    }
  },

  async getActivePrivacyPolicy(req, res) {
    try {
      const policy = await PrivacyPolicy.findOne({
        where: { isActive: true },
        order: [['effectiveDate', 'DESC']]
      });

      if (!policy) {
        return res.status(404).json({
          error: 'Privacy policy not found',
          message: 'No active privacy policy found'
        });
      }

      res.status(200).json({ policy });
    } catch (error) {
      console.error('Get active privacy policy error:', error);
      res.status(500).json({
        error: 'Failed to retrieve privacy policy',
        message: error.message
      });
    }
  },

  async updatePrivacyPolicy(req, res) {
    try {
      const { id } = req.params;
      const { title, content, version, effectiveDate, isActive } = req.body;

      const policy = await PrivacyPolicy.findByPk(id);

      if (!policy) {
        return res.status(404).json({
          error: 'Privacy policy not found',
          message: 'The requested privacy policy does not exist'
        });
      }

      const updateData = {};

      if (title) updateData.title = title;
      if (content) updateData.content = content;
      if (version) updateData.version = version;
      if (effectiveDate) updateData.effectiveDate = new Date(effectiveDate);
      if (isActive !== undefined) updateData.isActive = isActive;

      await policy.update(updateData);

      res.status(200).json({
        message: 'Privacy policy updated successfully',
        policy
      });
    } catch (error) {
      console.error('Update privacy policy error:', error);
      res.status(500).json({
        error: 'Failed to update privacy policy',
        message: error.message
      });
    }
  },

  // Terms and Conditions Operations
  async createTermsConditions(req, res) {
    try {
      const { title, content, version, effectiveDate, isActive = false } = req.body;
      const createdBy = req.user?.email || 'admin';

      if (!title || !content || !version || !effectiveDate) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'title, content, version, and effectiveDate are required'
        });
      }

      const termsConditions = await TermsConditions.create({
        title,
        content,
        version,
        effectiveDate: new Date(effectiveDate),
        isActive,
        createdBy
      });

      res.status(201).json({
        message: 'Terms and conditions created successfully',
        termsConditions
      });
    } catch (error) {
      console.error('Create terms and conditions error:', error);
      res.status(500).json({
        error: 'Failed to create terms and conditions',
        message: error.message
      });
    }
  },

  async getTermsConditions(req, res) {
    try {
      const { active, limit = 10, offset = 0 } = req.query;

      const whereClause = {};

      if (active !== undefined) {
        whereClause.isActive = active === 'true';
      }

      const terms = await TermsConditions.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['effectiveDate', 'DESC']]
      });

      res.status(200).json({
        terms: terms.rows,
        total: terms.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Get terms and conditions error:', error);
      res.status(500).json({
        error: 'Failed to retrieve terms and conditions',
        message: error.message
      });
    }
  },

  async getActiveTermsConditions(req, res) {
    try {
      const terms = await TermsConditions.findOne({
        where: { isActive: true },
        order: [['effectiveDate', 'DESC']]
      });

      if (!terms) {
        return res.status(404).json({
          error: 'Terms and conditions not found',
          message: 'No active terms and conditions found'
        });
      }

      res.status(200).json({ terms });
    } catch (error) {
      console.error('Get active terms and conditions error:', error);
      res.status(500).json({
        error: 'Failed to retrieve terms and conditions',
        message: error.message
      });
    }
  },

  async updateTermsConditions(req, res) {
    try {
      const { id } = req.params;
      const { title, content, version, effectiveDate, isActive } = req.body;

      const terms = await TermsConditions.findByPk(id);

      if (!terms) {
        return res.status(404).json({
          error: 'Terms and conditions not found',
          message: 'The requested terms and conditions do not exist'
        });
      }

      const updateData = {};

      if (title) updateData.title = title;
      if (content) updateData.content = content;
      if (version) updateData.version = version;
      if (effectiveDate) updateData.effectiveDate = new Date(effectiveDate);
      if (isActive !== undefined) updateData.isActive = isActive;

      await terms.update(updateData);

      res.status(200).json({
        message: 'Terms and conditions updated successfully',
        terms
      });
    } catch (error) {
      console.error('Update terms and conditions error:', error);
      res.status(500).json({
        error: 'Failed to update terms and conditions',
        message: error.message
      });
    }
  },

  // Generate signed URL for thumbnail uploads
  async getSignedUrlForThumbnailUpload(req, res) {
    try {
      const { fileName, fileType, fileSize } = req.body;

      if (!fileName || !fileType) {
        return res.status(400).json({
          success: false,
          error: 'fileName and fileType are required'
        });
      }

      // Validate file type
      if (!fileType.startsWith('image/')) {
        return res.status(400).json({
          success: false,
          error: 'Only image files are allowed'
        });
      }

      // Validate file size (max 10MB)
      if (fileSize && fileSize > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'File size must be less than 10MB'
        });
      }

      const s3Service = require('./services/s3Service');
      
      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const s3Key = `thumbnails/${timestamp}_${sanitizedFileName}`;

      // Generate signed URL
      const signedUrl = await s3Service.generateSignedUrl(s3Key, fileType, 'putObject');
      const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

      res.json({
        success: true,
        signedUrl,
        publicUrl,
        fileName: sanitizedFileName,
        s3Key
      });

    } catch (error) {
      console.error('Generate signed URL error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate signed URL',
        message: error.message
      });
    }
  }
};

module.exports = commonController;