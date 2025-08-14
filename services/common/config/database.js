
const { Sequelize } = require('sequelize');

// Remove quotes from password if present
const getPassword = (password) => {
  if (!password) return 'password';
  return password.replace(/^['"]|['"]$/g, '');
};

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'ott_common',
  username: process.env.DB_USER || 'root',
  password: getPassword(process.env.DB_PASSWORD),
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
