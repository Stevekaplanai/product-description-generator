const OpenAI = require('openai');
const fetch = require('node-fetch');

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        // For now, return mock data since actual web scraping requires additional setup
        // In production, you would:
        // 1. Fetch the webpage
        // 2. Parse HTML with cheerio or puppeteer
        // 3. Extract product information
        // 4. Use AI to analyze if needed
        
        const mockProductInfo = {
            success: true,
            productInfo: {
                name: 'Smart Product (Auto-detected)',
                category: 'electronics',
                features: [
                    'Premium quality',
                    'Advanced technology',
                    'User-friendly design'
                ].join('\n'),
                price: '$99.99',
                description: 'This product information would be extracted from the provided URL in production.'
            },
            message: 'Note: This is mock data. Web scraping functionality requires additional setup.'
        };
        
        // If OpenAI is configured, we could also analyze the page content
        if (openai && false) { // Disabled for now
            // In production: fetch page, extract text, analyze with GPT
            const analysis = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Extract product information from the given text.'
                    },
                    {
                        role: 'user',
                        content: `Extract product info from URL: ${url}`
                    }
                ],
                max_tokens: 500
            });
            
            // Parse and return the analysis
        }
        
        return res.status(200).json(mockProductInfo);
        
    } catch (error) {
        console.error('Product extraction error:', error);
        return res.status(500).json({ 
            error: 'Failed to extract product information',
            details: error.message 
        });
    }
};