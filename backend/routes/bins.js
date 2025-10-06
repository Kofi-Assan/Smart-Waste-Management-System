const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Get all bins
router.get('/', async (req, res) => {
  try {
    const [bins] = await pool.execute(`
      SELECT 
        id, 
        location, 
        latitude, 
        longitude, 
        status, 
        level, 
        bin_type, 
        capacity,
        last_emptied,
        created_at,
        updated_at
      FROM bins 
      ORDER BY created_at DESC
    `);
    
    res.json({ bins });
  } catch (error) {
    console.error('Get bins error:', error);
    res.status(500).json({ error: 'Failed to fetch bins' });
  }
});

// Get bin by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [bins] = await pool.execute(
      'SELECT * FROM bins WHERE id = ?',
      [id]
    );
    
    if (bins.length === 0) {
      return res.status(404).json({ error: 'Bin not found' });
    }
    
    res.json({ bin: bins[0] });
  } catch (error) {
    console.error('Get bin error:', error);
    res.status(500).json({ error: 'Failed to fetch bin' });
  }
});

// Create new bin
router.post('/', async (req, res) => {
  try {
    const { 
      location, 
      latitude, 
      longitude, 
      binType, 
      capacity = 100 
    } = req.body;
    
    if (!location || !binType) {
      return res.status(400).json({ error: 'Location and bin type are required' });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO bins (location, latitude, longitude, bin_type, capacity) VALUES (?, ?, ?, ?, ?)',
      [location, latitude, longitude, binType, capacity]
    );
    
    res.status(201).json({
      message: 'Bin created successfully',
      binId: result.insertId
    });
  } catch (error) {
    console.error('Create bin error:', error);
    res.status(500).json({ error: 'Failed to create bin' });
  }
});

// Update bin status/level
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, level } = req.body;
    
    const updateFields = [];
    const values = [];
    
    if (status !== undefined) {
      updateFields.push('status = ?');
      values.push(status);
    }
    
    if (level !== undefined) {
      updateFields.push('level = ?');
      values.push(level);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    const [result] = await pool.execute(
      `UPDATE bins SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Bin not found' });
    }
    
    res.json({ message: 'Bin updated successfully' });
  } catch (error) {
    console.error('Update bin error:', error);
    res.status(500).json({ error: 'Failed to update bin' });
  }
});

// Get bins by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    
    const [bins] = await pool.execute(
      'SELECT * FROM bins WHERE status = ? ORDER BY updated_at DESC',
      [status]
    );
    
    res.json({ bins });
  } catch (error) {
    console.error('Get bins by status error:', error);
    res.status(500).json({ error: 'Failed to fetch bins by status' });
  }
});

// Get bins by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    const [bins] = await pool.execute(
      'SELECT * FROM bins WHERE bin_type = ? ORDER BY updated_at DESC',
      [type]
    );
    
    res.json({ bins });
  } catch (error) {
    console.error('Get bins by type error:', error);
    res.status(500).json({ error: 'Failed to fetch bins by type' });
  }
});

// Get nearby bins (within radius)
router.get('/nearby/:lat/:lng/:radius', async (req, res) => {
  try {
    const { lat, lng, radius } = req.params;
    
    const [bins] = await pool.execute(`
      SELECT 
        id, 
        location, 
        latitude, 
        longitude, 
        status, 
        level, 
        bin_type,
        (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance
      FROM bins 
      WHERE latitude IS NOT NULL 
        AND longitude IS NOT NULL 
        AND status = 'active'
      HAVING distance < ?
      ORDER BY distance
    `, [lat, lng, lat, radius]);
    
    res.json({ bins });
  } catch (error) {
    console.error('Get nearby bins error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby bins' });
  }
});

module.exports = router;
