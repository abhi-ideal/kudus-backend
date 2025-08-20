const path = require('path');

// Load environment variables
require('dotenv').config({
  path: path.join(__dirname, '../../../.env')
});

// Load test-specific overrides
require('dotenv').config({
  path: path.join(__dirname, '.env.test'),
  override: true
});

console.log('Auth service tests will use real Firebase and database');
console.log('Make sure to set TEST_FIREBASE_TOKEN in your .env.test file');