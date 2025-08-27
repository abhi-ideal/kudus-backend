
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove index first
    try {
      await queryInterface.removeIndex('content', 'idx_content_featured');
    } catch (error) {
      console.log('Index idx_content_featured may not exist, skipping removal');
    }

    // Remove the isFeatured column
    await queryInterface.removeColumn('content', 'isFeatured');

    // Add new index for featuredAt
    await queryInterface.addIndex('content', ['featuredAt'], {
      name: 'idx_content_featured_at'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the new index
    await queryInterface.removeIndex('content', 'idx_content_featured_at');

    // Re-add the isFeatured column
    await queryInterface.addColumn('content', 'isFeatured', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this content is featured by admin'
    });

    // Re-add the original index
    await queryInterface.addIndex('content', ['isFeatured'], {
      name: 'idx_content_featured'
    });
  }
};
