
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      firebaseUid: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      displayName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      profilePicture: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      dateOfBirth: {
        type: Sequelize.DATE,
        allowNull: true
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true
      },
      language: {
        type: Sequelize.STRING,
        defaultValue: 'en'
      },
      subscriptionType: {
        type: Sequelize.ENUM('free', 'basic', 'premium'),
        defaultValue: 'free'
      },
      subscriptionStatus: {
        type: Sequelize.ENUM('active', 'inactive', 'cancelled', 'expired'),
        defaultValue: 'inactive'
      },
      subscriptionStartDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      subscriptionEndDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      preferences: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      lastLoginAt: {
        type: Sequelize.DATE,
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

    // Create watch_history table
    await queryInterface.createTable('watch_history', {
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
      contentId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      watchedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      watchedDuration: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      progress: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.00
      },
      completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      deviceType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      resumePosition: {
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

    // Add indexes
    await queryInterface.addIndex('users', ['firebaseUid']);
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('watch_history', ['userId']);
    await queryInterface.addIndex('watch_history', ['contentId']);
    await queryInterface.addIndex('watch_history', ['watchedAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('watch_history');
    await queryInterface.dropTable('users');
  }
};
