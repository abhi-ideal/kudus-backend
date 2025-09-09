
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create content_likes table
    await queryInterface.createTable('content_likes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      profileId: {
        type: Sequelize.UUID,
        allowNull: true,
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
        comment: 'References content.id from content service'
      },
      isLiked: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'True for like, false for dislike'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create unique constraint to prevent duplicate likes from same user/profile for same content
    await queryInterface.addIndex('content_likes', {
      fields: ['userId', 'profileId', 'contentId'],
      unique: true,
      name: 'unique_user_profile_content_like'
    });

    // Create index for faster queries
    await queryInterface.addIndex('content_likes', {
      fields: ['contentId', 'isLiked'],
      name: 'idx_content_likes_content_liked'
    });

    await queryInterface.addIndex('content_likes', {
      fields: ['userId', 'profileId'],
      name: 'idx_content_likes_user_profile'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('content_likes');
  }
};
