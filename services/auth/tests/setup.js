
const path = require('path');

// First load root .env file to get Firebase configuration
require('dotenv').config({ 
  path: path.join(__dirname, '../../../.env')
});

// Then load test-specific overrides
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

// Database setup and teardown functions
const setupDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Auth service test database connected');
    return sequelize;
  } catch (error) {
    console.error('❌ Auth service test database connection failed:', error.message);
    throw error;
  }
};

const teardownDatabase = async () => {
  await sequelize.close();
};

// Test database connection
beforeAll(async () => {
  await setupDatabase();
});

afterAll(async () => {
  await teardownDatabase();
});

module.exports = { 
  sequelize,
  setupDatabase,
  teardownDatabase
};
