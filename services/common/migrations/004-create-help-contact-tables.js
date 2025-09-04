
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Help Articles table
    await queryInterface.createTable('HelpArticles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM('account', 'billing', 'streaming', 'features', 'content', 'general'),
        defaultValue: 'general'
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true
      },
      isPublished: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isFAQ: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      viewCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      createdBy: {
        type: Sequelize.STRING,
        allowNull: false
      },
      updatedBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create Contact Us table
    await queryInterface.createTable('ContactUs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('new', 'in_progress', 'resolved', 'closed'),
        defaultValue: 'new'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      adminResponse: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      respondedBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      respondedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('HelpArticles', ['category']);
    await queryInterface.addIndex('HelpArticles', ['isPublished']);
    await queryInterface.addIndex('HelpArticles', ['isFAQ']);
    await queryInterface.addIndex('HelpArticles', ['order']);
    await queryInterface.addIndex('ContactUs', ['status']);
    await queryInterface.addIndex('ContactUs', ['priority']);
    await queryInterface.addIndex('ContactUs', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('HelpArticles');
    await queryInterface.dropTable('ContactUs');
  }
};
