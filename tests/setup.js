
const path = require('path');

// Set NODE_ENV to test before loading environment
process.env.NODE_ENV = 'test';

// First load root .env file for base configuration
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Then override with test-specific environment variables
require('dotenv').config({ path: path.join(__dirname, '.env.test') });

// Ensure Firebase is disabled in tests
process.env.DISABLE_FIREBASE = 'true';

// Mock Firebase Admin to prevent initialization issues
jest.mock('../utils/firebaseAdmin', () => ({
  initializeFirebaseAdmin: jest.fn(),
  verifyToken: jest.fn().mockResolvedValue({ uid: 'test-user' }),
  admin: {
    auth: () => ({
      verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-user' })
    })
  }
}));

// Test setup
module.exports = {
  setupDatabase: async () => {
    try {
      // Import sequelize after environment is loaded
      const { sequelize } = require('../config/database');
      // Sync database for tests
      await sequelize.sync({ force: true });
    } catch (error) {
      console.error('Database setup failed:', error);
      throw error;
    }
  },

  teardownDatabase: async () => {
    try {
      // Import sequelize after environment is loaded
      const { sequelize } = require('../config/database');
      // Clean up database after tests
      await sequelize.drop();
      await sequelize.close();
    } catch (error) {
      console.error('Database teardown failed:', error);
      throw error;
    }
  }
};
