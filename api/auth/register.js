const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
const users = new Map(); // In production, use a database

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { email, password, name } = req.body;
  
  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Check if user exists
  if (users.has(email)) {
    return res.status(409).json({ error: 'User already exists' });
  }
  
  // Create user
  const userId = crypto.randomBytes(16).toString('hex');
  const user = {
    id: userId,
    email,
    name: name || email.split('@')[0],
    password: hashPassword(password),
    createdAt: new Date().toISOString(),
    subscription: 'free',
    usage: {
      descriptions: 0,
      images: 0,
      videos: 0,
      bulk: 0
    }
  };
  
  users.set(email, user);
  
  // Generate token
  const token = generateToken(userId);
  
  res.status(201).json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription: user.subscription
    }
  });
};