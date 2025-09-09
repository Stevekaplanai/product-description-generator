module.exports = async (req, res) => {
  const D_ID_API_KEY = process.env.D_ID_API_KEY;
  
  res.status(200).json({
    hasKey: !!D_ID_API_KEY,
    keyLength: D_ID_API_KEY ? D_ID_API_KEY.length : 0,
    keyFormat: D_ID_API_KEY ? {
      hasColon: D_ID_API_KEY.includes(':'),
      startsWithBasic: D_ID_API_KEY.startsWith('Basic '),
      firstPart: D_ID_API_KEY.split(':')[0],
      secondPartLength: D_ID_API_KEY.split(':')[1] ? D_ID_API_KEY.split(':')[1].length : 0
    } : null,
    // Test the exact same request that works in curl
    testAuth: `Basic ${D_ID_API_KEY}`
  });
};