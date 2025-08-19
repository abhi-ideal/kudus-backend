
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
      uid: 'test-user-id',
      email: 'test@example.com'
    })
  })),
  apps: []
}));

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

module.exports = {
  setupDatabase: async () => {
    try {
      const { sequelize } = require('../config/database');
      await sequelize.authenticate();
      await sequelize.sync({ force: true });
      console.log('✅ Content service database setup complete');
      return sequelize;
    } catch (error) {
      console.error('❌ Content service database setup failed:', error.message);
      throw error;
    }
  },

  teardownDatabase: async () => {
    try {
      const { sequelize } = require('../config/database');
      await sequelize.drop();
      await sequelize.close();
      console.log('✅ Content service database teardown complete');
    } catch (error) {
      console.error('❌ Content service database teardown failed:', error.message);
    }
  }
};
