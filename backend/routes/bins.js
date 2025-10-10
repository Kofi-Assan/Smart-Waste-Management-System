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

// Arduino sensor data endpoint - receives data from ESP8266
router.post('/update', async (req, res) => {
  try {
    const { 
      binId, 
      level, 
      distance, 
      status, 
      timestamp,
      deviceId,
      location,
      userId // Optional: if we know which user is using the bin
    } = req.body;
    
    // Validate required fields
    if (level === undefined && status === undefined) {
      return res.status(400).json({ 
        error: 'At least one of level or status must be provided' 
      });
    }
    
    // Determine bin ID - use provided binId or default to 1
    const targetBinId = binId || 1;
    
    // Get current bin level for comparison
    const [currentBin] = await pool.execute(
      'SELECT level FROM bins WHERE id = ?',
      [targetBinId]
    );
    
    const currentLevel = currentBin.length > 0 ? currentBin[0].level : 0;
    
    // Determine status based on level if not provided
    let binStatus = status;
    if (!binStatus && level !== undefined) {
      if (level >= 90) {
        binStatus = 'Full';
      } else if (level >= 70) {
        binStatus = 'Almost Full';
      } else if (level >= 30) {
        binStatus = 'Half Full';
      } else {
        binStatus = 'Not Full';
      }
    }
    
    // Prepare update fields
    const updateFields = ['updated_at = NOW()'];
    const values = [];
    
    if (level !== undefined) {
      updateFields.push('level = ?');
      values.push(Math.max(0, Math.min(100, level))); // Clamp between 0-100
    }
    
    if (binStatus) {
      updateFields.push('status = ?');
      values.push(binStatus);
    }
    
    values.push(targetBinId);
    
    // Update the bin
    const [result] = await pool.execute(
      `UPDATE bins SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Bin not found' });
    }
    
    // Calculate coins to award based on 10% increments
    let coinsAwarded = 0;
    if (level !== undefined && level > currentLevel) {
      const levelIncrease = level - currentLevel;
      const tenPercentIncrements = Math.floor(levelIncrease / 10);
      coinsAwarded = tenPercentIncrements * 5; // 5 coins per 10%
      
      // Award coins to all users (or specific user if provided)
      if (coinsAwarded > 0) {
        try {
          if (userId) {
            // Award to specific user
            await pool.execute(
              'UPDATE users SET coin_balance = coin_balance + ? WHERE id = ?',
              [coinsAwarded, userId]
            );
            
            // Log transaction
            await pool.execute(
              'INSERT INTO transactions (user_id, bin_id, coins_earned, waste_type, transaction_date) VALUES (?, ?, ?, ?, NOW())',
              [userId, targetBinId, coinsAwarded, 'Bin Fill Level Increase']
            );
          } else {
            // Award to all users (community reward)
            await pool.execute(
              'UPDATE users SET coin_balance = coin_balance + ?',
              [coinsAwarded]
            );
            
            // Log transaction for all users
            const [allUsers] = await pool.execute('SELECT id FROM users');
            for (const user of allUsers) {
              await pool.execute(
                'INSERT INTO transactions (user_id, bin_id, coins_earned, waste_type, transaction_date) VALUES (?, ?, ?, ?, NOW())',
                [user.id, targetBinId, coinsAwarded, 'Community Bin Fill Reward']
              );
            }
          }
          
          console.log(`🎉 Awarded ${coinsAwarded} coins for bin level increase from ${currentLevel}% to ${level}%`);
        } catch (coinError) {
          console.error('Error awarding coins:', coinError);
          // Don't fail the bin update if coin awarding fails
        }
      }
    }
    
    // Log the update
    console.log(`Arduino update received:`, {
      binId: targetBinId,
      level,
      status: binStatus,
      distance,
      deviceId,
      timestamp: timestamp || new Date().toISOString(),
      coinsAwarded
    });
    
    res.json({ 
      message: 'Bin data updated successfully',
      binId: targetBinId,
      level,
      status: binStatus,
      timestamp: new Date().toISOString(),
      coinsAwarded
    });
    
  } catch (error) {
    console.error('Arduino update error:', error);
    res.status(500).json({ error: 'Failed to update bin data' });
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
