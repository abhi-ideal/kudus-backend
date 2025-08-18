
const express = require('express');
const { authAdmin } = require('../middleware/adminAuth');

/**
 * Creates an admin router with authentication middleware applied
 * @param {string} serviceName - Name of the service for logging
 * @returns {express.Router} - Router with admin auth middleware
 */
const createAdminRouter = (serviceName) => {
  const router = express.Router();
  
  // Apply admin authentication middleware to all routes
  router.use(authAdmin);
  
  // Add service-specific logging
  router.use((req, res, next) => {
    console.log(`[${serviceName}] Admin API accessed by: ${req.adminUser.email}`);
    next();
  });
  
  return router;
};

/**
 * Standard admin endpoints that all services should implement
 */
const standardAdminEndpoints = {
  // Health check for admin service
  health: (req, res) => {
    res.json({
      status: 'healthy',
      service: req.service || 'unknown',
      timestamp: new Date().toISOString(),
      admin: req.adminUser.email
    });
  },
  
  // Service statistics
  stats: async (req, res) => {
    res.json({
      message: 'Service-specific statistics should be implemented',
      service: req.service || 'unknown'
    });
  }
};

module.exports = {
  createAdminRouter,
  standardAdminEndpoints
};
