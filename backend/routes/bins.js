const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Get all bins (aligned with simplified schema)
router.get('/', async (req, res) => {
  try {
    const [bins] = await pool.execute(`
      SELECT 
        id,
        location,
        status,
        level,
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

// Create new bin (status/level only; defaults: Not Full, 0)
router.post('/', async (req, res) => {
  try {
    const { status = 'Not Full', level = 0 } = req.body || {};

    const [result] = await pool.execute(
      'INSERT INTO bins (location, status, level, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      ['Academic City University College', status, level]
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

// The schema no longer includes bin_type; return 410 Gone for this route
router.get('/type/:type', async (_req, res) => {
  res.status(410).json({ error: 'bin_type has been removed from schema' });
});

// Get nearby bins (within radius)
router.get('/nearby/:lat/:lng/:radius', async (_req, res) => {
  res.status(410).json({ error: 'location/latitude/longitude removed from schema' });
});

module.exports = router;
