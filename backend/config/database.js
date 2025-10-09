const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_waste_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Initialize database and tables
async function initializeDatabase() {
  try {
    // Create database if it doesn't exist
    const createDbQuery = `CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`;
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    await tempConnection.execute(createDbQuery);
    await tempConnection.end();
    
    // Create tables
    await createTables();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  }
}

// Create required tables
async function createTables() {
  const connection = await pool.getConnection();
  
  try {
    // Users table
    const usersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        coin_balance INT DEFAULT 0,
        qr_code VARCHAR(255) UNIQUE,
        reset_token_hash VARCHAR(255) NULL,
        reset_token_expires DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    // Bins table
    const binsTable = `
      CREATE TABLE IF NOT EXISTS bins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        location VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        status ENUM('active', 'maintenance', 'full', 'offline') DEFAULT 'active',
        level INT DEFAULT 0 CHECK (level >= 0 AND level <= 100),
        bin_type ENUM('plastic', 'paper', 'glass', 'metal', 'organic') NOT NULL,
        capacity INT DEFAULT 100,
        last_emptied TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    // Transactions table for coin tracking
    const transactionsTable = `
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        bin_id INT NOT NULL,
        coins_earned INT NOT NULL,
        waste_type ENUM('plastic', 'paper', 'glass', 'metal', 'organic') NOT NULL,
        weight DECIMAL(5, 2),
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (bin_id) REFERENCES bins(id) ON DELETE CASCADE
      )
    `;
    
    await connection.execute(usersTable);
    // Ensure reset columns exist for older databases
    await connection.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(255) NULL");
    await connection.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME NULL");
    await connection.execute(binsTable);
    await connection.execute(transactionsTable);
    
    console.log('✅ Tables created successfully');
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};
