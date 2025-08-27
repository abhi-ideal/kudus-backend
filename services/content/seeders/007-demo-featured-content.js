
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get some existing content to feature
    const [contentRows] = await queryInterface.sequelize.query(`
      SELECT id, title FROM content WHERE isActive = true ORDER BY createdAt DESC LIMIT 10
    `);

    if (contentRows.length === 0) {
      console.log('No content found to feature, skipping featured content seeder');
      return;
    }

    // Feature the first 5 content items
    const updates = [];
    const featuredDate = new Date();

    for (let i = 0; i < Math.min(5, contentRows.length); i++) {
      updates.push({
        id: contentRows[i].id,
        isFeatured: true,
        featuredAt: new Date(featuredDate.getTime() - (i * 60000)) // Stagger featured times
      });
    }

    for (const update of updates) {
      await queryInterface.sequelize.query(`
        UPDATE content 
        SET isFeatured = true, featuredAt = :featuredAt, updatedAt = NOW()
        WHERE id = :id
      `, {
        replacements: {
          id: update.id,
          featuredAt: update.featuredAt
        }
      });
    }

    console.log(`Featured ${updates.length} content items`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      UPDATE content 
      SET isFeatured = false, featuredAt = NULL, updatedAt = NOW()
      WHERE isFeatured = true
    `);
  }
};
