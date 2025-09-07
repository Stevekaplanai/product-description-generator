# 📧 Loops.so MJML Templates - Upload Ready

These templates are formatted exactly like the Loops.so sample format with `{DATA_VARIABLE:name}` syntax.

## 📁 Files Ready for Upload

| File | Template ID | Subject Line | Variables |
|------|-------------|-------------|-----------|
| `1-welcome.mjml` | `welcome_subscriber` | Welcome to ProductDescriptions.io, {DATA_VARIABLE:customerName}! 🎉 | customerName, plan, subscriptionId |
| `2-payment-success.mjml` | `payment_success` | Payment Received - Thank You! ✅ | customerName, plan, amount, paymentDate |
| `3-payment-failed.mjml` | `payment_failed` | Payment Failed - Action Required ⚠️ | customerName, amount, nextAttempt |
| `4-subscription-cancelled.mjml` | `subscription_cancelled` | Subscription Cancelled - We'll Miss You 😢 | customerName, subscriptionEndDate |
| `5-usage-warning.mjml` | `usage_limit_warning` | Usage Alert: {DATA_VARIABLE:percentUsed}% Used 📊 | percentUsed, usage, limit, plan, remaining |

## 🎯 Exact Upload Steps

For each template:

1. **Go to Loops.so** → Transactional Emails
2. **Click "Create transactional"**
3. **Enter Template ID** (exactly as shown above)
4. **Upload MJML file** - drag and drop the .mjml file
5. **Set Subject line** (copy from table above)
6. **Configure sender** - From: ProductDescriptions.io
7. **Save and Activate**

## 📋 Template Details

### Variables Used:
- `{DATA_VARIABLE:customerName}` - Customer's first name or full name
- `{DATA_VARIABLE:plan}` - Subscription plan (Starter, Professional, Enterprise)  
- `{DATA_VARIABLE:subscriptionId}` - Stripe subscription ID
- `{DATA_VARIABLE:amount}` - Payment amount (without $ sign)
- `{DATA_VARIABLE:paymentDate}` - Date of payment
- `{DATA_VARIABLE:nextAttempt}` - Next payment retry date
- `{DATA_VARIABLE:subscriptionEndDate}` - When access ends
- `{DATA_VARIABLE:percentUsed}` - Usage percentage (85)
- `{DATA_VARIABLE:usage}` - Current usage count (85)
- `{DATA_VARIABLE:limit}` - Monthly limit (100)
- `{DATA_VARIABLE:remaining}` - Remaining count (15)

## 🎨 Design Features

All templates follow Loops.so format with:
- ✅ Proper `{DATA_VARIABLE:name}` syntax
- ✅ Simple, clean design with borders
- ✅ Consistent styling with `.bold` class
- ✅ Mobile-responsive layout
- ✅ Professional color scheme
- ✅ Clear call-to-action buttons

## 🔗 Integration Notes

These templates work with:
- Our existing `/api/send-email` endpoint
- Loops.so Stripe webhook integration
- Custom usage tracking system

The API will automatically populate the data variables when sending emails.

## 🧪 Test After Upload

Once uploaded, test with:

```bash
curl -X POST https://productdescriptions.io/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "emailType": "welcome",
    "data": {
      "customerName": "John Doe",
      "plan": "Professional", 
      "subscriptionId": "sub_1234567890"
    }
  }'
```

## 📞 Support

If templates don't work:
1. Check Template IDs match exactly
2. Verify all data variables are configured
3. Test with actual Stripe webhook data
4. Check Loops.so logs for errors