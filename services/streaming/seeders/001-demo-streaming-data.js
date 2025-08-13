
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const sessionId1 = uuidv4();
    const sessionId2 = uuidv4();
    const contentId1 = uuidv4();
    const contentId2 = uuidv4();
    const userId1 = uuidv4();
    const userId2 = uuidv4();
    
    // Add streaming sessions
    await queryInterface.bulkInsert('streaming_sessions', [
      {
        id: sessionId1,
        userId: userId1,
        contentId: contentId1,
        sessionToken: 'session_token_1_' + Date.now(),
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        duration: 90 * 60, // 90 minutes
        quality: '1080p',
        deviceType: 'Smart TV',
        deviceId: 'samsung_tv_123',
        ipAddress: '192.168.1.100',
        userAgent: 'SmartTV/Samsung',
        bandwidth: 25000,
        bufferingEvents: JSON.stringify([
          { timestamp: 300, duration: 2 },
          { timestamp: 1800, duration: 1 }
        ]),
        qualityChanges: JSON.stringify([
          { timestamp: 120, from: '720p', to: '1080p' }
        ]),
        pauseEvents: JSON.stringify([
          { timestamp: 900, duration: 300 },
          { timestamp: 2700, duration: 180 }
        ]),
        seekEvents: JSON.stringify([
          { timestamp: 600, from: 580, to: 620 }
        ]),
        isActive: false,
        lastHeartbeat: new Date(Date.now() - 30 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: sessionId2,
        userId: userId2,
        contentId: contentId2,
        sessionToken: 'session_token_2_' + Date.now(),
        startTime: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        endTime: null,
        duration: 45 * 60, // 45 minutes so far
        quality: '720p',
        deviceType: 'Mobile',
        deviceId: 'iphone_12_456',
        ipAddress: '10.0.0.50',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        bandwidth: 8000,
        bufferingEvents: JSON.stringify([
          { timestamp: 600, duration: 3 },
          { timestamp: 1200, duration: 2 },
          { timestamp: 2100, duration: 4 }
        ]),
        qualityChanges: JSON.stringify([
          { timestamp: 180, from: '1080p', to: '720p' },
          { timestamp: 900, from: '720p', to: '480p' },
          { timestamp: 1500, from: '480p', to: '720p' }
        ]),
        pauseEvents: JSON.stringify([
          { timestamp: 1800, duration: 120 }
        ]),
        seekEvents: JSON.stringify([]),
        isActive: true,
        lastHeartbeat: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Add video analytics
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    await queryInterface.bulkInsert('video_analytics', [
      {
        id: uuidv4(),
        contentId: contentId1,
        date: today.toISOString().split('T')[0],
        totalViews: 152,
        uniqueViewers: 98,
        totalWatchTime: 8640, // 144 hours in minutes
        averageWatchTime: 88.16,
        completionRate: 67.50,
        qualityDistribution: JSON.stringify({
          '240p': 5,
          '360p': 12,
          '480p': 25,
          '720p': 35,
          '1080p': 23
        }),
        deviceDistribution: JSON.stringify({
          'Smart TV': 45,
          'Desktop': 30,
          'Mobile': 20,
          'Tablet': 5
        }),
        geographicDistribution: JSON.stringify({
          'US': 60,
          'CA': 15,
          'UK': 12,
          'DE': 8,
          'Other': 5
        }),
        bufferingIncidents: 23,
        averageBufferingTime: 2.34,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        contentId: contentId2,
        date: today.toISOString().split('T')[0],
        totalViews: 89,
        uniqueViewers: 67,
        totalWatchTime: 3825, // 63.75 hours in minutes
        averageWatchTime: 57.09,
        completionRate: 72.10,
        qualityDistribution: JSON.stringify({
          '240p': 8,
          '360p': 15,
          '480p': 28,
          '720p': 31,
          '1080p': 18
        }),
        deviceDistribution: JSON.stringify({
          'Smart TV': 38,
          'Desktop': 35,
          'Mobile': 22,
          'Tablet': 5
        }),
        geographicDistribution: JSON.stringify({
          'US': 55,
          'CA': 18,
          'UK': 15,
          'DE': 7,
          'Other': 5
        }),
        bufferingIncidents: 15,
        averageBufferingTime: 1.89,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        contentId: contentId1,
        date: yesterday.toISOString().split('T')[0],
        totalViews: 134,
        uniqueViewers: 87,
        totalWatchTime: 7560, // 126 hours in minutes
        averageWatchTime: 86.90,
        completionRate: 65.20,
        qualityDistribution: JSON.stringify({
          '240p': 6,
          '360p': 14,
          '480p': 26,
          '720p': 33,
          '1080p': 21
        }),
        deviceDistribution: JSON.stringify({
          'Smart TV': 42,
          'Desktop': 32,
          'Mobile': 21,
          'Tablet': 5
        }),
        geographicDistribution: JSON.stringify({
          'US': 58,
          'CA': 16,
          'UK': 13,
          'DE': 8,
          'Other': 5
        }),
        bufferingIncidents: 19,
        averageBufferingTime: 2.12,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('video_analytics', null, {});
    await queryInterface.bulkDelete('streaming_sessions', null, {});
  }
};
