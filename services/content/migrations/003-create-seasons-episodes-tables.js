
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create seasons table
    await queryInterface.createTable('seasons', {
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
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      posterImages: {
        type: Sequelize.JSON,
        defaultValue: JSON.stringify({
          thumbnail: null,
          medium: null,
          hd: null,
          original: null
        })
      },
      releaseDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      totalEpisodes: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('upcoming', 'airing', 'completed', 'cancelled'),
        defaultValue: 'upcoming'
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

    // Create episodes table
    await queryInterface.createTable('episodes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      seasonId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'seasons',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      thumbnailUrl: {
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
      videoQualities: {
        type: Sequelize.JSON,
        defaultValue: JSON.stringify({})
      },
      airDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rating: {
        type: Sequelize.DECIMAL(3,2),
        defaultValue: 0.00
      },
      views: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      likes: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('draft', 'processing', 'published', 'archived'),
        defaultValue: 'draft'
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
    await queryInterface.addIndex('seasons', ['seriesId']);
    await queryInterface.addIndex('seasons', ['seriesId', 'seasonNumber'], { unique: true });
    await queryInterface.addIndex('seasons', ['status']);
    await queryInterface.addIndex('seasons', ['isActive']);

    await queryInterface.addIndex('episodes', ['seasonId']);
    await queryInterface.addIndex('episodes', ['seriesId']);
    await queryInterface.addIndex('episodes', ['seasonId', 'episodeNumber'], { unique: true });
    await queryInterface.addIndex('episodes', ['status']);
    await queryInterface.addIndex('episodes', ['isActive']);
    await queryInterface.addIndex('episodes', ['airDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('episodes');
    await queryInterface.dropTable('seasons');
  }
};
