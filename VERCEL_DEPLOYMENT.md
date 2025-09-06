# Vercel Deployment Guide for productdescriptions.com

## 🚀 Deployment Steps

### 1. Prerequisites
- [ ] Vercel account created
- [ ] Git repository (GitHub/GitLab/Bitbucket) 
- [ ] Domain purchased (productdescriptions.com ✅)

### 2. Environment Variables Setup

Add these in Vercel Dashboard → Settings → Environment Variables:

```
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=dhup1riab
CLOUDINARY_API_KEY=635329558989426
CLOUDINARY_API_SECRET=tIG28CyJRfbGfVsmMPM1KZPOiic
D_ID_API_KEY=c3RldmVAZ3RtdnAuY29t:hdHqXeft2jBog8Sy5KDVC
NODE_ENV=production
```

### 3. Deploy to Vercel

#### Option A: Via Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

#### Option B: Via GitHub Integration
1. Push code to GitHub
2. Import project in Vercel Dashboard
3. Connect to productdescriptions.com

### 4. Domain Configuration

In Vercel Dashboard → Domains:
1. Add `productdescriptions.com`
2. Add `www.productdescriptions.com`
3. Update DNS records at your registrar:

```
A Record: @ → 76.76.21.21
CNAME: www → cname.vercel-dns.com
```

### 5. Post-Deployment Configuration

#### Webhook URL Update
Update D-ID webhook to production URL:
```
https://productdescriptions.com/api/webhook/d-id
```

#### CORS Settings
Ensure CORS allows your domain:
- productdescriptions.com
- www.productdescriptions.com

## ⚠️ Important Considerations

### 1. Serverless Limitations

**Issue**: FFmpeg binary for video processing
**Solution**: 
- Use Vercel Edge Functions for lightweight operations
- Offload heavy video processing to external service (Cloudinary transformations)
- Consider using a separate video processing microservice on Railway/Render

### 2. File Storage

**Issue**: Vercel has no persistent storage
**Solutions**:
- ✅ Already using Cloudinary for all media storage
- Temporary files use `/tmp` directory (512MB limit)
- All generated content goes directly to Cloudinary

### 3. Function Timeouts

**Current Limits**:
- Hobby: 10 seconds
- Pro: 60 seconds (configured in vercel.json)
- Enterprise: 900 seconds

**Recommendations**:
- Upgrade to Pro for video generation
- Implement queue system for long operations
- Use webhooks for async processing

### 4. Cold Starts

**Optimization**:
- Keep dependencies minimal
- Lazy load heavy libraries
- Use Edge Functions where possible

## 📦 Package.json Updates

Add Vercel build script:
```json
{
  "scripts": {
    "build": "echo 'No build step required'",
    "start": "node server.js"
  }
}
```

## 🔄 Alternative Deployment Options

If Vercel limitations are problematic:

### 1. Railway.app
- Better for Node.js apps with heavy processing
- Persistent storage available
- No timeout limits
- $5/month starter

### 2. Render.com
- Free tier available
- Background jobs support
- Persistent disk storage
- Auto-scaling capabilities

### 3. Hybrid Architecture
- Frontend on Vercel (fast CDN)
- API on Railway/Render (video processing)
- Media on Cloudinary (already setup)

## 🎯 Production Checklist

### Before Launch
- [ ] Test all API endpoints
- [ ] Verify environment variables
- [ ] Check video generation with production URLs
- [ ] Test CSV bulk upload
- [ ] Verify Cloudinary integration
- [ ] Test webhook callbacks

### Security
- [ ] Add rate limiting
- [ ] Implement API key authentication
- [ ] Set CORS properly
- [ ] Hide sensitive errors in production
- [ ] Add request validation

### Monitoring
- [ ] Set up Vercel Analytics
- [ ] Configure error tracking (Sentry)
- [ ] Monitor API usage costs
- [ ] Track video generation success rate

### Performance
- [ ] Enable caching headers
- [ ] Optimize image delivery
- [ ] Minify frontend assets
- [ ] Implement lazy loading

## 🚨 Known Issues & Solutions

### 1. FFmpeg in Serverless
**Problem**: Binary dependencies don't work well in Vercel
**Solution**: 
```javascript
// Use Cloudinary video transformations instead
const videoUrl = cloudinary.url(publicId, {
  resource_type: 'video',
  transformation: [
    { overlay: 'avatar_video' },
    { flags: 'layer_apply', gravity: 'west' }
  ]
});
```

### 2. Large File Uploads
**Problem**: 4.5MB body size limit
**Solution**: 
- Direct upload to Cloudinary from frontend
- Use signed upload URLs

### 3. Webhook Timeouts
**Problem**: D-ID webhooks may timeout
**Solution**:
- Respond immediately with 200
- Process async in background
- Use queue service if needed

## 📝 Next Steps

1. **Immediate Actions**:
   - Push code to GitHub
   - Deploy to Vercel
   - Configure domain DNS
   - Set environment variables

2. **Testing Phase**:
   - Test all features on production
   - Monitor performance metrics
   - Check error logs

3. **Optimization**:
   - Implement caching strategy
   - Optimize API calls
   - Add CDN for static assets

4. **Scaling Considerations**:
   - Monitor usage patterns
   - Plan for API rate limits
   - Consider dedicated video processing service

## 🔗 Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Docs](https://vercel.com/docs)
- [Edge Functions Guide](https://vercel.com/docs/functions/edge-functions)
- [Vercel Limits](https://vercel.com/docs/concepts/limits/overview)

---

**Note**: Consider starting with Vercel for the frontend and static content, but use Railway or Render for the API if video processing becomes a bottleneck.