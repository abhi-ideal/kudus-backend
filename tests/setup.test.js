
const { setupDatabase, teardownDatabase } = require('./setup');

describe('Test Setup Verification', () => {
  test('should have test environment variables loaded', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.DB_NAME).toBe('ott_platform_test');
    expect(process.env.DISABLE_FIREBASE).toBe('true');
    expect(process.env.JWT_SECRET).toBe('test-jwt-secret-key-for-testing-only');
    expect(process.env.DISABLE_AWS).toBe('true');
  });

  test('should setup and teardown database without errors', async () => {
    let sequelize;
    
    try {
      sequelize = await setupDatabase();
      expect(sequelize).toBeDefined();
      
      // Test that we can query the database
      await sequelize.query('SELECT 1 as test');
      
    } catch (error) {
      console.error('Setup test failed:', error);
      throw error;
    } finally {
      if (sequelize) {
        await teardownDatabase();
      }
    }
  }, 60000); // Increase timeout for database operations

  test('should have Firebase mocked', () => {
    const firebaseAdmin = require('../utils/firebaseAdmin');
    expect(firebaseAdmin.initializeFirebaseAdmin).toBeDefined();
    expect(jest.isMockFunction(firebaseAdmin.initializeFirebaseAdmin)).toBe(true);
  });
});
