
const path = require('path');

// Set NODE_ENV to test before loading anything
process.env.NODE_ENV = 'test';

// Load root .env file first for base configuration
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

// Then override with test-specific environment variables
require('dotenv').config({ path: path.join(__dirname, '.env.test') });

// Ensure Firebase is disabled in tests
process.env.DISABLE_FIREBASE = 'true';
process.env.DISABLE_AWS = 'true';

// Mock Firebase before any imports
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'test-admin-id',
      email: 'admin@example.com',
      admin: true
    })
  })),
  apps: []
}));

module.exports = {
  setupDatabase: async () => {
    try {
      const { sequelize } = require('../config/config');
      await sequelize.authenticate();
      await sequelize.sync({ force: true });
      console.log('✅ Admin service database setup complete');
      return sequelize;
    } catch (error) {
      console.error('❌ Admin service database setup failed:', error.message);
      throw error;
    }
  },

  teardownDatabase: async () => {
    try {
      const { sequelize } = require('../config/config');
      await sequelize.drop();
      await sequelize.close();
      console.log('✅ Admin service database teardown complete');
    } catch (error) {
      console.error('❌ Admin service database teardown failed:', error.message);
    }
  }
};
