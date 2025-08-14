
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create content table
    await queryInterface.createTable('content', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('movie', 'series', 'documentary', 'short'),
        allowNull: false
      },
      genre: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      releaseYear: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      rating: {
        type: Sequelize.ENUM('G', 'PG', 'PG-13', 'R', 'NC-17', 'U', '12A', '15', '18'),
        defaultValue: 'PG'
      },
      ageRating: {
        type: Sequelize.STRING,
        defaultValue: 'PG'
      },
      language: {
        type: Sequelize.STRING,
        defaultValue: 'English'
      },
      subtitles: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      cast: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      characters: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      director: {
        type: Sequelize.STRING,
        allowNull: true
      },
      producer: {
        type: Sequelize.STRING,
        allowNull: true
      },
      thumbnailUrl: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      posterImages: {
        type: Sequelize.JSON,
        defaultValue: {
          thumbnail: null,
          medium: null,
          hd: null,
          original: null
        }
      },
      items: {
        type: Sequelize.ENUM('drama-delights', 'sparks-your-digital-superstars', 'documentary-shows', 'action-adventures', 'comedy-classics', 'thriller-zone'),
        allowNull: true
      },
      trailerUrl: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      videoUrl: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      s3Key: {
        type: Sequelize.STRING,
        allowNull: true
      },
      s3Bucket: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cloudfrontUrl: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('draft', 'processing', 'published', 'archived'),
        defaultValue: 'draft'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      views: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      likes: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      averageRating: {
        type: Sequelize.DECIMAL(2,1),
        defaultValue: 0.0
      },
      totalRatings: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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

    // Create content_episodes table for series
    await queryInterface.createTable('content_episodes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      seriesId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'content',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      seasonNumber: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      episodeNumber: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      videoUrl: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      s3Key: {
        type: Sequelize.STRING,
        allowNull: true
      },
      thumbnailUrl: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      airDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
    await queryInterface.addIndex('content', ['type']);
    await queryInterface.addIndex('content', ['status']);
    await queryInterface.addIndex('content', ['releaseYear']);
    await queryInterface.addIndex('content', ['rating']);
    await queryInterface.addIndex('content_episodes', ['seriesId']);
    await queryInterface.addIndex('content_episodes', ['seasonNumber', 'episodeNumber']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('content_episodes');
    await queryInterface.dropTable('content');
  }
};
