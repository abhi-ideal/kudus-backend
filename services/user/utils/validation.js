const Joi = require('joi');

/**
 * Validation schemas for user service
 */
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
  }),

  // User registration schema
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    displayName: Joi.string().min(2).max(50),
    dateOfBirth: Joi.date().iso(),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/)
  }),

  // User profile update schema
  updateUserProfile: Joi.object({
    displayName: Joi.string().min(2).max(50),
    dateOfBirth: Joi.date().iso(),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).allow(''),
    preferences: Joi.object(),
    language: Joi.string().length(2),
    country: Joi.string().length(2)
  }),

  // Subscription update schema
  updateSubscription: Joi.object({
    subscription: Joi.string().valid('free', 'premium', 'family').required(),
    subscriptionEndDate: Joi.date().iso().allow(null)
  }),

  // Block user schema
  blockUser: Joi.object({
    reason: Joi.string().min(10).max(500).required()
  }),

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

module.exports = {
  validate,
  schemas
};