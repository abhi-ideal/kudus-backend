
const request = require('supertest');
const app = require('../index');

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status successfully', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('The requested resource was not found');
    });

    it('should return 404 for non-existent API routes', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
