# 🤖 Stripe Setup Automation Guide

Since the Stripe MCP requires your secret key (which you shouldn't share), here's a step-by-step guide to complete the setup yourself.

## Option 1: Using Stripe CLI (Recommended)

### 1. Install Stripe CLI
```bash
# Windows (using Scoop)
scoop install stripe

# Or download directly from:
# https://github.com/stripe/stripe-cli/releases/latest
```

### 2. Login to Stripe
```bash
stripe login
```

### 3. Create Products Automatically
Save this as `create-products.sh` and run it:

```bash
#!/bin/bash

# Create Starter Plan
STARTER_PRODUCT=$(stripe products create \
  --name="Product Description Generator - Starter" \
  --description="100 descriptions/month, 3 images per product" \
  --metadata[plan]="starter" \
  --output json | jq -r '.id')

STARTER_PRICE=$(stripe prices create \
  --product=$STARTER_PRODUCT \
  --unit-amount=1900 \
  --currency=usd \
  --recurring[interval]=month \
  --output json | jq -r '.id')

echo "Starter Price ID: $STARTER_PRICE"

# Create Professional Plan
PRO_PRODUCT=$(stripe products create \
  --name="Product Description Generator - Professional" \
  --description="500 descriptions/month, unlimited images, bulk upload" \
  --metadata[plan]="professional" \
  --output json | jq -r '.id')

PRO_PRICE=$(stripe prices create \
  --product=$PRO_PRODUCT \
  --unit-amount=4900 \
  --currency=usd \
  --recurring[interval]=month \
  --output json | jq -r '.id')

echo "Professional Price ID: $PRO_PRICE"

# Create Enterprise Plan
ENTERPRISE_PRODUCT=$(stripe products create \
  --name="Product Description Generator - Enterprise" \
  --description="Unlimited everything, priority support, custom integrations" \
  --metadata[plan]="enterprise" \
  --output json | jq -r '.id')

ENTERPRISE_PRICE=$(stripe prices create \
  --product=$ENTERPRISE_PRODUCT \
  --unit-amount=14900 \
  --currency=usd \
  --recurring[interval]=month \
  --output json | jq -r '.id')

echo "Enterprise Price ID: $ENTERPRISE_PRICE"

# Create Webhook
WEBHOOK_SECRET=$(stripe webhooks create \
  --url="https://productdescriptions.io/api/stripe-webhook" \
  --enabled-events="checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.payment_succeeded,invoice.payment_failed" \
  --output json | jq -r '.secret')

echo ""
echo "=== ADD THESE TO VERCEL ==="
echo "STRIPE_PRICE_STARTER=$STARTER_PRICE"
echo "STRIPE_PRICE_PROFESSIONAL=$PRO_PRICE"
echo "STRIPE_PRICE_ENTERPRISE=$ENTERPRISE_PRICE"
echo "STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET"
```

## Option 2: Manual Setup in Dashboard

If you prefer the dashboard:

### 1. Create Products
Go to: https://dashboard.stripe.com/products

Click "Add product" for each:

**Starter Plan**
- Name: Product Description Generator - Starter
- Price: $19.00 USD / month
- Recurring: Monthly
- Copy the Price ID (starts with `price_`)

**Professional Plan**
- Name: Product Description Generator - Professional
- Price: $49.00 USD / month
- Recurring: Monthly
- Copy the Price ID

**Enterprise Plan**
- Name: Product Description Generator - Enterprise
- Price: $149.00 USD / month
- Recurring: Monthly
- Copy the Price ID

### 2. Setup Webhook
Go to: https://dashboard.stripe.com/webhooks

1. Click "Add endpoint"
2. Endpoint URL: `https://productdescriptions.io/api/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Click "Add endpoint"
5. Copy the "Signing secret" (starts with `whsec_`)

## Option 3: Using Node.js Script

Save this as `setup-stripe.js` and run with your API key:

```javascript
const stripe = require('stripe')('YOUR_SECRET_KEY_HERE');

async function setupStripe() {
  console.log('Creating products and prices...');
  
  // Create Starter Plan
  const starterProduct = await stripe.products.create({
    name: 'Product Description Generator - Starter',
    description: '100 descriptions/month, 3 images per product'
  });
  
  const starterPrice = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 1900,
    currency: 'usd',
    recurring: { interval: 'month' }
  });
  
  console.log('Starter Price ID:', starterPrice.id);
  
  // Create Professional Plan
  const proProduct = await stripe.products.create({
    name: 'Product Description Generator - Professional',
    description: '500 descriptions/month, unlimited images, bulk upload'
  });
  
  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 4900,
    currency: 'usd',
    recurring: { interval: 'month' }
  });
  
  console.log('Professional Price ID:', proPrice.id);
  
  // Create Enterprise Plan
  const enterpriseProduct = await stripe.products.create({
    name: 'Product Description Generator - Enterprise',
    description: 'Unlimited everything, priority support'
  });
  
  const enterprisePrice = await stripe.prices.create({
    product: enterpriseProduct.id,
    unit_amount: 14900,
    currency: 'usd',
    recurring: { interval: 'month' }
  });
  
  console.log('Enterprise Price ID:', enterprisePrice.id);
  
  // Create webhook endpoint
  const webhook = await stripe.webhookEndpoints.create({
    url: 'https://productdescriptions.io/api/stripe-webhook',
    enabled_events: [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed'
    ]
  });
  
  console.log('\n=== ADD THESE TO VERCEL ===');
  console.log(`STRIPE_PRICE_STARTER=${starterPrice.id}`);
  console.log(`STRIPE_PRICE_PROFESSIONAL=${proPrice.id}`);
  console.log(`STRIPE_PRICE_ENTERPRISE=${enterprisePrice.id}`);
  console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
}

setupStripe().catch(console.error);
```

Run with:
```bash
node setup-stripe.js
```

## Final Steps in Vercel

1. Go to: https://vercel.com/[your-username]/product-description-generator/settings/environment-variables

2. Add/Update these variables for **Production**:
   ```
   STRIPE_MODE=live
   STRIPE_LIVE_PUBLISHABLE_KEY=[your publishable key]
   STRIPE_LIVE_SECRET_KEY=[your secret key]
   STRIPE_PRICE_STARTER=[from script output]
   STRIPE_PRICE_PROFESSIONAL=[from script output]
   STRIPE_PRICE_ENTERPRISE=[from script output]
   STRIPE_WEBHOOK_SECRET=[from script output]
   ```

3. Redeploy:
   ```bash
   vercel --prod
   ```

4. Test at: https://productdescriptions.io/verify-stripe.html

## Quick Test After Setup

Visit your verification page to ensure everything is working:
https://productdescriptions.io/verify-stripe.html

The page should show:
- Mode: PRODUCTION (with green badge)
- Configuration: CONFIGURED
- All Price IDs populated
- Test checkout buttons working

## Troubleshooting

If something doesn't work:

1. Check Vercel logs:
   ```bash
   vercel logs /api/create-checkout-session
   ```

2. Check Stripe webhook logs:
   https://dashboard.stripe.com/webhooks/[your-webhook-id]

3. Verify environment variables:
   ```bash
   vercel env ls
   ```

Remember: You can always switch back to test mode by changing `STRIPE_MODE=test` in Vercel!