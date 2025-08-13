
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const userId1 = uuidv4();
    const userId2 = uuidv4();
    
    await queryInterface.bulkInsert('users', [
      {
        id: userId1,
        firebaseUid: 'firebase_uid_1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        displayName: 'Admin User',
        subscriptionType: 'premium',
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        preferences: JSON.stringify({
          autoplay: true,
          quality: 'HD',
          subtitles: true
        }),
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: userId2,
        firebaseUid: 'firebase_uid_2',
        email: 'user@example.com',
        firstName: 'Regular',
        lastName: 'User',
        displayName: 'Regular User',
        subscriptionType: 'basic',
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        preferences: JSON.stringify({
          autoplay: false,
          quality: 'SD',
          subtitles: false
        }),
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Add some watch history
    await queryInterface.bulkInsert('watch_history', [
      {
        id: uuidv4(),
        userId: userId1,
        contentId: uuidv4(),
        watchedAt: new Date(),
        duration: 120,
        watchedDuration: 45,
        progress: 37.5,
        completed: false,
        rating: 5,
        deviceType: 'desktop',
        resumePosition: 45,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        userId: userId2,
        contentId: uuidv4(),
        watchedAt: new Date(),
        duration: 45,
        watchedDuration: 45,
        progress: 100.0,
        completed: true,
        rating: 4,
        deviceType: 'mobile',
        resumePosition: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('watch_history', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
