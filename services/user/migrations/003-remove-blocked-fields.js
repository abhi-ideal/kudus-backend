
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns exist before trying to remove them
    const tableDescription = await queryInterface.describeTable('users');
    
    if (tableDescription.blockedReason) {
      await queryInterface.removeColumn('users', 'blockedReason');
    }
    
    if (tableDescription.blockedAt) {
      await queryInterface.removeColumn('users', 'blockedAt');
    }
    
    console.log('Removed blockedReason and blockedAt columns from users table');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'blockedReason', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'blockedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  }
};
