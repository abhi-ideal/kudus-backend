
<old_str>// Define associations
Content.associate = (models) => {
  // Direct association with ContentItemMapping
  if (models.ContentItemMapping) {
    Content.hasMany(models.ContentItemMapping, {
      foreignKey: 'contentId',
      as: 'contentMappings'
    });
  }
  
  // Series associations
  if (models.Season) {
    Content.hasMany(models.Season, {
      foreignKey: 'seriesId',
      as: 'seasons'
    });
  }
  
  if (models.Episode) {
    Content.hasMany(models.Episode, {
      foreignKey: 'seriesId',
      as: 'episodes'
    });
  }

  // Watchlist association
  if (models.Watchlist) {
    Content.hasMany(models.Watchlist, {
      foreignKey: 'contentId',
      as: 'watchlistEntries'
    });
  }

  // Watch history association
  if (models.WatchHistory) {
    Content.hasMany(models.WatchHistory, {
      foreignKey: 'contentId',
      as: 'contentWatchHistory'
    });
  }

  // Content likes association
  if (models.ContentLike) {
    Content.hasMany(models.ContentLike, {
      foreignKey: 'contentId',
      as: 'contentLikes'
    });
  }
};</old_str>
<new_str>// Define associations
Content.associate = (models) => {
  // Direct association with ContentItemMapping
  if (models.ContentItemMapping) {
    Content.hasMany(models.ContentItemMapping, {
      foreignKey: 'contentId',
      as: 'contentMappings'
    });
  }
  
  // Series associations
  if (models.Season) {
    Content.hasMany(models.Season, {
      foreignKey: 'seriesId',
      as: 'seasons'
    });
  }
  
  if (models.Episode) {
    Content.hasMany(models.Episode, {
      foreignKey: 'seriesId',
      as: 'episodes'
    });
  }

  // Watchlist association
  if (models.Watchlist) {
    Content.hasMany(models.Watchlist, {
      foreignKey: 'contentId',
      as: 'watchlistEntries'
    });
  }

  // Watch history association
  if (models.WatchHistory) {
    Content.hasMany(models.WatchHistory, {
      foreignKey: 'contentId',
      as: 'contentWatchHistory'
    });
  }

  // Content likes association
  if (models.ContentLike) {
    Content.hasMany(models.ContentLike, {
      foreignKey: 'contentId',
      as: 'contentLikes'
    });
  }
};</new_str>
