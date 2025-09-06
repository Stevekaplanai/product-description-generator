import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { imageBase64, preferredApi = 'openai' } = req.body;

    if (!imageBase64) {
        return res.status(400).json({ error: 'No image provided' });
    }

    try {
        let analysisResult;

        if (preferredApi === 'gemini' && process.env.GEMINI_API_KEY) {
            analysisResult = await analyzeWithGemini(imageBase64);
        } else if (process.env.OPENAI_API_KEY) {
            analysisResult = await analyzeWithOpenAI(imageBase64);
        } else if (process.env.GEMINI_API_KEY) {
            analysisResult = await analyzeWithGemini(imageBase64);
        } else {
            return res.status(500).json({ error: 'No AI API keys configured' });
        }

        return res.status(200).json(analysisResult);
    } catch (error) {
        console.error('Image analysis error:', error);
        return res.status(500).json({ 
            error: 'Failed to analyze image',
            details: error.message 
        });
    }
}

async function analyzeWithOpenAI(imageBase64) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Analyze this product image and provide detailed information in JSON format:
    {
        "productName": "specific product name",
        "category": "product category",
        "features": ["feature1", "feature2", "feature3", "feature4", "feature5"],
        "targetAudience": "primary target audience",
        "suggestedTone": "professional/casual/playful/luxury",
        "colors": ["primary colors visible"],
        "materials": ["visible materials if applicable"],
        "brandName": "brand if visible",
        "productType": "specific type",
        "keySellingPoints": ["unique selling point 1", "unique selling point 2"],
        "suggestedDescription": "A compelling 2-3 sentence product description",
        "estimatedPrice": "price range estimate",
        "style": "modern/classic/minimalist/etc"
    }
    
    Be specific and detailed. If you can't determine something, use "Not visible" or provide your best educated guess based on the product type.`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: prompt
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/jpeg;base64,${imageBase64}`,
                            detail: "high"
                        }
                    }
                ]
            }
        ],
        max_tokens: 1000,
        temperature: 0.3
    });

    try {
        const content = response.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(content);
    } catch (e) {
        console.error('Failed to parse OpenAI response:', e);
        throw new Error('Failed to parse AI response');
    }
}

async function analyzeWithGemini(imageBase64) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this product image and provide detailed information in JSON format:
    {
        "productName": "specific product name",
        "category": "product category",
        "features": ["feature1", "feature2", "feature3", "feature4", "feature5"],
        "targetAudience": "primary target audience",
        "suggestedTone": "professional/casual/playful/luxury",
        "colors": ["primary colors visible"],
        "materials": ["visible materials if applicable"],
        "brandName": "brand if visible",
        "productType": "specific type",
        "keySellingPoints": ["unique selling point 1", "unique selling point 2"],
        "suggestedDescription": "A compelling 2-3 sentence product description",
        "estimatedPrice": "price range estimate",
        "style": "modern/classic/minimalist/etc"
    }
    
    Be specific and detailed. If you can't determine something, use "Not visible" or provide your best educated guess based on the product type.
    Return ONLY valid JSON, no markdown or additional text.`;

    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType: "image/jpeg"
        }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(text);
    } catch (e) {
        console.error('Failed to parse Gemini response:', e);
        throw new Error('Failed to parse AI response');
    }
}