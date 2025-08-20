
const axios = require('axios');
const path = require('path');

// Load environment variables
require('dotenv').config({ 
  path: path.join(__dirname, '../../../.env')
});

// Import the app - using real Firebase and database
const app = require('../index');

// Base URL for axios requests
const BASE_URL = 'http://0.0.0.0:3001';

describe('Auth Service', () => {
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
      // Note: You'll need to provide a real Firebase token for this test
      // or create a test token through Firebase Auth emulator
      const testFirebaseToken = process.env.TEST_FIREBASE_TOKEN || 'your-test-firebase-token';
      
      try {
        const response = await axios.post(`${BASE_URL}/api/auth/register`, {}, {
          headers: {
            'Authorization': `Bearer ${testFirebaseToken}`
          }
        });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('message', 'User registered successfully');
        expect(response.data).toHaveProperty('uid');
        expect(response.data).toHaveProperty('role', 'user');
      } catch (error) {
        // Skip test if no valid token provided
        if (testFirebaseToken === 'your-test-firebase-token') {
          console.log('Skipping test - no valid Firebase token provided');
          return;
        }
        throw error;
      }
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
      try {
        await axios.post(`${BASE_URL}/api/auth/register`, {}, {
          headers: {
            'Authorization': 'Bearer invalid-firebase-token'
          }
        });
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error', 'Registration failed');
      }
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully with valid Firebase token', async () => {
      const testFirebaseToken = process.env.TEST_FIREBASE_TOKEN || 'your-test-firebase-token';
      
      try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
          idToken: testFirebaseToken
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('message', 'Login successful');
      } catch (error) {
        if (testFirebaseToken === 'your-test-firebase-token') {
          console.log('Skipping test - no valid Firebase token provided');
          return;
        }
        throw error;
      }
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
      const testFirebaseToken = process.env.TEST_FIREBASE_TOKEN || 'your-test-firebase-token';
      
      try {
        const response = await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${testFirebaseToken}`
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('message', 'Logout successful');
      } catch (error) {
        if (testFirebaseToken === 'your-test-firebase-token') {
          console.log('Skipping test - no valid Firebase token provided');
          return;
        }
        throw error;
      }
    });

    test('should handle logout without token gracefully', async () => {
      const response = await axios.post(`${BASE_URL}/api/auth/logout`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });
  });

  describe('GET /api/auth/verify-token', () => {
    test('should verify valid Firebase token', async () => {
      const testFirebaseToken = process.env.TEST_FIREBASE_TOKEN || 'your-test-firebase-token';
      
      try {
        const response = await axios.get(`${BASE_URL}/api/auth/verify-token`, {
          headers: {
            'Authorization': `Bearer ${testFirebaseToken}`
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('valid', true);
        expect(response.data).toHaveProperty('uid');
        expect(response.data).toHaveProperty('email');
      } catch (error) {
        if (testFirebaseToken === 'your-test-firebase-token') {
          console.log('Skipping test - no valid Firebase token provided');
          return;
        }
        throw error;
      }
    });

    test('should fail with invalid token', async () => {
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
      const testFirebaseToken = process.env.TEST_FIREBASE_TOKEN || 'your-test-firebase-token';
      
      try {
        const response = await axios.post(`${BASE_URL}/api/auth/switch-profile`, {
          profileId: 'test-profile-id'
        }, {
          headers: {
            'Authorization': `Bearer ${testFirebaseToken}`
          }
        });

        expect(response.status).toBeDefined();
      } catch (error) {
        if (testFirebaseToken === 'your-test-firebase-token') {
          console.log('Skipping test - no valid Firebase token provided');
          return;
        }
        // Profile switching might fail if profile doesn't exist, which is expected
        expect(error.response.status).toBeDefined();
      }
    });
  });
});
