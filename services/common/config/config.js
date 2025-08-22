
require('dotenv').config();

const getPassword = (password) => {
  if (!password) return 'password';
  return password.replace(/^['"]|['"]$/g, '');
};

const baseConfig = {
  username: process.env.DB_USER || 'root',
  password: getPassword(process.env.DB_PASSWORD),
  database: process.env.DB_NAME || 'ott_common',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql'
};

module.exports = {
  development: {
    ...baseConfig,
    logging: console.log
  },
  test: {
    ...baseConfig,
    database: (process.env.DB_NAME || 'ott_users') + '_test',
    logging: false
  },
  production: {
    ...baseConfig,
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};
