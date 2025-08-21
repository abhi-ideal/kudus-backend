
# Content Service Testing

This directory contains comprehensive test cases for the Content Service, following the same patterns as the Auth Service tests.

## Test Structure

### 1. Environment Configuration
- `.env.test` - Test environment variables
- `setup.js` - Jest setup and database configuration
- Mocked Firebase Admin and AWS services for testing

### 2. Test Files

#### `content.test.js`
Comprehensive test coverage for all content endpoints:
- **Public Endpoints**: Content browsing, kids content, content items
- **Authentication Required**: Watchlist management, streaming URLs
- **Admin Endpoints**: Content CRUD operations, statistics
- **Error Handling**: Various error scenarios

#### `content-integration.test.js` 
Integration tests covering complete user flows:
- Content discovery flow
- Authenticated user flow (watchlist management)
- Admin content management flow
- Error scenario handling

#### `content-setup.test.js`
Basic setup validation tests

## Running Tests

### Prerequisites
1. Set up test environment variables in `.env.test`
2. Ensure test database is available
3. Configure Firebase test token

### Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run only integration tests
npm run test:integration
```

## Firebase Token Configuration

### Option 1: Environment Variable (Recommended for Replit)
Set `TEST_FIREBASE_TOKEN` in Replit Secrets or `.env.test`:
```bash
TEST_FIREBASE_TOKEN=your-actual-firebase-token
```

### Option 2: Static Test Token
For development, you can use Firebase Auth Emulator or create a test token.

## Test Categories

### 1. Public Endpoints (No Auth Required)
- `GET /api/content` - Browse all content
- `GET /api/content/kids` - Kids-only content
- `GET /api/content/items` - Content grouped by items
- `GET /api/content/:id` - Get specific content
- `GET /api/content/series/:id/details` - Series details
- `GET /api/content/admin/health` - Health check

### 2. Authenticated Endpoints
- `GET /api/content/watchlist` - User's watchlist
- `POST /api/content/watchlist` - Add to watchlist
- `DELETE /api/content/watchlist/:id` - Remove from watchlist
- `GET /api/content/:id/watchlist-status` - Check watchlist status
- `GET /api/content/:id/stream` - Get streaming URL

### 3. Admin Endpoints
- `POST /api/content` - Create content
- `PUT /api/content/:id` - Update content
- `DELETE /api/content/:id` - Delete content
- `GET /api/content/admin/content` - Admin content list
- `GET /api/content/admin/content/statistics` - Content statistics

## Test Data Handling

Tests are designed to work with or without seeded data:
- If database is empty, tests will skip data-dependent operations
- Tests log informative messages when skipping due to missing data
- Integration tests create and clean up their own test data

## Replit Configuration

### Environment Variables in Replit Secrets
```
TEST_FIREBASE_TOKEN=your-firebase-token
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ott_content_test
```

### Running Tests in Replit
1. Open the Shell
2. Navigate to content service: `cd services/content`
3. Run tests: `npm test`

## Mock Services

### Firebase Admin
- Mocked authentication verification
- Returns test user data for valid tokens
- Rejects invalid tokens appropriately

### AWS Services
- Mocked S3 operations
- Mocked CloudFront signed URLs
- Returns test URLs for streaming endpoints

## Coverage Reports

Test coverage reports are generated in the `coverage/` directory:
- HTML report: `coverage/lcov-report/index.html`
- Coverage summary in console output

## Continuous Integration

Tests are designed to:
- Run in CI/CD environments
- Handle missing external dependencies gracefully
- Provide clear success/failure indicators
- Generate detailed logs for debugging

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure MySQL is running and credentials are correct
2. **Firebase Token**: Use a valid Firebase token or the tests will skip auth-required endpoints
3. **Port Conflicts**: Tests run on port 3002, ensure it's available
4. **Timeout Issues**: Tests have 30-second timeout for database operations

### Debug Mode
Enable verbose logging by setting:
```bash
DEBUG=true npm test
```

This will provide detailed information about test execution and any issues encountered.
