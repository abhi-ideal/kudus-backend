
const Joi = require('joi');

const schemas = {
  // User schemas
  userProfile: Joi.object({
    displayName: Joi.string().min(2).max(50),
    avatar: Joi.string().uri(),
    preferences: Joi.object({
      language: Joi.string().valid('en', 'es', 'fr', 'de', 'hi'),
      genres: Joi.array().items(Joi.string()),
      adultContent: Joi.boolean()
    })
  }),

  // Content schemas
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
  }),

  // Streaming schemas
  playbackSession: Joi.object({
    contentId: Joi.string().uuid().required(),
    position: Joi.number().min(0).required(),
    quality: Joi.string().valid('240p', '480p', '720p', '1080p', '4K')
  }),

  // Admin schemas
  mediaConvertJob: Joi.object({
    inputFile: Joi.string().required(),
    outputs: Joi.array().items(
      Joi.object({
        quality: Joi.string().required(),
        preset: Joi.string().required()
      })
    ).required()
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
