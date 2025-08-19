
const { sequelize } = require('../config/config');

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
