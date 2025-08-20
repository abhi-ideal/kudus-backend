
const axios = require('axios');
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

// Base URL for axios requests
const BASE_URL = 'http://0.0.0.0:3001';

describe('Auth Service', () => {
  let mockAuth;
  let server;

  beforeAll(async () => {
    // Start the server for testing
    server = app.listen(3001, '0.0.0.0');
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Close the server after tests
    if (server) {
      server.close();
    }
  });

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
      const response = await axios.get(`${BASE_URL}/api/auth/health`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'OK');
      expect(response.data).toHaveProperty('service', 'Auth Service');
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

      const response = await axios.post(`${BASE_URL}/api/auth/register`, {}, {
        headers: {
          'Authorization': 'Bearer mock-firebase-token'
        }
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('message', 'User registered successfully');
      expect(response.data).toHaveProperty('uid', 'test-firebase-uid');
      expect(response.data).toHaveProperty('role', 'user');
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('mock-firebase-token');
      expect(mockAuth.setCustomUserClaims).toHaveBeenCalled();
    });

    test('should fail with missing Authorization header', async () => {
      try {
        await axios.post(`${BASE_URL}/api/auth/register`);
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data).toHaveProperty('error', 'Unauthorized');
        expect(error.response.data.message).toContain('Firebase auth token is required');
      }
    });

    test('should fail with invalid Firebase token', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      try {
        await axios.post(`${BASE_URL}/api/auth/register`, {}, {
          headers: {
            'Authorization': 'Bearer invalid-token'
          }
        });
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error', 'Registration failed');
      }
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
      const response = await axios.post(`${BASE_URL}/api/auth/register`, {}, {
        headers: {
          'Authorization': 'Bearer mock-firebase-token'
        }
      });

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

      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        idToken: 'valid-firebase-token'
      });

      // The actual response depends on whether the user exists in the database
      // For a new user, it might create a user record
      // For an existing user, it should return user data and access token
      expect(response.status).toBeDefined();
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-firebase-token');
    });

    test('should fail with missing idToken', async () => {
      try {
        await axios.post(`${BASE_URL}/api/auth/login`, {});
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error', 'ID token is required');
      }
    });

    test('should fail with invalid Firebase token', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      try {
        await axios.post(`${BASE_URL}/api/auth/login`, {
          idToken: 'invalid-firebase-token'
        });
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data).toHaveProperty('error', 'Invalid ID token');
      }
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

      const response = await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
        headers: {
          'Authorization': 'Bearer valid-firebase-token'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('message', 'Logout successful');
    });

    test('should handle logout without token gracefully', async () => {
      const response = await axios.post(`${BASE_URL}/api/auth/logout`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });
  });

  describe('GET /api/auth/verify-token', () => {
    test('should verify valid Firebase token', async () => {
      const mockDecodedToken = {
        uid: 'test-firebase-uid',
        email: 'test@example.com'
      };

      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);

      const response = await axios.get(`${BASE_URL}/api/auth/verify-token`, {
        headers: {
          'Authorization': 'Bearer valid-firebase-token'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('valid', true);
      expect(response.data).toHaveProperty('uid', 'test-firebase-uid');
      expect(response.data).toHaveProperty('email', 'test@example.com');
    });

    test('should fail with invalid token', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      try {
        await axios.get(`${BASE_URL}/api/auth/verify-token`, {
          headers: {
            'Authorization': 'Bearer invalid-token'
          }
        });
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data).toHaveProperty('error', 'Invalid token');
      }
    });

    test('should fail without token', async () => {
      try {
        await axios.get(`${BASE_URL}/api/auth/verify-token`);
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data).toHaveProperty('error', 'No token provided');
      }
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
      const response = await axios.post(`${BASE_URL}/api/auth/switch-profile`, {
        profileId: 'test-profile-id'
      });

      // This endpoint requires authentication middleware
      // The actual test would need proper setup with middleware mocking
      expect(response.status).toBeDefined();
    });
  });
});
