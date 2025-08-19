const axios = require('axios');

/**
 * Middleware to detect user's country based on IP address
 */
const detectCountry = async (req, res, next) => {
  try {
    // Get client IP address
    let clientIP = req.headers['x-forwarded-for'] ||
                   req.connection.remoteAddress ||
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null);

    // Handle localhost/development
    if (clientIP === '::1' || clientIP === '127.0.0.1' || clientIP?.includes('localhost')) {
      req.userCountry = process.env.DEFAULT_COUNTRY || 'US'; // Default for development
      return next();
    }

    // Clean up the IP address
    if (clientIP?.includes(',')) {
      clientIP = clientIP.split(',')[0].trim();
    }
    if (clientIP?.includes('::ffff:')) {
      clientIP = clientIP.replace('::ffff:', '');
    }

    try {
      // Use a free IP geolocation service (you can replace with a paid service for production)
      const response = await axios.get(`http://ip-api.com/json/${clientIP}?fields=countryCode`, {
        timeout: 3000
      });

      req.userCountry = response.data.countryCode || 'US';
    } catch (geoError) {
      console.warn('Geo-location service failed:', geoError.message);
      req.userCountry = 'US'; // Default fallback
    }

    next();
  } catch (error) {
    console.error('Country detection error:', error);
    req.userCountry = 'US'; // Default fallback
    next();
  }
};

/**
 * Middleware to filter content based on geo-restrictions
 */
const applyGeoFilter = (req, res, next) => {
  const userCountry = req.userCountry || 'US';

  // Add geo filter to request for use in controllers
  req.geoFilter = {
    userCountry,
    isContentAvailable: (content) => {
      // If content is globally available
      if (content.isGloballyAvailable) {
        // Check if user's country is in restricted list
        if (content.restrictedCountries && content.restrictedCountries.includes(userCountry)) {
          return false;
        }
        return true;
      }

      // If content has specific available countries
      if (content.availableCountries && content.availableCountries.length > 0) {
        return content.availableCountries.includes(userCountry);
      }

      // Default to available if no restrictions are set
      return true;
    }
  };

  next();
};

module.exports = {
  detectCountry,
  applyGeoFilter
};