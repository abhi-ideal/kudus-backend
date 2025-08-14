
# OTT Platform API - Postman Collection

This Postman collection provides comprehensive API testing for the OTT Platform backend services.

## 🚀 Quick Setup

### 1. Import Collection & Environment

1. **Import Collection**: Import `OTT-Platform-API.postman_collection.json`
2. **Import Environment**: Import `OTT-Platform-Environment.postman_environment.json`
3. **Select Environment**: Choose "OTT Platform Environment" from the environment dropdown

### 2. Configure Environment Variables

Update these variables in your environment:

- `baseUrl`: Your API base URL (default: `http://localhost:5000`)
- `userEmail`: Test user email
- `userPassword`: Test user password
- `displayName`: Test user display name

### 3. Authentication Flow

The collection includes automated token management:

1. **Register/Login**: Tokens are automatically saved to environment variables
2. **Switch Profile**: Updates token with new profile context
3. **Subsequent Requests**: Use saved token automatically

## 📁 Collection Structure

### 🔐 Authentication
- Register (auto-saves token)
- Login (auto-saves token)
- Switch Profile (auto-updates token)
- Set Default Profile
- Social Login
- Refresh Token
- Logout

### 👤 User Management
- Profile CRUD operations
- User feed management
- Profile switching

### 🎬 Content Management
- Content browsing and filtering
- Series/episodes management
- Watchlist operations
- Kids content filtering
- Admin content operations

### 📺 Streaming
- Streaming session management
- Progress tracking
- Heartbeat monitoring
- Session analytics

### 🎯 Recommendations
- Trending content
- Popular content by genre
- Personalized recommendations
- Similar content suggestions

### 🔧 Common Services
- Genre management
- S3 upload URL generation
- Shared utilities

### ⚙️ Admin
- Analytics and statistics
- Content geo-restrictions
- User management

## 🔧 Automated Features

### Token Management
- **Auto-save on login/register**: Tokens are automatically extracted and saved
- **Auto-update on profile switch**: Token updates with new profile context
- **Bearer token authentication**: All authenticated requests use saved token

### Variable Management
- **Dynamic ID extraction**: Content IDs, session IDs automatically saved
- **Environment persistence**: Variables persist across requests
- **Flexible configuration**: Easy to switch between environments

### Test Scripts
- **Response validation**: Automatic validation of successful responses
- **Data extraction**: Key data automatically saved to variables
- **Error handling**: Clear error messages and debugging info

## 🔄 Workflow Examples

### Complete User Journey
1. **Register** → Auto-saves token and profile ID
2. **Browse Content** → Use saved profile context
3. **Add to Watchlist** → Profile-specific watchlist
4. **Start Streaming** → Auto-saves session ID
5. **Send Heartbeats** → Monitor streaming progress
6. **End Session** → Complete streaming analytics

### Profile Management
1. **Login** → Auto-saves default profile
2. **Create New Profile** → Auto-saves new profile ID
3. **Switch Profile** → Updates token context
4. **Browse with New Profile** → Different content filtering

### Content Discovery
1. **Get Trending** → General trending content
2. **Get Personalized** → Profile-specific recommendations
3. **Get Similar** → Based on specific content
4. **Add to Watchlist** → Save for later

## 🌍 Environment Configurations

### Development
```json
{
  "baseUrl": "http://localhost:5000"
}
```

### Staging
```json
{
  "baseUrl": "https://staging-api.ottplatform.com"
}
```

### Production
```json
{
  "baseUrl": "https://api.ottplatform.com"
}
```

## 📝 Notes

- **Authentication Required**: Most endpoints require valid authentication token
- **Profile Context**: Many endpoints work with specific profile IDs
- **Error Handling**: Collection includes proper error response handling
- **Rate Limiting**: Be aware of API rate limits during testing
- **Data Persistence**: Variables are automatically managed between requests

## 🔧 Updating Collection

When APIs are updated:

1. Update the JSON files in this directory
2. Re-import in Postman to get latest changes
3. Verify environment variables are still valid
4. Test critical user flows after updates

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if token is saved in environment
   - Try login/register again
   - Verify token is not expired

2. **403 Forbidden**
   - Check profile permissions
   - Verify profile ID is correct
   - Try switching to appropriate profile

3. **404 Not Found**
   - Verify content IDs exist
   - Check if content is available in your region
   - Ensure profile has access to content

4. **Variables Not Saving**
   - Check test scripts are enabled
   - Verify environment is selected
   - Look for console errors in Postman
