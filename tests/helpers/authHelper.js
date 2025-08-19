
const request = require('supertest');
const app = require('../../index');

// Mock Firebase tokens for testing
const mockFirebaseTokens = {
  validToken: 'mock-valid-firebase-token',
  invalidToken: 'mock-invalid-firebase-token'
};

let storedTokens = {};

const authHelper = {
  // Register a user using Firebase token
  async registerUser(userData = {}) {
    const defaultUserData = {
      email: 'test@example.com',
      displayName: 'Test User'
    };

    const mergedUserData = { ...defaultUserData, ...userData };
    
    const response = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${mockFirebaseTokens.validToken}`);

    if (response.body.accessToken) {
      storedTokens.accessToken = response.body.accessToken;
    }

    return response;
  },

  // Login user using Firebase token
  async loginUser(credentials = {}) {
    const defaultCredentials = {
      idToken: mockFirebaseTokens.validToken
    };

    const mergedCredentials = { ...defaultCredentials, ...credentials };

    const response = await request(app)
      .post('/api/auth/login')
      .send(mergedCredentials);

    if (response.body.accessToken) {
      storedTokens.accessToken = response.body.accessToken;
    }

    return response;
  },

  // Get stored access token
  getAccessToken() {
    return storedTokens.accessToken;
  },

  // Clear stored tokens
  clearTokens() {
    storedTokens = {};
  },

  // Create authenticated request helper
  authenticatedRequest(method, endpoint) {
    const req = request(app)[method.toLowerCase()](endpoint);
    
    if (storedTokens.accessToken) {
      req.set('Authorization', `Bearer ${storedTokens.accessToken}`);
    }
    
    return req;
  },

  // Mock Firebase tokens
  mockTokens: mockFirebaseTokens
};

module.exports = authHelper;
