const crypto = require('crypto');
const { sendEmail } = require('../send-email');

// In-memory storage for video status (will be replaced with database later)
const videoStatus = new Map();

// Helper to verify D-ID webhook signature
function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle GET requests to check video status
  if (req.method === 'GET') {
    const { videoId } = req.query;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID required' });
    }

    const status = videoStatus.get(videoId) || { status: 'unknown' };
    return res.status(200).json(status);
  }

  // Handle POST webhook from D-ID
  if (req.method === 'POST') {
    try {
      const webhookSecret = process.env.D_ID_WEBHOOK_SECRET;
      const signature = req.headers['x-webhook-signature'];
      
      // Verify webhook signature if secret is configured
      if (webhookSecret && signature) {
        const isValid = verifyWebhookSignature(
          JSON.stringify(req.body),
          signature,
          webhookSecret
        );
        
        if (!isValid) {
          console.error('Invalid webhook signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      const { id, object, status, result_url, error, user_data } = req.body;
      
      // Parse user data if available
      let userData = {};
      try {
        userData = user_data ? JSON.parse(user_data) : {};
      } catch (e) {
        console.log('Could not parse user_data:', e);
      }

      // Log webhook event
      console.log('D-ID Webhook received:', {
        id,
        object,
        status,
        timestamp: new Date().toISOString()
      });

      // Update video status
      const videoData = {
        id,
        status,
        result_url,
        error,
        updated_at: new Date().toISOString(),
        object
      };

      videoStatus.set(id, videoData);

      // Handle different status types
      switch (status) {
        case 'created':
          console.log(`Video ${id} created, processing started`);
          break;
        case 'done':
          console.log(`Video ${id} completed successfully`);
          console.log(`Video URL: ${result_url}`);
          
          // Send email notification if user email is available
          if (userData.email) {
            await sendEmail(userData.email, 'videoGenerationComplete', {
              productName: userData.productName || 'Your product',
              videoUrl: result_url,
              videoId: id
            });
          }
          
          // TODO: Update database with completed status
          break;
        case 'error':
        case 'rejected':
          console.error(`Video ${id} failed:`, error);
          
          // Send failure notification if user email is available
          if (userData.email) {
            await sendEmail(userData.email, 'videoGenerationFailed', {
              productName: userData.productName || 'Your product',
              error: error || 'Unknown error occurred',
              videoId: id
            });
          }
          
          // TODO: Possibly trigger retry logic
          break;
        default:
          console.log(`Video ${id} status: ${status}`);
      }

      // Send success response to D-ID
      return res.status(200).json({ 
        received: true,
        id,
        status 
      });

    } catch (error) {
      console.error('Webhook processing error:', error);
      return res.status(500).json({ 
        error: 'Webhook processing failed',
        message: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

// Export the video status map for use in other modules
module.exports.videoStatus = videoStatus;