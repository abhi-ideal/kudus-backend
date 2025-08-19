
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.test') });

// Skip Firebase initialization in test environment
// Tests will mock Firebase authentication
if (process.env.NODE_ENV !== 'test') {
  const admin = require('firebase-admin');
  
  if (!admin.apps.length) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
}

// Test setup
module.exports = {
  setupDatabase: async () => {
    // Import sequelize after environment is loaded
    const { sequelize } = require('../config/database');
    // Sync database for tests
    await sequelize.sync({ force: true });
  },

  teardownDatabase: async () => {
    // Import sequelize after environment is loaded
    const { sequelize } = require('../config/database');
    // Clean up database after tests
    await sequelize.drop();
    await sequelize.close();
  }
};
