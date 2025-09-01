
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update content table - restructure thumbnailUrl to support new ratios
    await queryInterface.changeColumn('content', 'thumbnailUrl', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {
        "banner": null,      // 16:4 ratio (1920x480px)
        "landscape": null,   // 16:9 ratio (1200x675px)
        "portrait": null,    // 2:3 ratio (500x750px)
        "square": null       // 1:1 ratio (500x500px)
      }
    });

    // Update episodes table - restructure thumbnailUrl to support new ratios
    await queryInterface.changeColumn('episodes', 'thumbnailUrl', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {
        "banner": null,      // 16:4 ratio (1920x480px)
        "landscape": null,   // 16:9 ratio (1200x675px)
        "portrait": null,    // 2:3 ratio (500x750px)
        "square": null       // 1:1 ratio (500x500px)
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert content table back to old structure
    await queryInterface.changeColumn('content', 'thumbnailUrl', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {
        "150x150": null,
        "300x300": null,
        "500x500": null,
        "800x800": null,
        "1080x1080": null
      }
    });

    // Revert episodes table back to old structure
    await queryInterface.changeColumn('episodes', 'thumbnailUrl', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {
        "150x150": null,
        "300x300": null,
        "500x500": null,
        "800x800": null,
        "1080x1080": null
      }
    });
  }
};
