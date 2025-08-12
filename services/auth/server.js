
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('../../shared/utils/logger');
const authRoutes = require('./routes');
const sequelize = require('./config/database');

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3001;

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'auth-service',
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Auth Service Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Database connection and server start
sequelize.authenticate()
  .then(() => {
    logger.info('Auth Service: Database connected successfully');
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🔐 Auth Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    logger.error('Auth Service: Unable to connect to database:', err);
    process.exit(1);
  });

module.exports = app;
