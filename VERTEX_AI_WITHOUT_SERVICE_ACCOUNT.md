# Vertex AI Setup Without Service Account Keys

Your organization has disabled service account key creation for security reasons. This is actually a best practice! Here's how to use Vertex AI anyway.

## Solution: Use Application Default Credentials (ADC)

ADC uses your personal Google account credentials when developing locally, and automatically switches to managed service accounts when deployed to Google Cloud.

## Step-by-Step Setup

### 1. Install Google Cloud SDK (if not already installed)
Download from: https://cloud.google.com/sdk/docs/install

### 2. Authenticate with your Google Account

Run these commands in order:

```bash
# Login with your Google account (will open browser)
gcloud auth login

# Set up Application Default Credentials (will open browser again)
gcloud auth application-default login

# Set your project
gcloud config set project rare-result-471417-k0

# Enable required APIs
gcloud services enable aiplatform.googleapis.com
```

### 3. Verify Authentication

```bash
# Check your current authentication
gcloud auth list

# Test access token generation
gcloud auth application-default print-access-token
```

### 4. Update Your .env File

```env
# Remove this line (not needed with ADC):
# GOOGLE_APPLICATION_CREDENTIALS=./gcloud-credentials.json

# Keep these:
GOOGLE_CLOUD_PROJECT=rare-result-471417-k0
GOOGLE_CLOUD_LOCATION=us-central1

# Keep your other API keys
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
```

### 5. Install Required Package

```bash
npm install google-auth-library
```

### 6. Test the Setup

```bash
# Test OAuth authentication
node test-vertex-oauth.js

# Test the hybrid API
node test-hybrid-api.js
```

## How It Works

1. **Locally**: Uses your personal Google account credentials stored in:
   - Windows: `%APPDATA%\gcloud\application_default_credentials.json`
   - Mac/Linux: `~/.config/gcloud/application_default_credentials.json`

2. **In Production**: Automatically uses the compute instance's service account (no keys needed!)

3. **Security**: No service account keys to manage or accidentally leak

## API Endpoints Available

### With OAuth/ADC Authentication:
- `/api/generate-image-vertex-oauth` - Vertex AI with OAuth
- `/api/generate-image-hybrid` - Tries Vertex AI → DALL-E → Gemini

### Fallback Options:
- DALL-E 3 (if Vertex AI fails)
- Gemini descriptions (if image generation fails)

## Troubleshooting

### "Could not obtain access token"
```bash
gcloud auth application-default login
```

### "API not enabled"
```bash
gcloud services enable aiplatform.googleapis.com
```

### "Permission denied"
Your Google account needs access to Vertex AI. Contact your Google Cloud admin to grant:
- `roles/aiplatform.user` or
- `roles/aiplatform.developer`

### "Quota exceeded"
Check your quotas at:
https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas

## Alternative: Use DALL-E as Primary

If Vertex AI setup is blocked by your organization, the system automatically falls back to DALL-E 3, which is already working in your setup.

## Benefits of This Approach

✅ **No service account keys** - More secure
✅ **Works with organization policies** - Compliant with security requirements
✅ **Automatic fallback** - DALL-E works if Vertex AI is unavailable
✅ **Easy local development** - Uses your personal credentials
✅ **Production ready** - Seamlessly switches to managed identities

## Cost Comparison

- **Vertex AI Imagen**: ~$0.02 per image
- **DALL-E 3**: $0.04-0.08 per image
- **Gemini Descriptions**: Free tier available

## Next Steps

1. Run `setup-gcloud-auth.bat` to configure authentication
2. Test with `node test-vertex-oauth.js`
3. Your hybrid API will automatically use the best available service

The system is designed to work even if Vertex AI isn't available, so you can proceed with DALL-E as your primary image generator while Vertex AI authentication is being set up.