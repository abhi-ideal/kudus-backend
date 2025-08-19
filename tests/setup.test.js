
const { setupDatabase, teardownDatabase } = require('./setup');

describe('Test Setup', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await teardownDatabase();
  });

  test('should have test environment variables loaded', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.DB_NAME).toBe('ott_platform_test');
    expect(process.env.DISABLE_FIREBASE).toBe('true');
  });

  test('should have proper test configuration', () => {
    expect(process.env.JWT_SECRET).toBe('test-jwt-secret-key-for-testing-only');
    expect(process.env.DISABLE_AWS).toBe('true');
  });
});
