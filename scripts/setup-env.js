
const fs = require('fs');
const path = require('path');

// Load environment variables from root .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Service-specific environment variables
const serviceEnvs = {
  auth: {
    SERVICE_NAME: 'auth-service',
    SERVICE_PORT: '3001',
    DB_NAME: 'ott_auth',
    SERVICE_URL: 'http://localhost:3001',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'your-firebase-project-id',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || 'your-firebase-private-key',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'your-firebase-client-email',
    JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-key',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h'
  },
  user: {
    SERVICE_NAME: 'user-service',
    SERVICE_PORT: '3002',
    DB_NAME: 'ott_users',
    SERVICE_URL: 'http://localhost:3002',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'your-firebase-project-id',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || 'your-firebase-private-key',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'your-firebase-client-email'
  },
  content: {
    SERVICE_NAME: 'content-service',
    SERVICE_PORT: '3003',
    DB_NAME: 'ott_content',
    SERVICE_URL: 'http://localhost:3003',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'your-firebase-project-id',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || 'your-firebase-private-key',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'your-firebase-client-email',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || 'your-aws-access-key',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || 'your-aws-secret-key',
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'your-s3-bucket',
    AWS_CLOUDFRONT_DOMAIN: process.env.AWS_CLOUDFRONT_DOMAIN || 'your-cloudfront-domain',
    AWS_CLOUDFRONT_PRIVATE_KEY: process.env.AWS_CLOUDFRONT_PRIVATE_KEY || 'your-cloudfront-private-key',
    AWS_CLOUDFRONT_KEY_PAIR_ID: process.env.AWS_CLOUDFRONT_KEY_PAIR_ID || 'your-key-pair-id',
    AWS_MEDIACONVERT_ENDPOINT: process.env.AWS_MEDIACONVERT_ENDPOINT || 'your-mediaconvert-endpoint',
    AWS_MEDIACONVERT_ROLE: process.env.AWS_MEDIACONVERT_ROLE || 'your-mediaconvert-role-arn'
  },
  streaming: {
    SERVICE_NAME: 'streaming-service',
    SERVICE_PORT: '3004',
    DB_NAME: 'ott_streaming',
    SERVICE_URL: 'http://localhost:3004',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'your-firebase-project-id',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || 'your-firebase-private-key',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'your-firebase-client-email',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || 'your-aws-access-key',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || 'your-aws-secret-key',
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'your-s3-bucket',
    AWS_CLOUDFRONT_DOMAIN: process.env.AWS_CLOUDFRONT_DOMAIN || 'your-cloudfront-domain',
    AWS_CLOUDFRONT_PRIVATE_KEY: process.env.AWS_CLOUDFRONT_PRIVATE_KEY || 'your-cloudfront-private-key',
    AWS_CLOUDFRONT_KEY_PAIR_ID: process.env.AWS_CLOUDFRONT_KEY_PAIR_ID || 'your-key-pair-id'
  },
  recommendation: {
    SERVICE_NAME: 'recommendation-service',
    SERVICE_PORT: '3005',
    DB_NAME: 'ott_recommendations',
    SERVICE_URL: 'http://localhost:3005',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'your-firebase-project-id',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || 'your-firebase-private-key',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'your-firebase-client-email'
  },
  admin: {
    SERVICE_NAME: 'admin-service',
    SERVICE_PORT: '3006',
    DB_NAME: 'ott_admin',
    SERVICE_URL: 'http://localhost:3006',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'your-firebase-project-id',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || 'your-firebase-private-key',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'your-firebase-client-email',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || 'your-aws-access-key',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || 'your-aws-secret-key',
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'your-s3-bucket'
  },
  common: {
    SERVICE_NAME: 'common-service',
    SERVICE_PORT: '3007',
    DB_NAME: 'ott_common',
    SERVICE_URL: 'http://localhost:3007',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'your-firebase-project-id',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || 'your-firebase-private-key',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'your-firebase-client-email',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || 'your-aws-access-key',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || 'your-aws-secret-key',
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'your-s3-bucket'
  }
};

// Common environment variables for all services
const commonEnv = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || '3306',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  GATEWAY_URL: 'http://localhost:5000'
};

// Function to generate .env file content
const generateEnvContent = (serviceVars) => {
  const allVars = { ...commonEnv, ...serviceVars };
  let content = `# ${serviceVars.SERVICE_NAME.toUpperCase()} Environment Variables\n`;
  content += `# Auto-generated by setup-env.js\n\n`;
  
  Object.entries(allVars).forEach(([key, value]) => {
    content += `${key}=${value}\n`;
  });
  
  return content;
};

// Function to create .env file for a service
const createServiceEnv = (serviceName, serviceVars) => {
  const servicePath = path.join(__dirname, '..', 'services', serviceName);
  
  if (!fs.existsSync(servicePath)) {
    console.log(`⚠️  Service directory not found: ${servicePath}`);
    return;
  }
  
  const envPath = path.join(servicePath, '.env');
  const envContent = generateEnvContent(serviceVars);
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Created .env for ${serviceName} service`);
  } catch (error) {
    console.error(`❌ Failed to create .env for ${serviceName}:`, error.message);
  }
};

// Function to create gateway .env file
const createGatewayEnv = () => {
  const gatewayPath = path.join(__dirname, '..', 'gateway');
  
  if (!fs.existsSync(gatewayPath)) {
    console.log(`⚠️  Gateway directory not found: ${gatewayPath}`);
    return;
  }
  
  const gatewayEnv = {
    SERVICE_NAME: 'api-gateway',
    GATEWAY_PORT: '5000',
    NODE_ENV: process.env.NODE_ENV || 'development',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    AUTH_SERVICE_URL: 'http://localhost:3001',
    USER_SERVICE_URL: 'http://localhost:3002',
    CONTENT_SERVICE_URL: 'http://localhost:3003',
    STREAMING_SERVICE_URL: 'http://localhost:3004',
    RECOMMENDATION_SERVICE_URL: 'http://localhost:3005',
    ADMIN_SERVICE_URL: 'http://localhost:3006',
    COMMON_SERVICE_URL: 'http://localhost:3007'
  };
  
  const envPath = path.join(gatewayPath, '.env');
  const envContent = generateEnvContent(gatewayEnv);
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Created .env for gateway`);
  } catch (error) {
    console.error(`❌ Failed to create .env for gateway:`, error.message);
  }
};

// Main execution
console.log('🔧 Setting up environment files for all services...\n');

// Create service environment files
Object.entries(serviceEnvs).forEach(([serviceName, serviceVars]) => {
  createServiceEnv(serviceName, serviceVars);
});

// Create gateway environment file
createGatewayEnv();

console.log('\n🎉 Environment setup completed!');
console.log('\n📝 Next steps:');
console.log('1. Make sure your main .env file has the correct values');
console.log('2. Each service now has its own .env file with resolved variables');
console.log('3. Service-specific variables are configured with actual values or defaults');
console.log('\n💡 Note: Variables are resolved from your main .env file or use default values');
