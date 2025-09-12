const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { plan } = req.query;
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    
    const prices = {
        starter: process.env.STRIPE_PRICE_STARTER,
        professional: process.env.STRIPE_PRICE_PROFESSIONAL,
        enterprise: process.env.STRIPE_PRICE_ENTERPRISE
    };
    
    const priceId = prices[plan];
    
    if (!priceId) {
        return res.status(400).json({ error: 'Invalid plan selected' });
    }
    
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${protocol}://${host}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${protocol}://${host}/app.html`,
            allow_promotion_codes: true,
            billing_address_collection: 'required',
            customer_email: req.body?.email || undefined,
            metadata: {
                plan: plan
            }
        });
        
        // Redirect to Stripe Checkout
        res.redirect(303, session.url);
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ 
            error: 'Failed to create checkout session',
            details: error.message 
        });
    }
};