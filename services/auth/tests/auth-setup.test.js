
const { setupDatabase, teardownDatabase } = require('./setup');

describe('Auth Service Test Setup', () => {
  test('should have correct test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.DB_NAME).toBe('ott_users');
  });

});
