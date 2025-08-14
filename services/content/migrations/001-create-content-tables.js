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
      itemId: {
        type: Sequelize.UUID,
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
      availableCountries: {
        type: Sequelize.JSON,
        defaultValue: [],
        comment: 'List of country codes where content is available. Empty array means available globally'
      },
      restrictedCountries: {
        type: Sequelize.JSON,
        defaultValue: [],
        comment: 'List of country codes where content is restricted'
      },
      isGloballyAvailable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'If true, content is available globally unless restricted'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
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

    // Create watchlist table
    await queryInterface.createTable('watchlist', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      profileId: {
        type: Sequelize.UUID,
        allowNull: false
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
      addedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
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

    // Create watch_history table
    await queryInterface.createTable('watch_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      profileId: {
        type: Sequelize.UUID,
        allowNull: false
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
      episodeId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      watchedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      watchDuration: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalDuration: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      progressPercentage: {
        type: Sequelize.DECIMAL(5,2),
        defaultValue: 0.00
      },
      isCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      deviceType: {
        type: Sequelize.ENUM('web', 'mobile', 'tv', 'tablet'),
        allowNull: true
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
    await queryInterface.addIndex('content', ['isActive']);
    await queryInterface.addIndex('content', ['releaseYear']);
    await queryInterface.addIndex('watchlist', ['profileId']);
    await queryInterface.addIndex('watchlist', ['contentId']);
    await queryInterface.addIndex('watchlist', ['profileId', 'contentId'], { unique: true });
    await queryInterface.addIndex('watch_history', ['profileId']);
    await queryInterface.addIndex('watch_history', ['contentId']);
    await queryInterface.addIndex('watch_history', ['watchedAt']);
    await queryInterface.addIndex('watch_history', ['isCompleted']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('watch_history');
    await queryInterface.dropTable('watchlist');
    await queryInterface.dropTable('content_episodes');
    await queryInterface.dropTable('content');
  }
};