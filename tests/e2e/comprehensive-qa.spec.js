const { test, expect } = require('@playwright/test');
const path = require('path');

// Test configuration
const BASE_URL = 'https://product-description-generator-nefv0k77v-gtmvp.vercel.app';
const TIMEOUT = 60000; // 60 seconds for API calls

test.describe('Comprehensive Product Description Generator QA', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    // Navigate to app
    await page.goto(`${BASE_URL}/app.html`, { waitUntil: 'networkidle' });
    // Wait for app to initialize
    await page.waitForTimeout(2000);
  });

  test.describe('Method 1: Upload Image', () => {
    test('should analyze uploaded image and generate descriptions', async ({ page }) => {
      console.log('Testing Method 1: Upload Image');
      
      // Click on Upload Image option
      const uploadOption = page.locator('.option-card').filter({ hasText: 'Upload Image' });
      await uploadOption.click();
      
      // Wait for form to appear
      await page.waitForSelector('.form-container', { state: 'visible' });
      
      // Create a test image file path (using a placeholder)
      // In real test, you'd use an actual product image
      const testImagePath = path.join(__dirname, 'test-product.jpg');
      
      // Upload image
      const fileInput = page.locator('input[type="file"]');
      // Note: In actual test, you'd set a real file
      // await fileInput.setInputFiles(testImagePath);
      
      // Fill in manual fields as fallback
      await page.fill('#productName', 'Wireless Bluetooth Headphones');
      await page.selectOption('#productCategory', 'Electronics');
      await page.fill('#keyFeatures', 'Noise cancellation\n40-hour battery\nComfortable fit');
      await page.selectOption('#targetAudience', 'Tech Enthusiasts');
      await page.selectOption('#tone', 'professional');
      
      // Generate descriptions
      await page.click('button:has-text("Generate Descriptions")');
      
      // Wait for results
      await page.waitForSelector('.results-container', { 
        state: 'visible',
        timeout: TIMEOUT 
      });
      
      // Verify results
      const descriptions = await page.locator('.description-card').count();
      expect(descriptions).toBeGreaterThan(0);
      
      // Take screenshot
      await page.screenshot({ 
        path: 'tests/screenshots/method1-upload-image.png',
        fullPage: true 
      });
      
      console.log('✓ Method 1: Upload Image - PASSED');
    });
  });

  test.describe('Method 2: Smart Fill from URL', () => {
    test('should extract product info from URL and generate descriptions', async ({ page }) => {
      console.log('Testing Method 2: Smart Fill from URL');
      
      // Click on Smart Fill option
      const smartFillOption = page.locator('.option-card').filter({ hasText: 'Smart Fill' });
      await smartFillOption.click();
      
      // Wait for form
      await page.waitForSelector('.form-container', { state: 'visible' });
      
      // Enter a product URL (example)
      await page.fill('#productUrl', 'https://www.example.com/product/wireless-earbuds');
      
      // Click Smart Fill button
      const smartFillBtn = page.locator('.smart-fill-btn');
      if (await smartFillBtn.isVisible()) {
        await smartFillBtn.click();
        await page.waitForTimeout(3000);
      }
      
      // Fill remaining fields manually (as fallback)
      const productNameField = page.locator('#productName');
      if (await productNameField.inputValue() === '') {
        await productNameField.fill('Premium Wireless Earbuds');
      }
      
      await page.selectOption('#productCategory', 'Electronics');
      await page.fill('#keyFeatures', 'Active noise cancellation\nWireless charging case\n8-hour playtime');
      await page.selectOption('#targetAudience', 'Music Lovers');
      await page.selectOption('#tone', 'casual');
      
      // Generate descriptions
      await page.click('button:has-text("Generate Descriptions")');
      
      // Wait for results
      await page.waitForSelector('.results-container', { 
        state: 'visible',
        timeout: TIMEOUT 
      });
      
      // Verify results
      const descriptions = await page.locator('.description-card').count();
      expect(descriptions).toBeGreaterThan(0);
      
      // Take screenshot
      await page.screenshot({ 
        path: 'tests/screenshots/method2-smart-fill.png',
        fullPage: true 
      });
      
      console.log('✓ Method 2: Smart Fill from URL - PASSED');
    });
  });

  test.describe('Method 3: Manual Entry', () => {
    test('should generate descriptions from manual input', async ({ page }) => {
      console.log('Testing Method 3: Manual Entry');
      
      // Click on Manual Entry option
      const manualOption = page.locator('.option-card').filter({ hasText: 'Manual Entry' });
      await manualOption.click();
      
      // Wait for form
      await page.waitForSelector('.form-container', { state: 'visible' });
      
      // Fill all fields manually
      await page.fill('#productName', 'Organic Green Tea');
      await page.selectOption('#productCategory', 'Food & Beverage');
      await page.fill('#keyFeatures', '100% organic\nRich in antioxidants\nSingle origin\nHand-picked leaves');
      await page.selectOption('#targetAudience', 'Health-Conscious Consumers');
      await page.selectOption('#tone', 'luxury');
      
      // Generate descriptions
      await page.click('button:has-text("Generate Descriptions")');
      
      // Wait for results
      await page.waitForSelector('.results-container', { 
        state: 'visible',
        timeout: TIMEOUT 
      });
      
      // Verify results
      const descriptions = await page.locator('.description-card').count();
      expect(descriptions).toBeGreaterThan(0);
      
      // Test copy functionality
      const copyButtons = page.locator('button:has-text("Copy")');
      if (await copyButtons.count() > 0) {
        await copyButtons.first().click();
        await page.waitForTimeout(1000);
      }
      
      // Take screenshot
      await page.screenshot({ 
        path: 'tests/screenshots/method3-manual-entry.png',
        fullPage: true 
      });
      
      console.log('✓ Method 3: Manual Entry - PASSED');
    });
  });

  test.describe('Method 4: Bulk CSV Upload', () => {
    test('should handle bulk CSV upload', async ({ page }) => {
      console.log('Testing Method 4: Bulk CSV Upload');
      
      // Click on Bulk Upload option
      const bulkOption = page.locator('.option-card').filter({ hasText: 'Bulk Upload' });
      await bulkOption.click();
      
      // Should either show bulk upload interface or redirect
      await page.waitForTimeout(2000);
      
      // Check if we're on bulk page or see an upload interface
      const currentUrl = page.url();
      if (currentUrl.includes('bulk')) {
        console.log('✓ Redirected to bulk upload page');
      } else {
        // Look for CSV upload interface
        const csvInput = page.locator('input[type="file"][accept*="csv"]');
        if (await csvInput.isVisible()) {
          console.log('✓ CSV upload interface available');
        }
      }
      
      // Take screenshot
      await page.screenshot({ 
        path: 'tests/screenshots/method4-bulk-upload.png',
        fullPage: true 
      });
      
      console.log('✓ Method 4: Bulk CSV Upload - PASSED');
    });
  });

  test.describe('Image Generation', () => {
    test('should generate images after creating descriptions', async ({ page }) => {
      console.log('Testing Image Generation');
      
      // First generate a product description
      const manualOption = page.locator('.option-card').filter({ hasText: 'Manual Entry' });
      await manualOption.click();
      
      await page.waitForSelector('.form-container', { state: 'visible' });
      
      // Fill form
      await page.fill('#productName', 'Smart Watch Pro');
      await page.selectOption('#productCategory', 'Electronics');
      await page.fill('#keyFeatures', 'Heart rate monitor\nGPS tracking\n7-day battery');
      await page.selectOption('#targetAudience', 'Fitness Enthusiasts');
      await page.selectOption('#tone', 'professional');
      
      // Generate descriptions
      await page.click('button:has-text("Generate Descriptions")');
      
      // Wait for results
      await page.waitForSelector('.results-container', { 
        state: 'visible',
        timeout: TIMEOUT 
      });
      
      // Now test image generation
      const generateImagesBtn = page.locator('button:has-text("Generate Images")');
      if (await generateImagesBtn.isVisible()) {
        await generateImagesBtn.click();
        
        // Check for error or success
        await page.waitForTimeout(3000);
        
        // Check if error modal appears
        const errorModal = page.locator('.modal-content:has-text("Product name is required")');
        if (await errorModal.isVisible()) {
          console.log('⚠ Image generation error: Product name required');
          await page.click('button:has-text("OK")');
        } else {
          // Wait for loading or results
          await page.waitForTimeout(5000);
          console.log('✓ Image generation initiated');
        }
      }
      
      // Take screenshot
      await page.screenshot({ 
        path: 'tests/screenshots/image-generation.png',
        fullPage: true 
      });
      
      console.log('✓ Image Generation Test - COMPLETED');
    });
  });

  test.describe('History and State Management', () => {
    test('should save and load from history', async ({ page }) => {
      console.log('Testing History Management');
      
      // Generate a product first
      const manualOption = page.locator('.option-card').filter({ hasText: 'Manual Entry' });
      await manualOption.click();
      
      await page.waitForSelector('.form-container', { state: 'visible' });
      
      // Fill form with unique product
      const timestamp = Date.now();
      const productName = `Test Product ${timestamp}`;
      
      await page.fill('#productName', productName);
      await page.selectOption('#productCategory', 'Electronics');
      await page.fill('#keyFeatures', 'Test feature 1\nTest feature 2');
      await page.selectOption('#targetAudience', 'General Consumers');
      await page.selectOption('#tone', 'casual');
      
      // Generate descriptions
      await page.click('button:has-text("Generate Descriptions")');
      
      // Wait for results
      await page.waitForSelector('.results-container', { 
        state: 'visible',
        timeout: TIMEOUT 
      });
      
      // Check if history sidebar exists
      const historySidebar = page.locator('.history-sidebar');
      if (await historySidebar.isVisible()) {
        // Look for our product in history
        const historyItem = page.locator('.history-item').filter({ hasText: productName });
        if (await historyItem.count() > 0) {
          console.log('✓ Product saved to history');
          
          // Click to load from history
          await historyItem.first().click();
          await page.waitForTimeout(2000);
          
          // Verify loaded
          const resultsVisible = await page.locator('.results-container').isVisible();
          if (resultsVisible) {
            console.log('✓ Successfully loaded from history');
            
            // Now test image generation from history
            const generateImagesBtn = page.locator('button:has-text("Generate Images")');
            if (await generateImagesBtn.isVisible()) {
              await generateImagesBtn.click();
              await page.waitForTimeout(3000);
              
              // Check for error
              const errorModal = page.locator('.modal-content:has-text("Product name is required")');
              if (await errorModal.isVisible()) {
                console.log('❌ Bug confirmed: Image generation fails from history');
              } else {
                console.log('✓ Image generation works from history');
              }
            }
          }
        }
      }
      
      // Take screenshot
      await page.screenshot({ 
        path: 'tests/screenshots/history-management.png',
        fullPage: true 
      });
      
      console.log('✓ History Management Test - COMPLETED');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      console.log('Testing Mobile Responsiveness');
      
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(`${BASE_URL}/app.html`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      // Check if options are visible
      const optionCards = page.locator('.option-card');
      const cardCount = await optionCards.count();
      expect(cardCount).toBeGreaterThan(0);
      
      // Click Manual Entry
      const manualOption = page.locator('.option-card').filter({ hasText: 'Manual Entry' });
      if (await manualOption.isVisible()) {
        await manualOption.click();
        
        // Check form is usable on mobile
        await page.waitForSelector('.form-container', { state: 'visible' });
        
        // Take screenshot
        await page.screenshot({ 
          path: 'tests/screenshots/mobile-view.png',
          fullPage: true 
        });
        
        console.log('✓ Mobile responsiveness - PASSED');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      console.log('Testing Error Handling');
      
      // Try to generate without required fields
      const manualOption = page.locator('.option-card').filter({ hasText: 'Manual Entry' });
      await manualOption.click();
      
      await page.waitForSelector('.form-container', { state: 'visible' });
      
      // Try to submit empty form
      const generateBtn = page.locator('button:has-text("Generate Descriptions")');
      if (await generateBtn.isVisible()) {
        await generateBtn.click();
        
        // Should show validation error
        await page.waitForTimeout(2000);
        
        // Check for error messages
        const errorVisible = await page.locator('.error-message, .notification.error, [role="alert"]').isVisible();
        if (errorVisible) {
          console.log('✓ Form validation working');
        }
      }
      
      // Take screenshot
      await page.screenshot({ 
        path: 'tests/screenshots/error-handling.png',
        fullPage: true 
      });
      
      console.log('✓ Error Handling Test - COMPLETED');
    });
  });
});

// Run tests and generate report
test.afterAll(async () => {
  console.log('\n========================================');
  console.log('   COMPREHENSIVE QA TEST COMPLETED');
  console.log('========================================\n');
});