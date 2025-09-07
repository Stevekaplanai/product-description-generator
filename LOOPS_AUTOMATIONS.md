# Loops.so Automation Setup for Stripe Events

Once your Stripe webhook is connected, create these automations in Loops.so:

## 1. Welcome Email Automation
**Trigger:** Contact created with tag `stripe_customer`
**Email:** Welcome to ProductDescriptions.io
**Delay:** Immediate
**Conditions:** 
- Has property `stripe_subscription_status` = `active`

## 2. Payment Success Email
**Trigger:** Property changed `stripe_last_payment` 
**Email:** Payment successful
**Conditions:**
- Property `stripe_subscription_status` = `active`

## 3. Payment Failed Email
**Trigger:** Property changed `stripe_subscription_status` to `past_due`
**Email:** Payment failed - action required
**Delay:** Immediate

## 4. Subscription Cancelled
**Trigger:** Property changed `stripe_subscription_status` to `cancelled`
**Email:** We're sorry to see you go
**Delay:** Immediate

## 5. Trial Ending Soon (if using trials)
**Trigger:** Property `stripe_trial_end` is in 3 days
**Email:** Your trial is ending soon
**Conditions:**
- Has property `stripe_subscription_status` = `trialing`

## 6. Win-back Campaign
**Trigger:** Property changed `stripe_subscription_status` to `cancelled`
**Email Sequence:**
1. Day 3: We miss you (discount offer)
2. Day 7: New features you're missing
3. Day 30: Final offer to return

## Properties Available from Stripe

After connecting Stripe, these properties are automatically synced to each contact:

- `stripe_customer_id` - Stripe customer ID
- `stripe_subscription_status` - active, cancelled, past_due, trialing
- `stripe_subscription_id` - Current subscription ID
- `stripe_product_name` - Name of subscribed product/plan
- `stripe_subscription_created` - When they subscribed
- `stripe_subscription_cancelled` - Cancellation date
- `stripe_next_billing_date` - Next payment date
- `stripe_amount` - Subscription amount
- `stripe_currency` - Payment currency
- `stripe_last_payment` - Last successful payment date

## Email Templates to Create

### Welcome Email
```html
Subject: Welcome to ProductDescriptions.io, {{firstName}}! 🎉

Hi {{firstName|default:"there"}},

Welcome to ProductDescriptions.io! Your {{stripe_product_name}} subscription is now active.

Here's what you can do now:
✨ Generate unlimited product descriptions
🖼️ Create professional product images
🎬 Make viral UGC videos
📊 Track your content performance

Get Started: https://productdescriptions.io/app.html

Your subscription details:
Plan: {{stripe_product_name}}
Next billing: {{stripe_next_billing_date}}

Need help? Just reply to this email!

Best,
The ProductDescriptions Team
```

### Payment Failed
```html
Subject: Payment Failed - Action Required ⚠️

Hi {{firstName}},

We were unable to process your payment for ProductDescriptions.io.

Amount: {{stripe_currency}} {{stripe_amount}}
Plan: {{stripe_product_name}}

Please update your payment method to avoid service interruption:
https://productdescriptions.io/billing

We'll retry the payment in 3 days. Your access remains active during this time.

Need help? Reply to this email.

Best,
The ProductDescriptions Team
```

### Subscription Cancelled
```html
Subject: We're sorry to see you go 😢

Hi {{firstName}},

Your ProductDescriptions.io subscription has been cancelled.

You'll continue to have access until: {{stripe_subscription_cancelled}}

Your generated content remains available for download anytime.

Changed your mind? Reactivate here:
https://productdescriptions.io/pricing

We'd love your feedback on why you cancelled - just reply to this email.

Best,
The ProductDescriptions Team
```

## Testing the Integration

1. Make a test purchase with Stripe test card: `4242 4242 4242 4242`
2. Check Loops.so Audience - new contact should appear with Stripe properties
3. Check if welcome automation triggered
4. Cancel subscription in Stripe to test cancellation email

## Advanced Segmentation

Create these segments in Loops for targeted campaigns:

### Active Subscribers
- Filter: `stripe_subscription_status` = `active`
- Use for: Product updates, feature announcements

### Churned Users
- Filter: `stripe_subscription_status` = `cancelled`
- Use for: Win-back campaigns

### High-Value Customers
- Filter: `stripe_amount` > 49
- Use for: VIP features, priority support

### At-Risk Customers
- Filter: `stripe_subscription_status` = `past_due`
- Use for: Payment recovery emails

## Monitoring

Check these metrics in Loops:
- Email delivery rates
- Open rates by segment
- Click rates on CTAs
- Subscription reactivation rate from win-back campaigns