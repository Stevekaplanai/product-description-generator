# API Keys Setup Guide

## Quick Start

1. Copy `.env.example` to `.env`
2. Fill in your API keys
3. Deploy to Vercel with environment variables

## Required API Keys

### 1. Google Gemini API (Required)
**Used for:** AI product description generation

1. Visit: https://makersuite.google.com/app/apikey
2. Create a new API key
3. Add to `.env`: `GEMINI_API_KEY=your_key_here`

### 2. Stripe API Keys (Required for payments)
**Used for:** Subscription management and payments

1. Visit: https://dashboard.stripe.com/apikeys
2. Copy your **Test** keys for development:
   - `STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...`
   - `STRIPE_TEST_SECRET_KEY=sk_test_...`
3. For production, use **Live** keys:
   - `STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_...`
   - `STRIPE_LIVE_SECRET_KEY=sk_live_...`

### 3. Shopify App Credentials (For Shopify integration)
**Used for:** Shopify app installation and product sync

1. Create a Partner account: https://partners.shopify.com
2. Create a new app in Partner Dashboard
3. Get your credentials:
   - `SHOPIFY_API_KEY=your_api_key`
   - `SHOPIFY_API_SECRET=your_api_secret`
4. Set OAuth redirect URL: `https://productdescriptions.io/api/shopify/callback`

## Deployment to Vercel

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy with Environment Variables
```bash
vercel --prod
```

### Step 4: Add Environment Variables in Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from `.env`

## Testing Your Setup

### Test API Keys
```bash
node api/test/test-api-keys.js
```

### Test Shopify OAuth
```bash
node api/test/test-shopify-oauth.js
```

### Test Webhooks
```bash
node api/test/test-webhooks.js
```

## Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Use different keys for dev/prod** - Keep test and live keys separate
3. **Rotate keys regularly** - Update keys every 90 days
4. **Limit API key permissions** - Use minimum required scopes
5. **Monitor usage** - Check dashboards for unusual activity

## Troubleshooting

### "API key invalid" error
- Check for extra spaces in your `.env` file
- Ensure keys are not expired
- Verify you're using the correct environment (test vs live)

### Stripe webhook failures
- Update webhook endpoint URL in Stripe Dashboard
- Copy the webhook signing secret
- Ensure HTTPS is enabled

### Shopify OAuth errors
- Verify redirect URI matches exactly
- Check app is not in test mode
- Ensure scopes are approved

## Support

For help with API setup:
- Email: support@productdescriptions.io
- Documentation: https://productdescriptions.io/docs