
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('content', 'isFeatured', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this content is featured by admin'
    });

    await queryInterface.addColumn('content', 'featuredAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When this content was featured'
    });

    // Add index for better query performance
    await queryInterface.addIndex('content', ['isFeatured'], {
      name: 'idx_content_featured'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('content', 'idx_content_featured');
    await queryInterface.removeColumn('content', 'featuredAt');
    await queryInterface.removeColumn('content', 'isFeatured');
  }
};
