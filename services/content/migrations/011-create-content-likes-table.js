
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('content_likes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      profileId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'user_profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      contentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'content',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      likedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add unique constraint
    await queryInterface.addIndex('content_likes', {
      fields: ['profileId', 'contentId'],
      unique: true,
      name: 'content_likes_profile_content_unique'
    });

    // Add indexes for performance
    await queryInterface.addIndex('content_likes', {
      fields: ['contentId'],
      name: 'content_likes_content_id_index'
    });

    await queryInterface.addIndex('content_likes', {
      fields: ['profileId'],
      name: 'content_likes_profile_id_index'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('content_likes');
  }
};
