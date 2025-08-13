
const Joi = require('joi');

const schemas = {
  uploadUrl: Joi.object({
    fileType: Joi.string().required(),
    fileSize: Joi.number().positive().max(500 * 1024 * 1024).required(), // 500MB max
    uploadType: Joi.string().valid('general', 'video', 'image', 'thumbnail').default('general')
  }),

  genre: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    description: Joi.string().max(500).optional()
  }),

  genreUpdate: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    description: Joi.string().max(500).optional(),
    isActive: Joi.boolean().optional()
  })
};

const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({
        error: 'Validation schema not found'
      });
    }

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    next();
  };
};

module.exports = { validate, schemas };
