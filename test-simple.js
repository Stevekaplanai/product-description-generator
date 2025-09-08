const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3003';

async function testDirectAPI() {
  console.log('\n=== Testing Direct API Call ===');
  
  try {
    // Test the API directly without auth
    const response = await fetch(`${BASE_URL}/api/generate-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productName: 'Test Product',
        category: 'electronics',
        features: ['Feature 1', 'Feature 2'],
        targetAudience: 'Test users',
        generateImages: false
      })
    });
    
    console.log('API Response Status:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ API works:', {
        hasDescriptions: !!(data.descriptions || data.variations),
        descriptionCount: (data.descriptions || data.variations || []).length
      });
      return true;
    } else {
      const error = await response.text();
      console.error('❌ API failed:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ API request failed:', error.message);
    return false;
  }
}

async function testBasicFlow() {
  console.log('\n=== Testing Basic Page Load ===');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to app
    await page.goto(`${BASE_URL}/app.html`);
    await page.waitForTimeout(3000);
    
    // Check if form is visible
    const formVisible = await page.locator('#productName').isVisible();
    console.log('Form visible:', formVisible ? '✅' : '❌');
    
    if (formVisible) {
      // Fill basic form
      await page.fill('#productName', 'Simple Test');
      await page.selectOption('#category', 'electronics');
      await page.fill('#features', 'Test feature');
      await page.fill('#targetAudience', 'Everyone');
      
      console.log('✓ Form filled');
      
      // Check if generate button exists and is enabled
      const generateBtn = page.locator('#generateBtn');
      const btnExists = await generateBtn.count() > 0;
      const btnEnabled = btnExists && await generateBtn.isEnabled();
      
      console.log('Generate button exists:', btnExists ? '✅' : '❌');
      console.log('Generate button enabled:', btnEnabled ? '✅' : '❌');
      
      return btnExists && btnEnabled;
    }
    
    return false;
  } finally {
    await browser.close();
  }
}

async function runTests() {
  console.log('🚀 Starting Simple Tests\n');
  console.log(`Testing server at: ${BASE_URL}`);
  console.log('================================');
  
  const results = {
    api: false,
    ui: false
  };
  
  // Test API
  try {
    results.api = await testDirectAPI();
  } catch (error) {
    console.error('API test error:', error.message);
  }
  
  // Test UI
  try {
    results.ui = await testBasicFlow();
  } catch (error) {
    console.error('UI test error:', error.message);
  }
  
  // Summary
  console.log('\n================================');
  console.log('📊 Test Results Summary:');
  console.log('--------------------------------');
  console.log(`Direct API: ${results.api ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`UI Loading: ${results.ui ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('================================\n');
  
  const allPassed = Object.values(results).every(r => r);
  if (allPassed) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed.');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(console.error);