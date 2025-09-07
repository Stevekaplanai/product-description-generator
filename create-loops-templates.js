/**
 * Setup script to create all email templates in Loops.so
 */

const LOOPS_API_KEY = process.env.LOOPS_API_KEY || '8bc3ee3ea2d20759cd7ecd4933fee9f0';

async function createTemplates() {
  console.log('🚀 Creating Loops.so email templates...\n');

  // Test the API connection first with a simple API call
  const testResponse = await fetch('https://app.loops.so/api/v1/contacts?email=test@example.com', {
    method: 'GET', 
    headers: {
      'Authorization': `Bearer ${LOOPS_API_KEY}`,
      'Content-Type': 'application/json',
    }
  });

  if (!testResponse.ok) {
    console.error('❌ Invalid API key or connection error');
    console.log('Response:', await testResponse.text());
    return;
  }

  console.log('✅ API key validated successfully\n');

  // Since Loops.so transactional emails are created in the dashboard,
  // let's create a test send to verify everything works
  
  console.log('📧 Sending test email...');
  
  const testEmail = {
    transactionalId: 'welcome_subscriber',
    email: 'test@example.com',
    dataVariables: {
      customerName: 'Test User',
      plan: 'Professional',
      subscriptionId: 'sub_test123'
    }
  };

  try {
    const response = await fetch('https://app.loops.so/api/v1/transactional', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmail)
    });

    if (response.ok) {
      console.log('✅ Test email sent successfully!');
    } else {
      const error = await response.text();
      console.log('⚠️ Transactional email not found. You need to create templates in Loops.so dashboard.');
      console.log('Response:', error);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n📝 Email Templates to Create in Loops.so Dashboard:\n');
  
  const templates = [
    { id: 'welcome_subscriber', name: 'Welcome Email' },
    { id: 'payment_success', name: 'Payment Successful' },
    { id: 'payment_failed', name: 'Payment Failed' },
    { id: 'subscription_cancelled', name: 'Subscription Cancelled' },
    { id: 'usage_limit_warning', name: 'Usage Limit Warning' },
    { id: 'upgrade_success', name: 'Upgrade Success' }
  ];

  templates.forEach(t => {
    console.log(`- ${t.name} (ID: ${t.id})`);
  });

  console.log('\n📌 Next Steps:');
  console.log('1. Go to https://app.loops.so/transactional');
  console.log('2. Create each template with the IDs listed above');
  console.log('3. Add these environment variables to Vercel:');
  console.log(`   LOOPS_API_KEY=${LOOPS_API_KEY}`);
  console.log('4. Deploy to production');
  
  // Now let's update Vercel with the API key
  console.log('\n🔧 Setting up Vercel environment variable...');
  
  const { exec } = require('child_process');
  exec(`vercel env add LOOPS_API_KEY production`, (error, stdout, stderr) => {
    if (error) {
      console.log('Please manually add LOOPS_API_KEY to Vercel');
    } else {
      console.log('Environment variable prompt started - paste the API key when prompted');
    }
  });
}

createTemplates();