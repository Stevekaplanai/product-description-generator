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
  
  const { email, password } = req.body;
  
  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  // Find user
  const user = users.get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Check password
  if (hashPassword(password) !== user.password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate token
  const token = generateToken(user.id);
  
  // Check subscription status from Stripe
  let subscription = 'free';
  try {
    const checkSubResponse = await fetch(`${process.env.VERCEL_URL || 'https://productdescriptions.io'}/api/check-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    
    if (checkSubResponse.ok) {
      const subData = await checkSubResponse.json();
      subscription = subData.plan || 'free';
    }
  } catch (error) {
    console.error('Error checking subscription:', error);
  }
  
  res.status(200).json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription: subscription,
      usage: user.usage
    }
  });
};