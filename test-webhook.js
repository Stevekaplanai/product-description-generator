const stripe = require('stripe');
const fetch = require('node-fetch');

async function testWebhook() {
  console.log('Testing Stripe webhook locally...\n');

  // Test payload
  const testPayload = {
    id: 'evt_test_' + Date.now(),
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_test_' + Date.now(),
        object: 'checkout.session',
        customer_email: 'test@example.com',
        status: 'complete'
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type: 'checkout.session.completed'
  };

  // Test without signature (should fail)
  console.log('Test 1: Request without signature (should fail)');
  try {
    const response = await fetch('http://localhost:3000/api/stripe-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response:', text);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n---\n');

  // Test method not allowed
  console.log('Test 2: GET request (should fail with 405)');
  try {
    const response = await fetch('http://localhost:3000/api/stripe-webhook', {
      method: 'GET'
    });
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\nWebhook tests completed!');
  console.log('\nNote: To fully test with valid signatures, use Stripe CLI:');
  console.log('stripe listen --forward-to localhost:3000/api/stripe-webhook');
  console.log('stripe trigger checkout.session.completed');
}

testWebhook().catch(console.error);