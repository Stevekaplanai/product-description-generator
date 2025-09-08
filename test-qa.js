const { chromium, devices } = require('playwright');

const BASE_URL = 'http://localhost:3003';

async function testStripeCheckout() {
  console.log('\n=== Testing Stripe Checkout ===');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    
    // Check Stripe configuration
    const stripeConfig = await page.evaluate(async () => {
      const response = await fetch('/api/stripe-config');
      return await response.json();
    });
    
    console.log('Stripe Config:', {
      isConfigured: stripeConfig.isConfigured,
      mode: stripeConfig.mode,
      hasPublishableKey: !!stripeConfig.publishableKey
    });
    
    if (!stripeConfig.isConfigured || !stripeConfig.publishableKey) {
      console.error('❌ Stripe is not configured properly');
      console.log('Missing publishable key:', !stripeConfig.publishableKey);
      return false;
    }
    
    // Try to click checkout button
    const checkoutBtn = page.locator('button:has-text("Get Started - $19/mo")').first();
    if (await checkoutBtn.isVisible()) {
      console.log('✓ Checkout button found');
      
      // Monitor network for checkout session creation
      const checkoutPromise = page.waitForResponse(
        response => response.url().includes('/api/create-checkout-session'),
        { timeout: 5000 }
      ).catch(() => null);
      
      await checkoutBtn.click();
      const checkoutResponse = await checkoutPromise;
      
      if (checkoutResponse) {
        const status = checkoutResponse.status();
        console.log('Checkout API Response:', status);
        
        if (status === 200) {
          const data = await checkoutResponse.json();
          console.log('✅ Checkout session created:', data.sessionId ? 'Success' : 'Failed');
          return true;
        } else {
          const error = await checkoutResponse.text();
          console.error('❌ Checkout failed:', error);
          return false;
        }
      } else {
        console.error('❌ No checkout response received');
        return false;
      }
    } else {
      console.error('❌ Checkout button not found');
      return false;
    }
  } finally {
    await browser.close();
  }
}

async function testMobileGeneration() {
  console.log('\n=== Testing Mobile Generation ===');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    permissions: ['geolocation']
  });
  const page = await context.newPage();
  
  try {
    await page.goto(`${BASE_URL}/app.html`);
    await page.waitForTimeout(3000); // Give more time for initialization
    
    // Handle free tier welcome if present
    const welcomeModal = page.locator('button:has-text("Start Creating Free")');
    if (await welcomeModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Free tier welcome detected - closing');
      await welcomeModal.click();
      await page.waitForTimeout(500);
    }
    
    // Check if auth overlay exists (shouldn't with free tier)
    const authOverlay = page.locator('#authOverlay');
    if (await authOverlay.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('⚠️ Auth overlay detected - free tier should be available');
    }
    
    // Wait for form to be visible
    await page.waitForSelector('#productName', { state: 'visible', timeout: 10000 });
    
    // Fill form
    await page.fill('#productName', 'Test Product Mobile');
    await page.selectOption('#category', 'electronics');
    await page.fill('#features', 'Feature 1\nFeature 2');
    await page.fill('#targetAudience', 'Mobile users');
    
    // Disable images for faster test - click the toggle switch instead of checkbox
    const imageCheckbox = page.locator('#generateImages');
    if (await imageCheckbox.isChecked()) {
      // Click the toggle switch to uncheck
      await page.click('.toggle-switch');
    }
    
    console.log('✓ Form filled');
    
    // Monitor API response - reduced timeout for testing
    const apiPromise = page.waitForResponse(
      response => response.url().includes('/api/generate-description'),
      { timeout: 30000 }
    ).catch(() => null);
    
    // Click generate
    await page.click('#generateBtn');
    console.log('✓ Generate button clicked');
    
    // Wait for response
    const apiResponse = await apiPromise;
    
    if (apiResponse) {
      const status = apiResponse.status();
      console.log('API Response Status:', status);
      
      if (status === 200) {
        const data = await apiResponse.json();
        console.log('✅ Content generated:', {
          hasDescriptions: !!(data.descriptions || data.variations),
          descriptionCount: (data.descriptions || data.variations || []).length
        });
        
        // Check if results are displayed
        await page.waitForTimeout(2000);
        const resultsVisible = await page.locator('#results').isVisible();
        console.log('Results displayed:', resultsVisible ? '✅' : '❌');
        
        return true;
      } else {
        const error = await apiResponse.text();
        console.error('❌ Generation failed:', error);
        return false;
      }
    } else {
      console.error('❌ Request timed out or failed');
      return false;
    }
  } finally {
    await browser.close();
  }
}

async function testDesktopGeneration() {
  console.log('\n=== Testing Desktop Generation ===');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto(`${BASE_URL}/app.html`);
    await page.waitForTimeout(3000); // Give more time for initialization
    
    // Handle free tier welcome if present
    const welcomeModal = page.locator('button:has-text("Start Creating Free")');
    if (await welcomeModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Free tier welcome detected - closing');
      await welcomeModal.click();
      await page.waitForTimeout(500);
    }
    
    // Check if auth overlay exists (shouldn't with free tier)
    const authOverlay = page.locator('#authOverlay');
    if (await authOverlay.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('⚠️ Auth overlay detected - free tier should be available');
    }
    
    // Wait for form to be visible
    await page.waitForSelector('#productName', { state: 'visible', timeout: 10000 });
    
    // Fill form
    await page.fill('#productName', 'Test Product Desktop');
    await page.selectOption('#category', 'electronics');
    await page.fill('#features', 'Feature 1\nFeature 2\nFeature 3');
    await page.fill('#targetAudience', 'Desktop users');
    
    // Disable images for faster test - click the toggle switch if needed
    const imageCheckbox = page.locator('#generateImages');
    if (await imageCheckbox.isChecked()) {
      // Click the toggle switch to uncheck
      await page.click('.toggle-switch');
    }
    
    console.log('✓ Form filled with image generation disabled');
    
    // Monitor API response - reduced timeout for testing
    const apiPromise = page.waitForResponse(
      response => response.url().includes('/api/generate-description'),
      { timeout: 30000 }
    ).catch(() => null);
    
    // Click generate
    await page.click('#generateBtn');
    console.log('✓ Generate button clicked');
    
    // Wait for response
    const apiResponse = await apiPromise;
    
    if (apiResponse) {
      const status = apiResponse.status();
      console.log('API Response Status:', status);
      
      if (status === 200) {
        const data = await apiResponse.json();
        console.log('✅ Content generated:', {
          hasDescriptions: !!(data.descriptions || data.variations),
          hasImages: !!(data.images || data.generatedImages),
          imageCount: (data.images || data.generatedImages || []).length
        });
        
        return true;
      } else {
        const error = await apiResponse.text();
        console.error('❌ Generation failed:', error);
        return false;
      }
    } else {
      console.error('❌ Request timed out or failed');
      return false;
    }
  } finally {
    await browser.close();
  }
}

async function runAllTests() {
  console.log('🚀 Starting QA Tests\n');
  console.log(`Testing server at: ${BASE_URL}`);
  console.log('================================');
  
  const results = {
    stripe: false,
    mobile: false,
    desktop: false
  };
  
  // Test Stripe
  try {
    results.stripe = await testStripeCheckout();
  } catch (error) {
    console.error('Stripe test error:', error.message);
  }
  
  // Test Mobile
  try {
    results.mobile = await testMobileGeneration();
  } catch (error) {
    console.error('Mobile test error:', error.message);
  }
  
  // Test Desktop
  try {
    results.desktop = await testDesktopGeneration();
  } catch (error) {
    console.error('Desktop test error:', error.message);
  }
  
  // Summary
  console.log('\n================================');
  console.log('📊 Test Results Summary:');
  console.log('--------------------------------');
  console.log(`Stripe Checkout: ${results.stripe ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Mobile Generation: ${results.mobile ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Desktop Generation: ${results.desktop ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('================================\n');
  
  const allPassed = Object.values(results).every(r => r);
  if (allPassed) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Please review the logs above.');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(console.error);