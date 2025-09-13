const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Price IDs from environment variables
const PRICE_IDS = {
    starter: {
        monthly: process.env.STRIPE_PRICE_STARTER,
        annual: process.env.STRIPE_PRICE_STARTER_ANNUAL
    },
    professional: {
        monthly: process.env.STRIPE_PRICE_PROFESSIONAL,
        annual: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL
    },
    enterprise: {
        monthly: process.env.STRIPE_PRICE_ENTERPRISE,
        annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL
    }
};

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Support both GET and POST methods
    const plan = req.method === 'POST' ? req.body?.plan : req.query?.plan;
    const billingCycle = req.method === 'POST' ? req.body?.billingCycle : req.query?.billingCycle || 'monthly';
    const email = req.method === 'POST' ? req.body?.email : req.query?.email;

    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';

    // Validate plan
    if (!plan || !['starter', 'professional', 'enterprise'].includes(plan)) {
        return res.status(400).json({
            error: 'Invalid plan selected',
            details: 'Plan must be starter, professional, or enterprise'
        });
    }

    // Get the appropriate price ID
    const priceId = PRICE_IDS[plan]?.[billingCycle] || PRICE_IDS[plan]?.monthly;

    if (!priceId) {
        return res.status(400).json({
            error: 'Price not configured',
            details: `Price ID for ${plan} (${billingCycle}) is not configured`
        });
    }

    try {
        // Create or retrieve customer if email provided
        let customerId;
        if (email) {
            const existingCustomers = await stripe.customers.list({
                email: email,
                limit: 1
            });

            if (existingCustomers.data.length > 0) {
                customerId = existingCustomers.data[0].id;
            } else {
                const customer = await stripe.customers.create({
                    email: email,
                    metadata: {
                        plan: plan,
                        billingCycle: billingCycle
                    }
                });
                customerId = customer.id;
            }
        }

        // Create checkout session configuration
        const sessionConfig = {
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${protocol}://${host}/dashboard.html?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
            cancel_url: `${protocol}://${host}/pricing.html`,
            allow_promotion_codes: true,
            billing_address_collection: 'auto',
            metadata: {
                plan: plan,
                billingCycle: billingCycle
            }
        };

        // Add customer if we have one
        if (customerId) {
            sessionConfig.customer = customerId;
        } else if (email) {
            sessionConfig.customer_email = email;
        }

        // Add trial period for starter plan
        if (plan === 'starter') {
            sessionConfig.subscription_data = {
                trial_period_days: 7,
                metadata: {
                    plan: plan,
                    billingCycle: billingCycle
                }
            };
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        // Return JSON response for AJAX requests
        if (req.method === 'POST' || req.headers['content-type']?.includes('application/json')) {
            return res.status(200).json({
                success: true,
                checkoutUrl: session.url,
                sessionId: session.id
            });
        }

        // Redirect for GET requests
        res.redirect(303, session.url);
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({
            error: 'Failed to create checkout session',
            details: error.message
        });
    }
};