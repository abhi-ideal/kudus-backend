
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000,
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!**/migrations/**',
    '!**/seeders/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  roots: ['<rootDir>'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ]
};
