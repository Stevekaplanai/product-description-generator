const { kv } = require('@vercel/kv');

// User management functions
async function createUser(userData) {
  const userId = userData.id;
  const email = userData.email.toLowerCase();

  // Store user by ID
  await kv.hset(`user:${userId}`, userData);

  // Store email to ID mapping for login
  await kv.set(`email:${email}`, userId);

  // Initialize user credits
  await kv.hset(`credits:${userId}`, {
    descriptions: userData.plan === 'free' ? 3 : userData.plan === 'starter' ? 100 : userData.plan === 'professional' ? 500 : 10000,
    images: userData.plan === 'free' ? 0 : userData.plan === 'starter' ? 50 : userData.plan === 'professional' ? 200 : 10000,
    videos: userData.plan === 'free' ? 0 : userData.plan === 'starter' ? 10 : userData.plan === 'professional' ? 50 : 10000,
    bulk: userData.plan === 'free' ? 0 : userData.plan === 'starter' ? 10 : userData.plan === 'professional' ? 50 : 10000,
    resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Monthly reset
  });

  return userData;
}

async function getUserByEmail(email) {
  const userId = await kv.get(`email:${email.toLowerCase()}`);
  if (!userId) return null;

  const user = await kv.hgetall(`user:${userId}`);
  return user;
}

async function getUserById(userId) {
  const user = await kv.hgetall(`user:${userId}`);
  return user;
}

async function updateUser(userId, updates) {
  await kv.hset(`user:${userId}`, updates);
  return await getUserById(userId);
}

// Credit management functions
async function getUserCredits(userId) {
  const credits = await kv.hgetall(`credits:${userId}`);

  if (!credits) {
    // Initialize credits for existing user
    const user = await getUserById(userId);
    if (!user) return null;

    const defaultCredits = {
      descriptions: user.plan === 'free' ? 3 : user.plan === 'starter' ? 100 : user.plan === 'professional' ? 500 : 10000,
      images: user.plan === 'free' ? 0 : user.plan === 'starter' ? 50 : user.plan === 'professional' ? 200 : 10000,
      videos: user.plan === 'free' ? 0 : user.plan === 'starter' ? 10 : user.plan === 'professional' ? 50 : 10000,
      bulk: user.plan === 'free' ? 0 : user.plan === 'starter' ? 10 : user.plan === 'professional' ? 50 : 10000,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    await kv.hset(`credits:${userId}`, defaultCredits);
    return defaultCredits;
  }

  // Check if credits need to be reset (monthly)
  if (credits.resetDate && new Date(credits.resetDate) < new Date()) {
    const user = await getUserById(userId);
    const resetCredits = {
      descriptions: user.plan === 'free' ? 3 : user.plan === 'starter' ? 100 : user.plan === 'professional' ? 500 : 10000,
      images: user.plan === 'free' ? 0 : user.plan === 'starter' ? 50 : user.plan === 'professional' ? 200 : 10000,
      videos: user.plan === 'free' ? 0 : user.plan === 'starter' ? 10 : user.plan === 'professional' ? 50 : 10000,
      bulk: user.plan === 'free' ? 0 : user.plan === 'starter' ? 10 : user.plan === 'professional' ? 50 : 10000,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    await kv.hset(`credits:${userId}`, resetCredits);
    return resetCredits;
  }

  return credits;
}

async function deductCredits(userId, type, amount = 1) {
  const credits = await getUserCredits(userId);
  if (!credits) return { success: false, error: 'User not found' };

  const currentAmount = parseInt(credits[type] || 0);
  if (currentAmount < amount) {
    return { success: false, error: 'Insufficient credits', remaining: currentAmount };
  }

  const newAmount = currentAmount - amount;
  await kv.hset(`credits:${userId}`, { [type]: newAmount });

  // Track usage
  await trackUsage(userId, type, amount);

  return { success: true, remaining: newAmount };
}

async function addCredits(userId, type, amount) {
  const credits = await getUserCredits(userId);
  if (!credits) return { success: false, error: 'User not found' };

  const currentAmount = parseInt(credits[type] || 0);
  const newAmount = currentAmount + amount;

  await kv.hset(`credits:${userId}`, { [type]: newAmount });

  return { success: true, remaining: newAmount };
}

// Usage tracking
async function trackUsage(userId, type, amount = 1) {
  const today = new Date().toISOString().split('T')[0];
  const key = `usage:${userId}:${today}`;

  const currentUsage = await kv.hget(key, type) || 0;
  await kv.hset(key, { [type]: parseInt(currentUsage) + amount });

  // Set expiry for 90 days
  await kv.expire(key, 90 * 24 * 60 * 60);
}

async function getUsageHistory(userId, days = 30) {
  const history = {};
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const usage = await kv.hgetall(`usage:${userId}:${dateStr}`);
    if (usage && Object.keys(usage).length > 0) {
      history[dateStr] = usage;
    }
  }

  return history;
}

// Session management
async function createSession(userId, token) {
  await kv.set(`session:${token}`, userId, { ex: 7 * 24 * 60 * 60 }); // 7 days expiry
  return token;
}

async function getSession(token) {
  const userId = await kv.get(`session:${token}`);
  return userId;
}

async function deleteSession(token) {
  await kv.del(`session:${token}`);
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  getUserCredits,
  deductCredits,
  addCredits,
  trackUsage,
  getUsageHistory,
  createSession,
  getSession,
  deleteSession
};