const stripeConfig = require('./config/stripe');
const stripe = require('stripe')(stripeConfig.secretKey, stripeConfig.options);
const { sendEmail } = require('./send-email');
const getRawBody = require('raw-body');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = stripeConfig.webhookSecret;

  let event;
  let rawBody;

  try {
    // Get raw body for Stripe signature verification
    rawBody = await getRawBody(req);
  } catch (err) {
    console.error('Error reading raw body:', err.message);
    return res.status(400).send(`Webhook Error: Failed to read request body`);
  }

  try {
    // Verify webhook signature with raw body
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout completed:', session.id);
      
      // Loops.so will handle the welcome email automatically
      // We just track for our internal usage system
      console.log('New subscription for:', session.customer_email);
      break;

    case 'customer.subscription.created':
      const subscription = event.data.object;
      console.log('Subscription created:', subscription.id);
      break;

    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object;
      console.log('Subscription updated:', updatedSubscription.id);
      break;

    case 'customer.subscription.deleted':
      const canceledSubscription = event.data.object;
      console.log('Subscription canceled:', canceledSubscription.id);
      
      // Get customer email and send cancellation email
      try {
        const customer = await stripe.customers.retrieve(canceledSubscription.customer);
        if (customer.email) {
          await sendEmail(customer.email, 'subscriptionCancelled', {
            customerName: customer.name || 'Valued Customer',
            subscriptionEndDate: new Date(canceledSubscription.current_period_end * 1000).toLocaleDateString()
          });
        }
      } catch (err) {
        console.error('Error sending cancellation email:', err);
      }
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      console.log('Payment succeeded for invoice:', invoice.id);
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log('Payment failed for invoice:', failedInvoice.id);
      
      // Send payment failed email
      if (failedInvoice.customer_email) {
        await sendEmail(failedInvoice.customer_email, 'paymentFailed', {
          customerName: failedInvoice.customer_name || 'Valued Customer',
          amount: (failedInvoice.amount_due / 100).toFixed(2),
          currency: failedInvoice.currency.toUpperCase(),
          nextAttempt: failedInvoice.next_payment_attempt 
            ? new Date(failedInvoice.next_payment_attempt * 1000).toLocaleDateString()
            : 'Contact support'
        });
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
};

// Disable body parsing for Stripe webhook verification
module.exports.config = {
  api: {
    bodyParser: false,
  },
};