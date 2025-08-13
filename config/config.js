
require('dotenv').config();

module.exports = {
  auth: {
    username: process.env.AUTH_DB_USER || process.env.DB_USER || 'root',
    password: process.env.AUTH_DB_PASSWORD || process.env.DB_PASSWORD || 'password',
    database: process.env.AUTH_DB_NAME || 'ott_auth',
    host: process.env.AUTH_DB_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.AUTH_DB_PORT || process.env.DB_PORT || 3306,
    dialect: 'mysql'
  },
  user: {
    username: process.env.USER_DB_USER || process.env.DB_USER || 'root',
    password: process.env.USER_DB_PASSWORD || process.env.DB_PASSWORD || 'password',
    database: process.env.USER_DB_NAME || 'ott_users',
    host: process.env.USER_DB_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.USER_DB_PORT || process.env.DB_PORT || 3306,
    dialect: 'mysql'
  },
  content: {
    username: process.env.CONTENT_DB_USER || process.env.DB_USER || 'root',
    password: process.env.CONTENT_DB_PASSWORD || process.env.DB_PASSWORD || 'password',
    database: process.env.CONTENT_DB_NAME || 'ott_content',
    host: process.env.CONTENT_DB_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.CONTENT_DB_PORT || process.env.DB_PORT || 3306,
    dialect: 'mysql'
  },
  recommendation: {
    username: process.env.RECOMMENDATION_DB_USER || process.env.DB_USER || 'root',
    password: process.env.RECOMMENDATION_DB_PASSWORD || process.env.DB_PASSWORD || 'password',
    database: process.env.RECOMMENDATION_DB_NAME || 'ott_recommendations',
    host: process.env.RECOMMENDATION_DB_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.RECOMMENDATION_DB_PORT || process.env.DB_PORT || 3306,
    dialect: 'mysql'
  },
  streaming: {
    username: process.env.STREAMING_DB_USER || process.env.DB_USER || 'root',
    password: process.env.STREAMING_DB_PASSWORD || process.env.DB_PASSWORD || 'password',
    database: process.env.STREAMING_DB_NAME || 'ott_streaming',
    host: process.env.STREAMING_DB_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.STREAMING_DB_PORT || process.env.DB_PORT || 3306,
    dialect: 'mysql'
  },
  admin: {
    username: process.env.ADMIN_DB_USER || process.env.DB_USER || 'root',
    password: process.env.ADMIN_DB_PASSWORD || process.env.DB_PASSWORD || 'password',
    database: process.env.ADMIN_DB_NAME || 'ott_admin',
    host: process.env.ADMIN_DB_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.ADMIN_DB_PORT || process.env.DB_PORT || 3306,
    dialect: 'mysql'
  }
};
