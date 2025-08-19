
const request = require('supertest');
const app = require('../index');
const { setupDatabase, teardownDatabase } = require('./setup');
const authHelper = require('./helpers/authHelper');
const mockData = require('./helpers/mockData');

describe('Content API Endpoints', () => {
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

  describe('GET /api/content', () => {
    it('should get content list successfully', async () => {
      const response = await request(app)
        .get('/api/content')
        .set('Authorization', authHelper.getAuthHeader())
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(Array.isArray(response.body.content)).toBe(true);
    });

    it('should filter content by type', async () => {
      const response = await request(app)
        .get('/api/content?type=movie')
        .set('Authorization', authHelper.getAuthHeader())
        .expect(200);

      expect(response.body).toHaveProperty('content');
    });

    it('should filter content by genre', async () => {
      const response = await request(app)
        .get('/api/content?genre=action')
        .set('Authorization', authHelper.getAuthHeader())
        .expect(200);

      expect(response.body).toHaveProperty('content');
    });

    it('should paginate content correctly', async () => {
      const response = await request(app)
        .get('/api/content?page=1&limit=10')
        .set('Authorization', authHelper.getAuthHeader())
        .expect(200);

      expect(response.body).toHaveProperty('pagination');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/content')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/content/:id', () => {
    let contentId;

    beforeEach(async () => {
      // Create content first (this would need admin auth)
      await authHelper.loginAdmin();
      const createResponse = await request(app)
        .post('/api/content')
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .send(mockData.content.validMovie);
      
      contentId = createResponse.body.content?.id || 'test-content-id';
      
      // Switch back to regular user
      await authHelper.loginUser();
    });

    it('should get content by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/content/${contentId}`)
        .set('Authorization', authHelper.getAuthHeader())
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body.content).toHaveProperty('title');
    });

    it('should fail with non-existent content ID', async () => {
      const fakeId = mockData.generateId();

      const response = await request(app)
        .get(`/api/content/${fakeId}`)
        .set('Authorization', authHelper.getAuthHeader())
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/content/${contentId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/content/search', () => {
    it('should search content successfully', async () => {
      const response = await request(app)
        .get('/api/content/search?q=test')
        .set('Authorization', authHelper.getAuthHeader())
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should handle empty search query', async () => {
      const response = await request(app)
        .get('/api/content/search')
        .set('Authorization', authHelper.getAuthHeader())
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/content/search?q=test')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/content/trending', () => {
    it('should get trending content successfully', async () => {
      const response = await request(app)
        .get('/api/content/trending')
        .set('Authorization', authHelper.getAuthHeader())
        .expect(200);

      expect(response.body).toHaveProperty('trending');
      expect(Array.isArray(response.body.trending)).toBe(true);
    });

    it('should limit trending content results', async () => {
      const response = await request(app)
        .get('/api/content/trending?limit=5')
        .set('Authorization', authHelper.getAuthHeader())
        .expect(200);

      expect(response.body).toHaveProperty('trending');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/content/trending')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/content (Admin Only)', () => {
    beforeEach(async () => {
      await authHelper.loginAdmin();
    });

    it('should create movie content successfully', async () => {
      const movieData = mockData.content.validMovie;

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .send(movieData)
        .expect(201);

      expect(response.body.message).toBe('Content created successfully');
      expect(response.body.content.title).toBe(movieData.title);
      expect(response.body.content.type).toBe('movie');
    });

    it('should create series content successfully', async () => {
      const seriesData = mockData.content.validSeries;

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .send(seriesData)
        .expect(201);

      expect(response.body.content.type).toBe('series');
    });

    it('should fail with invalid content data', async () => {
      const invalidData = mockData.content.invalidContent;

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without admin authentication', async () => {
      await authHelper.loginUser(); // Switch to regular user

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', authHelper.getAuthHeader())
        .send(mockData.content.validMovie)
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/content/:id (Admin Only)', () => {
    let contentId;

    beforeEach(async () => {
      await authHelper.loginAdmin();
      
      // Create content first
      const createResponse = await request(app)
        .post('/api/content')
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .send(mockData.content.validMovie);
      
      contentId = createResponse.body.content?.id || 'test-content-id';
    });

    it('should update content successfully', async () => {
      const updateData = {
        title: 'Updated Movie Title',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/content/${contentId}`)
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Content updated successfully');
      expect(response.body.content.title).toBe('Updated Movie Title');
    });

    it('should fail with non-existent content ID', async () => {
      const fakeId = mockData.generateId();

      const response = await request(app)
        .put(`/api/content/${fakeId}`)
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .send({ title: 'Test' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without admin authentication', async () => {
      await authHelper.loginUser(); // Switch to regular user

      const response = await request(app)
        .put(`/api/content/${contentId}`)
        .set('Authorization', authHelper.getAuthHeader())
        .send({ title: 'Test' })
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/content/:id (Admin Only)', () => {
    let contentId;

    beforeEach(async () => {
      await authHelper.loginAdmin();
      
      // Create content first
      const createResponse = await request(app)
        .post('/api/content')
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .send(mockData.content.validMovie);
      
      contentId = createResponse.body.content?.id || 'test-content-id';
    });

    it('should delete content successfully', async () => {
      const response = await request(app)
        .delete(`/api/content/${contentId}`)
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .expect(200);

      expect(response.body.message).toBe('Content deleted successfully');
    });

    it('should fail with non-existent content ID', async () => {
      const fakeId = mockData.generateId();

      const response = await request(app)
        .delete(`/api/content/${fakeId}`)
        .set('Authorization', authHelper.getAuthHeader('admin'))
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without admin authentication', async () => {
      await authHelper.loginUser(); // Switch to regular user

      const response = await request(app)
        .delete(`/api/content/${contentId}`)
        .set('Authorization', authHelper.getAuthHeader())
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });
});
