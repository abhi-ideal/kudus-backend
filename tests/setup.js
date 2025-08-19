
const path = require('path');

// Set NODE_ENV to test before loading environment
process.env.NODE_ENV = 'test';

require('dotenv').config({ path: path.join(__dirname, '.env.test') });

// Initialize Firebase Admin with test environment handling
const { initializeFirebaseAdmin } = require('../utils/firebaseAdmin');
initializeFirebaseAdmin();

// Test setup
module.exports = {
  setupDatabase: async () => {
    // Import sequelize after environment is loaded
    const { sequelize } = require('../config/database');
    // Sync database for tests
    await sequelize.sync({ force: true });
  },

  teardownDatabase: async () => {
    // Import sequelize after environment is loaded
    const { sequelize } = require('../config/database');
    // Clean up database after tests
    await sequelize.drop();
    await sequelize.close();
  }
};
