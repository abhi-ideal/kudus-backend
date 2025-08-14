
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
      displayName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      profilePicture: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      subscriptionType: {
        type: Sequelize.ENUM('free', 'basic', 'premium', 'family'),
        defaultValue: 'free'
      },
      subscriptionStatus: {
        type: Sequelize.ENUM('active', 'inactive', 'canceled', 'expired'),
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
      parentalControls: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      language: {
        type: Sequelize.STRING,
        defaultValue: 'en'
      },
      country: {
        type: Sequelize.STRING(2),
        allowNull: true
      },
      timezone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      emailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    // Create user_profiles table
    await queryInterface.createTable('user_profiles', {
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
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      avatar: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isKidsProfile: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      ageRating: {
        type: Sequelize.ENUM('G', 'PG', 'PG-13', 'R', 'NC-17'),
        defaultValue: 'R'
      },
      language: {
        type: Sequelize.STRING,
        defaultValue: 'en'
      },
      autoplayNext: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      autoplayPreviews: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      subtitles: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      subtitleLanguage: {
        type: Sequelize.STRING,
        defaultValue: 'en'
      },
      audioLanguage: {
        type: Sequelize.STRING,
        defaultValue: 'en'
      },
      maturityLevel: {
        type: Sequelize.INTEGER,
        defaultValue: 18
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

    // Add indexes for users table
    await queryInterface.addIndex('users', ['firebaseUid']);
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['subscriptionType']);
    await queryInterface.addIndex('users', ['subscriptionStatus']);
    await queryInterface.addIndex('users', ['isActive']);

    // Add indexes for user_profiles table
    await queryInterface.addIndex('user_profiles', ['userId']);
    await queryInterface.addIndex('user_profiles', ['isKidsProfile']);
    await queryInterface.addIndex('user_profiles', ['isActive']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_profiles');
    await queryInterface.dropTable('users');
  }
};
