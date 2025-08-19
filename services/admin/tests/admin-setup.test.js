
const { setupDatabase, teardownDatabase } = require('./setup');

describe('Admin Service Test Setup', () => {
  test('should have correct test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.DB_NAME).toBe('ott_admin_test');
    expect(process.env.DISABLE_FIREBASE).toBe('true');
  });

  test('should setup and teardown database', async () => {
    const sequelize = await setupDatabase();
    expect(sequelize).toBeDefined();
    await teardownDatabase();
  }, 30000);

  test('should have Firebase mocked', () => {
    const admin = require('firebase-admin');
    expect(jest.isMockFunction(admin.initializeApp)).toBe(true);
  });
});
