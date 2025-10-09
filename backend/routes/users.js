const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Get user coin balance
router.get('/:id/coins', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await pool.execute(
      'SELECT coin_balance FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ coinBalance: users[0].coin_balance });
  } catch (error) {
    console.error('Get coins error:', error);
    res.status(500).json({ error: 'Failed to fetch coin balance' });
  }
});

// Update user coin balance
router.put('/:id/coins', async (req, res) => {
  try {
    const { id } = req.params;
    const { coins } = req.body;
    
    if (typeof coins !== 'number') {
      return res.status(400).json({ error: 'Coins must be a number' });
    }
    
    const [result] = await pool.execute(
      'UPDATE users SET coin_balance = coin_balance + ? WHERE id = ?',
      [coins, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get updated balance
    const [users] = await pool.execute(
      'SELECT coin_balance FROM users WHERE id = ?',
      [id]
    );
    
    res.json({ 
      message: 'Coin balance updated',
      coinBalance: users[0].coin_balance 
    });
  } catch (error) {
    console.error('Update coins error:', error);
    res.status(500).json({ error: 'Failed to update coin balance' });
  }
});

// Get user transactions
router.get('/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const [transactions] = await pool.execute(`
      SELECT 
        t.id,
        t.coins_earned,
        t.waste_type,
        t.weight,
        t.transaction_date,
        b.location as bin_location,
        b.bin_type
      FROM transactions t
      JOIN bins b ON t.bin_id = b.id
      WHERE t.user_id = ?
      ORDER BY t.transaction_date DESC
      LIMIT ? OFFSET ?
    `, [id, parseInt(limit), parseInt(offset)]);
    
    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Add transaction (when user deposits waste)
router.post('/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const { binId, wasteType, weight, coinsEarned } = req.body;
    
    if (!binId || !wasteType || !coinsEarned) {
      return res.status(400).json({ error: 'Bin ID, waste type, and coins earned are required' });
    }
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Add transaction record
      await connection.execute(
        'INSERT INTO transactions (user_id, bin_id, coins_earned, waste_type, weight) VALUES (?, ?, ?, ?, ?)',
        [id, binId, coinsEarned, wasteType, weight || null]
      );
      
      // Update user coin balance
      await connection.execute(
        'UPDATE users SET coin_balance = coin_balance + ? WHERE id = ?',
        [coinsEarned, id]
      );
      
      // Update bin level (if weight provided)
      if (weight) {
        const levelIncrease = Math.min(Math.round(weight * 2), 20); // Max 20% increase per deposit
        await connection.execute(
          'UPDATE bins SET level = LEAST(level + ?, 100) WHERE id = ?',
          [levelIncrease, binId]
        );
      }
      
      await connection.commit();
      
      // Get updated balance
      const [users] = await pool.execute(
        'SELECT coin_balance FROM users WHERE id = ?',
        [id]
      );
      
      res.json({
        message: 'Transaction recorded successfully',
        coinBalance: users[0].coin_balance
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({ error: 'Failed to record transaction' });
  }
});

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await pool.execute(
      'SELECT id, first_name, last_name, email, coin_balance, qr_code, created_at FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[0];
    res.json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        coinBalance: user.coin_balance,
        qrCode: user.qr_code,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get leaderboard (top users by coin balance)
router.get('/leaderboard/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const [users] = await pool.execute(`
      SELECT 
        id,
        first_name,
        last_name,
        coin_balance,
        ROW_NUMBER() OVER (ORDER BY coin_balance DESC) as rank
      FROM users 
      ORDER BY coin_balance DESC 
      LIMIT ?
    `, [parseInt(limit)]);
    
    res.json({ leaderboard: users });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
