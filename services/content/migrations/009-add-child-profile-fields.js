
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('content_items', 'showOnChildProfile', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether this content item should be shown to child profiles'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('content_items', 'showOnChildProfile');
  }
};
