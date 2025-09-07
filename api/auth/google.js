const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id';

// In production, use a database
const users = new Map();

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
  
  const { credential } = req.body;
  
  if (!credential) {
    return res.status(400).json({ error: 'Google credential required' });
  }
  
  try {
    // Decode the JWT from Google (without verification for demo)
    // In production, verify with Google's public keys
    const parts = credential.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    const { email, name, picture, sub: googleId } = payload;
    
    // Check if user exists
    let user = users.get(email);
    
    if (!user) {
      // Create new user from Google data
      const userId = crypto.randomBytes(16).toString('hex');
      user = {
        id: userId,
        email,
        name,
        picture,
        googleId,
        provider: 'google',
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
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        subscription: user.subscription
      }
    });
    
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};