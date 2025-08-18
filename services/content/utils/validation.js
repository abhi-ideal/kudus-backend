
const Joi = require('joi');

const schemas = {
  content: Joi.object({
    title: Joi.string().required().min(1).max(255),
    description: Joi.string().max(2000),
    type: Joi.string().valid('movie', 'series', 'episode').required(),
    genre: Joi.array().items(Joi.string()).required(),
    releaseDate: Joi.date(),
    duration: Joi.number().positive(),
    rating: Joi.string().valid('G', 'PG', 'PG-13', 'R', 'NC-17'),
    cast: Joi.array().items(Joi.string()),
    director: Joi.string(),
    poster: Joi.string().uri(),
    thumbnail: Joi.string().uri(),
    trailerUrl: Joi.string().uri(),
    isActive: Joi.boolean().default(true)
  })
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

module.exports = { schemas, validate };
const joi = require('joi');

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
  createContent: joi.object({
    title: joi.string().min(1).max(255).required(),
    description: joi.string().max(2000),
    type: joi.string().valid('movie', 'series', 'documentary').required(),
    genre: joi.array().items(joi.string()).min(1).required(),
    duration: joi.number().positive(),
    releaseYear: joi.number().integer().min(1900).max(new Date().getFullYear() + 5),
    ageRating: joi.string().valid('G', 'PG', 'PG-13', 'R', 'NC-17'),
    language: joi.string().length(2),
    cast: joi.array().items(joi.string()),
    director: joi.string().max(255),
    thumbnailUrl: joi.string().uri(),
    trailerUrl: joi.string().uri()
  }),

  // Content update schema
  updateContent: joi.object({
    title: joi.string().min(1).max(255),
    description: joi.string().max(2000),
    type: joi.string().valid('movie', 'series', 'documentary'),
    genre: joi.array().items(joi.string()).min(1),
    duration: joi.number().positive(),
    releaseYear: joi.number().integer().min(1900).max(new Date().getFullYear() + 5),
    ageRating: joi.string().valid('G', 'PG', 'PG-13', 'R', 'NC-17'),
    language: joi.string().length(2),
    cast: joi.array().items(joi.string()),
    director: joi.string().max(255),
    thumbnailUrl: joi.string().uri(),
    trailerUrl: joi.string().uri(),
    isActive: joi.boolean(),
    status: joi.string().valid('draft', 'published', 'archived')
  }),

  // Season creation schema
  createSeason: joi.object({
    contentId: joi.string().required(),
    seasonNumber: joi.number().integer().positive().required(),
    title: joi.string().max(255),
    description: joi.string().max(2000),
    releaseYear: joi.number().integer().min(1900).max(new Date().getFullYear() + 5)
  }),

  // Episode creation schema
  createEpisode: joi.object({
    seasonId: joi.string().required(),
    episodeNumber: joi.number().integer().positive().required(),
    title: joi.string().min(1).max(255).required(),
    description: joi.string().max(2000),
    duration: joi.number().positive().required(),
    thumbnailUrl: joi.string().uri(),
    videoUrl: joi.string().uri()
  })
};

module.exports = {
  validate,
  schemas
};
const Joi = require('joi');

const schemas = {
  content: {
    create: Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required(),
      type: Joi.string().valid('movie', 'series').required(),
      genre: Joi.array().items(Joi.string()).required(),
      duration: Joi.number().when('type', {
        is: 'movie',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      releaseYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 5).required(),
      rating: Joi.string().valid('G', 'PG', 'PG-13', 'R', 'NC-17').required(),
      ageRating: Joi.string().required(),
      language: Joi.string().required(),
      subtitles: Joi.array().items(Joi.string()).optional(),
      cast: Joi.array().items(Joi.string()).optional(),
      director: Joi.string().optional(),
      thumbnailUrl: Joi.string().uri().optional(),
      trailerUrl: Joi.string().uri().optional(),
      isGloballyAvailable: Joi.boolean().default(true),
      availableCountries: Joi.array().items(Joi.string()).optional(),
      restrictedCountries: Joi.array().items(Joi.string()).optional()
    }),
    
    update: Joi.object({
      title: Joi.string().optional(),
      description: Joi.string().optional(),
      type: Joi.string().valid('movie', 'series').optional(),
      genre: Joi.array().items(Joi.string()).optional(),
      duration: Joi.number().optional(),
      releaseYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 5).optional(),
      rating: Joi.string().valid('G', 'PG', 'PG-13', 'R', 'NC-17').optional(),
      ageRating: Joi.string().optional(),
      language: Joi.string().optional(),
      subtitles: Joi.array().items(Joi.string()).optional(),
      cast: Joi.array().items(Joi.string()).optional(),
      director: Joi.string().optional(),
      thumbnailUrl: Joi.string().uri().optional(),
      trailerUrl: Joi.string().uri().optional(),
      isActive: Joi.boolean().optional(),
      isGloballyAvailable: Joi.boolean().optional(),
      availableCountries: Joi.array().items(Joi.string()).optional(),
      restrictedCountries: Joi.array().items(Joi.string()).optional()
    })
  }
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    next();
  };
};

module.exports = {
  validate,
  schemas
};
