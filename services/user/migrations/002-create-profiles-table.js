
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
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
      profileName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isChild: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      avatarUrl: {
        type: Sequelize.TEXT,
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
    await queryInterface.addIndex('user_profiles', ['userId']);
    await queryInterface.addIndex('user_profiles', ['isChild']);
    await queryInterface.addIndex('user_profiles', ['isActive']);
    
    // Add unique constraint for profile name per user
    await queryInterface.addIndex('user_profiles', ['userId', 'profileName'], {
      unique: true,
      name: 'unique_profile_name_per_user'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_profiles');
  }
};
