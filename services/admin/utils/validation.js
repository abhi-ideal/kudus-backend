
const Joi = require('joi');

const schemas = {
  content: Joi.object({
    title: Joi.string().required().min(1).max(255),
    description: Joi.string().max(2000),
    type: Joi.string().valid('movie', 'series').required(),
    genre: Joi.array().items(Joi.string()).required(),
    ageRating: Joi.string().valid('G', 'PG', 'PG-13', 'R', 'NC-17'),
    duration: Joi.number().positive(),
    releaseYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 5),
    director: Joi.string().max(255),
    cast: Joi.array().items(Joi.string()),
    language: Joi.string().max(10),
    availableCountries: Joi.array().items(Joi.string().length(2)),
    restrictedCountries: Joi.array().items(Joi.string().length(2)),
    isGloballyAvailable: Joi.boolean().default(true),
    poster: Joi.string().uri(),
    thumbnail: Joi.string().uri(),
    trailerUrl: Joi.string().uri(),
    isActive: Joi.boolean().default(true)
  }),

  updateContent: Joi.object({
    title: Joi.string().min(1).max(255),
    description: Joi.string().max(2000),
    type: Joi.string().valid('movie', 'series', 'documentary', 'short'),
    genre: Joi.array().items(Joi.string()),
    ageRating: Joi.string().valid('G', 'PG', 'PG-13', 'R', 'NC-17'),
    duration: Joi.number().positive(),
    releaseYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 5),
    director: Joi.string().max(255),
    cast: Joi.array().items(Joi.string()),
    language: Joi.string().max(10),
    availableCountries: Joi.array().items(Joi.string().length(2)),
    restrictedCountries: Joi.array().items(Joi.string().length(2)),
    isGloballyAvailable: Joi.boolean(),
    poster: Joi.string().uri(),
    thumbnail: Joi.string().uri(),
    trailerUrl: Joi.string().uri(),
    isActive: Joi.boolean()
  }),

  season: Joi.object({
    contentId: Joi.string().uuid().required(),
    seasonNumber: Joi.number().integer().positive().required(),
    title: Joi.string().required().max(255),
    description: Joi.string().max(2000),
    releaseYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 5)
  }),

  updateSeason: Joi.object({
    seasonNumber: Joi.number().integer().positive(),
    title: Joi.string().max(255),
    description: Joi.string().max(2000),
    releaseYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 5),
    isActive: Joi.boolean()
  }),

  episode: Joi.object({
    seasonId: Joi.string().uuid().required(),
    episodeNumber: Joi.number().integer().positive().required(),
    title: Joi.string().required().max(255),
    description: Joi.string().max(2000),
    duration: Joi.number().positive(),
    releaseDate: Joi.date(),
    thumbnail: Joi.string().uri(),
    videoUrl: Joi.string().uri()
  }),

  updateEpisode: Joi.object({
    episodeNumber: Joi.number().integer().positive(),
    title: Joi.string().max(255),
    description: Joi.string().max(2000),
    duration: Joi.number().positive(),
    releaseDate: Joi.date(),
    thumbnail: Joi.string().uri(),
    videoUrl: Joi.string().uri(),
    isActive: Joi.boolean()
  }),

  blockUser: Joi.object({
    reason: Joi.string().max(500)
  }),

  updateSubscription: Joi.object({
    subscription: Joi.string().valid('free', 'premium', 'family').required(),
    subscriptionEndDate: Joi.date().iso()
  }),

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
