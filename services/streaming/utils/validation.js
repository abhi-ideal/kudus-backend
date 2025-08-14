
const Joi = require('joi');

const schemas = {
  playbackSession: Joi.object({
    contentId: Joi.string().uuid().required(),
    position: Joi.number().min(0).required(),
    quality: Joi.string().valid('240p', '480p', '720p', '1080p', '4K')
  }),
  
  heartbeat: Joi.object({
    currentPosition: Joi.number().min(0).optional(),
    bufferHealth: Joi.number().min(0).max(100).optional(),
    networkSpeed: Joi.number().min(0).optional(),
    deviceInfo: Joi.object({
      batteryLevel: Joi.number().min(0).max(100).optional(),
      orientation: Joi.string().valid('portrait', 'landscape').optional(),
      screenResolution: Joi.string().optional(),
      appVersion: Joi.string().optional()
    }).optional()
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
