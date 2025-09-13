// Get available avatars for video generation

const AVATAR_OPTIONS = {
  'professional-male': {
    id: 'professional-male',
    name: 'Alex',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4',
    description: 'Professional male presenter',
    category: 'Professional'
  },
  'professional-female': {
    id: 'professional-female',
    name: 'Sarah',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=c0aede',
    description: 'Professional female presenter',
    category: 'Professional'
  },
  'casual-male': {
    id: 'casual-male',
    name: 'Mike',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike&backgroundColor=ffd5dc',
    description: 'Friendly casual male',
    category: 'Casual'
  },
  'casual-female': {
    id: 'casual-female',
    name: 'Emma',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=ffc9a9',
    description: 'Friendly casual female',
    category: 'Casual'
  },
  'young-male': {
    id: 'young-male',
    name: 'Tyler',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tyler&backgroundColor=a8e6cf',
    description: 'Young energetic male',
    category: 'Young & Energetic'
  },
  'young-female': {
    id: 'young-female',
    name: 'Zoe',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe&backgroundColor=ffd3b6',
    description: 'Young energetic female',
    category: 'Young & Energetic'
  },
  'mature-male': {
    id: 'mature-male',
    name: 'Robert',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert&backgroundColor=d5d5d5',
    description: 'Mature professional male',
    category: 'Mature'
  },
  'mature-female': {
    id: 'mature-female',
    name: 'Diana',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana&backgroundColor=ffaaa5',
    description: 'Mature professional female',
    category: 'Mature'
  }
};

const VOICE_OPTIONS = [
  { id: 'en-US-JennyNeural', name: 'Jenny', accent: 'US', gender: 'Female', description: 'Clear American female voice' },
  { id: 'en-US-GuyNeural', name: 'Guy', accent: 'US', gender: 'Male', description: 'Professional American male voice' },
  { id: 'en-US-AriaNeural', name: 'Aria', accent: 'US', gender: 'Female', description: 'Friendly American female voice' },
  { id: 'en-US-DavisNeural', name: 'Davis', accent: 'US', gender: 'Male', description: 'Casual American male voice' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia', accent: 'UK', gender: 'Female', description: 'British female voice' },
  { id: 'en-GB-RyanNeural', name: 'Ryan', accent: 'UK', gender: 'Male', description: 'British male voice' },
  { id: 'en-AU-NatashaNeural', name: 'Natasha', accent: 'Australian', gender: 'Female', description: 'Australian female voice' },
  { id: 'en-AU-WilliamNeural', name: 'William', accent: 'Australian', gender: 'Male', description: 'Australian male voice' }
];

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Group avatars by category
    const avatarsByCategory = {};
    Object.values(AVATAR_OPTIONS).forEach(avatar => {
      if (!avatarsByCategory[avatar.category]) {
        avatarsByCategory[avatar.category] = [];
      }
      avatarsByCategory[avatar.category].push(avatar);
    });

    return res.status(200).json({
      success: true,
      avatars: Object.values(AVATAR_OPTIONS),
      avatarsByCategory,
      voices: VOICE_OPTIONS,
      defaultAvatar: 'professional-female',
      defaultVoice: 'en-US-JennyNeural'
    });
  } catch (error) {
    console.error('Get avatars error:', error);
    res.status(500).json({ 
      error: 'Failed to get avatars', 
      message: error.message 
    });
  }
};