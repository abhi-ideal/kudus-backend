
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Support/Contact table
    await queryInterface.createTable('Support', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
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
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM('general', 'technical', 'billing', 'account', 'content', 'other'),
        defaultValue: 'general'
      },
      status: {
        type: Sequelize.ENUM('open', 'in_progress', 'resolved', 'closed'),
        defaultValue: 'open'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      adminResponse: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      resolvedAt: {
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

    // Create Privacy Policy table
    await queryInterface.createTable('PrivacyPolicy', {
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
      version: {
        type: Sequelize.STRING,
        allowNull: false
      },
      effectiveDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdBy: {
        type: Sequelize.STRING,
        allowNull: false
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

    // Create Terms and Conditions table
    await queryInterface.createTable('TermsConditions', {
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
      version: {
        type: Sequelize.STRING,
        allowNull: false
      },
      effectiveDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdBy: {
        type: Sequelize.STRING,
        allowNull: false
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
    await queryInterface.addIndex('Support', ['status']);
    await queryInterface.addIndex('Support', ['category']);
    await queryInterface.addIndex('Support', ['createdAt']);
    await queryInterface.addIndex('PrivacyPolicy', ['isActive']);
    await queryInterface.addIndex('PrivacyPolicy', ['effectiveDate']);
    await queryInterface.addIndex('TermsConditions', ['isActive']);
    await queryInterface.addIndex('TermsConditions', ['effectiveDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Support');
    await queryInterface.dropTable('PrivacyPolicy');
    await queryInterface.dropTable('TermsConditions');
  }
};
