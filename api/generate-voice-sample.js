const sdk = require('microsoft-cognitiveservices-speech-sdk');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, voiceId } = req.body;

        if (!text || !voiceId) {
            return res.status(400).json({ error: 'Text and voiceId are required' });
        }

        // Azure Speech API configuration
        const speechKey = process.env.AZURE_SPEECH_KEY;
        const speechRegion = process.env.AZURE_SPEECH_REGION || 'eastus';

        if (!speechKey) {
            console.error('Azure Speech API key not configured');
            // Return a mock response for testing
            return res.status(200).json({
                success: true,
                audioUrl: 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABkYXRhDgAAAAEA/v8CAP7/AgACAP7/AQA='
            });
        }

        // Configure speech synthesis
        const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
        speechConfig.speechSynthesisVoiceName = voiceId;
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

        // Create synthesizer
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

        // Generate speech
        const result = await new Promise((resolve, reject) => {
            synthesizer.speakTextAsync(
                text,
                result => {
                    synthesizer.close();
                    resolve(result);
                },
                error => {
                    synthesizer.close();
                    reject(error);
                }
            );
        });

        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            // Convert audio data to base64
            const audioData = Buffer.from(result.audioData).toString('base64');
            const audioUrl = `data:audio/mp3;base64,${audioData}`;

            res.status(200).json({
                success: true,
                audioUrl: audioUrl
            });
        } else {
            console.error('Speech synthesis failed:', result.errorDetails);
            res.status(500).json({
                error: 'Failed to generate speech',
                details: result.errorDetails
            });
        }
    } catch (error) {
        console.error('Voice sample generation error:', error);
        
        // Return a simple beep sound as fallback for testing
        const fallbackAudio = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABkYXRhDgAAAAEA/v8CAP7/AgACAP7/AQA=';
        
        res.status(200).json({
            success: true,
            audioUrl: fallbackAudio,
            fallback: true
        });
    }
};