# 🚀 Stripe Live Payment Setup Guide

## Current Status
Your app is deployed on Vercel with API keys configured. Here's what you need to do to enable live payments:

## Step 1: Verify Vercel Environment Variables ✅

Go to your Vercel dashboard: https://vercel.com/dashboard

1. Select your `product-description-generator` project
2. Go to Settings → Environment Variables
3. Ensure these variables are set for **Production**:

```
STRIPE_MODE=live                          # Switch from 'test' to 'live'
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_...   # Your live publishable key
STRIPE_LIVE_SECRET_KEY=sk_live_...        # Your live secret key
STRIPE_WEBHOOK_SECRET=whsec_...           # Your webhook signing secret
```

## Step 2: Create Products in Stripe Dashboard 💳

Go to https://dashboard.stripe.com/products

Create these subscription products:

### Starter Plan - $19/month
1. Click "Add product"
2. Name: "Product Description Generator - Starter"
3. Price: $19.00 USD/month
4. Recurring billing
5. Copy the Price ID (starts with `price_`)

### Professional Plan - $49/month
1. Click "Add product"
2. Name: "Product Description Generator - Professional"
3. Price: $49.00 USD/month
4. Recurring billing
5. Copy the Price ID

### Enterprise Plan - $149/month
1. Click "Add product"
2. Name: "Product Description Generator - Enterprise"
3. Price: $149.00 USD/month
4. Recurring billing
5. Copy the Price ID

## Step 3: Add Price IDs to Vercel 📝

Back in Vercel Environment Variables, add:

```
STRIPE_PRICE_STARTER=price_1QaXXXXXXXXXXXXX     # Your actual Starter price ID
STRIPE_PRICE_PROFESSIONAL=price_1QaYYYYYYYYYYY  # Your actual Professional price ID
STRIPE_PRICE_ENTERPRISE=price_1QaZZZZZZZZZZZZ   # Your actual Enterprise price ID
```

## Step 4: Configure Webhook Endpoint 🔗

In Stripe Dashboard:
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://productdescriptions.io/api/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Add to Vercel as `STRIPE_WEBHOOK_SECRET`

## Step 5: Deploy to Production 🚀

After updating environment variables:

```bash
vercel --prod
```

Or trigger a redeployment from Vercel dashboard.

## Step 6: Test Live Payments 🧪

1. Visit https://productdescriptions.io/app.html
2. Click on a subscription plan
3. Use a real credit card (for testing, you can use your own and refund later)
4. Verify:
   - Payment goes through
   - Webhook is received (check Stripe webhook logs)
   - User gets access to premium features

## Step 7: Monitor & Verify 📊

Check these in Stripe Dashboard:
- Payments → All transactions (should show successful payment)
- Developers → Webhooks → Recent deliveries (should show 200 OK)
- Customers → Should see new customer created

## Quick Verification Commands

Once you're logged into Vercel CLI:

```bash
# Check current environment variables
vercel env ls

# Pull environment variables locally (optional)
vercel env pull

# Deploy to production
vercel --prod

# Check deployment status
vercel ls
```

## Troubleshooting 🔧

### If payments fail:
1. Check browser console for errors
2. Verify Stripe keys are correct (live keys start with `pk_live_` and `sk_live_`)
3. Check Vercel function logs: `vercel logs /api/create-checkout-session`

### If webhooks fail:
1. Check webhook signing secret is correct
2. Verify endpoint URL is exactly: `https://productdescriptions.io/api/stripe-webhook`
3. Check webhook logs in Stripe Dashboard

## Support Contacts 📞

- Stripe Support: https://support.stripe.com
- Your email: hello@gtmvp.com (as configured in the code)

---

## ✅ Ready to Go Live?

Once all steps are complete:
1. Change `STRIPE_MODE=live` in Vercel
2. Redeploy: `vercel --prod`
3. Monitor first 24 hours closely
4. You're accepting real payments! 💰

Remember: You can always switch back to test mode by changing `STRIPE_MODE=test` if needed.