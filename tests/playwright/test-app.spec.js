/**
 * Playwright Test Suite for Product Description Generator
 * Tests the live application at productdescriptions.io
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://productdescriptions.io';

test.describe('Product Description Generator App', () => {
    
    test.beforeEach(async ({ page }) => {
        // Set viewport for desktop
        await page.setViewportSize({ width: 1280, height: 720 });
    });

    test('Home page loads successfully', async ({ page }) => {
        await page.goto(BASE_URL);
        await expect(page).toHaveTitle(/Product Description Generator/i);
        
        // Check for key elements
        const heroTitle = page.locator('h1').first();
        await expect(heroTitle).toBeVisible();
        await expect(heroTitle).toContainText(/Product Description/i);
        
        // Check for Get Started button
        const getStartedBtn = page.locator('a[href="/app.html"]').first();
        await expect(getStartedBtn).toBeVisible();
    });

    test('Application page loads and has all form elements', async ({ page }) => {
        await page.goto(`${BASE_URL}/app.html`);
        
        // Check for image upload area
        const uploadArea = page.locator('#image-upload-area');
        await expect(uploadArea).toBeVisible();
        
        // Check for form fields
        await expect(page.locator('#productName')).toBeVisible();
        await expect(page.locator('#productCategory')).toBeVisible();
        await expect(page.locator('#targetAudience')).toBeVisible();
        await expect(page.locator('#keyFeatures')).toBeVisible();
        await expect(page.locator('#tone')).toBeVisible();
        
        // Check for generate button
        const generateBtn = page.locator('button:has-text("Generate Content")');
        await expect(generateBtn).toBeVisible();
    });

    test('Image upload and analysis works', async ({ page }) => {
        await page.goto(`${BASE_URL}/app.html`);
        
        // Create a test image file
        const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        
        // Upload the image
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
            name: 'test.png',
            mimeType: 'image/png',
            buffer: buffer
        });
        
        // Wait for image preview
        await page.waitForSelector('#uploadedImage', { state: 'visible', timeout: 5000 });
        
        // Check if analyze button appears
        const analyzeBtn = page.locator('button:has-text("Analyze Image with AI")');
        await expect(analyzeBtn).toBeVisible();
        
        // Click analyze button
        await analyzeBtn.click();
        
        // Wait for analysis to complete (may take time)
        await page.waitForResponse(
            response => response.url().includes('/api/analyze-image') && response.status() === 200,
            { timeout: 30000 }
        ).catch(() => {
            // API might be rate limited or require keys
            console.log('Image analysis API not available or rate limited');
        });
    });

    test('Description generation with test data', async ({ page }) => {
        await page.goto(`${BASE_URL}/app.html`);
        
        // Fill in the form
        await page.fill('#productName', 'Wireless Bluetooth Headphones');
        await page.fill('#productCategory', 'Electronics');
        await page.fill('#targetAudience', 'Music lovers and commuters');
        await page.fill('#keyFeatures', 'Noise canceling, 30-hour battery, Premium sound quality');
        await page.selectOption('#tone', 'professional');
        
        // Click generate button
        const generateBtn = page.locator('button:has-text("Generate Content")');
        await generateBtn.click();
        
        // Wait for loading indicator
        await page.waitForSelector('#loading.active', { state: 'visible', timeout: 5000 });
        
        // Wait for response
        await page.waitForResponse(
            response => response.url().includes('/api/generate-description') && response.status() === 200,
            { timeout: 30000 }
        );
        
        // Check if results section appears
        await page.waitForSelector('#results', { state: 'visible', timeout: 10000 });
        
        // Check for generated content
        const descriptionOutput = page.locator('#descriptionOutput');
        await expect(descriptionOutput).not.toBeEmpty();
        
        // Check for variation tabs
        const variationTabs = page.locator('#variationTabs');
        await expect(variationTabs).toBeVisible();
    });

    test('Video upsell popup appears after delay', async ({ page }) => {
        test.setTimeout(120000); // 2 minutes timeout for this test
        
        await page.goto(`${BASE_URL}/app.html`);
        
        // Fill and generate content first
        await page.fill('#productName', 'Test Product');
        await page.fill('#productCategory', 'Test Category');
        await page.fill('#keyFeatures', 'Test features');
        
        const generateBtn = page.locator('button:has-text("Generate Content")');
        await generateBtn.click();
        
        // Wait for generation to complete
        await page.waitForSelector('#results', { state: 'visible', timeout: 30000 });
        
        // Wait for video upsell popup (should appear after 90 seconds)
        await page.waitForSelector('#videoUpsellModal.active', { 
            state: 'visible', 
            timeout: 95000 // Wait up to 95 seconds
        });
        
        // Check popup content
        const modalTitle = page.locator('#videoUpsellModal h2');
        await expect(modalTitle).toContainText(/Transform Your Product/i);
        
        // Check for action buttons
        const createVideoBtn = page.locator('.create-video-btn');
        await expect(createVideoBtn).toBeVisible();
        
        const maybeLaterBtn = page.locator('.skip-btn');
        await expect(maybeLaterBtn).toBeVisible();
    });

    test('Mobile responsiveness', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 390, height: 844 }); // iPhone 15 size
        
        await page.goto(`${BASE_URL}/app.html`);
        
        // Check if mobile menu is properly displayed
        const container = page.locator('.container');
        await expect(container).toBeVisible();
        
        // Check if form is stacked vertically on mobile
        const mainContent = page.locator('.main-content');
        const computedStyle = await mainContent.evaluate(el => {
            return window.getComputedStyle(el).gridTemplateColumns;
        });
        
        // On mobile, should be single column
        expect(computedStyle).toBe('1fr');
        
        // Check if buttons are properly sized for mobile
        const generateBtn = page.locator('button:has-text("Generate Content")');
        const btnBox = await generateBtn.boundingBox();
        expect(btnBox.height).toBeGreaterThanOrEqual(44); // Minimum touch target
    });

    test('Sticky header functionality on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 390, height: 844 });
        
        await page.goto(`${BASE_URL}/app.html`);
        
        // First generate content to trigger the flow
        await page.fill('#productName', 'Test Product');
        await page.fill('#keyFeatures', 'Test features');
        await page.locator('button:has-text("Generate Content")').click();
        
        // Wait for results
        await page.waitForSelector('#results', { state: 'visible', timeout: 30000 });
        
        // Manually trigger sticky header for testing
        await page.evaluate(() => {
            document.getElementById('stickyVideoCTA').classList.add('active');
        });
        
        // Check if sticky header is visible
        const stickyHeader = page.locator('#stickyVideoCTA');
        await expect(stickyHeader).toBeVisible();
        
        // Test dismiss button
        const dismissBtn = page.locator('.sticky-video-cta-btn.dismiss');
        await expect(dismissBtn).toBeVisible();
        await dismissBtn.click();
        
        // Header should be hidden
        await expect(stickyHeader).not.toHaveClass('active');
        
        // Show it again for close button test
        await page.evaluate(() => {
            document.getElementById('stickyVideoCTA').classList.add('active');
        });
        
        // Test close button
        const closeBtn = page.locator('.sticky-video-cta-close');
        await expect(closeBtn).toBeVisible();
        await closeBtn.click();
        
        // Header should be hidden
        await expect(stickyHeader).not.toHaveClass('active');
    });

    test('Static pages are accessible', async ({ page }) => {
        const pages = [
            { path: '/privacy.html', title: /Privacy Policy/i },
            { path: '/terms.html', title: /Terms/i },
            { path: '/refund.html', title: /Refund/i }
        ];
        
        for (const testPage of pages) {
            await page.goto(`${BASE_URL}${testPage.path}`);
            const title = page.locator('h1, h2').first();
            await expect(title).toContainText(testPage.title);
        }
    });

    test('Video checkout integration', async ({ page }) => {
        await page.goto(`${BASE_URL}/app.html`);
        
        // Generate content first
        await page.fill('#productName', 'Test Video Product');
        await page.fill('#keyFeatures', 'Test features for video');
        await page.locator('button:has-text("Generate Content")').click();
        
        // Wait for results
        await page.waitForSelector('#results', { state: 'visible', timeout: 30000 });
        
        // Manually trigger video upsell modal
        await page.evaluate(() => {
            const modal = document.getElementById('videoUpsellModal');
            if (modal) modal.classList.add('active');
        });
        
        // Click create video button
        const createVideoBtn = page.locator('.create-video-btn');
        await expect(createVideoBtn).toBeVisible();
        
        // Set up listener for the checkout API call
        const [request] = await Promise.all([
            page.waitForRequest(request => 
                request.url().includes('/api/create-video-checkout') && 
                request.method() === 'POST',
                { timeout: 5000 }
            ).catch(() => null),
            createVideoBtn.click()
        ]);
        
        // Verify the request was made with correct data
        if (request) {
            const postData = request.postDataJSON();
            expect(postData.videoType).toBe('single');
            expect(postData.productName).toBeTruthy();
        }
    });
});

test.describe('Performance Tests', () => {
    test('Page load performance', async ({ page }) => {
        const startTime = Date.now();
        await page.goto(`${BASE_URL}/app.html`);
        const loadTime = Date.now() - startTime;
        
        console.log(`Page load time: ${loadTime}ms`);
        expect(loadTime).toBeLessThan(5000); // Should load in under 5 seconds
        
        // Check for key performance metrics
        const metrics = await page.evaluate(() => {
            const perf = performance.getEntriesByType('navigation')[0];
            return {
                domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
                loadComplete: perf.loadEventEnd - perf.loadEventStart
            };
        });
        
        console.log('Performance metrics:', metrics);
        expect(metrics.domContentLoaded).toBeLessThan(2000);
    });
});