
module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  setupFiles: [
    '<rootDir>/tests/setup.js'
  ],
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
