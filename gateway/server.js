
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// Using console for logging

const app = express();
const PORT = process.env.GATEWAY_PORT || 5000;

// Trust proxy for rate limiting in production
app.set('trust proxy', true);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Service configurations
const services = {
  auth: {
    target: `http://localhost:${process.env.AUTH_SERVICE_PORT || 3001}`,
    pathRewrite: { '^/api/auth': '/api/auth' }
  },
  users: {
    target: `http://localhost:${process.env.USER_SERVICE_PORT || 3002}`,
    pathRewrite: { '^/api/users': '/api/users' }
  },
  content: {
    target: `http://localhost:${process.env.CONTENT_SERVICE_PORT || 3003}`,
    pathRewrite: { '^/api/content': '/api/content' }
  },
  streaming: {
    target: `http://localhost:${process.env.STREAMING_SERVICE_PORT || 3004}`,
    pathRewrite: { '^/api/streaming': '/api/streaming' }
  },
  recommendations: {
    target: `http://localhost:${process.env.RECOMMENDATION_SERVICE_PORT || 3005}`,
    pathRewrite: { '^/api/recommendations': '/api/recommendations' }
  },
  admin: {
    target: `http://localhost:${process.env.ADMIN_SERVICE_PORT || 3006}`,
    pathRewrite: { '^/api/admin': '/api/admin' }
  }
};

// Create proxy middlewares
Object.keys(services).forEach(service => {
  const serviceConfig = services[service];
  app.use(`/api/${service}`, createProxyMiddleware({
    target: serviceConfig.target,
    changeOrigin: true,
    pathRewrite: serviceConfig.pathRewrite,
    onError: (err, req, res) => {
      console.error(`Proxy error for ${service} service:`, err.message);
      res.status(503).json({
        error: 'Service Unavailable',
        message: `${service} service is currently unavailable`
      });
    }
  }));
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OTT Platform API Gateway',
      version: '1.0.0',
      description: 'Netflix-style OTT Platform Microservices Gateway',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development API Gateway',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./services/*/routes.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Gateway health check
app.get('/health', async (req, res) => {
  const healthChecks = {};
  
  // Check each service health
  for (const [serviceName, config] of Object.entries(services)) {
    try {
      const response = await fetch(`${config.target}/api/${serviceName}/health`);
      healthChecks[serviceName] = {
        status: response.ok ? 'healthy' : 'unhealthy',
        statusCode: response.status
      };
    } catch (error) {
      healthChecks[serviceName] = {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  const overallStatus = Object.values(healthChecks).every(service => service.status === 'healthy') ? 'healthy' : 'degraded';

  res.status(overallStatus === 'healthy' ? 200 : 503).json({
    gateway: 'API Gateway',
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: healthChecks
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint was not found'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 API Gateway running on port ${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log('🔗 Routing requests to microservices:');
  Object.keys(services).forEach(service => {
    console.log(`  - /${service} -> ${services[service].target}`);
  });
});

module.exports = app;
