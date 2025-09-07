# Video Pricing & Testing Setup Guide

## 📹 Video Pricing Setup in Stripe

### Step 1: Create Video Products in Stripe

Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/test/products) and create:

#### 1. Single Video Product ($29)
```
Name: Single AI Video
Price: $29.00 (one-time)
Description: One professional AI-generated product video with avatar
Product ID: Save this for later
Price ID: price_xxxx (you'll need this)
```

#### 2. Triple Video Pack ($69)
```
Name: Triple Video Pack
Price: $69.00 (one-time)
Description: Three professional AI-generated product videos
Product ID: Save this for later
Price ID: price_xxxx (you'll need this)
```

### Step 2: Update Environment Variables

Add to your `.env` file:
```env
# Video Products (One-time purchases)
STRIPE_PRICE_VIDEO_SINGLE=price_[your_single_video_price_id]
STRIPE_PRICE_VIDEO_TRIPLE=price_[your_triple_pack_price_id]

# D-ID API for video generation
D_ID_API_KEY=your_d_id_api_key
```

### Step 3: Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add the video price IDs:
   - `STRIPE_PRICE_VIDEO_SINGLE`
   - `STRIPE_PRICE_VIDEO_TRIPLE`

## 🧪 Complete Application Testing Checklist

### Prerequisites
- [ ] Verify all API keys are set in `.env`
- [ ] Run `npm install` to ensure all dependencies
- [ ] Start local server: `npm run dev`
- [ ] Open browser to `http://localhost:3000/app.html`

### 1. Image Upload & Analysis Testing
- [ ] **Upload product image**
  - Click on image upload area
  - Select a product image (jpg/png)
  - Verify image preview appears
  - Click "Analyze Image" button
  - Confirm fields auto-populate:
    - Product name
    - Category
    - Features
    - Target audience
    - Tone suggestion

### 2. Description Generation Testing

#### Test without image:
- [ ] Fill in product details manually
- [ ] Click "Generate Content"
- [ ] Verify 3 description variations appear
- [ ] Check variations tabs (V1, V2, V3) work
- [ ] Verify images generate (if enabled)

#### Test with image analysis:
- [ ] Upload and analyze an image first
- [ ] Click "Generate Content" without changing fields
- [ ] Verify enhanced descriptions using image data
- [ ] Check that descriptions reference colors/materials from image

### 3. Video Upsell Flow Testing
- [ ] Generate a product description
- [ ] Wait 60 seconds (or modify timeout in code to 5 seconds for testing)
- [ ] Verify video upsell popup appears
- [ ] Check popup displays correctly on:
  - [ ] Desktop
  - [ ] Mobile (use browser dev tools)
- [ ] Test "Create Video Now" button
- [ ] Test "Maybe Later" button
- [ ] Verify close (X) button works

### 4. Subscription Tier Testing

#### Free Tier (No subscription):
- [ ] Verify 5 descriptions limit
- [ ] Check that video generation is blocked
- [ ] Confirm upgrade prompts appear

#### Paid Tier Testing:
1. Create test subscription:
   - [ ] Click "Upgrade" or pricing button
   - [ ] Select Starter plan
   - [ ] Use test card: `4242 4242 4242 4242`
   - [ ] Complete checkout

2. Verify features:
   - [ ] Increased description limit
   - [ ] Video generation enabled
   - [ ] Multiple image generation
   - [ ] No upgrade prompts

### 5. Payment Processing Testing

#### Subscription Payment:
- [ ] Test successful payment (4242 4242 4242 4242)
- [ ] Test declined card (4000 0000 0000 0002)
- [ ] Test authentication required (4000 0025 0000 3155)
- [ ] Verify webhook receives events
- [ ] Check customer portal access

#### Video Purchase (One-time):
- [ ] Select single video ($29)
- [ ] Complete checkout
- [ ] Verify payment processed
- [ ] Check video generation starts

### 6. API Integration Testing

#### OpenAI (DALL-E 3):
- [ ] Image generation works
- [ ] Multiple styles generate
- [ ] Error handling for API limits

#### Google Gemini:
- [ ] Description generation works
- [ ] Multiple variations create
- [ ] Fallback if API fails

#### D-ID Video:
- [ ] Avatar selection works
- [ ] Voice selection functions
- [ ] Video generation completes
- [ ] Webhook receives video URL

### 7. Mobile Responsiveness Testing
- [ ] Test on actual iPhone/Android device
- [ ] Check all buttons are tappable
- [ ] Verify forms are fillable
- [ ] Test image upload on mobile
- [ ] Confirm popups display correctly
- [ ] Check text is readable

### 8. Error Handling Testing
- [ ] Test with no internet (offline)
- [ ] Test with invalid API keys
- [ ] Test with exceeded quotas
- [ ] Verify error messages display
- [ ] Check graceful degradation

## 🚀 Quick Test Sequence

1. **Basic Flow Test** (5 minutes):
   ```
   1. Open app.html
   2. Upload product image
   3. Click "Analyze Image"
   4. Generate description
   5. Wait for video upsell
   6. Test video purchase flow
   ```

2. **Payment Test** (3 minutes):
   ```
   1. Click upgrade/pricing
   2. Select Starter plan
   3. Enter: 4242 4242 4242 4242
   4. Any future date, any CVC
   5. Complete purchase
   6. Verify subscription active
   ```

3. **Mobile Test** (2 minutes):
   ```
   1. Open Chrome DevTools (F12)
   2. Toggle device toolbar (Ctrl+Shift+M)
   3. Select iPhone 15 Pro
   4. Test upload and buttons
   5. Check video popup
   ```

## 🔧 Common Issues & Solutions

### Issue: Video upsell not appearing
- Check console for errors
- Verify sessionStorage has product data
- Reduce timeout for testing (line ~2086 in app.html)

### Issue: Payment not processing
- Verify Stripe keys in .env
- Check webhook endpoint URL
- Ensure test mode is active

### Issue: Image analysis failing
- Check OpenAI API key
- Verify API quota available
- Test with smaller images

### Issue: Mobile buttons not working
- Clear browser cache
- Check for JavaScript errors
- Verify touch events enabled

## 📊 Monitoring & Analytics

### Check These Dashboards:
1. **Stripe Dashboard**: https://dashboard.stripe.com/test/events
   - Payment events
   - Webhook logs
   - Customer sessions

2. **Vercel Dashboard**: https://vercel.com/dashboard
   - Function logs
   - Error tracking
   - Performance metrics

3. **Browser Console**:
   - Network tab for API calls
   - Console for errors
   - Application tab for storage

## ✅ Ready for Production Checklist

- [ ] All tests pass successfully
- [ ] Payment processing works
- [ ] Mobile experience smooth
- [ ] Error handling robust
- [ ] API keys secured
- [ ] Webhooks configured
- [ ] Domain verified (productdescriptions.io)
- [ ] SSL certificate active
- [ ] Analytics tracking setup
- [ ] Customer support ready

## 📞 Support Contacts

- **Stripe Support**: https://support.stripe.com
- **D-ID Support**: https://docs.d-id.com
- **OpenAI Support**: https://help.openai.com
- **Vercel Support**: https://vercel.com/support

---

**Last Updated**: January 2025
**Ready to test?** Start with the Quick Test Sequence above!