const Joi = require('joi');

const schemas = {
  createProfile: Joi.object({
    profileName: Joi.string().min(1).max(50).required(),
    isChild: Joi.boolean().default(false),
    avatarUrl: Joi.string().uri().allow(null, ''),
    preferences: Joi.object().default({})
  }),

  updateProfile: Joi.object({
    profileName: Joi.string().min(1).max(50),
    isChild: Joi.boolean(),
    avatarUrl: Joi.string().uri().allow(null, ''),
    preferences: Joi.object()
  }),

  createUser: Joi.object({
    userProfile: Joi.object({
      displayName: Joi.string().min(2).max(50),
      avatar: Joi.string().uri(),
      preferences: Joi.object({
        language: Joi.string().valid('en', 'es', 'fr', 'de', 'hi'),
        genres: Joi.array().items(Joi.string()),
        adultContent: Joi.boolean()
      })
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
const joi = require('joi');

/**
 * Validation middleware for user service
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
 * Validation schemas for user service
 */
const schemas = {
  // User registration schema
  register: joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(8).required(),
    displayName: joi.string().min(2).max(50),
    dateOfBirth: joi.date().iso(),
    phoneNumber: joi.string().pattern(/^\+?[1-9]\d{1,14}$/)
  }),

  // User profile update schema
  updateProfile: joi.object({
    displayName: joi.string().min(2).max(50),
    dateOfBirth: joi.date().iso(),
    phoneNumber: joi.string().pattern(/^\+?[1-9]\d{1,14}$/).allow(''),
    preferences: joi.object(),
    language: joi.string().length(2),
    country: joi.string().length(2)
  }),

  // Subscription update schema
  updateSubscription: joi.object({
    subscription: joi.string().valid('free', 'premium', 'family').required(),
    subscriptionEndDate: joi.date().iso().allow(null)
  }),

  // Block user schema
  blockUser: joi.object({
    reason: joi.string().min(10).max(500).required()
  })
};

module.exports = {
  validate,
  schemas
};
const Joi = require('joi');

const schemas = {
  user: {
    update: Joi.object({
      displayName: Joi.string().optional(),
      preferences: Joi.object().optional(),
      subscription: Joi.string().valid('free', 'premium', 'family').optional(),
      subscriptionEndDate: Joi.date().optional()
    }),
    
    profile: {
      create: Joi.object({
        name: Joi.string().required(),
        avatar: Joi.string().optional(),
        preferences: Joi.object().optional(),
        parentalControls: Joi.object().optional()
      }),
      
      update: Joi.object({
        name: Joi.string().optional(),
        avatar: Joi.string().optional(),
        preferences: Joi.object().optional(),
        parentalControls: Joi.object().optional()
      })
    }
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
