
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
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
        type: Sequelize.TEXT
      },
      type: {
        type: Sequelize.ENUM('movie', 'series', 'episode'),
        allowNull: false
      },
      genre: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      releaseDate: {
        type: Sequelize.DATE
      },
      duration: {
        type: Sequelize.INTEGER
      },
      rating: {
        type: Sequelize.ENUM('G', 'PG', 'PG-13', 'R', 'NC-17'),
        defaultValue: 'PG'
      },
      cast: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      director: {
        type: Sequelize.STRING
      },
      poster: {
        type: Sequelize.STRING
      },
      thumbnail: {
        type: Sequelize.STRING
      },
      trailerUrl: {
        type: Sequelize.STRING
      },
      s3Key: {
        type: Sequelize.STRING
      },
      videoQualities: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      views: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      averageRating: {
        type: Sequelize.DECIMAL(2, 1),
        defaultValue: 0.0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('content', ['type']);
    await queryInterface.addIndex('content', ['isActive']);
    await queryInterface.addIndex('content', ['views']);
    await queryInterface.addIndex('content', ['averageRating']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('content');
  }
};
