// Get available avatars for video generation

const AVATAR_OPTIONS = {
  'professional-male': {
    id: 'professional-male',
    name: 'Alex',
    imageUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    description: 'Professional male presenter',
    category: 'Professional'
  },
  'professional-female': {
    id: 'professional-female',
    name: 'Sarah', 
    imageUrl: 'https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083383_640.jpg',
    description: 'Professional female presenter',
    category: 'Professional'
  },
  'casual-male': {
    id: 'casual-male',
    name: 'Mike',
    imageUrl: 'https://cdn.pixabay.com/photo/2016/11/21/12/42/beard-1845166_640.jpg',
    description: 'Friendly casual male',
    category: 'Casual'
  },
  'casual-female': {
    id: 'casual-female',
    name: 'Emma',
    imageUrl: 'https://cdn.pixabay.com/photo/2017/08/07/14/15/portrait-2604283_640.jpg', 
    description: 'Friendly casual female',
    category: 'Casual'
  },
  'young-male': {
    id: 'young-male',
    name: 'Tyler',
    imageUrl: 'https://cdn.pixabay.com/photo/2018/04/27/03/50/portrait-3353699_640.jpg',
    description: 'Young energetic male',
    category: 'Young & Energetic'
  },
  'young-female': {
    id: 'young-female',
    name: 'Zoe',
    imageUrl: 'https://cdn.pixabay.com/photo/2016/01/19/17/48/woman-1149911_640.jpg',
    description: 'Young energetic female',
    category: 'Young & Energetic'
  },
  'mature-male': {
    id: 'mature-male',
    name: 'Robert',
    imageUrl: 'https://cdn.pixabay.com/photo/2015/01/08/18/29/entrepreneur-593358_640.jpg',
    description: 'Mature professional male',
    category: 'Mature'
  },
  'mature-female': {
    id: 'mature-female',
    name: 'Diana',
    imageUrl: 'https://cdn.pixabay.com/photo/2018/01/13/19/39/fashion-3080644_640.jpg',
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