
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const superAdminId = uuidv4();
    const adminId = uuidv4();
    const contentManagerId = uuidv4();
    
    // Add admin users
    await queryInterface.bulkInsert('admin_users', [
      {
        id: superAdminId,
        firebaseUid: 'super_admin_firebase_uid',
        email: 'superadmin@ottplatform.com',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        permissions: JSON.stringify([
          'user_management',
          'content_management',
          'system_settings',
          'analytics',
          'moderation',
          'billing'
        ]),
        isActive: true,
        lastLoginAt: new Date(),
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: adminId,
        firebaseUid: 'admin_firebase_uid',
        email: 'admin@ottplatform.com',
        firstName: 'Platform',
        lastName: 'Admin',
        role: 'admin',
        permissions: JSON.stringify([
          'user_management',
          'content_management',
          'analytics',
          'moderation'
        ]),
        isActive: true,
        lastLoginAt: new Date(),
        createdBy: superAdminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: contentManagerId,
        firebaseUid: 'content_manager_firebase_uid',
        email: 'content@ottplatform.com',
        firstName: 'Content',
        lastName: 'Manager',
        role: 'content_manager',
        permissions: JSON.stringify([
          'content_management',
          'moderation'
        ]),
        isActive: true,
        lastLoginAt: new Date(),
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Add content moderation records
    const contentId1 = uuidv4();
    const contentId2 = uuidv4();
    
    await queryInterface.bulkInsert('content_moderation', [
      {
        id: uuidv4(),
        contentId: contentId1,
        moderatorId: contentManagerId,
        action: 'approved',
        reason: 'Content meets platform guidelines',
        notes: 'High quality production, suitable for all audiences',
        previousStatus: 'pending',
        newStatus: 'published',
        moderatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        contentId: contentId2,
        moderatorId: adminId,
        action: 'flagged',
        reason: 'Requires age verification',
        notes: 'Content contains mature themes, updated age rating to R',
        previousStatus: 'published',
        newStatus: 'flagged',
        moderatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Add system analytics
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    await queryInterface.bulkInsert('system_analytics', [
      {
        id: uuidv4(),
        date: today.toISOString().split('T')[0],
        totalUsers: 15420,
        activeUsers: 8940,
        newUsers: 234,
        totalContent: 2156,
        publishedContent: 1987,
        totalViews: 45678,
        totalWatchTime: 567890, // in minutes
        subscriptionRevenue: 125478.50,
        bandwidthUsage: 5674839274, // in bytes
        storageUsage: 2847392847, // in bytes
        errorCount: 23,
        averageResponseTime: 245.67,
        topContent: JSON.stringify([
          { contentId: contentId1, title: 'Popular Movie', views: 5423 },
          { contentId: contentId2, title: 'Trending Series', views: 4892 }
        ]),
        userEngagement: JSON.stringify({
          averageSessionDuration: 78.5,
          bounceRate: 12.3,
          returnUserRate: 67.8
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        date: yesterday.toISOString().split('T')[0],
        totalUsers: 15186,
        activeUsers: 9234,
        newUsers: 198,
        totalContent: 2154,
        publishedContent: 1985,
        totalViews: 43892,
        totalWatchTime: 548320,
        subscriptionRevenue: 124892.75,
        bandwidthUsage: 5234829374,
        storageUsage: 2834729384,
        errorCount: 18,
        averageResponseTime: 234.12,
        topContent: JSON.stringify([
          { contentId: contentId1, title: 'Popular Movie', views: 5234 },
          { contentId: contentId2, title: 'Trending Series', views: 4567 }
        ]),
        userEngagement: JSON.stringify({
          averageSessionDuration: 76.2,
          bounceRate: 13.1,
          returnUserRate: 66.4
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Add audit logs
    await queryInterface.bulkInsert('audit_logs', [
      {
        id: uuidv4(),
        userId: superAdminId,
        userType: 'admin',
        action: 'CREATE_USER',
        resource: 'admin_users',
        resourceId: adminId,
        details: JSON.stringify({
          email: 'admin@ottplatform.com',
          role: 'admin'
        }),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        success: true,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        userId: contentManagerId,
        userType: 'admin',
        action: 'MODERATE_CONTENT',
        resource: 'content',
        resourceId: contentId1,
        details: JSON.stringify({
          action: 'approved',
          previousStatus: 'pending',
          newStatus: 'published'
        }),
        ipAddress: '10.0.0.50',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        success: true,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        userId: null,
        userType: 'system',
        action: 'BACKUP_DATABASE',
        resource: 'system',
        resourceId: 'daily_backup',
        details: JSON.stringify({
          size: '2.4GB',
          tables: 15,
          duration: '45 minutes'
        }),
        ipAddress: null,
        userAgent: 'System/Cron',
        success: true,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('audit_logs', null, {});
    await queryInterface.bulkDelete('system_analytics', null, {});
    await queryInterface.bulkDelete('content_moderation', null, {});
    await queryInterface.bulkDelete('admin_users', null, {});
  }
};
