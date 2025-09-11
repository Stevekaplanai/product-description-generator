# D-ID API Setup Guide

## Issue Diagnosis
The video generation was failing with a 500 error because:
1. **Authentication Format**: The API was using incorrect Basic auth format
2. **API Key Format**: D-ID expects the API key as the username with an empty password in Basic auth

## Fixed Authentication
The authentication has been updated from:
```javascript
'Authorization': `Basic ${D_ID_API_KEY}`
```

To the correct format:
```javascript
const authString = Buffer.from(`${D_ID_API_KEY}:`).toString('base64');
'Authorization': `Basic ${authString}`
```

## Webhook Configuration (Optional but Recommended)

### Why Use Webhooks?
- Avoids polling for video status
- More efficient and faster response times
- Better user experience with real-time updates

### Setting Up D-ID Webhooks

1. **Webhook Endpoint**
   Your webhook endpoint is already deployed at:
   ```
   https://productdescriptions.io/api/webhooks/did-video
   ```

2. **Configure in D-ID Dashboard**
   - Log into your D-ID account
   - Navigate to Settings → Webhooks
   - Add your webhook URL
   - Select events to subscribe to:
     - `talk.created` - When video generation starts
     - `talk.done` - When video is ready
     - `talk.error` - If generation fails

3. **Webhook Secret (Optional)**
   For added security, you can configure a webhook secret:
   - Generate a secret in D-ID dashboard
   - Add to Vercel environment variables:
     ```
     D_ID_WEBHOOK_SECRET=your_webhook_secret_here
     ```

## Vercel Environment Variables

Ensure these are set in your Vercel project:

```bash
# D-ID API Configuration
D_ID_API_KEY=your_api_key_here  # Your actual D-ID API key

# Optional - for webhook verification
D_ID_WEBHOOK_SECRET=your_webhook_secret_here

# Cloudinary (for video storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Testing the Fix

1. **Deploy to Vercel**
   The fix has been pushed to GitHub and should auto-deploy

2. **Test Video Generation**
   - Go to https://productdescriptions.io/app.html
   - Enter a product name
   - Click on the video tab
   - Click "Generate Video"

3. **Monitor Logs**
   Check Vercel function logs for detailed error messages:
   ```bash
   vercel logs --follow
   ```

## Current Video Generation Flow

1. **With Webhook (Recommended)**
   - Request sent to D-ID API
   - Immediate response with video ID
   - D-ID processes video asynchronously
   - Webhook called when complete
   - User can check status via `/api/webhooks/did-video?videoId=xxx`

2. **Without Webhook (Fallback)**
   - Uses demo video for now
   - Can be updated to poll D-ID API

## Troubleshooting

### If video generation still fails:

1. **Check API Key Format**
   - Ensure your D-ID API key is correct
   - Should be a long string (usually 40+ characters)
   - No extra spaces or quotes

2. **Check API Credits**
   - Log into D-ID dashboard
   - Verify you have credits remaining
   - Check if your plan supports the features being used

3. **Test API Directly**
   Use curl to test the API:
   ```bash
   curl -X POST https://api.d-id.com/talks \
     -H "Authorization: Basic $(echo -n 'YOUR_API_KEY:' | base64)" \
     -H "Content-Type: application/json" \
     -d '{
       "script": {
         "type": "text",
         "input": "Hello world"
       },
       "source_url": "https://create-images-results.d-id.com/DefaultPresenters/Noelle_t/image.jpeg"
     }'
   ```

4. **Check Vercel Logs**
   ```bash
   vercel logs api/generate-video
   ```

## Next Steps

1. **Monitor Initial Deployment**
   - Wait for Vercel deployment (1-2 minutes)
   - Test video generation
   - Check function logs for any errors

2. **Configure Webhook (Optional)**
   - Set up webhook in D-ID dashboard
   - Add webhook secret to Vercel
   - Test webhook notifications

3. **Optimize Video Settings**
   - Adjust video quality settings
   - Choose different avatars
   - Customize voice options

## Support

If issues persist after following this guide:
1. Check D-ID API status: https://status.d-id.com/
2. Review D-ID documentation: https://docs.d-id.com/
3. Contact D-ID support with your API request ID from the logs