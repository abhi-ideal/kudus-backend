
<old_str>// Define associations
ContentItem.associate = (models) => {
  // Has many content item mappings
  if (models.ContentItemMapping) {
    ContentItem.hasMany(models.ContentItemMapping, {
      foreignKey: 'itemId',
      as: 'itemMappings'
    });
  }
};</old_str>
<new_str>// Define associations
ContentItem.associate = (models) => {
  // Has many content item mappings
  if (models.ContentItemMapping) {
    ContentItem.hasMany(models.ContentItemMapping, {
      foreignKey: 'itemId',
      as: 'itemMappings'
    });
  }
};</new_str>
