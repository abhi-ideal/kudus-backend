const Joi = require('joi');

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

const schemas = {
  uploadUrl: Joi.object({
    fileType: Joi.string().required(),
    fileSize: Joi.number().positive().max(500 * 1024 * 1024).required(), // 500MB max
    uploadType: Joi.string().valid('general', 'video', 'image', 'thumbnail').default('general')
  }),

  genre: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    slug: Joi.string().min(2).max(50).optional(),
    description: Joi.string().max(500).optional(),
    isActive: Joi.boolean().optional().default(true)
  }),

  genreUpdate: Joi.object({
    id: Joi.string().uuid().optional(),
    name: Joi.string().min(2).max(50).optional(),
    slug: Joi.string().min(2).max(50).optional(),
    description: Joi.string().max(500).optional(),
    isActive: Joi.boolean().optional()
  }),

  supportTicket: Joi.object({
    name: Joi.string().required().min(2).max(100),
    email: Joi.string().email().required(),
    subject: Joi.string().required().min(5).max(200),
    message: Joi.string().required().min(10).max(2000),
    category: Joi.string().valid('general', 'technical', 'billing', 'account', 'content', 'other').default('general')
  }),

  supportTicketUpdate: Joi.object({
    status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed'),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
    adminResponse: Joi.string().max(2000)
  }),

  privacyPolicy: Joi.object({
    title: Joi.string().required().min(5).max(200),
    content: Joi.string().required().min(10),
    version: Joi.string().required(),
    effectiveDate: Joi.date().required(),
    isActive: Joi.boolean().default(false)
  }),

  privacyPolicyUpdate: Joi.object({
    title: Joi.string().min(5).max(200),
    content: Joi.string().min(10),
    version: Joi.string(),
    effectiveDate: Joi.date(),
    isActive: Joi.boolean()
  }),

  termsConditions: Joi.object({
    title: Joi.string().required().min(5).max(200),
    content: Joi.string().required().min(10),
    version: Joi.string().required(),
    effectiveDate: Joi.date().required(),
    isActive: Joi.boolean().default(false)
  }),

  termsConditionsUpdate: Joi.object({
    title: Joi.string().min(5).max(200),
    content: Joi.string().min(10),
    version: Joi.string(),
    effectiveDate: Joi.date(),
    isActive: Joi.boolean()
  })
};

module.exports = { validate, schemas };