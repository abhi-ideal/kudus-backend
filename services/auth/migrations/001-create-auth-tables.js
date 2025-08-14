
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create auth_sessions table for token management
    await queryInterface.createTable('auth_sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
        index: true
      },
      firebaseUid: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      refreshToken: {
        type: Sequelize.TEXT,
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
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create auth_tokens table for JWT management
    await queryInterface.createTable('auth_tokens', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('access', 'refresh'),
        allowNull: false
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      isRevoked: {
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

    // Add indexes
    await queryInterface.addIndex('auth_sessions', ['firebaseUid']);
    await queryInterface.addIndex('auth_sessions', ['email']);
    await queryInterface.addIndex('auth_tokens', ['userId']);
    await queryInterface.addIndex('auth_tokens', [{
      name: 'token',
      length: 255
    }], {
      name: 'auth_tokens_token_prefix'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('auth_tokens');
    await queryInterface.dropTable('auth_sessions');
  }
};
