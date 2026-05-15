/**
 * Test Stripe Webhook in Production
 * This script sends a test webhook event to the production endpoint
 */

const stripe = require('stripe');
const crypto = require('crypto');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuration
const WEBHOOK_ENDPOINT = 'https://productdescriptions.io/api/stripe-webhook';
const WEBHOOK_SECRET = 'whsec_ELwZGojQg2cnsZMyzEj89FbLOoCVZuc9';

/**
 * Generate a valid Stripe signature for webhook testing
 */
function generateStripeSignature(payload, secret, timestamp) {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Test webhook endpoint
 */
async function testWebhook() {
  console.log('🚀 Testing Stripe Webhook on Production\n');
  console.log(`Endpoint: ${WEBHOOK_ENDPOINT}`);
  console.log(`Using webhook secret: ${WEBHOOK_SECRET}\n`);

  // Create a test event payload
  const testEvent = {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `cs_test_${Date.now()}`,
        object: 'checkout.session',
        customer_email: 'test@productdescriptions.io',
        customer: `cus_test_${Date.now()}`,
        status: 'complete',
        payment_status: 'paid',
        amount_total: 4900,
        currency: 'usd',
        mode: 'subscription'
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type: 'checkout.session.completed'
  };

  const payload = JSON.stringify(testEvent);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateStripeSignature(payload, WEBHOOK_SECRET, timestamp);

  console.log('📤 Sending test event: checkout.session.completed\n');

  try {
    const response = await fetch(WEBHOOK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: payload
    });

    console.log(`✅ Response Status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    console.log(`📥 Response Body: ${responseText}\n`);

    if (response.status === 200) {
      console.log('✅ SUCCESS: Webhook endpoint is working correctly!');
      console.log('✅ Signature verification passed');
      console.log('✅ Event was processed successfully\n');
    } else {
      console.log('❌ FAILED: Webhook returned non-200 status');
      console.log(`Error: ${responseText}\n`);
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\nPossible issues:');
    console.error('- Network connectivity problem');
    console.error('- Webhook endpoint is down');
    console.error('- Firewall or DNS issues\n');
  }

  // Test with invalid signature (should fail)
  console.log('\n---\n');
  console.log('🔒 Testing signature verification (should fail with invalid signature)\n');

  try {
    const response = await fetch(WEBHOOK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 't=123,v1=invalidsignature'
      },
      body: payload
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    const responseText = await response.text();
    console.log(`Response: ${responseText}\n`);

    if (response.status === 400) {
      console.log('✅ SUCCESS: Signature verification is working correctly (rejected invalid signature)');
    } else {
      console.log('⚠️  WARNING: Expected 400 status for invalid signature');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n✅ Webhook testing completed!\n');
  console.log('Next steps:');
  console.log('1. Check Vercel logs: vercel logs productdescriptions.io');
  console.log('2. Check Stripe Dashboard for webhook delivery status');
  console.log('3. Monitor for any real webhook events from Stripe\n');
}

// Run the test
testWebhook().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
