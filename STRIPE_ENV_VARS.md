# Stripe Environment Variables for Vercel

## API Keys (from https://dashboard.stripe.com/apikeys)

```env
# Test Mode Keys (for development/testing)
STRIPE_SECRET_KEY=sk_test_[Get from Stripe Dashboard - click reveal on test secret key]
STRIPE_PUBLISHABLE_KEY=pk_test_[Get from Stripe Dashboard - test publishable key]

# Live Mode Keys (for production - when ready)
STRIPE_SECRET_KEY=sk_live_[Click reveal on the live secret key]
STRIPE_PUBLISHABLE_KEY=pk_live_51P9AaXRrVb92Q7hgRtrOFO9EFMxdc6WYNrcKzUCZxnTI0OzYRTuSR3Zhw6VxgZBF4rfzheDKj0hFgzmtKSTFgpCP00xI27l0il
```

## Products Created

We've created three subscription tiers:

1. **Starter Plan - $19/month**
   - 100 product descriptions per month
   - Advanced AI features
   - Custom tone & style
   - Image generation
   - 10 AI videos per month
   - Email support

2. **Professional Plan - $49/month**
   - 500 product descriptions per month
   - Premium AI features
   - Multiple languages
   - Unlimited image generation
   - 50 AI videos per month
   - Bulk upload
   - Priority support

3. **Enterprise Plan - $149/month**
   - Unlimited product descriptions
   - Custom AI training
   - API access
   - Unlimited image generation
   - Unlimited AI videos
   - Custom integrations
   - Dedicated support
   - SLA guarantee

## Price IDs

To get the price IDs:
1. Go to https://dashboard.stripe.com/test/products (for test mode)
2. Click on each product
3. Find the price ID (starts with `price_`)
4. Add to your environment variables:

```env
STRIPE_PRICE_STARTER=price_[copy from Stripe Dashboard]
STRIPE_PRICE_PROFESSIONAL=price_[copy from Stripe Dashboard]
STRIPE_PRICE_ENTERPRISE=price_[copy from Stripe Dashboard]
```

## Webhook Setup

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://productdescriptions.com/api/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the signing secret (starts with `whsec_`)

```env
STRIPE_WEBHOOK_SECRET=whsec_[copy from webhook settings]
```

## Customer Portal Setup

1. Go to https://dashboard.stripe.com/test/settings/billing/portal
2. Click "Activate test link"
3. Configure settings:
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to cancel subscriptions
   - ✅ Allow customers to view billing history

## Add to Vercel

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add each variable above
4. Make sure to add for:
   - Production (use live keys when ready)
   - Preview (use test keys)
   - Development (use test keys)

## Testing

Use test cards for payment testing:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

## Important Notes

- Start with TEST mode keys for development
- Only switch to LIVE mode keys when ready for real payments
- Test webhook endpoints thoroughly before going live
- Monitor webhook events in Stripe Dashboard → Developers → Webhooks