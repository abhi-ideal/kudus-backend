
const mysql = require('mysql2/promise');
require('dotenv').config();

const testDatabases = [
  'ott_users_test',
  'ott_content_test', 
  'ott_recommendations_test',
  'ott_streaming_test',
  'ott_admin_test',
  'ott_common_test'
];

async function setupTestDatabases() {
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

    // Create each test database
    for (const dbName of testDatabases) {
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      console.log(`✅ Test database '${dbName}' created or already exists`);
    }

    await connection.end();
    console.log('🎉 All test databases setup completed!');

  } catch (error) {
    console.error('❌ Error setting up test databases:', error.message);
    process.exit(1);
  }
}

setupTestDatabases();
