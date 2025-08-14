
const Joi = require('joi');

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }
    next();
  };
};

// Common validation schemas
const schemas = {
  userProfile: Joi.object({
    displayName: Joi.string().min(2).max(50),
    avatar: Joi.string().uri(),
    preferences: Joi.object()
  }),
  
  profile: Joi.object({
    profileName: Joi.string().min(2).max(30).required(),
    isChild: Joi.boolean().default(false),
    avatarUrl: Joi.string().uri(),
    preferences: Joi.object()
  }),

  contentUpload: Joi.object({
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000),
    type: Joi.string().valid('movie', 'series', 'documentary', 'short').required(),
    genre: Joi.array().items(Joi.string()),
    duration: Joi.number().integer().min(1),
    releaseYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 5),
    rating: Joi.string().valid('G', 'PG', 'PG-13', 'R', 'NC-17', 'U', '12A', '15', '18'),
    language: Joi.string().max(50),
    director: Joi.string().max(255),
    producer: Joi.string().max(255)
  }),

  watchProgress: Joi.object({
    contentId: Joi.string().uuid().required(),
    watchTime: Joi.number().min(0).required(),
    totalDuration: Joi.number().min(0).required(),
    completed: Joi.boolean().default(false)
  }),

  recommendation: Joi.object({
    contentId: Joi.string().uuid().required(),
    score: Joi.number().min(0).max(1).required(),
    reason: Joi.string().max(255)
  })
};

module.exports = { validate, schemas };
