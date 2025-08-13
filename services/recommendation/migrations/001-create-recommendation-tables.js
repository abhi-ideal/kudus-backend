
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create user_preferences table
    await queryInterface.createTable('user_preferences', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true
      },
      preferredGenres: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      dislikedGenres: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      preferredLanguages: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      watchTimePatterns: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      contentTypePreferences: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      ratingHistory: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      lastUpdated: {
        type: Sequelize.DATE,
        allowNull: false
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

    // Create recommendations table
    await queryInterface.createTable('recommendations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      contentId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      score: {
        type: Sequelize.DECIMAL(3,2),
        allowNull: false
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      recommendationType: {
        type: Sequelize.ENUM('personalized', 'trending', 'similar', 'collaborative'),
        allowNull: false
      },
      isViewed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      viewedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isClicked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      clickedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false
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

    // Create content_similarity table
    await queryInterface.createTable('content_similarity', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      contentId1: {
        type: Sequelize.UUID,
        allowNull: false
      },
      contentId2: {
        type: Sequelize.UUID,
        allowNull: false
      },
      similarityScore: {
        type: Sequelize.DECIMAL(3,2),
        allowNull: false
      },
      similarityType: {
        type: Sequelize.ENUM('genre', 'cast', 'director', 'user_behavior'),
        allowNull: false
      },
      calculatedAt: {
        type: Sequelize.DATE,
        allowNull: false
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

    // Add indexes
    await queryInterface.addIndex('user_preferences', ['userId']);
    await queryInterface.addIndex('recommendations', ['userId']);
    await queryInterface.addIndex('recommendations', ['contentId']);
    await queryInterface.addIndex('recommendations', ['score']);
    await queryInterface.addIndex('recommendations', ['expiresAt']);
    await queryInterface.addIndex('content_similarity', ['contentId1']);
    await queryInterface.addIndex('content_similarity', ['contentId2']);
    await queryInterface.addIndex('content_similarity', ['similarityScore']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('content_similarity');
    await queryInterface.dropTable('recommendations');
    await queryInterface.dropTable('user_preferences');
  }
};
