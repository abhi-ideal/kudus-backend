
const request = require('supertest');
const app = require('../index');
const { setupDatabase, teardownDatabase } = require('./setup');
const authHelper = require('./helpers/authHelper');
const mockData = require('./helpers/mockData');

describe('Admin API Endpoints', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await teardownDatabase();
  });

  beforeEach(async () => {
    authHelper.clearTokens();
    await authHelper.loginAdmin();
  });

  describe('GET /api/admin/users', () => {
    beforeEach(async () => {
      // Create some test users
      await authHelper.registerUser({ email: 'user1@test.com' });
      await authHelper.registerUser({ email: 'user2@test.com' });
    });

    it('should get users list successfully', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should filter users by status', async () => {
      const response = await request(app)
        .get('/api/admin/users?status=active')
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .expect(200);

      expect(response.body).toHaveProperty('users');
    });

    it('should paginate users correctly', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=5')
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .expect(200);

      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.itemsPerPage).toBe(5);
    });

    it('should fail without admin authentication', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/admin/users/:id', () => {
    let userId;

    beforeEach(async () => {
      const registerResponse = await authHelper.registerUser({ email: 'testuser@test.com' });
      // Extract user ID from response or database
      userId = 'test-user-id'; // This would be the actual user ID
    });

    it('should get user by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${userId}`)
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('statistics');
    });

    it('should fail with non-existent user ID', async () => {
      const fakeId = mockData.generateId();

      const response = await request(app)
        .get(`/api/admin/users/${fakeId}`)
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('should fail without admin authentication', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${userId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /api/admin/users/:id/block', () => {
    let userId;

    beforeEach(async () => {
      await authHelper.registerUser({ email: 'blocktest@test.com' });
      userId = 'test-user-id'; // This would be the actual user ID
    });

    it('should block user successfully', async () => {
      const blockData = {
        reason: 'Violation of terms of service'
      };

      const response = await request(app)
        .patch(`/api/admin/users/${userId}/block`)
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .send(blockData)
        .expect(200);

      expect(response.body.message).toBe('User blocked successfully');
      expect(response.body.user.isActive).toBe(false);
    });

    it('should block user without reason', async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${userId}/block`)
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .send({})
        .expect(200);

      expect(response.body.message).toBe('User blocked successfully');
    });

    it('should fail with non-existent user ID', async () => {
      const fakeId = mockData.generateId();

      const response = await request(app)
        .patch(`/api/admin/users/${fakeId}/block`)
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .send({ reason: 'Test' })
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('should fail without admin authentication', async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${userId}/block`)
        .send({ reason: 'Test' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /api/admin/users/:id/unblock', () => {
    let userId;

    beforeEach(async () => {
      await authHelper.registerUser({ email: 'unblocktest@test.com' });
      userId = 'test-user-id'; // This would be the actual user ID
      
      // Block user first
      await request(app)
        .patch(`/api/admin/users/${userId}/block`)
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .send({ reason: 'Test block' });
    });

    it('should unblock user successfully', async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${userId}/unblock`)
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .expect(200);

      expect(response.body.message).toBe('User unblocked successfully');
      expect(response.body.user.isActive).toBe(true);
    });

    it('should fail with non-existent user ID', async () => {
      const fakeId = mockData.generateId();

      const response = await request(app)
        .patch(`/api/admin/users/${fakeId}/unblock`)
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('should fail without admin authentication', async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${userId}/unblock`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /api/admin/users/:id/subscription', () => {
    let userId;

    beforeEach(async () => {
      await authHelper.registerUser({ email: 'subtest@test.com' });
      userId = 'test-user-id'; // This would be the actual user ID
    });

    it('should update user subscription successfully', async () => {
      const subscriptionData = {
        subscription: 'premium',
        subscriptionEndDate: '2024-12-31'
      };

      const response = await request(app)
        .patch(`/api/admin/users/${userId}/subscription`)
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .send(subscriptionData)
        .expect(200);

      expect(response.body.message).toBe('User subscription updated successfully');
      expect(response.body.user.subscription).toBe('premium');
    });

    it('should fail with invalid subscription type', async () => {
      const subscriptionData = {
        subscription: 'invalid-type'
      };

      const response = await request(app)
        .patch(`/api/admin/users/${userId}/subscription`)
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .send(subscriptionData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without admin authentication', async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${userId}/subscription`)
        .send({ subscription: 'premium' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/admin/users/statistics', () => {
    it('should get user statistics successfully', async () => {
      const response = await request(app)
        .get('/api/admin/users/statistics')
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .expect(200);

      expect(response.body).toHaveProperty('overview');
      expect(response.body).toHaveProperty('subscriptionBreakdown');
      expect(response.body).toHaveProperty('userGrowth');
      expect(response.body.overview).toHaveProperty('totalUsers');
      expect(response.body.overview).toHaveProperty('activeUsers');
    });

    it('should fail without admin authentication', async () => {
      const response = await request(app)
        .get('/api/admin/users/statistics')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
