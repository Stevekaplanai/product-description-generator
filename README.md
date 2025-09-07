# AI Product Description Generator

**Live Application**: https://productdescriptions.io

Complete AI-powered e-commerce content generation platform with product descriptions (Gemini), images (DALL-E 3), and UGC videos (D-ID).

## 🚀 Quick Context Restoration

To restore full context in a new Claude conversation, read these files:
1. This README.md - Complete project overview
2. `/api/generate-description.js` - Main AI generation logic
3. `/app.html` - Frontend application

## 📋 Current Configuration

### Deployment
- **Platform**: Vercel (auto-deploys from GitHub)
- **Domain**: productdescriptions.io (via AWS Route 53 → Vercel)
- **Repository**: Connected to GitHub (push to deploy)

### API Keys (All configured in Vercel Environment Variables)
- `GEMINI_API_KEY` / `GOOGLE_GEMINI_API_KEY` - Google Gemini 1.5 Flash
- `OPENAI_API_KEY` - DALL-E 3 & Vision API
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `D_ID_API_KEY` - Video generation
- `STRIPE_SECRET_KEY`, `STRIPE_PRICE_VIDEO_SINGLE`, `STRIPE_PRICE_VIDEO_TRIPLE`

## 🎯 Core Features

### 1. AI Product Analysis (Image Upload)
- Upload product image → AI identifies product
- Auto-populates form fields from image analysis
- Uses OpenAI Vision or Gemini Vision API
- Makes all form fields optional when image uploaded

### 2. Description Generation
- **Model**: Gemini 1.5 Flash (gemini-1.5-flash)
- Generates 3 variations (100-150 words each)
- SEO-optimized with different tones
- Enhanced with image analysis data if available

### 3. Image Generation  
- **Model**: DALL-E 3
- Professional product photography style
- White background e-commerce format
- Auto-uploads to Cloudinary CDN

### 4. Video Upsell System
- Delayed popup (1-2 minutes after generation)
- Two pricing tiers: $29 single, $69 triple pack
- Stripe checkout integration
- Mobile-optimized popup design

### 5. Combined View (No Tabs)
- Descriptions and images display together
- Streamlined mobile experience
- No tab switching required

## 📁 Project Structure

```
product-description-generator/
├── api/                         # Vercel serverless functions
│   ├── generate-description.js # Main AI generation (Gemini + DALL-E)
│   ├── analyze-image.js        # Image analysis (Vision APIs)  
│   ├── create-video-checkout.js # Stripe video checkout
│   ├── generate-video.js       # D-ID video generation
│   └── debug.js                # API configuration check
├── src/
│   └── video-composer.js       # FFmpeg video composition
├── tests/                      # Test suites
│   └── playwright/            # E2E tests
├── app.html                   # Main application (single-page)
├── index.html                 # Landing page
├── bulk.html                  # CSV bulk upload
├── privacy.html               # Legal pages
├── terms.html
├── refund.html
├── package.json              # Dependencies
├── vercel.json              # Deployment config
└── .env.example            # Environment template
```

## 🔧 API Endpoints

### Main Endpoints
- `POST /api/generate-description` - Generate descriptions & images
- `POST /api/analyze-image` - AI product identification
- `POST /api/create-video-checkout` - Stripe video purchase
- `POST /api/generate-video` - D-ID video creation
- `GET /api/debug` - Check API configuration

## 💻 Local Development

**Note**: This app is designed for Vercel deployment. Local development requires:

1. Install dependencies:
```bash
npm install
```

2. Set environment variables in Vercel dashboard
3. Use Vercel CLI for local testing:
```bash
vercel dev
```

## 🚀 Deployment

Push to GitHub main branch → Auto-deploys to Vercel

```bash
git add .
git commit -m "Update"
git push origin main
```

## 🐛 Known Issues & Fixes

### 1. Gemini Not Generating
- **Issue**: Fallback descriptions instead of AI
- **Fix**: Check both `GEMINI_API_KEY` and `GOOGLE_GEMINI_API_KEY` in Vercel
- **Model**: Must use `gemini-1.5-flash`

### 2. Mobile Popup Issues  
- **Issue**: White text on white background
- **Fix**: Gradient backgrounds implemented in app.html

### 3. Video Checkout Errors
- **Fix**: Hardcoded price IDs in `/api/create-video-checkout.js`:
  - Single: `price_1QfxqBRrVb92Q7hgKmQNqFkH` ($29)
  - Triple: `price_1QfxqwRrVb92Q7hgXGa9yYMT` ($69)

## 📝 Testing

Run Playwright tests:
```bash
npm test
```

## 🎯 Recent Updates

- Combined descriptions & images view (no tabs)
- Mobile-optimized video popup with delayed trigger
- Image upload with AI product identification
- Enhanced 100-150 word descriptions
- Fixed Gemini API integration

---

**Quick Start**: Visit https://productdescriptions.io