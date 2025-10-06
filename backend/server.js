const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection, initializeDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');
const binRoutes = require('./routes/bins');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bins', binRoutes);
app.use('/api/users', userRoutes);

// Serve main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Smart Waste Management API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.log('⚠️  Starting server without database connection...');
    }
    
    // Initialize database tables
    await initializeDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
      console.log(`🌐 Frontend available at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
