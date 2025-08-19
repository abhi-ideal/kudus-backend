
const request = require('supertest');
const app = require('../index');

describe('Health Check', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });

  test('GET /api-docs should return 200 (Swagger)', async () => {
    const response = await request(app)
      .get('/api-docs/')
      .expect(200);
    
    expect(response.text).toContain('Swagger UI');
  });

  test('GET /unknown-route should return 404', async () => {
    const response = await request(app)
      .get('/unknown-route')
      .expect(404);
    
    expect(response.body).toHaveProperty('error', 'Not Found');
  });
});
