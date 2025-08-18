
const express = require('express');
const { authAdmin } = require('../middleware/adminAuth');

/**
 * Creates an admin router with authentication middleware applied
 * Content service specific implementation
 * @param {string} serviceName - Name of the service for logging
 * @returns {express.Router} - Router with admin auth middleware
 */
const createAdminRouter = (serviceName) => {
  const router = express.Router();
  
  // Apply admin authentication middleware to all routes
  router.use(authAdmin);
  
  // Add service-specific logging
  router.use((req, res, next) => {
    req.service = serviceName; // Set service name for endpoints
    console.log(`[${serviceName}] Admin API accessed by: ${req.adminUser?.email || 'Unknown'}`);
    next();
  });
  
  return router;
};

/**
 * Standard admin endpoints that the content service implements
 */
const standardAdminEndpoints = {
  // Health check for admin service
  health: (req, res) => {
    res.json({
      status: 'healthy',
      service: req.service || 'Content Service',
      timestamp: new Date().toISOString(),
      admin: req.adminUser.email
    });
  },
  
  // Service statistics
  stats: async (req, res) => {
    res.json({
      message: 'Content service statistics should be implemented',
      service: req.service || 'Content Service'
    });
  }
};

module.exports = {
  createAdminRouter,
  standardAdminEndpoints
};
