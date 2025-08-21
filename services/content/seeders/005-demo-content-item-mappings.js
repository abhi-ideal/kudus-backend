
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get existing content and items for reference
    const [contentRows] = await queryInterface.sequelize.query(`
      SELECT id, title, type, genre FROM content WHERE isActive = true
    `);
    
    const [itemRows] = await queryInterface.sequelize.query(`
      SELECT id, name, slug FROM content_items WHERE isActive = true
    `);

    if (contentRows.length === 0 || itemRows.length === 0) {
      console.log('No content or items found, skipping mapping seeder');
      return;
    }

    const mappings = [];

    // Map content to multiple items based on genre and type
    contentRows.forEach((content, index) => {
      const genre = JSON.parse(content.genre || '[]');
      const contentType = content.type;
      
      // Add to multiple relevant items
      itemRows.forEach((item, itemIndex) => {
        let shouldMap = false;
        let displayOrder = 0;
        let isFeatured = false;

        // Logic to map content to appropriate items
        switch (item.slug) {
          case 'sparks-your-digital-superstars':
            // Add some variety of content
            shouldMap = index % 3 === 0;
            displayOrder = index;
            isFeatured = index < 2;
            break;
            
          case 'mystery-thriller-collection':
            shouldMap = genre.includes('Mystery') || genre.includes('Thriller') || genre.includes('Crime');
            displayOrder = index;
            isFeatured = content.title.includes('Detective') || content.title.includes('Mystery');
            break;
            
          case 'trending-now':
            // Add recent content (2024)
            shouldMap = content.title.includes('2024') || index < 5;
            displayOrder = index;
            isFeatured = index < 3;
            break;
            
          case 'action-adventures':
            shouldMap = genre.includes('Action') || genre.includes('Adventure');
            displayOrder = index;
            isFeatured = content.title.includes('Hero') || content.title.includes('War');
            break;
            
          case 'comedy-classics':
            shouldMap = genre.includes('Comedy') || genre.includes('Family');
            displayOrder = index;
            isFeatured = content.title.includes('Laugh') || content.title.includes('Family');
            break;
            
          case 'thriller-zone':
            shouldMap = genre.includes('Thriller') || genre.includes('Horror');
            displayOrder = index;
            isFeatured = content.title.includes('Haunted') || content.title.includes('Zombie');
            break;
            
          default:
            // For other items, add some random content
            shouldMap = Math.random() < 0.3;
            displayOrder = index;
            isFeatured = Math.random() < 0.2;
        }

        if (shouldMap) {
          mappings.push({
            id: uuidv4(),
            contentId: content.id,
            itemId: item.id,
            displayOrder: displayOrder,
            isFeatured: isFeatured,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      });
    });

    // Ensure each item has at least some content (max 10 per item as requested)
    const mappingsByItem = {};
    mappings.forEach(mapping => {
      if (!mappingsByItem[mapping.itemId]) {
        mappingsByItem[mapping.itemId] = [];
      }
      mappingsByItem[mapping.itemId].push(mapping);
    });

    // Limit to 10 content per item and ensure proper ordering
    const finalMappings = [];
    Object.keys(mappingsByItem).forEach(itemId => {
      const itemMappings = mappingsByItem[itemId]
        .sort((a, b) => {
          // Featured content first, then by display order
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return a.displayOrder - b.displayOrder;
        })
        .slice(0, 10) // Max 10 content per item
        .map((mapping, index) => ({
          ...mapping,
          displayOrder: index // Re-order from 0 to 9
        }));
      
      finalMappings.push(...itemMappings);
    });

    if (finalMappings.length > 0) {
      await queryInterface.bulkInsert('content_item_mappings', finalMappings);
      console.log(`Created ${finalMappings.length} content-item mappings`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('content_item_mappings', null, {});
  }
};
