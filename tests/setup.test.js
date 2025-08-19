
const { setupDatabase, teardownDatabase } = require('./setup');

describe('Test Setup', () => {
  test('should setup and teardown database without errors', async () => {
    await expect(setupDatabase()).resolves.not.toThrow();
    await expect(teardownDatabase()).resolves.not.toThrow();
  });

  test('should have test environment variables loaded', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.DB_NAME).toBe('ott_platform_test');
    expect(process.env.DISABLE_FIREBASE).toBe('true');
  });
});
