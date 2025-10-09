# Smart Waste Management System - Backend

Node.js/Express backend API for the Smart Waste Management System with MySQL database integration.

## Features

- **User Authentication**: Register, login, and JWT token management
- **Bin Management**: CRUD operations for smart bins with location tracking
- **Coin System**: User coin balance and transaction tracking
- **QR Code Integration**: Unique QR codes for user identification
- **Real-time Data**: Bin status and level monitoring

## Database Schema

### Users Table
- `id`: Primary key
- `first_name`, `last_name`: User names
- `email`: Unique email address
- `password_hash`: Bcrypt hashed password
- `coin_balance`: User's coin balance (default: 0)
- `qr_code`: Unique QR code for user identification
- `created_at`, `updated_at`: Timestamps

### Bins Table
- `id`: Primary key
- `location`: Human-readable location name
- `latitude`, `longitude`: GPS coordinates
- `status`: active, maintenance, full, offline
- `level`: Fill level (0-100%)
- `bin_type`: plastic, paper, glass, metal, organic
- `capacity`: Maximum capacity
- `last_emptied`: Last maintenance timestamp
- `created_at`, `updated_at`: Timestamps

### Transactions Table
- `id`: Primary key
- `user_id`: Foreign key to users table
- `bin_id`: Foreign key to bins table
- `coins_earned`: Coins earned from this transaction
- `waste_type`: Type of waste deposited
- `weight`: Weight of deposited waste
- `transaction_date`: When transaction occurred

## Installation

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the backend directory:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=smart_waste_management
   PORT=3000
   JWT_SECRET=your_jwt_secret_key_here
   ```

3. **Database Setup**
   - Install MySQL server
   - Create database: `smart_waste_management`
   - The application will automatically create tables on first run

4. **Start Server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (requires token)

### Bins
- `GET /api/bins` - Get all bins
- `GET /api/bins/:id` - Get specific bin
- `POST /api/bins` - Create new bin
- `PUT /api/bins/:id` - Update bin status/level
- `GET /api/bins/status/:status` - Get bins by status
- `GET /api/bins/type/:type` - Get bins by type
- `GET /api/bins/nearby/:lat/:lng/:radius` - Get nearby bins

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/coins` - Get user coin balance
- `PUT /api/users/:id/coins` - Update coin balance
- `GET /api/users/:id/transactions` - Get user transactions
- `POST /api/users/:id/transactions` - Add new transaction
- `GET /api/users/leaderboard/top` - Get leaderboard

### Health Check
- `GET /api/health` - API health status

## Usage Examples

### Register User
```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password123'
  })
});
```

### Login User
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123'
  })
});
```

### Get All Bins
```javascript
const response = await fetch('/api/bins');
const data = await response.json();
```

### Add Transaction
```javascript
const response = await fetch('/api/users/1/transactions', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_jwt_token'
  },
  body: JSON.stringify({
    binId: 1,
    wasteType: 'plastic',
    weight: 2.5,
    coinsEarned: 10
  })
});
```

## Development

The server runs on `http://localhost:3000` by default. The frontend is served from the same port, and API endpoints are available at `/api/*`.

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- SQL injection protection with prepared statements
- CORS enabled for cross-origin requests
- Input validation and sanitization

## Database Connection

The application uses MySQL2 with connection pooling for optimal performance. Connection details are configured via environment variables.
