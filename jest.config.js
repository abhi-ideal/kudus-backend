
module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  moduleNameMapping: {
    '^../utils/firebaseAdmin$': '<rootDir>/tests/__mocks__/firebaseAdmin.js'
  },
  collectCoverageFrom: [
    'services/**/*.js',
    'utils/**/*.js',
    '!services/**/migrations/**',
    '!services/**/seeders/**',
    '!services/**/config/**',
    '!**/node_modules/**',
    '!tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
