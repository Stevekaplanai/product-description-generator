const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { createUser, getUserByEmail, createSession } = require('../lib/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '33582369743-qn5tcsguqg16jo7ue7dlr4vg0e51d9io.apps.googleusercontent.com';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

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

  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential required' });
    }

    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId, email_verified } = payload;

    // Check if user exists
    let user = await getUserByEmail(email);

    if (!user) {
      // Create new user from Google data
      const userId = crypto.randomBytes(16).toString('hex');
      const userData = {
        id: userId,
        email: email.toLowerCase(),
        name,
        picture,
        googleId,
        provider: 'google',
        password: null, // No password for OAuth users
        createdAt: new Date().toISOString(),
        plan: 'free',
        stripeCustomerId: null,
        emailVerified: email_verified || false
      };

      await createUser(userData);
      user = userData;
    }

    // Generate token
    const token = generateToken(user.id);

    // Create session
    await createSession(user.id, token);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        plan: user.plan,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
};