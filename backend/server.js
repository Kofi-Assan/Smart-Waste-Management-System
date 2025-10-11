const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection, initializeDatabase } = require('./config/database');
const { verifyEmailConfig } = require('./services/emailService');
const authRoutes = require('./routes/auth');
const binRoutes = require('./routes/bins');
const userRoutes = require('./routes/users');
const emailRoutes = require('./routes/email');

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
app.use('/api/email', emailRoutes);

// Serve main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// ESP32 WiFi Communication Endpoint
app.post('/api/update', (req, res) => {
  try {
    const { fill, binId, location, timestamp } = req.body;
    
    console.log('📡 ESP32 Data Received:', {
      fill: fill,
      binId: binId || 'unknown',
      location: location || 'unknown',
      timestamp: timestamp || new Date().toISOString()
    });
    
    // Validate required data
    if (fill === undefined || fill === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: fill',
        message: 'Fill percentage is required'
      });
    }
    
    // Validate fill percentage (0-100)
    if (fill < 0 || fill > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid fill percentage',
        message: 'Fill must be between 0 and 100'
      });
    }
    
    // Process the data (you can add database storage here later)
    const response = {
      success: true,
      message: 'ESP32 data received successfully',
      data: {
        fill: fill,
        binId: binId || 'default',
        location: location || 'unknown',
        timestamp: timestamp || new Date().toISOString(),
        status: fill > 80 ? 'Full' : fill > 50 ? 'Half Full' : 'Empty'
      }
    };
    
    console.log('✅ ESP32 Response:', response);
    res.json(response);
    
  } catch (error) {
    console.error('❌ ESP32 Communication Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process ESP32 data',
      message: error.message
    });
  }
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
    
    // Verify email configuration
    await verifyEmailConfig();
    
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
