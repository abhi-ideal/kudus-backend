
const path = require('path');

// Load test environment variables
require('dotenv').config({ 
  path: path.join(__dirname, '.env.test'),
  override: true
});

// Mock Firebase Admin before any imports
jest.mock('firebase-admin', () => {
  const mockAuth = {
    verifyIdToken: jest.fn().mockImplementation((token) => {
      // Check if it's our test token or a real Firebase token
      if (token === 'your-test-firebase-token') {
        return Promise.reject(new Error('Please provide a valid Firebase token'));
      }
      // For valid-looking tokens, return a mock decoded token
      return Promise.resolve({
        uid: 'test-uid-123',
        email: 'test@example.com',
        admin: true, // For admin tests
        firebase: {
          identities: {},
          sign_in_provider: 'custom'
        }
      });
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
    }),
    getSignedUrl: jest.fn().mockReturnValue('https://test-signed-url.com/video.mp4')
  })),
  CloudFront: jest.fn(() => ({
    getSignedUrl: jest.fn().mockReturnValue('https://test-cloudfront.com/video.mp4')
  })),
  config: {
    update: jest.fn()
  }
}));

// Setup test database
const { Sequelize } = require('sequelize');

let sequelize;

const setupDatabase = async () => {
  sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD?.replace(/'/g, ''),
    database: process.env.DB_NAME,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Content service test database connected');
    return sequelize;
  } catch (error) {
    console.error('❌ Content service test database connection failed:', error.message);
    throw error;
  }
};

const teardownDatabase = async () => {
  if (sequelize) {
    await sequelize.close();
    console.log('✅ Content service test database connection closed');
  }
};

// Test database connection
beforeAll(async () => {
  await setupDatabase();
}, 30000);

afterAll(async () => {
  await teardownDatabase();
}, 10000);

// Global test setup
beforeEach(() => {
  // Clear any previous console mocks
  jest.clearAllMocks();
});

module.exports = { 
  sequelize, 
  setupDatabase, 
  teardownDatabase 
};
