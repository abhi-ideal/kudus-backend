
const path = require('path');

// Set NODE_ENV to test before loading anything
process.env.NODE_ENV = 'test';

// Load root .env file first for base configuration
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Then override with test-specific environment variables
require('dotenv').config({ path: path.join(__dirname, '.env.test') });

// Ensure Firebase is disabled in tests
process.env.DISABLE_FIREBASE = 'true';
process.env.DISABLE_AWS = 'true';

// Mock Firebase before any imports
jest.mock('../utils/firebaseAdmin', () => require('./__mocks__/firebaseAdmin'));

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Location: 'https://test-bucket.s3.amazonaws.com/test-file.jpg'
      })
    }),
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    })
  })),
  config: {
    update: jest.fn()
  }
}));

// Test setup
module.exports = {
  setupDatabase: async () => {
    try {
      // Import sequelize after environment is loaded
      const { sequelize } = require('../config/database');
      
      // Test connection first
      await sequelize.authenticate();
      console.log('✅ Database connection established successfully.');
      
      // Sync database for tests
      await sequelize.sync({ force: true });
      console.log('✅ Database synced successfully.');
      
      return sequelize;
    } catch (error) {
      console.error('❌ Database setup failed:', error.message);
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
      console.log('✅ Database teardown completed successfully.');
    } catch (error) {
      console.error('❌ Database teardown failed:', error.message);
      // Don't throw here as it might prevent other cleanup
      console.warn('Continuing despite teardown error...');
    }
  }
};
