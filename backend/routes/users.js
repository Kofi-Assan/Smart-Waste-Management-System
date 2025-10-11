const express = require('express');
const { pool } = require('../config/database');
const { sendRewardConfirmationEmail } = require('../services/emailService');

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

// Add coins to user balance (POST method for frontend compatibility)
router.post('/:id/coins', async (req, res) => {
  try {
    const { id } = req.params;
    const { coins, action = 'add' } = req.body;
    
    if (typeof coins !== 'number') {
      return res.status(400).json({ error: 'Coins must be a number' });
    }
    
    let coinChange = coins;
    if (action === 'subtract') {
      coinChange = -coins;
    }
    
    const [result] = await pool.execute(
      'UPDATE users SET coin_balance = coin_balance + ? WHERE id = ?',
      [coinChange, id]
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
      message: 'Coin balance updated successfully',
      newBalance: users[0].coin_balance,
      coinsAdded: coinChange
    });
  } catch (error) {
    console.error('Add coins error:', error);
    res.status(500).json({ error: 'Failed to update coin balance' });
  }
});

// Get user transactions
router.get('/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // Use a schema-tolerant query (omit optional/non-universal columns)
    const [transactions] = await pool.execute(`
      SELECT 
        t.id,
        t.coins_earned,
        t.transaction_date,
        t.bin_id,
        b.location as bin_location,
        b.bin_type
      FROM transactions t
      LEFT JOIN bins b ON t.bin_id = b.id
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

// Redeem reward
router.post('/:id/redeem', async (req, res) => {
  try {
    const { id } = req.params;
    const { rewardId, rewardName, cost } = req.body;
    
    if (!rewardId || !rewardName || !cost) {
      return res.status(400).json({ error: 'Reward ID, name, and cost are required' });
    }
    
    if (typeof cost !== 'number' || cost <= 0) {
      return res.status(400).json({ error: 'Cost must be a positive number' });
    }
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Check user's current balance
      const [users] = await connection.execute(
        'SELECT coin_balance FROM users WHERE id = ?',
        [id]
      );
      
      if (users.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'User not found' });
      }
      
      const currentBalance = users[0].coin_balance;
      
      if (currentBalance < cost) {
        await connection.rollback();
        return res.status(400).json({ 
          error: 'Insufficient coins',
          currentBalance,
          requiredCost: cost
        });
      }
      
      // Deduct coins from user balance
      await connection.execute(
        'UPDATE users SET coin_balance = coin_balance - ? WHERE id = ?',
        [cost, id]
      );
      
      // Record redemption transaction (no waste_type/weight columns)
      await connection.execute(
        `INSERT INTO transactions (user_id, bin_id, coins_earned, transaction_date)
         VALUES (?, ?, ?, NOW())`,
        [id, null, -cost]
      );
      
      await connection.commit();
      
      // Get updated balance and user info for email
      const [updatedUsers] = await pool.execute(
        'SELECT coin_balance, first_name, last_name, email FROM users WHERE id = ?',
        [id]
      );
      
      const user = updatedUsers[0];
      const newBalance = user.coin_balance;
      
      // Send confirmation email
      try {
        const emailResult = await sendRewardConfirmationEmail(
          user.email,
          `${user.first_name} ${user.last_name}`,
          rewardName,
          cost,
          newBalance
        );
        
        if (emailResult.success) {
          console.log(`✅ Reward confirmation email sent to ${user.email}`);
        } else {
          console.log(`⚠️ Failed to send email to ${user.email}: ${emailResult.error}`);
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the redemption if email fails
      }
      
      res.json({
        message: 'Reward redeemed successfully',
        rewardName,
        cost,
        newBalance,
        emailSent: true,
        emailAddress: user.email
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    // Log full error and surface message in dev for easier debugging
    console.error('Redeem reward error:', error);
    const message = process.env.NODE_ENV === 'development' ? (error.message || 'Failed to redeem reward') : 'Failed to redeem reward';
    res.status(500).json({ error: message });
  }
});

module.exports = router;
