
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
