const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.test') });

// Initialize Firebase Admin for tests
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

const sequelize = require('../config/database');

// Test setup
module.exports = {
  setupDatabase: async () => {
    // Sync database for tests
    await sequelize.sync({ force: true });
  },

  teardownDatabase: async () => {
    // Clean up database after tests
    await sequelize.drop();
    await sequelize.close();
  }
};