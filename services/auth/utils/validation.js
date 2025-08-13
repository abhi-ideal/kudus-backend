
const Joi = require('joi');

const schemas = {
  userProfile: Joi.object({
    displayName: Joi.string().min(2).max(50),
    avatar: Joi.string().uri(),
    preferences: Joi.object({
      language: Joi.string().valid('en', 'es', 'fr', 'de', 'hi'),
      genres: Joi.array().items(Joi.string()),
      adultContent: Joi.boolean()
    })
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
