const { test, expect } = require('@playwright/test');

// Test configuration
const BASE_URL = 'https://productdescriptions.io';
const TIMEOUT = 60000; // 60 seconds for generation operations

test.describe('Product Description Generator - Image and Video Generation', () => {
  test.setTimeout(TIMEOUT);

  test('Complete product generation flow with images', async ({ page }) => {
    console.log('Starting complete generation flow test...');

    // Navigate to the main application
    await page.goto(`${BASE_URL}/app.html`);

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/01-initial-page.png', fullPage: true });

    // Fill in the product form
    console.log('Filling product form...');

    // Product name
    await page.fill('#productName', 'Premium Wireless Headphones');

    // Product category
    await page.fill('#productCategory', 'Electronics');

    // Target audience
    await page.fill('#targetAudience', 'Music enthusiasts and professionals');

    // Key features
    await page.fill('#keyFeatures', 'Noise cancellation, 30-hour battery, Premium audio quality, Comfortable design');

    // Select tone
    const toneSelector = await page.$('#tone');
    if (toneSelector) {
      await page.selectOption('#tone', 'professional');
    }

    // Check the generate images checkbox
    const generateImagesCheckbox = await page.$('#generateImages');
    if (generateImagesCheckbox) {
      await page.check('#generateImages');
      console.log('Checked generate images option');
    }

    // Take screenshot of filled form
    await page.screenshot({ path: 'screenshots/02-filled-form.png', fullPage: true });

    // Click generate button
    console.log('Clicking generate button...');
    const generateButton = await page.$('button[type="submit"], #generateBtn, button:has-text("Generate")');
    if (generateButton) {
      await generateButton.click();
    } else {
      // Try alternative selectors
      await page.click('text=/generate/i');
    }

    // Wait for generation to complete
    console.log('Waiting for generation to complete...');

    // Wait for results to appear (looking for common result indicators)
    const resultSelectors = [
      '.description-result',
      '#results',
      '.generated-content',
      '[class*="result"]',
      'text=/variation/i'
    ];

    let resultsFound = false;
    for (const selector of resultSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 30000 });
        resultsFound = true;
        console.log(`Results found with selector: ${selector}`);
        break;
      } catch {
        continue;
      }
    }

    if (resultsFound) {
      // Take screenshot of results
      await page.screenshot({ path: 'screenshots/03-generation-results.png', fullPage: true });

      // Check if descriptions were generated
      const descriptions = await page.$$eval('[class*="description"], [class*="variation"]', elements =>
        elements.map(el => el.textContent)
      );

      console.log(`Found ${descriptions.length} description variations`);

      // Test image generation
      console.log('Testing image generation...');

      // Look for image generation button
      const imageButtonSelectors = [
        'button:has-text("Generate Images")',
        '#generateImagesBtn',
        'button[onclick*="generateImages"]',
        '.generate-images-btn'
      ];

      let imageButtonClicked = false;
      for (const selector of imageButtonSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            await button.click();
            imageButtonClicked = true;
            console.log('Clicked image generation button');
            break;
          }
        } catch {
          continue;
        }
      }

      if (imageButtonClicked) {
        // Wait for image modal or results
        console.log('Waiting for images to generate...');

        try {
          await page.waitForSelector('img[src*="dalle"], img[src*="cloudinary"], .generated-image, [class*="image-result"]',
            { timeout: 45000 }
          );

          // Take screenshot of generated images
          await page.screenshot({ path: 'screenshots/04-generated-images.png', fullPage: true });

          // Count generated images
          const images = await page.$$('img[src*="dalle"], img[src*="cloudinary"], .generated-image');
          console.log(`Generated ${images.length} images`);

          // Verify image URLs
          const imageUrls = await page.$$eval('img[src*="dalle"], img[src*="cloudinary"], .generated-image',
            imgs => imgs.map(img => img.src)
          );

          console.log('Image URLs:', imageUrls);

          // Test download functionality if available
          const downloadButtons = await page.$$('button:has-text("Download"), a[download]');
          if (downloadButtons.length > 0) {
            console.log(`Found ${downloadButtons.length} download buttons`);
          }

        } catch (error) {
          console.log('Image generation timeout or error:', error.message);
          await page.screenshot({ path: 'screenshots/04-image-generation-error.png', fullPage: true });
        }
      }
    }
  });

  test('Test video generation feature', async ({ page }) => {
    console.log('Starting video generation test...');

    // Navigate to video generator if it exists
    await page.goto(`${BASE_URL}/video-generator.html`);

    // Check if page exists
    const response = await page.goto(`${BASE_URL}/video-generator.html`, { waitUntil: 'networkidle' });

    if (response.status() === 200) {
      console.log('Video generator page found');

      // Take screenshot
      await page.screenshot({ path: 'screenshots/05-video-generator.png', fullPage: true });

      // Fill in video generation form
      await page.fill('#productName, input[placeholder*="product"]', 'Smart Watch Pro');

      // Select avatar if available
      const avatarSelectors = await page.$$('.avatar-option, [class*="avatar"]');
      if (avatarSelectors.length > 0) {
        await avatarSelectors[0].click();
        console.log('Selected avatar');
      }

      // Select voice if available
      const voiceSelect = await page.$('#voice, select[name="voice"]');
      if (voiceSelect) {
        await page.selectOption(voiceSelect, { index: 1 });
        console.log('Selected voice');
      }

      // Fill script if needed
      const scriptField = await page.$('#script, textarea[name="script"]');
      if (scriptField) {
        await page.fill(scriptField, 'Introducing the Smart Watch Pro - your perfect companion for a healthier lifestyle.');
      }

      // Take screenshot of filled form
      await page.screenshot({ path: 'screenshots/06-video-form-filled.png', fullPage: true });

      // Click generate video button
      const generateVideoBtn = await page.$('button:has-text("Generate Video"), #generateVideoBtn');
      if (generateVideoBtn) {
        await generateVideoBtn.click();
        console.log('Clicked generate video button');

        // Wait for video generation (this can take a while)
        try {
          await page.waitForSelector('video, .video-player, [class*="video-result"]', { timeout: 60000 });

          // Take screenshot of video result
          await page.screenshot({ path: 'screenshots/07-video-generated.png', fullPage: true });

          console.log('Video generation completed');

          // Check for video URL
          const videoElement = await page.$('video');
          if (videoElement) {
            const videoSrc = await videoElement.getAttribute('src');
            console.log('Video URL:', videoSrc);
          }

        } catch (error) {
          console.log('Video generation timeout or error:', error.message);
          await page.screenshot({ path: 'screenshots/07-video-error.png', fullPage: true });
        }
      }
    } else {
      console.log('Video generator page not found, testing video in main app...');

      // Try to find video generation in main app
      await page.goto(`${BASE_URL}/app.html`);

      // Look for video generation option
      const videoOptions = await page.$$('button:has-text("Video"), [class*="video"]');
      if (videoOptions.length > 0) {
        console.log(`Found ${videoOptions.length} video-related elements`);
      }
    }
  });

  test('Test authentication and credits', async ({ page }) => {
    console.log('Testing authentication and credit system...');

    // Navigate to auth page
    await page.goto(`${BASE_URL}/auth.html`);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/08-auth-page.png', fullPage: true });

    // Check if login form exists
    const loginForm = await page.$('#loginForm, form[action*="login"]');
    if (loginForm) {
      console.log('Login form found');

      // Check for Google Sign-In button
      const googleButton = await page.$('.g_id_signin, #g_id_onload, button:has-text("Google")');
      if (googleButton) {
        console.log('Google Sign-In button found');
      }

      // Check for signup tab
      const signupTab = await page.$('#signupTab, button:has-text("Sign Up")');
      if (signupTab) {
        await signupTab.click();
        await page.screenshot({ path: 'screenshots/09-signup-form.png', fullPage: true });
        console.log('Signup form available');
      }
    }

    // Test navigation to dashboard
    await page.goto(`${BASE_URL}/dashboard.html`);
    const dashboardResponse = await page.goto(`${BASE_URL}/dashboard.html`, { waitUntil: 'networkidle' });

    if (dashboardResponse.status() === 200) {
      await page.screenshot({ path: 'screenshots/10-dashboard.png', fullPage: true });
      console.log('Dashboard page accessible');

      // Look for credit display
      const creditElements = await page.$$('[class*="credit"], [class*="usage"]');
      if (creditElements.length > 0) {
        console.log('Credit tracking elements found');
      }
    }
  });

  test('Performance and responsiveness check', async ({ page }) => {
    console.log('Testing performance and responsiveness...');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/app.html`);
    await page.screenshot({ path: 'screenshots/11-mobile-view.png', fullPage: true });

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.screenshot({ path: 'screenshots/12-tablet-view.png', fullPage: true });

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.screenshot({ path: 'screenshots/13-desktop-view.png', fullPage: true });

    // Check for service worker
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });

    console.log('Service Worker support:', hasServiceWorker);

    // Check page load metrics
    const metrics = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart
      };
    });

    console.log('Page load metrics:', metrics);
  });
});

// Run tests
console.log('Starting Playwright tests for ProductDescriptions.io...');
console.log('Base URL:', BASE_URL);
console.log('Screenshots will be saved to: tests/playwright/screenshots/');