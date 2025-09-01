
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all content with old thumbnail structure
    const [contentRows] = await queryInterface.sequelize.query(`
      SELECT id, thumbnailUrl FROM content WHERE thumbnailUrl IS NOT NULL
    `);

    console.log(`Found ${contentRows.length} content items to update thumbnails`);

    for (const content of contentRows) {
      let oldThumbnail = null;
      
      try {
        // Parse existing thumbnail data
        if (typeof content.thumbnailUrl === 'string') {
          oldThumbnail = JSON.parse(content.thumbnailUrl);
        } else {
          oldThumbnail = content.thumbnailUrl;
        }

        // Convert old structure to new structure
        let newThumbnailStructure = {
          banner: null,
          landscape: null,
          portrait: null,
          square: null
        };

        // If old structure exists, try to map it
        if (oldThumbnail && typeof oldThumbnail === 'object') {
          // Try to use the largest size available for landscape
          if (oldThumbnail['1080x1080']) {
            newThumbnailStructure.square = oldThumbnail['1080x1080'];
            newThumbnailStructure.landscape = oldThumbnail['1080x1080'];
          } else if (oldThumbnail['800x800']) {
            newThumbnailStructure.square = oldThumbnail['800x800'];
            newThumbnailStructure.landscape = oldThumbnail['800x800'];
          } else if (oldThumbnail['500x500']) {
            newThumbnailStructure.square = oldThumbnail['500x500'];
            newThumbnailStructure.landscape = oldThumbnail['500x500'];
          }
        } else if (typeof oldThumbnail === 'string') {
          // If it's a direct URL string, use it for all ratios
          newThumbnailStructure.landscape = oldThumbnail;
          newThumbnailStructure.square = oldThumbnail;
        }

        // Update the content with new structure
        await queryInterface.sequelize.query(`
          UPDATE content 
          SET thumbnailUrl = :thumbnailUrl, updatedAt = NOW()
          WHERE id = :id
        `, {
          replacements: {
            id: content.id,
            thumbnailUrl: JSON.stringify(newThumbnailStructure)
          }
        });

      } catch (error) {
        console.log(`Error updating thumbnail for content ${content.id}:`, error.message);
        // Set default structure if parsing fails
        await queryInterface.sequelize.query(`
          UPDATE content 
          SET thumbnailUrl = :thumbnailUrl, updatedAt = NOW()
          WHERE id = :id
        `, {
          replacements: {
            id: content.id,
            thumbnailUrl: JSON.stringify({
              banner: null,
              landscape: null,
              portrait: null,
              square: null
            })
          }
        });
      }
    }

    // Update episodes table as well
    const [episodeRows] = await queryInterface.sequelize.query(`
      SELECT id, thumbnailUrl FROM episodes WHERE thumbnailUrl IS NOT NULL
    `);

    console.log(`Found ${episodeRows.length} episodes to update thumbnails`);

    for (const episode of episodeRows) {
      try {
        let oldThumbnail = null;
        
        if (typeof episode.thumbnailUrl === 'string') {
          oldThumbnail = JSON.parse(episode.thumbnailUrl);
        } else {
          oldThumbnail = episode.thumbnailUrl;
        }

        let newThumbnailStructure = {
          banner: null,
          landscape: null,
          portrait: null,
          square: null
        };

        if (oldThumbnail && typeof oldThumbnail === 'object') {
          if (oldThumbnail['1080x1080']) {
            newThumbnailStructure.landscape = oldThumbnail['1080x1080'];
            newThumbnailStructure.square = oldThumbnail['1080x1080'];
          } else if (oldThumbnail['800x800']) {
            newThumbnailStructure.landscape = oldThumbnail['800x800'];
            newThumbnailStructure.square = oldThumbnail['800x800'];
          }
        }

        await queryInterface.sequelize.query(`
          UPDATE episodes 
          SET thumbnailUrl = :thumbnailUrl, updatedAt = NOW()
          WHERE id = :id
        `, {
          replacements: {
            id: episode.id,
            thumbnailUrl: JSON.stringify(newThumbnailStructure)
          }
        });

      } catch (error) {
        console.log(`Error updating thumbnail for episode ${episode.id}:`, error.message);
        await queryInterface.sequelize.query(`
          UPDATE episodes 
          SET thumbnailUrl = :thumbnailUrl, updatedAt = NOW()
          WHERE id = :id
        `, {
          replacements: {
            id: episode.id,
            thumbnailUrl: JSON.stringify({
              banner: null,
              landscape: null,
              portrait: null,
              square: null
            })
          }
        });
      }
    }

    console.log('Thumbnail structure migration completed');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to old structure if needed
    const [contentRows] = await queryInterface.sequelize.query(`
      SELECT id, thumbnailUrl FROM content WHERE thumbnailUrl IS NOT NULL
    `);

    for (const content of contentRows) {
      await queryInterface.sequelize.query(`
        UPDATE content 
        SET thumbnailUrl = :thumbnailUrl, updatedAt = NOW()
        WHERE id = :id
      `, {
        replacements: {
          id: content.id,
          thumbnailUrl: JSON.stringify({
            "150x150": null,
            "300x300": null,
            "500x500": null,
            "800x800": null,
            "1080x1080": null
          })
        }
      });
    }
  }
};
