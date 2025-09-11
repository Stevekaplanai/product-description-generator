const { test, expect } = require('@playwright/test');

test.describe('Product Description Generator App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/app.html');
  });
  
  test('should load the application', async ({ page }) => {
    await expect(page).toHaveTitle(/AI Product Description Generator/);
    await expect(page.locator('h1')).toContainText('AI Product Generator');
  });
  
  test('should generate product description', async ({ page }) => {
    // Fill in product details
    await page.fill('#productName', 'Wireless Bluetooth Headphones');
    await page.selectOption('#category', 'electronics');
    await page.fill('#targetAudience', 'Music lovers and commuters');
    await page.fill('#features', 'Noise cancelling, 30-hour battery, comfortable fit');
    await page.selectOption('#tone', 'professional');
    
    // Click generate button
    await page.click('button:has-text("Generate Descriptions")');
    
    // Wait for results
    await page.waitForSelector('#resultsPanel .result-card', { timeout: 30000 });
    
    // Check that descriptions were generated
    const descriptions = await page.locator('.description-card').count();
    expect(descriptions).toBeGreaterThan(0);
  });
  
  test('should handle image upload', async ({ page }) => {
    // Upload an image
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-product.jpg');
    
    // Wait for image analysis
    await page.waitForSelector('.image-preview', { timeout: 10000 });
    
    // Check that fields were auto-populated
    const productName = await page.inputValue('#productName');
    expect(productName).not.toBe('');
  });
  
  test('should show video generation progress', async ({ page }) => {
    // Fill minimum required fields
    await page.fill('#videoProductName', 'Test Product');
    await page.fill('#videoScript', 'This is a test product video script');
    
    // Click generate video
    await page.click('button:has-text("Create Product Video")');
    
    // Check for progress indicator
    await expect(page.locator('.progress-container')).toBeVisible();
    await expect(page.locator('#statusText')).toContainText(/Processing|Initializing/);
    
    // Check for progress bar
    await expect(page.locator('#progressFill')).toBeVisible();
  });
  
  test('should toggle dark mode', async ({ page }) => {
    // Click dark mode toggle
    await page.click('.dark-mode-toggle');
    
    // Check that dark mode class is applied
    await expect(page.locator('body')).toHaveClass(/dark-mode/);
    
    // Toggle back
    await page.click('.dark-mode-toggle');
    await expect(page.locator('body')).not.toHaveClass(/dark-mode/);
  });
  
  test('should save draft automatically', async ({ page }) => {
    // Enter product details
    await page.fill('#productName', 'Draft Product Test');
    await page.fill('#targetAudience', 'Test Audience');
    
    // Wait for auto-save (5 seconds)
    await page.waitForTimeout(6000);
    
    // Reload page
    await page.reload();
    
    // Check if draft was restored
    const productName = await page.inputValue('#productName');
    expect(productName).toBe('Draft Product Test');
  });
  
  test('should display AI suggestions', async ({ page }) => {
    // Type in product name to trigger suggestions
    await page.fill('#productName', 'Organic');
    
    // Wait for suggestions
    await page.waitForSelector('#aiSuggestions.active', { timeout: 5000 });
    
    // Check that suggestions are displayed
    const suggestions = await page.locator('.suggestion-item').count();
    expect(suggestions).toBeGreaterThan(0);
  });
  
  test('should apply template', async ({ page }) => {
    // Open templates modal
    await page.click('button:has-text("Templates")');
    
    // Wait for modal
    await expect(page.locator('#templatesModal')).toHaveClass(/active/);
    
    // Select a template
    await page.click('.template-card[data-template="electronics"]');
    
    // Check that template was applied
    await expect(page.locator('.notification')).toContainText(/Template.*applied/);
  });
  
  test('should handle bulk upload', async ({ page }) => {
    // Navigate to bulk page
    await page.goto('http://localhost:3000/bulk.html');
    
    // Upload CSV file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-bulk.csv');
    
    // Check that file was loaded
    await expect(page.locator('.file-info')).toContainText(/products loaded/);
    
    // Click process button
    await page.click('button:has-text("Process")');
    
    // Wait for processing to start
    await expect(page.locator('.processing-status')).toBeVisible();
  });
  
  test('should display analytics', async ({ page }) => {
    // Click analytics button
    await page.click('button:has-text("Analytics")');
    
    // Check that analytics panel is visible
    await expect(page.locator('#analyticsPanel')).toHaveClass(/active/);
    
    // Check for metrics
    await expect(page.locator('#totalGenerations')).toBeVisible();
    await expect(page.locator('#seoScore')).toBeVisible();
    await expect(page.locator('#readabilityScore')).toBeVisible();
  });
});

test.describe('Admin Dashboard', () => {
  test('should require authentication', async ({ page }) => {
    await page.goto('http://localhost:3000/admin.html');
    
    // Should prompt for password
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('prompt');
      expect(dialog.message()).toContain('admin password');
      await dialog.accept('admin2025');
    });
    
    // After auth, should show dashboard
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
  
  test('should display stats cards', async ({ page }) => {
    // Authenticate first
    await page.goto('http://localhost:3000/admin.html?token=test');
    
    // Check for stats cards
    await expect(page.locator('.stat-card')).toHaveCount(4);
    await expect(page.locator('#totalGenerations')).toBeVisible();
    await expect(page.locator('#activeUsers')).toBeVisible();
    await expect(page.locator('#videosCreated')).toBeVisible();
    await expect(page.locator('#revenue')).toBeVisible();
  });
  
  test('should show real-time activity', async ({ page }) => {
    await page.goto('http://localhost:3000/admin.html?token=test');
    
    // Check for activity feed
    await expect(page.locator('#activityFeed')).toBeVisible();
    
    // Wait for activity items
    await page.waitForSelector('.activity-item', { timeout: 10000 });
    
    const activities = await page.locator('.activity-item').count();
    expect(activities).toBeGreaterThan(0);
  });
  
  test('should switch between sections', async ({ page }) => {
    await page.goto('http://localhost:3000/admin.html?token=test');
    
    // Click on Users section
    await page.click('.nav-item:has-text("Users")');
    
    // Check that users section is visible
    await expect(page.locator('#users-section')).toBeVisible();
    await expect(page.locator('#overview-section')).not.toBeVisible();
    
    // Switch back to overview
    await page.click('.nav-item:has-text("Overview")');
    await expect(page.locator('#overview-section')).toBeVisible();
  });
});