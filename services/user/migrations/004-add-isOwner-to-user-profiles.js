
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('user_profiles', 'isOwner', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Indicates if this profile is the account owner profile'
    });

    // Update existing profiles to set the first profile of each user as owner
    await queryInterface.sequelize.query(`
      UPDATE user_profiles 
      SET isOwner = true 
      WHERE id IN (
        SELECT id FROM (
          SELECT id, 
                 ROW_NUMBER() OVER (PARTITION BY userId ORDER BY createdAt ASC) as rn
          FROM user_profiles
        ) ranked 
        WHERE rn = 1
      )
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('user_profiles', 'isOwner');
  }
};
