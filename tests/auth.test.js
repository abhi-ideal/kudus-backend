
const request = require('supertest');
const app = require('../index');
const { setupDatabase, teardownDatabase } = require('./setup');
const authHelper = require('./helpers/authHelper');
const mockData = require('./helpers/mockData');

describe('Auth API Endpoints', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await teardownDatabase();
  });

  beforeEach(() => {
    authHelper.clearTokens();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = mockData.users.validUser;
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('uid');
      expect(response.body.role).toBe('user');
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        ...mockData.users.validUser,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when user already exists', async () => {
      const userData = mockData.users.validUser;
      
      // Register user first time
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to register same user again
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('User already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await authHelper.registerUser();
    });

    it('should login successfully with valid credentials', async () => {
      const response = await authHelper.loginUser();
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.success).toBe(true);
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/verify-token', () => {
    let authToken;

    beforeEach(async () => {
      await authHelper.registerUser();
      const loginResponse = await authHelper.loginUser();
      authToken = loginResponse.body.accessToken;
    });

    it('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-token')
        .set('Authorization', `Bearer ${authToken}`)
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

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken;

    beforeEach(async () => {
      await authHelper.registerUser();
      const loginResponse = await authHelper.loginUser();
      authToken = loginResponse.body.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
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
    let authToken;

    beforeEach(async () => {
      await authHelper.registerUser();
      const loginResponse = await authHelper.loginUser();
      authToken = loginResponse.body.accessToken;
    });

    it('should logout all sessions successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('sessionsTerminated');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout-all')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
