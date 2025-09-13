# Vertex AI (Nano Banana) Image Generation Setup

## Overview
The application uses Google Vertex AI's Imagen model (imagegeneration@006) as the primary image generation service, with OpenAI's DALL-E 3 as a fallback.

## Current Configuration

### Local Development
- **Authentication**: Application Default Credentials (ADC)
- **Credentials Location**: `C:\Users\steve\AppData\Roaming\gcloud\application_default_credentials.json`
- **Project**: `rare-result-471417-k0`
- **Location**: `us-central1`
- **Model**: `imagegeneration@006` (Vertex AI Imagen)

### Production (Vercel)
For production deployment on Vercel, you need to:

1. **Create a Service Account**:
```bash
gcloud iam service-accounts create vertex-ai-image-gen \
    --display-name="Vertex AI Image Generation"
```

2. **Grant Required Permissions**:
```bash
gcloud projects add-iam-policy-binding rare-result-471417-k0 \
    --member="serviceAccount:vertex-ai-image-gen@rare-result-471417-k0.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"
```

3. **Create and Download Service Account Key**:
```bash
gcloud iam service-accounts keys create vertex-ai-key.json \
    --iam-account=vertex-ai-image-gen@rare-result-471417-k0.iam.gserviceaccount.com
```

4. **Add to Vercel Environment Variables**:
   - Copy the contents of `vertex-ai-key.json`
   - Go to Vercel Dashboard > Settings > Environment Variables
   - Add `GOOGLE_APPLICATION_CREDENTIALS_JSON` with the JSON content as value
   - The app will automatically write this to a temp file on startup

## Image Generation Flow

1. **Primary**: Vertex AI Imagen
   - Uses Google Cloud's Imagen model
   - Generates high-quality product images
   - Cost-effective for high volume

2. **Fallback**: OpenAI DALL-E 3
   - Activated when Vertex AI fails or is not configured
   - Uses OpenAI API key
   - Higher quality but more expensive

## API Endpoints

### `/api/generate-image-hybrid`
- Attempts Vertex AI first
- Falls back to DALL-E if Vertex fails
- Returns array of generated images with metadata

### Response Format
```javascript
{
  success: true,
  results: [
    {
      url: "https://...",
      source: "Vertex AI Imagen",
      model: "imagegeneration@006",
      type: "hero"
    },
    // ... more images
  ]
}
```

## Troubleshooting

### Local Development Issues
1. **No credentials found**:
   ```bash
   gcloud auth application-default login
   ```

2. **Wrong project**:
   ```bash
   gcloud config set project rare-result-471417-k0
   ```

### Production Issues
1. **Vertex AI not working**: Check if service account JSON is properly set in Vercel
2. **DALL-E fallback active**: Verify Google Cloud credentials and permissions
3. **No images generated**: Check both API keys are configured

## Cost Optimization
- Vertex AI: ~$0.02 per image
- DALL-E 3: ~$0.04-0.08 per image
- Recommendation: Use Vertex AI for production, DALL-E for premium requests

## Required Environment Variables

### Local (.env)
```
GOOGLE_CLOUD_PROJECT=rare-result-471417-k0
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=C:\Users\steve\AppData\Roaming\gcloud\application_default_credentials.json
```

### Production (Vercel)
```
GOOGLE_CLOUD_PROJECT=rare-result-471417-k0
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS_JSON={...service account JSON content...}
OPENAI_API_KEY=sk-proj-...
```

## Testing Image Generation

1. **Test Vertex AI**:
   - Generate image with product description
   - Check logs for "✅ Vertex AI image generated successfully"

2. **Test DALL-E Fallback**:
   - Temporarily remove Google credentials
   - Verify "✅ DALL-E image generated successfully" in logs

3. **Verify Both Services**:
   - Check `/api/generate-image-hybrid` response
   - Confirm `source` field shows correct service