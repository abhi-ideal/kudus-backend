
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove views column if it exists
    try {
      await queryInterface.removeColumn('content', 'views');
    } catch (error) {
      console.log('Views column does not exist in content table');
    }

    // Remove likes column if it exists
    try {
      await queryInterface.removeColumn('content', 'likes');
    } catch (error) {
      console.log('Likes column does not exist in content table');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Add views column back
    await queryInterface.addColumn('content', 'views', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    // Add likes column back
    await queryInterface.addColumn('content', 'likes', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
  }
};
