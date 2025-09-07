# PostHog Setup Guide for Product Description Generator

## 1. Quick Install (5 minutes)

Add this to your `app.html` before closing `</head>`:

```html
<script>
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('YOUR_PROJECT_API_KEY',{api_host:'https://app.posthog.com'})
</script>
```

## 2. Key Events to Track

Add these tracking calls to your existing functions:

```javascript
// Track when someone generates content
function generateDescription() {
    // ... existing code ...
    
    posthog.capture('content_generated', {
        has_image: !!uploadedImageBase64,
        product_category: document.getElementById('category').value,
        features_count: document.getElementById('features').value.split('\n').length
    });
}

// Track video modal views
function showVideoUpsellPopup() {
    // ... existing code ...
    
    posthog.capture('video_modal_shown', {
        trigger: 'sticky_cta', // or 'auto_delay'
        time_on_page: Math.floor((Date.now() - pageLoadTime) / 1000)
    });
}

// Track pricing selection
function proceedToVideoCreation(videoType) {
    posthog.capture('video_package_selected', {
        package: videoType, // 'single' or 'triple'
        price: videoType === 'triple' ? 69 : 29
    });
    
    // ... existing checkout code ...
}

// Track successful checkout (add to success page)
if (window.location.pathname === '/video-success.html') {
    const urlParams = new URLSearchParams(window.location.search);
    posthog.capture('video_purchased', {
        session_id: urlParams.get('session_id'),
        revenue: sessionStorage.getItem('purchaseAmount')
    });
}
```

## 3. Conversion Funnel Setup

In PostHog Dashboard:
1. Go to Insights → Funnels
2. Create funnel with these steps:
   - Step 1: `content_generated`
   - Step 2: `video_modal_shown`
   - Step 3: `video_package_selected`
   - Step 4: `video_purchased`

## 4. A/B Test Setup

```javascript
// A/B test different price points
function showVideoUpsellPopup() {
    const variant = posthog.getFeatureFlag('video_pricing_test');
    
    if (variant === 'lower_price') {
        document.querySelector('.pricing-option .amount').textContent = '24';
        document.querySelector('.pricing-option.popular .amount').textContent = '59';
    }
    
    posthog.capture('video_modal_shown', {
        pricing_variant: variant || 'control'
    });
}
```

## 5. Session Recording Setup

In PostHog:
1. Go to Settings → Session Recording
2. Enable recording
3. Add recording snippet (already included in main script)

## Key Metrics to Monitor

### Daily Dashboard:
- **Conversion Rate**: Generate → Purchase
- **Modal Engagement**: View → Click rate
- **Package Split**: Single vs Triple selection
- **Drop-off Points**: Where users abandon

### Weekly Analysis:
- **Avg Time to Purchase**: How long from first visit
- **Return Visitor Rate**: Do they come back?
- **Feature Usage**: Image upload vs manual entry
- **Device Performance**: Mobile vs Desktop conversion

## Alternative Tools (If PostHog feels too complex)

### Simpler Options:

1. **Plausible Analytics** ($9/month)
   - Dead simple
   - Privacy-focused
   - Basic goals/conversions
   - No session recording

2. **Simple Analytics** ($19/month)
   - Even simpler than Plausible
   - One-line install
   - Basic event tracking

3. **Splitbee** (Free tier available)
   - Middle ground
   - Nice UI
   - Basic A/B testing
   - Simpler than PostHog

### My Take:
Start with PostHog's free tier. You only need to implement 5-6 key events. Ignore 90% of features initially. Just focus on:
1. Funnel tracking
2. One A/B test (pricing)
3. Session recordings of drop-offs

If PostHog feels overwhelming after 2 weeks, switch to Plausible for simplicity.