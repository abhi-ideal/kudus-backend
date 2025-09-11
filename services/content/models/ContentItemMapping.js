
<old_str>// Define associations
ContentItemMapping.associate = (models) => {
  // Belongs to Content
  if (models.Content) {
    ContentItemMapping.belongsTo(models.Content, {
      foreignKey: 'contentId',
      as: 'content'
    });
  }

  // Belongs to ContentItem
  if (models.ContentItem) {
    ContentItemMapping.belongsTo(models.ContentItem, {
      foreignKey: 'itemId',
      as: 'item'
    });
  }
};</old_str>
<new_str>// Define associations
ContentItemMapping.associate = (models) => {
  // Belongs to Content
  if (models.Content) {
    ContentItemMapping.belongsTo(models.Content, {
      foreignKey: 'contentId',
      as: 'content'
    });
  }

  // Belongs to ContentItem
  if (models.ContentItem) {
    ContentItemMapping.belongsTo(models.ContentItem, {
      foreignKey: 'itemId',
      as: 'item'
    });
  }
};</new_str>
