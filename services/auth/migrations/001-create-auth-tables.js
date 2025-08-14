'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Auth service now references tables created by user service
    // No table creation needed here - all user-related tables are in user service
    console.log('Auth service migration: Tables are managed by user service');
  },

  down: async (queryInterface, Sequelize) => {
    // No tables to drop - they're managed by user service
    console.log('Auth service rollback: Tables are managed by user service');
  }
};