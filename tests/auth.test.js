const request = require('supertest');
const app = require('../index');
const { setupDatabase, teardownDatabase } = require('./setup');

// Mock Firebase Admin
jest.mock('../utils/firebaseAdmin', () => require('./__mocks__/firebaseAdmin'));

describe('Auth API Endpoints', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await teardownDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully with Firebase token', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', 'Bearer mock-firebase-token')
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('uid');
      expect(response.body.role).toBe('user');
    });

    it('should fail with missing Authorization header', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
      expect(response.body.message).toContain('Firebase auth token is required');
    });

    it('should fail with invalid Firebase token', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', 'Bearer invalid-token')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid Firebase token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ idToken: 'mock-firebase-token' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should fail with missing idToken', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'ID token is required');
    });

    it('should fail with invalid Firebase token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ idToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid ID token');
    });
  });

  describe('GET /api/auth/verify-token', () => {
    it('should verify valid Firebase token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-token')
        .set('Authorization', 'Bearer mock-firebase-token')
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body).toHaveProperty('uid');
      expect(response.body).toHaveProperty('email');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-token')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No token provided');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer mock-firebase-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should handle logout without token gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/logout-all', () => {
    it('should logout all sessions successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout-all')
        .set('Authorization', 'Bearer mock-firebase-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('sessionsTerminated');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout-all')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('POST /api/auth/social-login', () => {
    it('should handle social login with Firebase token', async () => {
      const response = await request(app)
        .post('/api/auth/social-login')
        .send({ 
          provider: 'google',
          token: 'mock-firebase-token'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Social login successful');
      expect(response.body).toHaveProperty('uid');
    });
  });
});