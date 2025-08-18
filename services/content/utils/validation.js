
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
  })
};

module.exports = {
  validate,
  schemas
};
