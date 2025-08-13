
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create admin_users table
    await queryInterface.createTable('admin_users', {
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
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('super_admin', 'admin', 'content_manager', 'analytics_viewer'),
        allowNull: false
      },
      permissions: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.UUID,
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

    // Create content_moderation table
    await queryInterface.createTable('content_moderation', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      contentId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      moderatorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'admin_users',
          key: 'id'
        }
      },
      action: {
        type: Sequelize.ENUM('approved', 'rejected', 'flagged', 'archived'),
        allowNull: false
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      previousStatus: {
        type: Sequelize.STRING,
        allowNull: true
      },
      newStatus: {
        type: Sequelize.STRING,
        allowNull: false
      },
      moderatedAt: {
        type: Sequelize.DATE,
        allowNull: false
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

    // Create system_analytics table
    await queryInterface.createTable('system_analytics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      totalUsers: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      activeUsers: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      newUsers: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalContent: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      publishedContent: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalViews: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalWatchTime: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      subscriptionRevenue: {
        type: Sequelize.DECIMAL(10,2),
        defaultValue: 0.00
      },
      bandwidthUsage: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      storageUsage: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      errorCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      averageResponseTime: {
        type: Sequelize.DECIMAL(6,2),
        defaultValue: 0.00
      },
      topContent: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      userEngagement: {
        type: Sequelize.JSON,
        defaultValue: {}
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

    // Create audit_logs table
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      userType: {
        type: Sequelize.ENUM('admin', 'user', 'system'),
        allowNull: false
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false
      },
      resource: {
        type: Sequelize.STRING,
        allowNull: false
      },
      resourceId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      details: {
        type: Sequelize.JSON,
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      success: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false
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
    await queryInterface.addIndex('admin_users', ['firebaseUid']);
    await queryInterface.addIndex('admin_users', ['email']);
    await queryInterface.addIndex('admin_users', ['role']);
    await queryInterface.addIndex('content_moderation', ['contentId']);
    await queryInterface.addIndex('content_moderation', ['moderatorId']);
    await queryInterface.addIndex('content_moderation', ['moderatedAt']);
    await queryInterface.addIndex('system_analytics', ['date'], { unique: true });
    await queryInterface.addIndex('audit_logs', ['userId']);
    await queryInterface.addIndex('audit_logs', ['action']);
    await queryInterface.addIndex('audit_logs', ['resource']);
    await queryInterface.addIndex('audit_logs', ['timestamp']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('system_analytics');
    await queryInterface.dropTable('content_moderation');
    await queryInterface.dropTable('admin_users');
  }
};
