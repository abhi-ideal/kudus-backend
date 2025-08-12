
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('../../shared/utils/logger');
const contentRoutes = require('./routes');
const sequelize = require('./config/database');

const app = express();
const PORT = process.env.CONTENT_SERVICE_PORT || 3003;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'content-service',
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/content', contentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Content Service Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Database connection and server start
sequelize.authenticate()
  .then(() => {
    logger.info('Content Service: Database connected successfully');
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🎬 Content Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    logger.error('Content Service: Unable to connect to database:', err);
    process.exit(1);
  });

module.exports = app;
