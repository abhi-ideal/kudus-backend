
const Content = require('./Content');
const ContentItem = require('./ContentItem');
const ContentItemMapping = require('./ContentItemMapping');
const Episode = require('./Episode');
const Season = require('./Season');
const Watchlist = require('./Watchlist');
const WatchHistory = require('./WatchHistory');

// Define all models
const models = {
  Content,
  ContentItem,
  ContentItemMapping,
  Episode,
  Season,
  Watchlist,
  WatchHistory
};

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
