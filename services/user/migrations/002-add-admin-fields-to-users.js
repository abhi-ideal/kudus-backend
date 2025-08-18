
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'status', {
      type: Sequelize.ENUM('active', 'blocked', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    });

    await queryInterface.addColumn('users', 'subscription', {
      type: Sequelize.ENUM('free', 'premium', 'family'),
      allowNull: false,
      defaultValue: 'free'
    });

    await queryInterface.addColumn('users', 'subscriptionEndDate', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'blockedReason', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'blockedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'status');
    await queryInterface.removeColumn('users', 'subscription');
    await queryInterface.removeColumn('users', 'subscriptionEndDate');
    await queryInterface.removeColumn('users', 'blockedReason');
    await queryInterface.removeColumn('users', 'blockedAt');
  }
};
