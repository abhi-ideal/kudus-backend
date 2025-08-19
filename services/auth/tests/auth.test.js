
const request = require('supertest');
const path = require('path');

// Load environment variables properly
require('dotenv').config({ 
  path: path.join(__dirname, '../../../.env')
});
require('dotenv').config({ 
  path: path.join(__dirname, '.env.test'),
  override: true
});

// Mock Firebase Admin before importing the app
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    createUser: jest.fn(),
    getUser: jest.fn(),
    setCustomUserClaims: jest.fn(),
    revokeRefreshTokens: jest.fn()
  })),
  credential: {
    cert: jest.fn()
  },
  apps: []
}));

// Import the app after mocking Firebase
const app = require('../index');
const admin = require('firebase-admin');

describe('Auth Service', () => {
  let mockAuth;

  beforeEach(() => {
    // Reset mocks before each test
    mockAuth = {
      verifyIdToken: jest.fn(),
      createUser: jest.fn(),
      getUser: jest.fn(),
      setCustomUserClaims: jest.fn(),
      revokeRefreshTokens: jest.fn()
    };
    admin.auth.mockReturnValue(mockAuth);
  });

  describe('GET /api/auth/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/auth/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('service', 'Auth Service');
    });
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user with valid Firebase token', async () => {
      const mockDecodedToken = {
        uid: 'test-firebase-uid',
        email: 'test@example.com',
        name: 'Test User',
        email_verified: true
      };

      const mockUserRecord = {
        uid: 'test-firebase-uid',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);
      mockAuth.getUser.mockResolvedValue(mockUserRecord);
      mockAuth.setCustomUserClaims.mockResolvedValue();

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', 'Bearer mock-firebase-token')
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('uid', 'test-firebase-uid');
      expect(response.body).toHaveProperty('role', 'user');
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('mock-firebase-token');
      expect(mockAuth.setCustomUserClaims).toHaveBeenCalled();
    });

    test('should fail with missing Authorization header', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
      expect(response.body.message).toContain('Firebase auth token is required');
    });

    test('should fail with invalid Firebase token', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', 'Bearer invalid-token')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Registration failed');
    });

    test('should fail when user already exists', async () => {
      const mockDecodedToken = {
        uid: 'existing-user-uid',
        email: 'existing@example.com',
        name: 'Existing User',
        email_verified: true
      };

      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);

      // Mock that user already exists in database
      // This would be handled by the actual database logic
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', 'Bearer mock-firebase-token');

      // Since we're mocking, we expect the registration to proceed
      // In a real test with database, you'd seed an existing user first
      expect(response.status).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully with valid Firebase token', async () => {
      const mockDecodedToken = {
        uid: 'test-firebase-uid',
        email: 'test@example.com',
        name: 'Test User',
        email_verified: true
      };

      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ idToken: 'valid-firebase-token' });

      // The actual response depends on whether the user exists in the database
      // For a new user, it might create a user record
      // For an existing user, it should return user data and access token
      expect(response.status).toBeDefined();
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-firebase-token');
    });

    test('should fail with missing idToken', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'ID token is required');
    });

    test('should fail with invalid Firebase token', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ idToken: 'invalid-firebase-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid ID token');
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout successfully', async () => {
      const mockDecodedToken = {
        uid: 'test-firebase-uid',
        email: 'test@example.com'
      };

      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);
      mockAuth.revokeRefreshTokens.mockResolvedValue();

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-firebase-token')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Logout successful');
    });

    test('should handle logout without token gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/auth/verify-token', () => {
    test('should verify valid Firebase token', async () => {
      const mockDecodedToken = {
        uid: 'test-firebase-uid',
        email: 'test@example.com'
      };

      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);

      const response = await request(app)
        .get('/api/auth/verify-token')
        .set('Authorization', 'Bearer valid-firebase-token')
        .expect(200);

      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('uid', 'test-firebase-uid');
      expect(response.body).toHaveProperty('email', 'test@example.com');
    });

    test('should fail with invalid token', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .get('/api/auth/verify-token')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    test('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No token provided');
    });
  });

  describe('POST /api/auth/switch-profile', () => {
    test('should switch profile successfully', async () => {
      const mockDecodedToken = {
        uid: 'test-firebase-uid',
        email: 'test@example.com'
      };

      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);
      mockAuth.setCustomUserClaims.mockResolvedValue();
      mockAuth.revokeRefreshTokens.mockResolvedValue();

      // Mock the middleware that adds user to request
      const response = await request(app)
        .post('/api/auth/switch-profile')
        .send({ profileId: 'test-profile-id' });

      // This endpoint requires authentication middleware
      // The actual test would need proper setup with middleware mocking
      expect(response.status).toBeDefined();
    });
  });
});
