const mysql = require('mysql2/promise');
require('dotenv').config();

const databases = [
    'ott_users',
    'ott_content',
    'ott_recommendations',
    'ott_streaming',
    'ott_admin',
    'ott_common'
  ];

async function setupDatabases() {
  try {
    // Remove quotes from password if present
    const getPassword = (password) => {
      if (!password) return 'password';
      return password.replace(/^['"]|['"]$/g, '');
    };

    console.log('Connecting to database:', process.env.DB_HOST || '111.118.251.133');
    
    // Create connection to MySQL server
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '111.118.251.133',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'idealuser',
      password: getPassword(process.env.DB_PASSWORD) || 'BVtNpIG*P0v#LnoX'
    });

    console.log('Connected to MySQL server');

    // Create each database
    for (const dbName of databases) {
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      console.log(`✅ Database '${dbName}' created or already exists`);
    }

    await connection.end();
    console.log('🎉 All databases setup completed!');

  } catch (error) {
    console.error('❌ Error setting up databases:', error.message);
    process.exit(1);
  }
}

setupDatabases();