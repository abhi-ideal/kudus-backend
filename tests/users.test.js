
const request = require('supertest');
const app = require('../index');
const { setupDatabase, teardownDatabase } = require('./setup');
const authHelper = require('./helpers/authHelper');
const mockData = require('./helpers/mockData');

describe('User API Endpoints', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await teardownDatabase();
  });

  beforeEach(async () => {
    authHelper.clearTokens();
    await authHelper.registerUser();
    await authHelper.loginUser();
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', authHelper.getAuthHeader())
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        displayName: 'Updated Name',
        language: 'es'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', authHelper.getAuthHeader())
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.user.displayName).toBe('Updated Name');
    });

    it('should fail with invalid data', async () => {
      const updateData = {
        email: 'invalid-email-format'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', authHelper.getAuthHeader())
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({ displayName: 'Test' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/users/profiles', () => {
    it('should get user profiles successfully', async () => {
      const response = await request(app)
        .get('/api/users/profiles')
        .set('Authorization', authHelper.getAuthHeader())
        .expect(200);

      expect(response.body).toHaveProperty('profiles');
      expect(Array.isArray(response.body.profiles)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/users/profiles')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/users/profiles', () => {
    it('should create a new profile successfully', async () => {
      const profileData = mockData.profiles.validProfile;

      const response = await request(app)
        .post('/api/users/profiles')
        .set('Authorization', authHelper.getAuthHeader())
        .send(profileData)
        .expect(201);

      expect(response.body.message).toBe('Profile created successfully');
      expect(response.body.profile.name).toBe(profileData.name);
    });

    it('should create kids profile successfully', async () => {
      const profileData = mockData.profiles.kidsProfile;

      const response = await request(app)
        .post('/api/users/profiles')
        .set('Authorization', authHelper.getAuthHeader())
        .send(profileData)
        .expect(201);

      expect(response.body.profile.isKidsProfile).toBe(true);
    });

    it('should fail with invalid profile data', async () => {
      const profileData = mockData.profiles.invalidProfile;

      const response = await request(app)
        .post('/api/users/profiles')
        .set('Authorization', authHelper.getAuthHeader())
        .send(profileData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/users/profiles')
        .send(mockData.profiles.validProfile)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/users/profiles/:id', () => {
    let profileId;

    beforeEach(async () => {
      // Create a profile first
      const createResponse = await request(app)
        .post('/api/users/profiles')
        .set('Authorization', authHelper.getAuthHeader())
        .send(mockData.profiles.validProfile);
      
      profileId = createResponse.body.profile.id;
    });

    it('should update profile successfully', async () => {
      const updateData = {
        name: 'Updated Profile Name',
        language: 'es'
      };

      const response = await request(app)
        .put(`/api/users/profiles/${profileId}`)
        .set('Authorization', authHelper.getAuthHeader())
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.profile.name).toBe('Updated Profile Name');
    });

    it('should fail with non-existent profile ID', async () => {
      const fakeId = mockData.generateId();

      const response = await request(app)
        .put(`/api/users/profiles/${fakeId}`)
        .set('Authorization', authHelper.getAuthHeader())
        .send({ name: 'Test' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/users/profiles/${profileId}`)
        .send({ name: 'Test' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/users/profiles/:id', () => {
    let profileId;

    beforeEach(async () => {
      // Create a profile first
      const createResponse = await request(app)
        .post('/api/users/profiles')
        .set('Authorization', authHelper.getAuthHeader())
        .send(mockData.profiles.validProfile);
      
      profileId = createResponse.body.profile.id;
    });

    it('should delete profile successfully', async () => {
      const response = await request(app)
        .delete(`/api/users/profiles/${profileId}`)
        .set('Authorization', authHelper.getAuthHeader())
        .expect(200);

      expect(response.body.message).toBe('Profile deleted successfully');
    });

    it('should fail with non-existent profile ID', async () => {
      const fakeId = mockData.generateId();

      const response = await request(app)
        .delete(`/api/users/profiles/${fakeId}`)
        .set('Authorization', authHelper.getAuthHeader())
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/users/profiles/${profileId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
