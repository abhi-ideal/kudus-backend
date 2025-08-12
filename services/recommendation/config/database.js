
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.RECOMMENDATION_DB_NAME || 'ott_recommendations',
  process.env.RECOMMENDATION_DB_USER || process.env.DB_USER,
  process.env.RECOMMENDATION_DB_PASSWORD || process.env.DB_PASSWORD,
  {
    host: process.env.RECOMMENDATION_DB_HOST || process.env.DB_HOST,
    port: process.env.RECOMMENDATION_DB_PORT || process.env.DB_PORT,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
