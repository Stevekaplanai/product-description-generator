# Stripe Payment Integration Setup

## Required Environment Variables

Add these to your Vercel dashboard under Settings > Environment Variables:

```env
# Stripe API Keys (from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx

# Stripe Webhook Secret (from https://dashboard.stripe.com/webhooks)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Stripe Price IDs (from https://dashboard.stripe.com/products)
STRIPE_PRICE_STARTER=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_PROFESSIONAL=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxxxxxxxxxxxxxxxxxx
```

## Setup Steps

### 1. Create Stripe Account
1. Go to https://stripe.com and create an account
2. Complete your business profile

### 2. Create Products and Prices
1. Go to https://dashboard.stripe.com/products
2. Create 3 products:
   - **Starter Plan** ($19/month)
     - 100 product descriptions per month
     - Image generation
     - 10 AI videos per month
   
   - **Professional Plan** ($49/month)
     - 500 product descriptions per month
     - Unlimited images
     - 50 AI videos per month
     - Bulk upload
   
   - **Enterprise Plan** ($149/month)
     - Unlimited everything
     - API access
     - Custom AI training
     - Priority support

3. For each product, create a recurring monthly price
4. Copy the price IDs (they start with `price_`)

### 3. Set Up Webhook
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-domain.com/api/stripe-webhook`
3. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret

### 4. Configure Customer Portal
1. Go to https://dashboard.stripe.com/settings/billing/portal
2. Enable customer portal
3. Configure:
   - Allow customers to update payment methods
   - Allow customers to cancel subscriptions
   - Allow customers to view invoices

### 5. Add Environment Variables to Vercel
1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add all the variables listed above
4. Redeploy your application

## Testing

### Test Mode
For testing, use test API keys:
- Secret key starts with `sk_test_`
- Publishable key starts with `pk_test_`

### Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

## Features Implemented

### For Users
- ✅ Free tier with 5 descriptions/month
- ✅ Subscription tiers (Starter, Professional, Enterprise)
- ✅ Usage tracking and limits
- ✅ Customer portal for subscription management
- ✅ Automatic subscription verification
- ✅ Seamless checkout flow

### For Admin
- ✅ Webhook handling for subscription events
- ✅ Automatic access management
- ✅ Usage reset on monthly cycle
- ✅ Secure payment processing

## API Endpoints

- `/api/create-checkout-session` - Create Stripe checkout
- `/api/verify-subscription` - Verify active subscription
- `/api/create-portal-session` - Access customer portal
- `/api/stripe-webhook` - Handle Stripe events

## Support

For issues or questions:
1. Check Stripe logs: https://dashboard.stripe.com/logs
2. Review webhook events: https://dashboard.stripe.com/events
3. Contact support with error details