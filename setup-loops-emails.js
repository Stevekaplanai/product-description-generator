/**
 * Setup script to create all email templates in Loops.so
 * Run this once to set up all transactional emails
 */

const LOOPS_API_KEY = process.env.LOOPS_API_KEY || '';
const LOOPS_API_URL = 'https://app.loops.so/api/v1';

// Email templates to create
const emailTemplates = [
  {
    id: 'welcome_subscriber',
    name: 'Welcome to ProductDescriptions.io',
    subject: 'Welcome to ProductDescriptions.io! 🎉',
    from: 'ProductDescriptions.io',
    replyTo: 'support@productdescriptions.io',
    html: String.raw`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .features { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome, {{customerName}}! 🚀</h1>
            <p>Your {{plan}} plan is now active</p>
        </div>
        <div class="content">
            <p>Thank you for choosing ProductDescriptions.io! We're excited to help you create amazing product content.</p>
            
            <div class="features">
                <h3>What's included in your {{plan}} plan:</h3>
                <ul>
                    <li>✨ AI-powered product descriptions</li>
                    <li>🖼️ Professional product images</li>
                    <li>🎬 UGC-style marketing videos</li>
                    <li>📊 SEO optimization</li>
                    <li>🚀 Bulk upload capabilities</li>
                </ul>
            </div>
            
            <center>
                <a href="https://productdescriptions.io/app.html" class="button">Start Creating Content</a>
            </center>
            
            <h3>Quick Start Guide:</h3>
            <ol>
                <li>Upload a product image or enter product details</li>
                <li>Select your preferred tone and style</li>
                <li>Generate descriptions, images, and videos</li>
                <li>Download and use across all platforms</li>
            </ol>
            
            <p>Need help? Reply to this email or visit our <a href="https://productdescriptions.io/help">help center</a>.</p>
            
            <p>Best regards,<br>The ProductDescriptions.io Team</p>
        </div>
        <div class="footer">
            <p>© 2024 ProductDescriptions.io | <a href="https://productdescriptions.io/privacy">Privacy</a> | <a href="https://productdescriptions.io/terms">Terms</a></p>
            <p>Subscription ID: {{subscriptionId}}</p>
        </div>
    </div>
</body>
</html>
    `,
    variables: ['customerName', 'plan', 'subscriptionId']
  },
  {
    id: 'payment_success',
    name: 'Payment Successful',
    subject: 'Payment Received - Thank You! ✅',
    from: 'ProductDescriptions.io',
    replyTo: 'billing@productdescriptions.io',
    html: String.raw`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
        .receipt { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Successful! ✅</h1>
        </div>
        <div class="content">
            <p>Hi {{customerName}},</p>
            <p>We've successfully processed your payment. Thank you for continuing with ProductDescriptions.io!</p>
            
            <div class="receipt">
                <h3>Payment Details:</h3>
                <p><strong>Plan:</strong> {{plan}}</p>
                <p><strong>Amount:</strong> ${{amount}}</p>
                <p><strong>Date:</strong> {{paymentDate}}</p>
                <p><strong>Invoice ID:</strong> {{invoiceId}}</p>
            </div>
            
            <center>
                <a href="https://productdescriptions.io/app.html" class="button">Continue Creating</a>
            </center>
            
            <p>Your subscription is active and you have full access to all {{plan}} features.</p>
            
            <p>Need to update your billing info or download invoices? Visit your <a href="{{portalUrl}}">billing portal</a>.</p>
            
            <p>Thank you for your business!</p>
            
            <p>Best regards,<br>The ProductDescriptions.io Team</p>
        </div>
        <div class="footer">
            <p>© 2024 ProductDescriptions.io | <a href="https://productdescriptions.io/privacy">Privacy</a> | <a href="https://productdescriptions.io/terms">Terms</a></p>
        </div>
    </div>
</body>
</html>
    `,
    variables: ['customerName', 'plan', 'amount', 'paymentDate', 'invoiceId', 'portalUrl']
  },
  {
    id: 'payment_failed',
    name: 'Payment Failed',
    subject: 'Payment Failed - Action Required ⚠️',
    from: 'ProductDescriptions.io',
    replyTo: 'billing@productdescriptions.io',
    html: String.raw`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
        .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Failed ⚠️</h1>
        </div>
        <div class="content">
            <p>Hi {{customerName}},</p>
            <p>We were unable to process your payment for your ProductDescriptions.io subscription.</p>
            
            <div class="alert">
                <h3>Payment Details:</h3>
                <p><strong>Amount:</strong> {{currency}} {{amount}}</p>
                <p><strong>Next retry:</strong> {{nextAttempt}}</p>
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ul>
                <li>We'll automatically retry the payment on {{nextAttempt}}</li>
                <li>Your access remains active during the retry period</li>
                <li>Update your payment method to avoid service interruption</li>
            </ul>
            
            <center>
                <a href="{{portalUrl}}" class="button">Update Payment Method</a>
            </center>
            
            <p>Common reasons for payment failure:</p>
            <ul>
                <li>Insufficient funds</li>
                <li>Card expired</li>
                <li>Bank declined the transaction</li>
                <li>Incorrect billing information</li>
            </ul>
            
            <p>If you need assistance, please reply to this email or contact support.</p>
            
            <p>Best regards,<br>The ProductDescriptions.io Team</p>
        </div>
        <div class="footer">
            <p>© 2024 ProductDescriptions.io | <a href="https://productdescriptions.io/privacy">Privacy</a> | <a href="https://productdescriptions.io/terms">Terms</a></p>
        </div>
    </div>
</body>
</html>
    `,
    variables: ['customerName', 'amount', 'currency', 'nextAttempt', 'portalUrl']
  },
  {
    id: 'subscription_cancelled',
    name: 'Subscription Cancelled',
    subject: 'Subscription Cancelled - We\'ll Miss You 😢',
    from: 'ProductDescriptions.io',
    replyTo: 'support@productdescriptions.io',
    html: String.raw`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6c757d; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
        .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Subscription Cancelled 😢</h1>
        </div>
        <div class="content">
            <p>Hi {{customerName}},</p>
            <p>Your ProductDescriptions.io subscription has been cancelled as requested.</p>
            
            <div class="info-box">
                <h3>Important Information:</h3>
                <p><strong>Access until:</strong> {{subscriptionEndDate}}</p>
                <p>You can continue using all features until this date.</p>
            </div>
            
            <p><strong>What happens to your data?</strong></p>
            <ul>
                <li>All your generated content remains accessible</li>
                <li>You can still download your previous work</li>
                <li>Your account remains active (with free tier limits after expiry)</li>
            </ul>
            
            <h3>We'd love your feedback!</h3>
            <p>Help us improve by telling us why you cancelled:</p>
            <ul>
                <li>Too expensive?</li>
                <li>Missing features?</li>
                <li>Found an alternative?</li>
                <li>No longer needed?</li>
            </ul>
            
            <p>Reply to this email with your feedback - we read every response!</p>
            
            <center>
                <a href="https://productdescriptions.io/pricing" class="button">Reactivate Anytime</a>
            </center>
            
            <p>Changed your mind? You can reactivate your subscription anytime before {{subscriptionEndDate}} to keep your current pricing.</p>
            
            <p>Thank you for being part of our journey!</p>
            
            <p>Best regards,<br>The ProductDescriptions.io Team</p>
        </div>
        <div class="footer">
            <p>© 2024 ProductDescriptions.io | <a href="https://productdescriptions.io/privacy">Privacy</a> | <a href="https://productdescriptions.io/terms">Terms</a></p>
        </div>
    </div>
</body>
</html>
    `,
    variables: ['customerName', 'subscriptionEndDate']
  },
  {
    id: 'usage_limit_warning',
    name: 'Usage Limit Warning',
    subject: 'Approaching Usage Limit - {{percentUsed}}% Used 📊',
    from: 'ProductDescriptions.io',
    replyTo: 'support@productdescriptions.io',
    html: String.raw`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffc107; color: #333; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
        .usage-bar { background: #e0e0e0; height: 30px; border-radius: 15px; overflow: hidden; margin: 20px 0; }
        .usage-fill { background: linear-gradient(90deg, #28a745, #ffc107, #dc3545); height: 100%; transition: width 0.3s; }
        .stats { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Usage Alert: {{percentUsed}}% Used 📊</h1>
        </div>
        <div class="content">
            <p>Hi there!</p>
            <p>You're approaching your monthly usage limit for your {{plan}} plan.</p>
            
            <div class="usage-bar">
                <div class="usage-fill" style="width: {{percentUsed}}%"></div>
            </div>
            
            <div class="stats">
                <h3>Current Usage:</h3>
                <p><strong>Descriptions generated:</strong> {{usage}} / {{limit}}</p>
                <p><strong>Percentage used:</strong> {{percentUsed}}%</p>
                <p><strong>Remaining:</strong> {{remaining}} descriptions</p>
            </div>
            
            <p><strong>What happens when you reach the limit?</strong></p>
            <ul>
                <li>New generations will be paused</li>
                <li>You can still access all previous content</li>
                <li>Limits reset on your billing date</li>
            </ul>
            
            <h3>Need more capacity?</h3>
            <p>Upgrade your plan for higher limits and more features:</p>
            
            <center>
                <a href="https://productdescriptions.io/pricing" class="button">View Upgrade Options</a>
            </center>
            
            <p>Or manage your usage by:</p>
            <ul>
                <li>Using bulk upload for multiple products</li>
                <li>Optimizing your prompts for better results</li>
                <li>Saving templates for similar products</li>
            </ul>
            
            <p>Questions? Reply to this email and we'll help!</p>
            
            <p>Best regards,<br>The ProductDescriptions.io Team</p>
        </div>
        <div class="footer">
            <p>© 2024 ProductDescriptions.io | <a href="https://productdescriptions.io/privacy">Privacy</a> | <a href="https://productdescriptions.io/terms">Terms</a></p>
        </div>
    </div>
</body>
</html>
    `,
    variables: ['usage', 'limit', 'percentUsed', 'plan', 'remaining']
  },
  {
    id: 'upgrade_success',
    name: 'Plan Upgraded Successfully',
    subject: 'Plan Upgraded Successfully! 🎊',
    from: 'ProductDescriptions.io',
    replyTo: 'support@productdescriptions.io',
    html: String.raw`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
        .comparison { display: flex; gap: 20px; margin: 20px 0; }
        .plan-box { flex: 1; padding: 15px; border-radius: 8px; text-align: center; }
        .old-plan { background: #f8f9fa; }
        .new-plan { background: #d4edda; border: 2px solid #28a745; }
        .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .features { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{newPlan}}! 🎊</h1>
            <p>Your upgrade is complete</p>
        </div>
        <div class="content">
            <p>Hi {{customerName}},</p>
            <p>Congratulations! You've successfully upgraded your ProductDescriptions.io plan.</p>
            
            <div class="comparison">
                <div class="plan-box old-plan">
                    <h4>Previous Plan</h4>
                    <p><strong>{{oldPlan}}</strong></p>
                </div>
                <div class="plan-box new-plan">
                    <h4>New Plan</h4>
                    <p><strong>{{newPlan}}</strong></p>
                    <p>✨ Active Now!</p>
                </div>
            </div>
            
            <div class="features">
                <h3>Your new {{newPlan}} features:</h3>
                <ul>
                    <li>✅ {{newLimit}} descriptions per month</li>
                    <li>✅ Enhanced AI capabilities</li>
                    <li>✅ Priority processing</li>
                    <li>✅ Advanced customization options</li>
                    <li>✅ Premium support</li>
                </ul>
            </div>
            
            <center>
                <a href="https://productdescriptions.io/app.html" class="button">Start Using New Features</a>
            </center>
            
            <h3>What's changed?</h3>
            <ul>
                <li>Your new limits are effective immediately</li>
                <li>Usage from this month carries over</li>
                <li>New billing amount: ${{newPrice}}/month</li>
                <li>Next billing date: {{nextBillingDate}}</li>
            </ul>
            
            <p>Thank you for growing with us! We're excited to see what you create with your enhanced capabilities.</p>
            
            <p>Need help getting started with your new features? Check out our <a href="https://productdescriptions.io/guide">upgrade guide</a> or reply to this email.</p>
            
            <p>Best regards,<br>The ProductDescriptions.io Team</p>
        </div>
        <div class="footer">
            <p>© 2024 ProductDescriptions.io | <a href="https://productdescriptions.io/privacy">Privacy</a> | <a href="https://productdescriptions.io/terms">Terms</a></p>
        </div>
    </div>
</body>
</html>
    `,
    variables: ['customerName', 'oldPlan', 'newPlan', 'newLimit', 'newPrice', 'nextBillingDate']
  }
];

async function createLoopsTemplate(template) {
  try {
    const response = await fetch(`${LOOPS_API_URL}/transactional`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: template.name,
        transactionalId: template.id,
        subject: template.subject,
        fromName: template.from,
        fromEmail: 'noreply@productdescriptions.io',
        replyToEmail: template.replyTo,
        content: {
          html: template.html,
          text: template.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        },
        dataVariables: template.variables.reduce((acc, v) => {
          acc[v] = `{{${v}}}`;
          return acc;
        }, {})
      })
    });

    if (response.ok) {
      console.log(`✅ Created template: ${template.name}`);
      return true;
    } else {
      const error = await response.text();
      console.error(`❌ Failed to create ${template.name}:`, error);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error creating ${template.name}:`, error);
    return false;
  }
}

async function setupAllTemplates() {
  console.log('🚀 Starting Loops.so email template setup...\n');
  
  if (!LOOPS_API_KEY) {
    console.error('❌ LOOPS_API_KEY environment variable is required');
    console.log('Please set: export LOOPS_API_KEY=your_api_key_here');
    process.exit(1);
  }

  let successCount = 0;
  
  for (const template of emailTemplates) {
    console.log(`Creating: ${template.name}...`);
    const success = await createLoopsTemplate(template);
    if (success) successCount++;
    
    // Small delay between API calls
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n✨ Setup complete! Created ${successCount}/${emailTemplates.length} templates.`);
  
  if (successCount === emailTemplates.length) {
    console.log('\n✅ All templates created successfully!');
    console.log('\nNext steps:');
    console.log('1. Add these environment variables to Vercel:');
    console.log(`   LOOPS_API_KEY=${LOOPS_API_KEY}`);
    console.log('   ZAPIER_WEBHOOK_URL=your_zapier_webhook_url (optional)');
    console.log('2. Test email sending with: npm run test-email');
    console.log('3. Configure Stripe webhook endpoint in Stripe dashboard');
  } else {
    console.log('\n⚠️ Some templates failed to create. Please check the errors above.');
  }
}

// Run if called directly
if (require.main === module) {
  setupAllTemplates();
}

module.exports = { emailTemplates, createLoopsTemplate, setupAllTemplates };