
const path = require('path');

// Load test environment variables
require('dotenv').config({ 
  path: path.join(__dirname, '.env.test'),
  override: true
});

// Mock Firebase Admin before any imports
jest.mock('firebase-admin', () => {
  const mockAuth = {
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'test-uid',
      email: 'test@example.com'
    }),
    createUser: jest.fn().mockResolvedValue({
      uid: 'new-test-uid'
    }),
    updateUser: jest.fn().mockResolvedValue({
      uid: 'test-uid'
    }),
    deleteUser: jest.fn().mockResolvedValue({}),
    getUserByEmail: jest.fn().mockResolvedValue({
      uid: 'test-uid',
      email: 'test@example.com'
    })
  };

  return {
    initializeApp: jest.fn(),
    auth: jest.fn(() => mockAuth),
    credential: {
      cert: jest.fn()
    },
    apps: []
  };
});

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => ({
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Location: 'https://test-bucket.s3.amazonaws.com/test-file'
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

// Setup test database
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD?.replace(/'/g, ''),
  database: process.env.DB_NAME,
  logging: false
});

// Test database connection
beforeAll(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Common service test database connected');
  } catch (error) {
    console.error('❌ Common service test database connection failed:', error.message);
    throw error;
  }
});

afterAll(async () => {
  await sequelize.close();
});

module.exports = { sequelize };
const sequelize = require('../config/database');

// Set test environment
process.env.NODE_ENV = 'test';

// Setup database connection for tests
beforeAll(async () => {
  try {
    await sequelize.authenticate();
    console.log('Test database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the test database:', error);
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    await sequelize.close();
    console.log('Test database connection closed.');
  } catch (error) {
    console.error('Error closing test database connection:', error);
  }
});

// Global test utilities
global.testHelpers = {
  createMockUser: () => ({
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User'
  })
};
