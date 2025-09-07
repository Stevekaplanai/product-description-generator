# Email Setup Guide with Loops.so via Zapier

## Overview
This guide will help you set up automated transactional emails using Loops.so and Zapier for your ProductDescriptions.io application.

## Prerequisites
1. Loops.so account (sign up at https://loops.so)
2. Zapier account (free plan works)
3. Access to Vercel environment variables

## Step 1: Create Email Templates in Loops.so

Log into Loops.so and create the following transactional email templates:

### 1.1 Welcome Email (ID: `welcome_subscriber`)
- Subject: "Welcome to ProductDescriptions.io!"
- Variables needed:
  - `customerName`
  - `plan`
  - `subscriptionId`

### 1.2 Payment Success (ID: `payment_success`)
- Subject: "Payment Successful - Your subscription is active"
- Variables needed:
  - `customerName`
  - `plan`
  - `amount`

### 1.3 Payment Failed (ID: `payment_failed`)
- Subject: "Payment Failed - Action Required"
- Variables needed:
  - `customerName`
  - `amount`
  - `currency`
  - `nextAttempt`

### 1.4 Subscription Cancelled (ID: `subscription_cancelled`)
- Subject: "Subscription Cancelled"
- Variables needed:
  - `customerName`
  - `subscriptionEndDate`

### 1.5 Usage Limit Warning (ID: `usage_limit_warning`)
- Subject: "Approaching Usage Limit"
- Variables needed:
  - `usage`
  - `limit`
  - `percentUsed`
  - `plan`

### 1.6 Upgrade Success (ID: `upgrade_success`)
- Subject: "Plan Upgraded Successfully"
- Variables needed:
  - `customerName`
  - `newPlan`
  - `oldPlan`

## Step 2: Get Your Loops.so API Key

1. Go to Loops.so Dashboard
2. Navigate to Settings → API
3. Copy your API key

## Step 3: Create Zapier Webhook → Loops.so Integration

### 3.1 Create a New Zap
1. Go to Zapier.com
2. Click "Create Zap"
3. Choose "Webhooks by Zapier" as the trigger
4. Select "Catch Hook" as the trigger event
5. Copy the webhook URL provided (looks like: `https://hooks.zapier.com/hooks/catch/XXXXXX/XXXXXX/`)

### 3.2 Set up Loops.so Action
1. Click "+" to add an action
2. Search for "Loops" or use "Webhooks by Zapier" with POST request
3. If using Webhooks:
   - Method: POST
   - URL: `https://app.loops.so/api/v1/transactional`
   - Headers:
     ```
     Authorization: Bearer YOUR_LOOPS_API_KEY
     Content-Type: application/json
     ```
   - Data:
     ```json
     {
       "email": "{{to}}",
       "transactionalId": "{{template}}",
       "dataVariables": {
         // Map all the data fields from webhook
       }
     }
     ```

### 3.3 Test the Integration
1. Send a test webhook from the app
2. Verify it appears in Zapier
3. Map the fields correctly
4. Test the Loops.so action
5. Turn on the Zap

## Step 4: Configure Environment Variables in Vercel

Add these environment variables to your Vercel project:

```bash
# Zapier Webhook URL (from Step 3.1)
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/XXXXXX/XXXXXX/

# Loops.so API Key (from Step 2)
LOOPS_API_KEY=loops_api_key_here

# Optional: Fallback email settings
EMAIL_FROM=noreply@productdescriptions.io
EMAIL_FROM_NAME=ProductDescriptions.io
```

## Step 5: Test Email Sending

### Test via API endpoint:
```bash
curl -X POST https://productdescriptions.io/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "emailType": "welcome",
    "data": {
      "customerName": "Test User",
      "plan": "Professional"
    }
  }'
```

### Test webhook events:
1. Make a test purchase with Stripe test card: 4242 4242 4242 4242
2. Check Loops.so for sent emails
3. Check Zapier history for webhook triggers

## Step 6: Monitor Email Delivery

### In Loops.so:
- Go to Analytics → Transactional
- Monitor delivery rates, opens, clicks

### In Zapier:
- Check Task History for successful/failed runs
- Set up error notifications

## Troubleshooting

### Emails not sending:
1. Check Vercel logs: `vercel logs`
2. Verify environment variables are set
3. Check Zapier task history
4. Verify Loops.so API key is valid

### Webhook not triggering:
1. Verify Stripe webhook is configured
2. Check webhook endpoint URL in Stripe dashboard
3. Test with Stripe CLI: `stripe trigger checkout.session.completed`

### Template errors:
1. Ensure template IDs match exactly
2. Verify all required variables are being passed
3. Check Loops.so template syntax

## Email Types and When They're Sent

| Email Type | Trigger | Webhook Event |
|------------|---------|---------------|
| Welcome | New subscription | checkout.session.completed |
| Payment Success | Successful payment | invoice.payment_succeeded |
| Payment Failed | Failed payment | invoice.payment_failed |
| Subscription Cancelled | User cancels | customer.subscription.deleted |
| Usage Warning | 80% of limit reached | Custom trigger |
| Upgrade Success | Plan change | customer.subscription.updated |

## Support

- Loops.so Documentation: https://loops.so/docs
- Zapier Help: https://zapier.com/help
- Stripe Webhooks: https://stripe.com/docs/webhooks

## Next Steps

1. Create custom email designs in Loops.so
2. Set up email analytics tracking
3. Add more email types as needed
4. Consider setting up SMS notifications via Twilio
5. Implement in-app notifications