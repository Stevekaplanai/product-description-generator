# Google Cloud Setup Guide for Image Generation

## Prerequisites
- Google Cloud account with billing enabled
- Project: `rare-result-471417-k0` (already configured)

## Step 1: Enable Required APIs

Run these commands in your terminal or Cloud Shell:

```bash
# Enable Vertex AI API
gcloud services enable aiplatform.googleapis.com

# Enable Cloud Vision API (optional, for image analysis)
gcloud services enable vision.googleapis.com

# Enable IAM API
gcloud services enable iam.googleapis.com
```

## Step 2: Create Service Account

### Option A: Using gcloud CLI
```bash
# Create service account
gcloud iam service-accounts create product-image-generator \
  --display-name="Product Image Generator Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding rare-result-471417-k0 \
  --member="serviceAccount:product-image-generator@rare-result-471417-k0.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Create and download key
gcloud iam service-accounts keys create ./gcloud-credentials.json \
  --iam-account=product-image-generator@rare-result-471417-k0.iam.gserviceaccount.com
```

### Option B: Using Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "IAM & Admin" > "Service Accounts"
3. Click "Create Service Account"
4. Name: `product-image-generator`
5. Grant roles:
   - Vertex AI User
   - Storage Object Viewer (if using Cloud Storage)
6. Click "Done"
7. Click on the created service account
8. Go to "Keys" tab
9. Add Key > Create new key > JSON
10. Save the file as `gcloud-credentials.json` in your project root

## Step 3: Set Environment Variables

Add these to your `.env` file:

```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=rare-result-471417-k0
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./gcloud-credentials.json

# Keep existing Gemini key
GEMINI_API_KEY=your_existing_gemini_key

# Keep DALL-E as fallback
OPENAI_API_KEY=your_existing_openai_key
```

## Step 4: Install Required Packages

```bash
npm install @google-cloud/aiplatform google-auth-library
```

## Step 5: Test Authentication

Run the test script:
```bash
node test-vertex-auth.js
```

## API Endpoints

Once configured, you'll have these endpoints:

1. **Primary**: `/api/generate-image-hybrid` 
   - Tries Vertex AI Imagen first
   - Falls back to DALL-E if Vertex fails
   - Falls back to Gemini descriptions if both fail

2. **Vertex Only**: `/api/generate-image-vertex`
   - Uses only Google Cloud Vertex AI

3. **DALL-E Only**: `/api/generate-image-dalle`
   - Uses only OpenAI DALL-E

4. **Gemini Descriptions**: `/api/generate-image-nano`
   - Generates detailed photography descriptions

## Troubleshooting

### Authentication Issues
- Ensure the service account has the correct permissions
- Check that the credentials file path is correct
- Verify the project ID matches your Google Cloud project

### API Not Enabled
Run: `gcloud services list --enabled` to check enabled APIs

### Quota Limits
- Vertex AI has usage quotas
- Check your quota at: https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas

## Cost Estimates

- **Vertex AI Imagen**: ~$0.02 per image
- **DALL-E 3**: $0.04-0.08 per image (depending on quality/size)
- **Gemini API**: Free tier available, then $0.00025 per 1K characters

## Support

For issues, check:
1. Google Cloud logs: `gcloud logging read`
2. Application logs in your terminal
3. Google Cloud Console > Vertex AI > Models