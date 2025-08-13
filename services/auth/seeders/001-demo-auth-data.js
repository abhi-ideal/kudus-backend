
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('auth_sessions', [
      {
        id: uuidv4(),
        userId: 'user_1',
        firebaseUid: 'firebase_uid_1',
        email: 'admin@example.com',
        lastLoginAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        userId: 'user_2',
        firebaseUid: 'firebase_uid_2',
        email: 'user@example.com',
        lastLoginAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('auth_sessions', null, {});
  }
};
