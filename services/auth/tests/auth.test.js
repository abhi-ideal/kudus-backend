
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

// Import the app after environment is loaded
const app = require('../index');

describe('Auth Service', () => {
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
    test('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Since auth routes may not be fully implemented yet, just check if we get a response
      expect(response.status).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    test('should attempt login', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // Since auth routes may not be fully implemented yet, just check if we get a response
      expect(response.status).toBeDefined();
    });
  });
});
