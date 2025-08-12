
# OTT Platform Backend - Netflix-style Streaming Service

A complete backend API stack for a modern Netflix-style OTT (Over-The-Top) streaming platform built with Node.js and microservices architecture.

## 🚀 Features

- **Microservices Architecture**: Modular services for Auth, User, Content, Streaming, Recommendations, and Admin
- **Firebase Authentication**: Complete auth system with social login support
- **AWS Integration**: S3 storage, MediaConvert transcoding, CloudFront CDN
- **Video Streaming**: Secure video delivery with signed URLs
- **Content Management**: Full CRUD operations for movies, series, and episodes
- **User Management**: Profiles, watch history, favorites, and preferences
- **Recommendations**: Basic recommendation engine (extensible to ML)
- **Admin Dashboard**: Content upload, transcoding management, and analytics
- **API Documentation**: Complete Swagger/OpenAPI documentation

## 🏗️ Architecture

```
├── services/
│   ├── auth/           # Firebase Authentication Service
│   ├── user/           # User Profile & History Service
│   ├── content/        # Content Management Service
│   ├── streaming/      # Video Streaming Service
│   ├── recommendation/ # Recommendation Engine
│   └── admin/          # Admin & Analytics Service
├── shared/
│   ├── config/         # Database & App Configuration
│   ├── middleware/     # Authentication & Validation
│   └── utils/          # Logger & Validation Schemas
├── database/
│   ├── migrations/     # Database Schema Migrations
│   └── seeders/        # Demo Data Seeders
└── index.js           # Main API Gateway
```

## 🛠️ Tech Stack

- **Runtime**: Node.js with Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: Firebase Auth
- **Cloud Services**: AWS (S3, MediaConvert, CloudFront, RDS)
- **Validation**: Joi
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston
- **File Upload**: Multer

## 📋 Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- Firebase project with Auth enabled
- AWS account with S3, MediaConvert, and CloudFront configured

## ⚡ Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd ott-platform-backend
npm install
```

### 2. Environment Setup

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ott_platform
DB_USER=root
DB_PASSWORD=your_password

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket
AWS_CLOUDFRONT_DOMAIN=your-cloudfront-domain
```

### 3. Database Setup

Create your MySQL database and run migrations:

```bash
# Create database (using MySQL CLI or phpMyAdmin)
mysql -u root -p
CREATE DATABASE ott_platform;
exit

# Run migrations (after setting up Sequelize CLI)
npx sequelize-cli db:migrate

# (Optional) Seed demo data
npx sequelize-cli db:seed:all
```

### 4. Start the Server

```bash
npm start
# or for development with auto-reload
npm run dev
```

The API will be available at `http://localhost:5000`

### 5. View API Documentation

Open your browser and go to: `http://localhost:5000/api-docs`

## 📚 API Endpoints

### Authentication (`/api/auth`)
- `POST /login` - User login
- `POST /register` - User registration  
- `POST /social-login` - Social media login
- `POST /refresh` - Refresh authentication token
- `POST /logout` - User logout

### Users (`/api/users`)
- `GET /users/:id` - Get user profile
- `PUT /users/:id` - Update user profile
- `GET /users/:id/history` - Get watch history
- `GET /users/:id/favorites` - Get user favorites

### Content (`/api/content`)
- `GET /content` - List all content with filtering
- `GET /content/:id` - Get content details
- `GET /content/:id/stream` - Get streaming URL
- `POST /content` - Create new content (Admin)
- `PUT /content/:id` - Update content (Admin)
- `DELETE /content/:id` - Delete content (Admin)

### Streaming (`/api/streaming`)
- `POST /session` - Start playback session
- `PUT /session/:id` - Update playback position
- `POST /session/:id/end` - End playback session
- `GET /analytics` - Get streaming analytics

### Recommendations (`/api/recommendations`)
- `GET /trending` - Get trending content
- `GET /popular` - Get popular content by genre
- `GET /personalized` - Get personalized recommendations
- `GET /similar/:id` - Get similar content

### Admin (`/api/admin`)
- `POST /content` - Upload new content with video file
- `POST /transcode` - Start transcoding job
- `GET /stats` - Get platform analytics
- `GET /content/:id/status` - Get content processing status

## 🔐 Authentication

The API uses Firebase Authentication with JWT tokens. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## 📊 Database Schema

### Users Table
- User profiles with Firebase UID mapping
- Subscription levels (free, premium, family)
- User preferences and settings

### Content Table  
- Movies, series, and episodes
- Metadata (title, description, genre, cast, etc.)
- S3 keys and video quality information
- View counts and ratings

### Watch History Table
- User viewing sessions
- Playback positions for resume functionality
- Completion tracking

## 🎥 Video Processing Workflow

1. **Upload**: Admin uploads video file via `/api/admin/content`
2. **Storage**: Original file stored in S3
3. **Transcoding**: AWS MediaConvert creates multiple quality versions
4. **CDN**: Transcoded files distributed via CloudFront
5. **Streaming**: Signed URLs generated for secure access

## 🔧 Development

### Project Structure

```
services/
├── auth/               # Authentication logic
├── user/              # User management
│   ├── models/        # Sequelize models
│   ├── controller.js  # Request handlers
│   └── routes.js      # Route definitions
├── content/           # Content management
├── streaming/         # Video streaming
├── recommendation/    # Recommendation engine
└── admin/            # Admin operations
```

### Adding New Features

1. Create new service folder under `services/`
2. Implement controller, routes, and models
3. Add routes to main `index.js`
4. Update Swagger documentation
5. Add tests and validation

### Environment Variables

All configuration is handled via environment variables. Never commit secrets to version control.

## 🚀 Deployment

### Replit Deployment

This project is configured for easy deployment on Replit:

1. Import the project into Replit
2. Configure environment variables in Replit Secrets
3. Click the "Deploy" button

The deployment configuration is already set up in `.replit` file.

### Production Considerations

- Use AWS RDS for production MySQL database
- Configure AWS IAM roles with minimal required permissions
- Set up CloudWatch for monitoring and logging
- Implement Redis for session storage and caching
- Add rate limiting and DDoS protection
- Use AWS Lambda for MediaConvert job callbacks

## 📈 Monitoring and Analytics

The platform includes built-in analytics:

- Content view tracking
- User engagement metrics
- Streaming session analytics
- Popular content identification
- User behavior insights

Access analytics via `/api/admin/stats` endpoint.

## 🛡️ Security Features

- Firebase Authentication integration
- JWT token validation middleware
- Input validation with Joi schemas
- Rate limiting on API endpoints
- Secure file upload handling
- Signed URLs for content protection
- CORS and security headers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and documentation
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:

1. Check the API documentation at `/api-docs`
2. Review the code examples in this README
3. Open an issue for bugs or feature requests

---

**Note**: This is a comprehensive backend scaffold. You'll need to configure your Firebase project, AWS services, and database according to your specific requirements.
