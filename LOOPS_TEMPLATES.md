# Loops.so Email Templates Setup

Your API key is configured: `8bc3ee3ea2d20759cd7ecd4933fee9f0`

## Create These Transactional Templates in Loops.so

Go to: https://app.loops.so/transactional

### 1. Welcome Email
- **Template ID:** `welcome_subscriber`
- **Subject:** Welcome to ProductDescriptions.io! 🎉
- **Variables:**
  - customerName
  - plan 
  - subscriptionId

### 2. Payment Success
- **Template ID:** `payment_success`  
- **Subject:** Payment Received - Thank You! ✅
- **Variables:**
  - customerName
  - plan
  - amount
  - paymentDate
  - invoiceId

### 3. Payment Failed
- **Template ID:** `payment_failed`
- **Subject:** Payment Failed - Action Required ⚠️
- **Variables:**
  - customerName
  - amount
  - currency
  - nextAttempt

### 4. Subscription Cancelled
- **Template ID:** `subscription_cancelled`
- **Subject:** Subscription Cancelled - We'll Miss You 😢
- **Variables:**
  - customerName
  - subscriptionEndDate

### 5. Usage Limit Warning  
- **Template ID:** `usage_limit_warning`
- **Subject:** Approaching Usage Limit - {{percentUsed}}% Used 📊
- **Variables:**
  - usage
  - limit
  - percentUsed
  - plan

### 6. Upgrade Success
- **Template ID:** `upgrade_success`
- **Subject:** Plan Upgraded Successfully! 🎊
- **Variables:**
  - customerName
  - oldPlan
  - newPlan
  - newPrice

## Test Email Sending

Once templates are created, test with:

```bash
curl -X POST https://productdescriptions.io/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "emailType": "welcome",
    "data": {
      "customerName": "Test User",
      "plan": "Professional",
      "subscriptionId": "sub_test123"
    }
  }'
```

## Email Template Content

For each template, you can use this structure:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #667eea; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>[Email Title]</h1>
    </div>
    <div class="content">
      <p>Hi {{customerName}},</p>
      [Email content here]
      <a href="https://productdescriptions.io/app.html" class="button">CTA Button</a>
    </div>
  </div>
</body>
</html>
```

## Verify Setup

The system is now configured to:
1. Send emails via Loops.so API directly
2. Track all Stripe events and send appropriate emails
3. Send usage warnings at 80% capacity
4. Handle subscription changes

## Environment Variables Set
✅ LOOPS_API_KEY - Added to Vercel production

## What's Working Now
- Webhook endpoint ready at `/api/stripe-webhook`
- Email service at `/api/send-email`
- Usage tracking with warnings
- Subscription management portal
- All feature gates based on plan