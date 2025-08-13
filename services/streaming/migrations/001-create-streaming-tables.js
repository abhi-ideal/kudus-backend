
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create streaming_sessions table
    await queryInterface.createTable('streaming_sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      contentId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      sessionToken: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      duration: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      quality: {
        type: Sequelize.ENUM('240p', '360p', '480p', '720p', '1080p', '4K'),
        defaultValue: '720p'
      },
      deviceType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      deviceId: {
        type: Sequelize.STRING,
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
      bandwidth: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      bufferingEvents: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      qualityChanges: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      pauseEvents: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      seekEvents: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      lastHeartbeat: {
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

    // Create video_analytics table
    await queryInterface.createTable('video_analytics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      contentId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      totalViews: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      uniqueViewers: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalWatchTime: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      averageWatchTime: {
        type: Sequelize.DECIMAL(10,2),
        defaultValue: 0.00
      },
      completionRate: {
        type: Sequelize.DECIMAL(5,2),
        defaultValue: 0.00
      },
      qualityDistribution: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      deviceDistribution: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      geographicDistribution: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      bufferingIncidents: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      averageBufferingTime: {
        type: Sequelize.DECIMAL(10,2),
        defaultValue: 0.00
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
    await queryInterface.addIndex('streaming_sessions', ['userId']);
    await queryInterface.addIndex('streaming_sessions', ['contentId']);
    await queryInterface.addIndex('streaming_sessions', ['sessionToken']);
    await queryInterface.addIndex('streaming_sessions', ['startTime']);
    await queryInterface.addIndex('streaming_sessions', ['isActive']);
    await queryInterface.addIndex('video_analytics', ['contentId']);
    await queryInterface.addIndex('video_analytics', ['date']);
    
    // Add composite index for unique constraint
    await queryInterface.addIndex('video_analytics', ['contentId', 'date'], {
      unique: true,
      name: 'unique_content_date'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('video_analytics');
    await queryInterface.dropTable('streaming_sessions');
  }
};
