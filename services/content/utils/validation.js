const Joi = require('joi');

/**
 * Validation middleware for content service
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

/**
 * Validation schemas for content service
 */
const schemas = {
  // Content creation schema
  createContent: Joi.object({
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(2000),
    type: Joi.string().valid('movie', 'series', 'documentary').required(),
    genre: Joi.array().items(Joi.string()).min(1).required(),
    duration: Joi.number().positive(),
    releaseYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 5),
    ageRating: Joi.string().valid('G', 'PG', 'PG-13', 'R', 'NC-17'),
    language: Joi.string().length(2),
    cast: Joi.array().items(Joi.string()),
    director: Joi.string().max(255),
    thumbnailUrl: Joi.string().uri(),
    trailerUrl: Joi.string().uri()
  }),

  // Content update schema
  updateContent: Joi.object({
    title: Joi.string().min(1).max(255),
    description: Joi.string().max(2000),
    type: Joi.string().valid('movie', 'series', 'documentary'),
    genre: Joi.array().items(Joi.string()).min(1),
    duration: Joi.number().positive(),
    releaseYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 5),
    ageRating: Joi.string().valid('G', 'PG', 'PG-13', 'R', 'NC-17'),
    language: Joi.string().length(2),
    cast: Joi.array().items(Joi.string()),
    director: Joi.string().max(255),
    thumbnailUrl: Joi.string().uri(),
    trailerUrl: Joi.string().uri(),
    isActive: Joi.boolean(),
    status: Joi.string().valid('draft', 'published', 'archived')
  }),

  // Season creation schema
  createSeason: Joi.object({
    contentId: Joi.string().required(),
    seasonNumber: Joi.number().integer().positive().required(),
    title: Joi.string().max(255),
    description: Joi.string().max(2000),
    releaseYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 5)
  }),

  // Episode creation schema
  createEpisode: Joi.object({
    seasonId: Joi.string().required(),
    episodeNumber: Joi.number().integer().positive().required(),
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(2000),
    duration: Joi.number().positive().required(),
    thumbnailUrl: Joi.string().uri(),
    videoUrl: Joi.string().uri()
  }),

  // Admin content creation schema (more flexible)
  content: Joi.object({
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(2000),
    type: Joi.string().valid('movie', 'series', 'documentary').required(),
    genre: Joi.array().items(Joi.string()).min(1).required(),
    duration: Joi.number().positive(),
    releaseYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 5),
    ageRating: Joi.string().valid('G', 'PG', 'PG-13', 'R', 'NC-17'),
    language: Joi.string().max(10),
    cast: Joi.array().items(Joi.string()),
    director: Joi.string().max(255),
    thumbnailUrl: Joi.string().uri(),
    trailerUrl: Joi.string().uri(),
    poster: Joi.string().uri(),
    thumbnail: Joi.string().uri(),
    availableCountries: Joi.array().items(Joi.string().length(2)),
    restrictedCountries: Joi.array().items(Joi.string().length(2)),
    isGloballyAvailable: Joi.boolean()
  }),

  episode: Joi.object({
    seasonId: Joi.string().uuid().required(),
    episodeNumber: Joi.number().integer().min(1).required(),
    title: Joi.string().required().min(1).max(200),
    description: Joi.string().max(1000),
    duration: Joi.number().integer().min(1),
    releaseDate: Joi.date(),
    thumbnail: Joi.string().uri(),
    videoUrl: Joi.string().uri()
  }),

  contentItem: Joi.object({
    name: Joi.string().required().min(2).max(100),
    description: Joi.string().max(500).optional(),
    isActive: Joi.boolean().optional(),
    displayOrder: Joi.number().integer().optional()
  }),

  updateContentItem: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(500).optional(),
    isActive: Joi.boolean().optional(),
    displayOrder: Joi.number().integer().optional()
  }),

  watchlist: Joi.object({
  }),

  contentUpdate: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    description: Joi.string().min(1).max(1000).optional(),
    genre: Joi.array().items(Joi.string()).optional(),
    type: Joi.string().valid('movie', 'series', 'documentary', 'short').optional(),
    duration: Joi.number().integer().min(1).optional(),
    releaseYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
    rating: Joi.string().valid('G', 'PG', 'PG-13', 'R', 'NC-17').optional(),
    ageRating: Joi.string().valid('G', 'PG', 'PG-13', 'R', 'NC-17').optional(),
    language: Joi.string().min(2).max(50).optional(),
    subtitles: Joi.array().items(Joi.string()).optional(),
    cast: Joi.array().items(Joi.string()).optional(),
    characters: Joi.array().items(Joi.string()).optional(),
    director: Joi.string().min(1).max(100).optional(),
    thumbnailUrl: Joi.alternatives().try(
      Joi.string().uri(),
      Joi.object({
        banner: Joi.string().uri().allow(null).optional(),      // 16:4 ratio
        landscape: Joi.string().uri().allow(null).optional(),   // 16:9 ratio
        portrait: Joi.string().uri().allow(null).optional(),    // 2:3 ratio
        square: Joi.string().uri().allow(null).optional()       // 1:1 ratio
      })
    ).optional(),
    posterImages: Joi.alternatives().try(
      Joi.string().uri(),
      Joi.object()
    ).optional(),
    videoUrl: Joi.string().uri().optional(),
    trailerUrl: Joi.string().uri().optional(),
    isActive: Joi.boolean().optional(),
    restrictedCountries: Joi.array().items(Joi.string().length(2)).optional(),
    availableCountries: Joi.array().items(Joi.string().length(2)).optional()
  }),

  contentItemCreate: Joi.object({
    name: Joi.string().required().min(2).max(100),
    slug: Joi.string().required().min(2).max(100).pattern(/^[a-z0-9-]+$/),
    description: Joi.string().max(500).optional(),
    displayOrder: Joi.number().integer().min(0).optional(),
    isActive: Joi.boolean().optional(),
    showOnChildProfile: Joi.boolean().optional()
  }),

  contentItemUpdate: Joi.object({
    id: Joi.string().uuid().optional(),
    name: Joi.string().min(2).max(100).optional(),
    slug: Joi.string().min(2).max(100).pattern(/^[a-z0-9-]+$/).optional(),
    description: Joi.string().max(500).optional(),
    displayOrder: Joi.number().integer().min(0).optional(),
    isActive: Joi.boolean().optional(),
    createdAt: Joi.date().optional(),
    updatedAt: Joi.date().optional()
  }).options({ stripUnknown: true }),

  contentItemOrder: Joi.object({
    newOrder: Joi.number().integer().min(0).required(),
    oldOrder: Joi.number().integer().min(0).required()
  }),
};

module.exports = {
  validate,
  schemas
};