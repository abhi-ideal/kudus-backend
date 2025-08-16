
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'idealuser',
    password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.replace(/^['"]|['"]$/g, '') : 'BVtNpIG*P0v#LnoX',
    database: process.env.DB_NAME || 'ott_platform',
    host: process.env.DB_HOST || '111.118.251.133',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ott_platform_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ott_platform',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};
