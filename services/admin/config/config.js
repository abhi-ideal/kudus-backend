
require('dotenv').config();

// Remove quotes from password if present
const getPassword = (password) => {
  if (!password) return 'password';
  return password.replace(/^['"]|['"]$/g, '');
};

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: getPassword(process.env.DB_PASSWORD),
    database: process.env.DB_NAME || 'ott_admin',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: getPassword(process.env.DB_PASSWORD),
    database: process.env.DB_NAME ? process.env.DB_NAME + '_test' : 'ott_admin_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.DB_USER || 'root',
    password: getPassword(process.env.DB_PASSWORD),
    database: process.env.DB_NAME || 'ott_admin',
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
