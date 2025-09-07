# AI Product Description Generator

**Live Application**: https://productdescriptions.io

Complete AI-powered e-commerce content generation platform with product descriptions (Gemini 2.0), images (DALL-E 3), videos (D-ID), and bulk processing capabilities.

## 🚀 Quick Context Restoration

To restore full context in a new Claude conversation, read these files:
1. This README.md - Complete project overview
2. `/api/generate-description.js` - Main AI generation logic  
3. `/api/bulk-generate.js` - Bulk CSV processing
4. `/app.html` - Single product interface
5. `/bulk.html` - Bulk upload interface

## 📋 Current Configuration

### Deployment
- **Platform**: Vercel (auto-deploys from GitHub)
- **Domain**: productdescriptions.io (via AWS Route 53 → Vercel)
- **Repository**: Connected to GitHub (push to deploy)

### API Keys (All configured in Vercel Environment Variables)
- `GEMINI_API_KEY` / `GOOGLE_GEMINI_API_KEY` - Google Gemini 2.0 Flash
- `OPENAI_API_KEY` - DALL-E 3 & Vision API (gpt-4o-mini)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `D_ID_API_KEY` - Video generation (upgraded with new credits)
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
- `POSTHOG_API_KEY` - Analytics tracking

### Stripe Price IDs (Configured in Vercel)
- **Subscriptions**:
  - `STRIPE_PRICE_STARTER` - $49/month
  - `STRIPE_PRICE_PROFESSIONAL` - $99/month  
  - `STRIPE_PRICE_ENTERPRISE` - $299/month
- **Video Products**:
  - `STRIPE_PRICE_VIDEO_SINGLE` - $29 single video
  - `STRIPE_PRICE_VIDEO_TRIPLE` - $69 triple pack
  - `STRIPE_PRICE_BULK_VIDEO` - $199 bulk bundle (10 videos)

## 🎯 Core Features

### 1. AI Product Analysis (Image Upload) ✨
- **Smart Product Recognition**: Upload any product image for instant AI analysis
- **Auto-Population**: Automatically fills form fields:
  - Product Name (becomes optional - shows green "auto-detected" badge)
  - Category (intelligently matched to dropdown options)
  - Key Features (extracted as bullet points, marked optional)
  - Target Audience (identified from product type)
  - Suggested Tone (professional/casual/luxury based on product)
- **Deep Analysis Captures**:
  - Visible colors and materials
  - Brand identification (if visible)
  - Style classification (modern/classic/minimalist)
  - Key selling points
  - Price range estimation
  - Auto-generated product description suggestion
- **Vision Models**: Uses OpenAI Vision API (gpt-4o-mini) primary, Gemini Vision fallback
- **Enhanced UX**: Fields become optional after image analysis, reducing manual input

### 2. Description Generation
- **Model**: Gemini 2.0 Flash (gemini-2.0-flash-exp) - Latest model for superior quality
- Generates 3 unique variations (100-150 words each)
- SEO-optimized with different tones and approaches
- **Context-Aware**: Leverages image analysis data for accuracy:
  - Incorporates detected colors, materials, and style
  - Uses identified key selling points
  - Adapts tone to match product type

### 3. Bulk Processing (CSV Upload) 🆕
- **Efficient Batch Processing**: Single API call for multiple products
- **Subscription Tiers**:
  - Free: 5 products (for testing)
  - Starter: 100 products/month ($49)
  - Professional: 500 products/month ($99)
  - Enterprise: Unlimited ($299)
- **CSV Format**: product_name, category, features, target_audience, tone
- **Bulk Video Upsell**: $199 for 10 video bundle
- **Results Export**: Download all descriptions as CSV

### 4. Image Generation  
- **Model**: DALL-E 3
- Professional product photography style
- White background e-commerce format
- **Cloudinary Integration**: Auto-uploads to CDN for persistence 🆕
- Optimized delivery with auto-format and quality
- Included in Professional+ tiers

### 5. Video Creation System
- **D-ID Integration**: AI avatar product videos
- **Pricing Options**:
  - Single: $29
  - Triple Pack: $69
  - Bulk Bundle: $199 (10 videos)
- **Features**: Professional voiceover, animations, HD rendering
- **Delayed Popup**: 90 seconds after generation for better UX

### 6. Analytics & Tracking
- **PostHog Integration**: Complete event tracking
- **Tracked Events**:
  - Product generation
  - Image uploads
  - Video purchases
  - Bulk processing
  - Subscription conversions

## 📁 Project Structure

```
product-description-generator/
├── api/                         # Vercel serverless functions
│   ├── generate-description.js # Single product AI generation
│   ├── bulk-generate.js        # Bulk CSV processing 🆕
│   ├── analyze-image.js        # Image analysis (Vision APIs)  
│   ├── create-video-checkout.js # Single/triple video checkout
│   ├── create-bulk-video-checkout.js # Bulk video bundle 🆕
│   ├── create-subscription-checkout.js # Monthly plans 🆕
│   ├── generate-video.js       # D-ID video generation
│   ├── config.js               # Secure config endpoint 🆕
│   └── debug.js                # API configuration check
├── src/
│   └── video-composer.js       # FFmpeg video composition
├── tests/                      # Test suites
│   └── playwright/            # E2E tests
├── app.html                   # Main single product app
├── bulk.html                  # CSV bulk upload interface 🆕
├── index.html                 # Landing page
├── subscription-success.html  # Post-payment confirmation 🆕
├── privacy.html               # Legal pages
├── terms.html
├── refund.html
├── sitemap.xml               # SEO sitemap 🆕
├── robots.txt                # Search engine directives 🆕
├── sw.js                     # Service worker for caching 🆕
├── performance-config.js     # Performance optimizations 🆕
├── generate-seo-images.html  # SEO image generator 🆕
├── sample-bulk-template.csv  # Example CSV format
├── package.json              # Dependencies
├── vercel.json              # Deployment config
└── .env.example            # Environment template
```

## 🔧 API Endpoints

### Main Endpoints
- `POST /api/generate-description` - Single product generation
- `POST /api/bulk-generate` - Bulk CSV processing 🆕
- `POST /api/analyze-image` - AI product identification
- `POST /api/create-video-checkout` - Single/triple video purchase
- `POST /api/create-bulk-video-checkout` - Bulk video bundle 🆕
- `POST /api/create-subscription-checkout` - Monthly subscriptions 🆕
- `POST /api/generate-video` - D-ID video creation
- `GET /api/config` - Secure configuration 🆕
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

### Pre-Deployment Checklist
- [x] All environment variables configured in Vercel
- [x] Cloudinary credentials set for image storage
- [x] PostHog API key configured for analytics
- [x] Stripe price IDs match environment variables
- [x] D-ID API key active with credits
- [x] SEO images generated and referenced
- [x] Service worker and performance scripts added
- [x] All API endpoints tested in production

### Deploy Command
Push to GitHub main branch → Auto-deploys to Vercel

```bash
git add .
git commit -m "Update: Cloudinary integration, SEO optimization, performance enhancements"
git push origin main
```

### Post-Deployment Verification
1. Test image generation → Verify Cloudinary upload
2. Check SEO meta tags → View page source
3. Verify service worker → DevTools > Application > Service Workers
4. Test bulk upload → Use sample CSV
5. Confirm analytics → Check PostHog dashboard

## 🐛 Known Issues & Fixes

### 1. Bulk Generation
- **Issue**: 404 on bulk-generate endpoint
- **Fix**: Ensure `api/bulk-generate.js` is deployed
- **Note**: Use www subdomain to avoid redirects

### 2. Stripe Checkout Errors
- **Issue**: Empty email validation error
- **Fix**: Email is now optional in checkout endpoints
- **Price IDs**: All configured via environment variables

### 3. Mobile Responsiveness  
- **Issue**: Video popup timing
- **Fix**: Delayed to 90 seconds, mobile-optimized CSS

### 4. API Rate Limits
- **Gemini 2.0**: 1000 requests/minute
- **OpenAI**: 500 images/minute
- **Bulk Processing**: Includes 500ms delay between products

## 📈 Roadmap & Next Steps

### Immediate Priorities (Q1 2025)
- [ ] **D-ID Video Integration**: Complete webhook for video completion
- [ ] **Progress Tracking**: Real-time updates for bulk video generation
- [ ] **Admin Dashboard**: Usage analytics and customer metrics
- [ ] **Rate Limiting**: Implement per-endpoint limits
- [ ] **Email Notifications**: Send results when bulk processing completes

### Feature Enhancements (Q2 2025)
- [ ] **Multi-language Support**: ES, FR, DE, JP, CN
- [ ] **Custom Brand Voice**: Train on existing product catalogs
- [ ] **A/B Testing**: Generate and test description variants
- [ ] **E-commerce Plugins**: 
  - Shopify app
  - WooCommerce plugin
  - BigCommerce integration
- [ ] **API Access**: RESTful API for Enterprise tier
- [ ] **Webhook System**: Real-time updates for bulk operations

### Technical Improvements
- [x] **Performance Optimizations**: ✅ COMPLETED
  - Service worker for offline support
  - Lazy loading for images
  - API response caching
  - Resource hints (prefetch/preconnect)
- [x] **SEO Enhancements**: ✅ COMPLETED
  - Comprehensive meta tags
  - Open Graph and Twitter Cards
  - JSON-LD structured data
  - Sitemap and robots.txt
- [ ] **Framework Migration**: Move to Next.js 14 for:
  - Better SEO (server-side rendering)
  - API routes optimization
- [ ] **Advanced Performance**:
  - Redis caching layer
  - WebSocket for real-time updates
- [ ] **Testing & Quality**:
  - Comprehensive test suite (Jest + Playwright)
  - CI/CD pipeline with GitHub Actions
  - Error monitoring (Sentry)
- [ ] **Database**: 
  - PostgreSQL for user management
  - Store generation history
  - Usage analytics

### Business Features
- [ ] **White Label Option**: Custom branding for agencies
- [ ] **Affiliate Program**: Revenue sharing system
- [ ] **Team Accounts**: Multi-user access for Enterprise
- [ ] **Custom Training**: Fine-tune models on client data
- [ ] **Batch Scheduling**: Queue large jobs for off-peak processing

## 📊 Analytics Events (PostHog)

Tracked events for conversion optimization:
- `product_generated` - Single product creation
- `bulk_upload_started` - CSV processing initiated
- `bulk_processing_completed` - Batch finished
- `video_upsell_shown` - Popup displayed
- `video_checkout_started` - Stripe redirect
- `subscription_started` - New subscriber
- `image_uploaded` - Vision API used
- `image_generated` - DALL-E 3 used

## 🎯 Recent Updates (January 2025)

- ✅ **Upgraded to Gemini 2.0 Flash** (gemini-2.0-flash-exp) for superior quality
- ✅ **Bulk CSV Processing**: Efficient batch API for multiple products
- ✅ **Subscription Model**: Monthly tiers with 7-day free trial
- ✅ **Bulk Video Bundles**: $199 for 10 videos
- ✅ **PostHog Analytics**: Complete event tracking
- ✅ **Mobile Optimizations**: Responsive design, 90-second popup delay
- ✅ **Enhanced Security**: Environment variables not exposed in frontend
- ✅ **D-ID Credits**: Refreshed and ready for video generation
- ✅ **Cloudinary Storage**: DALL-E images auto-upload to CDN
- ✅ **SEO Optimization**: Complete meta tags, OG tags, structured data
- ✅ **Performance**: Service worker, lazy loading, caching strategies
- ✅ **Search Engine Ready**: sitemap.xml, robots.txt, JSON-LD schemas

## 🔒 Security Best Practices

- All API keys stored in Vercel environment variables
- CORS headers configured on all endpoints
- Stripe webhooks for payment verification
- No sensitive data in frontend code
- PostHog key fetched via secure endpoint

## 📞 Support & Contact

- **Production URL**: https://productdescriptions.io
- **GitHub**: https://github.com/Stevekaplanai/product-description-generator
- **Issues**: Report bugs via GitHub Issues
- **Email**: sales@productdescriptions.io (for Enterprise)

## 📄 License

Proprietary - All rights reserved

---

**Quick Start**: Visit https://productdescriptions.io

*Last Updated: January 2025*