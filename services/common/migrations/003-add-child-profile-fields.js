
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('genres', 'showOnChildProfile', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether this genre should be shown to child profiles'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('genres', 'showOnChildProfile');
  }
};
