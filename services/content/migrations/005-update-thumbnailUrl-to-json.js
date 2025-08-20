
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update content table - change thumbnailUrl to JSON
    await queryInterface.changeColumn('content', 'thumbnailUrl', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {
        thumbnail: null,
        medium: null,
        hd: null,
        original: null
      }
    });

    // Update episodes table - change thumbnailUrl to JSON
    await queryInterface.changeColumn('episodes', 'thumbnailUrl', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {
        thumbnail: null,
        medium: null,
        hd: null,
        original: null
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert content table - change thumbnailUrl back to TEXT
    await queryInterface.changeColumn('content', 'thumbnailUrl', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Revert episodes table - change thumbnailUrl back to TEXT
    await queryInterface.changeColumn('episodes', 'thumbnailUrl', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  }
};
