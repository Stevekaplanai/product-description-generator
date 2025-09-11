const { db } = require('./lib/database');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, type, data } = req.body;

        if (!userId || !type || !data) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Track generation in Redis
        const generation = await db.trackGeneration(userId, type, data);

        // Get user's recent generations for response
        const recentGenerations = await db.getGenerations(userId, 10);

        // Get updated stats
        const stats = await db.getStats();

        return res.status(200).json({
            success: true,
            generation,
            recentGenerations,
            stats
        });

    } catch (error) {
        console.error('Track generation error:', error);
        return res.status(500).json({ 
            error: 'Failed to track generation',
            message: error.message 
        });
    }
};