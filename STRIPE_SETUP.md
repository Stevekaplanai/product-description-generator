# Stripe Setup Guide

The Stripe checkout is failing because the price IDs in the code don't match your actual Stripe products.

To fix this:
1. Go to https://dashboard.stripe.com/test/products
2. Create products for Starter (9), Professional (9), Enterprise (49)
3. Get the price IDs (start with price_)
4. Share them with me to update in the code

Current non-working IDs that need replacement:
- Starter: price_1PvWKf033zrJmRoAbV7hjrGd
- Professional: price_1PvWLQ033zrJmRoA8QKfPUez
- Enterprise: price_1PvWLv033zrJmRoAsZmyGSte
