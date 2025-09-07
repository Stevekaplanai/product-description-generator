# 📧 Email Templates for Loops.so

Ready-to-upload MJML templates for your transactional emails.

## 📁 Files Overview

| File | Template ID | Subject | Variables |
|------|-------------|---------|-----------|
| `1-welcome.mjml` | `welcome_subscriber` | Welcome to ProductDescriptions.io, {{customerName}}! 🎉 | customerName, plan, subscriptionId |
| `2-payment-success.mjml` | `payment_success` | Payment Received - Thank You! ✅ | customerName, plan, amount, paymentDate |
| `3-payment-failed.mjml` | `payment_failed` | Payment Failed - Action Required ⚠️ | customerName, amount, nextAttempt |
| `4-subscription-cancelled.mjml` | `subscription_cancelled` | Subscription Cancelled - We'll Miss You 😢 | customerName, subscriptionEndDate |
| `5-usage-warning.mjml` | `usage_limit_warning` | Usage Alert: {{percentUsed}}% of Monthly Limit 📊 | percentUsed, usage, limit, plan, remaining |

## 🚀 Upload Instructions

For each template:

1. **Go to Loops.so** → Transactional Emails → Create transactional
2. **Enter Template ID** exactly as shown above
3. **Upload MJML file** using the "Select or drop a file here" option
4. **Add Subject line** from the table above
5. **Configure variables** as listed
6. **Save and activate**

## 📋 Template Details

### 1. Welcome Email (`welcome_subscriber`)
- **Trigger**: New subscription via Stripe
- **Variables**: 
  - `customerName` - Customer's name
  - `plan` - Subscription plan name (Starter, Professional, Enterprise)
  - `subscriptionId` - Stripe subscription ID

### 2. Payment Success (`payment_success`)
- **Trigger**: Successful payment via Stripe webhook
- **Variables**:
  - `customerName` - Customer's name
  - `plan` - Plan name
  - `amount` - Payment amount
  - `paymentDate` - Date of payment

### 3. Payment Failed (`payment_failed`)
- **Trigger**: Failed payment via Stripe webhook
- **Variables**:
  - `customerName` - Customer's name
  - `amount` - Failed payment amount
  - `nextAttempt` - Next retry date

### 4. Subscription Cancelled (`subscription_cancelled`)
- **Trigger**: Subscription cancellation via Stripe
- **Variables**:
  - `customerName` - Customer's name
  - `subscriptionEndDate` - Date when access ends

### 5. Usage Warning (`usage_limit_warning`)
- **Trigger**: 80% of monthly limit reached
- **Variables**:
  - `percentUsed` - Percentage of limit used (e.g., "85")
  - `usage` - Number used (e.g., "85")
  - `limit` - Total limit (e.g., "100")
  - `plan` - Plan name
  - `remaining` - Number remaining

## 🎨 Design Features

All templates include:
- ✅ Responsive design (mobile-friendly)
- ✅ Professional branding
- ✅ Clear call-to-action buttons
- ✅ Email client compatibility
- ✅ Proper spacing and typography
- ✅ Footer with legal links

## 🧪 Testing

After upload, test with:

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

## 📞 Support

If you need help with template setup:
1. Check Loops.so documentation
2. Ensure all variables are properly configured
3. Test with real data from Stripe webhooks

## 🔗 Integration

These templates work with:
- Stripe webhook integration
- Loops.so native Stripe connection
- Custom email API endpoints
- Usage tracking system