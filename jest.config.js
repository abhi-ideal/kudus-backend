module.exports = {
  testEnvironment: 'node',
  projects: [
    // Root level tests
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
    },
    // Auth service tests
    {
      displayName: 'auth-service',
      testMatch: ['<rootDir>/services/auth/tests/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/services/auth/tests/setup.js']
    },
    // User service tests
    {
      displayName: 'user-service',
      testMatch: ['<rootDir>/services/user/tests/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/services/user/tests/setup.js']
    },
    // Content service tests
    {
      displayName: 'content-service',
      testMatch: ['<rootDir>/services/content/tests/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/services/content/tests/setup.js']
    },
    // Admin service tests
    {
      displayName: 'admin-service',
      testMatch: ['<rootDir>/services/admin/tests/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/services/admin/tests/setup.js']
    },
    // Streaming service tests
    {
      displayName: 'streaming-service',
      testMatch: ['<rootDir>/services/streaming/tests/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/services/streaming/tests/setup.js']
    },
    // Recommendation service tests
    {
      displayName: 'recommendation-service',
      testMatch: ['<rootDir>/services/recommendation/tests/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/services/recommendation/tests/setup.js']
    },
    // Common service tests
    {
      displayName: 'common-service',
      testMatch: ['<rootDir>/services/common/tests/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/services/common/tests/setup.js']
    }
  ],
  collectCoverageFrom: [
    'services/**/*.js',
    'utils/**/*.js',
    '!services/**/node_modules/**',
    '!services/**/tests/**',
    '!**/migrations/**',
    '!**/seeders/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};