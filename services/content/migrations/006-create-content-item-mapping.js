
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create junction table for content-items relationship
    await queryInterface.createTable('content_item_mappings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      contentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'content',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      itemId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'content_items',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      displayOrder: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Order of content within the item'
      },
      isFeatured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this content is featured in the item'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add unique constraint to prevent duplicate mappings
    await queryInterface.addIndex('content_item_mappings', ['contentId', 'itemId'], {
      unique: true,
      name: 'unique_content_item_mapping'
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('content_item_mappings', ['contentId']);
    await queryInterface.addIndex('content_item_mappings', ['itemId']);
    await queryInterface.addIndex('content_item_mappings', ['displayOrder']);
    await queryInterface.addIndex('content_item_mappings', ['isFeatured']);

    // Migrate existing data from content table to junction table
    await queryInterface.sequelize.query(`
      INSERT INTO content_item_mappings (id, contentId, itemId, displayOrder, isFeatured, createdAt, updatedAt)
      SELECT 
        UUID(),
        id as contentId,
        itemId,
        0 as displayOrder,
        false as isFeatured,
        NOW() as createdAt,
        NOW() as updatedAt
      FROM content 
      WHERE itemId IS NOT NULL
    `);

    // Remove the old itemId column from content table
    await queryInterface.removeColumn('content', 'itemId');
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add itemId column to content table
    await queryInterface.addColumn('content', 'itemId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'content_items',
        key: 'id'
      }
    });

    // Migrate data back (taking only the first mapping for each content)
    await queryInterface.sequelize.query(`
      UPDATE content c
      JOIN (
        SELECT contentId, itemId,
               ROW_NUMBER() OVER (PARTITION BY contentId ORDER BY displayOrder, createdAt) as rn
        FROM content_item_mappings
      ) cim ON c.id = cim.contentId AND cim.rn = 1
      SET c.itemId = cim.itemId
    `);

    // Drop the junction table
    await queryInterface.dropTable('content_item_mappings');
  }
};
