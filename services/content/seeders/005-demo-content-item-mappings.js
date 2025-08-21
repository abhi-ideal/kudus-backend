
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

        // Logic for mapping content to items
        switch (item.slug) {
          case 'sparks-your-digital-superstars':
            // All content goes here with some being featured
            shouldMap = true;
            displayOrder = index;
            isFeatured = index % 5 === 0; // Every 5th item is featured
            break;
            
          case 'mystery-thriller-collection':
            // Only mystery, thriller, crime content
            shouldMap = genre.some(g => ['Mystery', 'Thriller', 'Crime'].includes(g));
            displayOrder = index;
            isFeatured = index % 3 === 0;
            break;
            
          case 'trending-now':
            // Recent content (2024) and some 2023
            shouldMap = content.title.includes('2025') || content.title.includes('Dark Knight') || 
                       content.title.includes('Tech Titans') || content.title.includes('Space Station') ||
                       (index < 10 && Math.random() > 0.5);
            displayOrder = index;
            isFeatured = index % 4 === 0;
            break;
            
          case 'action-adventures':
            // Action and adventure content
            shouldMap = genre.some(g => ['Action', 'Adventure'].includes(g));
            displayOrder = index;
            isFeatured = index % 6 === 0;
            break;
            
          case 'comedy-classics':
            // Comedy content
            shouldMap = genre.some(g => ['Comedy'].includes(g));
            displayOrder = index;
            isFeatured = index % 2 === 0;
            break;
            
          case 'family-friendly':
            // Family, G and PG rated content
            shouldMap = genre.some(g => ['Family'].includes(g)) || 
                       content.rating === 'G' || content.rating === 'PG';
            displayOrder = index;
            isFeatured = false;
            break;
            
          case 'sci-fi-fantasy':
            // Sci-Fi and Fantasy content
            shouldMap = genre.some(g => ['Sci-Fi', 'Fantasy'].includes(g));
            displayOrder = index;
            isFeatured = index % 3 === 0;
            break;
            
          case 'drama-series':
            // Drama series only
            shouldMap = contentType === 'series' && genre.some(g => ['Drama'].includes(g));
            displayOrder = index;
            isFeatured = index % 4 === 0;
            break;
            
          case 'documentaries':
            // Documentary content
            shouldMap = contentType === 'documentary';
            displayOrder = index;
            isFeatured = index % 2 === 0;
            break;
            
          case 'horror-thrills':
            // Horror content
            shouldMap = genre.some(g => ['Horror'].includes(g));
            displayOrder = index;
            isFeatured = index % 3 === 0;
            break;
            
          case 'romance-movies':
            // Romance content
            shouldMap = genre.some(g => ['Romance'].includes(g));
            displayOrder = index;
            isFeatured = false;
            break;
            
          case 'latest-releases':
            // 2024 content
            shouldMap = content.title.includes('2024') || 
                       ['Dark Knight Returns', 'Tech Titans', 'Space Station Alpha', 'Medical Miracles'].includes(content.title);
            displayOrder = index;
            isFeatured = index % 2 === 0;
            break;
            
          case 'binge-worthy-series':
            // All series content
            shouldMap = contentType === 'series';
            displayOrder = index;
            isFeatured = index % 5 === 0;
            break;
            
          case 'award-winners':
            // Select premium content
            shouldMap = ['The Adventure Begins', 'Dark Knight Returns', 'Medieval Kingdoms', 'Musical Dreams'].includes(content.title);
            displayOrder = index;
            isFeatured = true;
            break;
            
          case 'international-content':
            // Content with multiple subtitle languages
            shouldMap = index % 3 === 0; // Distribute some content here
            displayOrder = index;
            isFeatured = false;
            break;
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

    if (mappings.length > 0) {
      await queryInterface.bulkInsert('content_item_mappings', mappings);
      console.log(`Created ${mappings.length} content-item mappings`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('content_item_mappings', null, {});
  }
};
