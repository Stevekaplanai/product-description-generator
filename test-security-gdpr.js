#!/usr/bin/env node

const fetch = require('node-fetch');
const crypto = require('crypto');

const BASE_URL = process.env.API_URL || 'http://localhost:3007';

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, endpoint, body = null, headers = {}) {
  try {
    log(`\nTesting: ${name}`, 'blue');
    log(`Endpoint: ${method} ${endpoint}`, 'yellow');
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseHeaders = {};
    // Convert headers to lowercase for case-insensitive comparison
    response.headers.forEach((value, key) => {
      responseHeaders[key.toLowerCase()] = value;
    });
    
    // Check security headers
    const securityHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'x-xss-protection': '1; mode=block',
      'strict-transport-security': true,
      'content-security-policy': true
    };
    
    let headersOk = true;
    for (const [header, expected] of Object.entries(securityHeaders)) {
      const headerLower = header.toLowerCase();
      if (expected === true) {
        if (!responseHeaders[headerLower]) {
          log(`  ❌ Missing header: ${header}`, 'red');
          headersOk = false;
        } else {
          log(`  ✅ Has header: ${header}`, 'green');
        }
      } else if (responseHeaders[headerLower] !== expected) {
        log(`  ❌ Invalid ${header}: Expected "${expected}", got "${responseHeaders[headerLower]}"`, 'red');
        headersOk = false;
      } else {
        log(`  ✅ Correct ${header}: ${expected}`, 'green');
      }
    }
    
    const data = await response.text();
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }
    
    if (response.ok) {
      log(`✅ Success: ${response.status}`, 'green');
      return { success: true, data: jsonData, headers: responseHeaders, headersOk };
    } else {
      log(`❌ Failed: ${response.status}`, 'red');
      return { success: false, error: jsonData, headers: responseHeaders, headersOk };
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runSecurityTests() {
  log('\n🔒 Starting Security & GDPR Compliance Test Suite', 'magenta');
  log('=' .repeat(60), 'magenta');
  
  const results = [];
  
  // 1. Test Input Sanitization
  log('\n📝 Testing Input Sanitization', 'blue');
  results.push(await testEndpoint(
    'XSS Attack Prevention',
    'POST',
    '/api/generate-description',
    {
      productName: '<script>alert("XSS")</script>',
      category: 'electronics',
      features: 'SELECT * FROM users; DROP TABLE users;--',
      targetAudience: '<img src=x onerror=alert("XSS")>',
      tone: 'professional'
    }
  ));
  
  // 2. Test Rate Limiting
  log('\n⏱️ Testing Rate Limiting', 'blue');
  const rateLimitTests = [];
  for (let i = 0; i < 12; i++) {
    rateLimitTests.push(testEndpoint(
      `Rate Limit Test ${i + 1}`,
      'POST',
      '/api/generate-description',
      {
        productName: `Test Product ${i}`,
        category: 'test',
        features: 'test features',
        targetAudience: 'testers',
        tone: 'professional'
      }
    ));
  }
  
  const rateLimitResults = await Promise.all(rateLimitTests);
  const blocked = rateLimitResults.filter(r => !r.success && r.error?.error === 'Too many requests');
  log(`Rate limiting: ${blocked.length > 0 ? '✅ Working' : '❌ Not working'} (${blocked.length}/12 blocked)`, 
      blocked.length > 0 ? 'green' : 'red');
  
  // 3. Test GDPR Consent Management
  log('\n🍪 Testing GDPR Consent Management', 'blue');
  
  // Get current consent
  results.push(await testEndpoint(
    'Get Consent Status',
    'GET',
    '/api/gdpr/consent-management',
    null,
    { 'x-session-id': 'test-session-123' }
  ));
  
  // Update consent
  results.push(await testEndpoint(
    'Update Consent Preferences',
    'POST',
    '/api/gdpr/consent-management',
    {
      consent: {
        essential: true,
        analytics: false,
        marketing: false,
        personalization: true,
        thirdParty: false
      }
    },
    { 'x-session-id': 'test-session-123' }
  ));
  
  // Withdraw consent
  results.push(await testEndpoint(
    'Withdraw Consent',
    'DELETE',
    '/api/gdpr/consent-management',
    null,
    { 'x-session-id': 'test-session-123' }
  ));
  
  // 4. Test Data Export (requires auth)
  log('\n📤 Testing GDPR Data Export', 'blue');
  
  // Create a test JWT token
  const jwt = require('jsonwebtoken');
  const testToken = jwt.sign(
    { userId: 'test-user-123' },
    process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
    { expiresIn: '1h' }
  );
  
  results.push(await testEndpoint(
    'Export User Data',
    'GET',
    '/api/gdpr/export-data',
    null,
    { 'Authorization': `Bearer ${testToken}` }
  ));
  
  // 5. Test Data Deletion
  log('\n🗑️ Testing GDPR Data Deletion', 'blue');
  
  // Test without confirmation
  results.push(await testEndpoint(
    'Delete Data Without Confirmation',
    'POST',
    '/api/gdpr/delete-data',
    { immediate: false },
    { 'Authorization': `Bearer ${testToken}` }
  ));
  
  // Test with confirmation
  results.push(await testEndpoint(
    'Delete Data With Confirmation',
    'POST',
    '/api/gdpr/delete-data',
    { 
      immediate: false,
      confirmation: 'DELETE_MY_DATA',
      reason: 'Testing GDPR compliance'
    },
    { 'Authorization': `Bearer ${testToken}` }
  ));
  
  // 6. Test Input Length Validation
  log('\n📏 Testing Input Length Validation', 'blue');
  
  const longString = 'a'.repeat(6000);
  results.push(await testEndpoint(
    'Input Length Validation',
    'POST',
    '/api/generate-description',
    {
      productName: longString.slice(0, 300), // Too long
      category: 'test',
      features: longString, // Way too long
      targetAudience: 'test',
      tone: 'professional'
    }
  ));
  
  // 7. Test CORS Headers
  log('\n🌐 Testing CORS Configuration', 'blue');
  
  results.push(await testEndpoint(
    'CORS Preflight',
    'OPTIONS',
    '/api/generate-description'
  ));
  
  // Summary
  log('\n' + '=' .repeat(60), 'magenta');
  log('📊 Security Test Summary', 'magenta');
  log('=' .repeat(60), 'magenta');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const secureHeaders = results.filter(r => r.headersOk).length;
  
  log(`Total Tests: ${results.length}`, 'yellow');
  log(`✅ Successful: ${successful}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  log(`🔒 Secure Headers: ${secureHeaders}/${results.length}`, secureHeaders === results.length ? 'green' : 'yellow');
  
  // GDPR Compliance Checklist
  log('\n📋 GDPR Compliance Checklist:', 'blue');
  const gdprChecklist = {
    'Data Export (Article 20)': results.find(r => r.data?.dataPortability)?.success ? '✅' : '❌',
    'Data Deletion (Article 17)': results.find(r => r.data?.gdprCompliant && r.data?.deletionRecord)?.success ? '✅' : '❌',
    'Consent Management (Article 7)': results.find(r => r.data?.consentTypes)?.success ? '✅' : '❌',
    'Data Protection': secureHeaders === results.length ? '✅' : '❌',
    'Rate Limiting': blocked.length > 0 ? '✅' : '❌',
    'Input Sanitization': results[0]?.success ? '✅' : '❌'
  };
  
  for (const [feature, status] of Object.entries(gdprChecklist)) {
    log(`  ${status} ${feature}`, status === '✅' ? 'green' : 'red');
  }
  
  // Security Score
  const score = Object.values(gdprChecklist).filter(v => v === '✅').length;
  const maxScore = Object.keys(gdprChecklist).length;
  const percentage = Math.round((score / maxScore) * 100);
  
  log(`\n🏆 Security Score: ${score}/${maxScore} (${percentage}%)`, percentage >= 80 ? 'green' : percentage >= 60 ? 'yellow' : 'red');
  
  if (percentage >= 80) {
    log('🎉 Excellent security and GDPR compliance!', 'green');
  } else if (percentage >= 60) {
    log('⚠️ Good progress, but some improvements needed', 'yellow');
  } else {
    log('❌ Significant security improvements required', 'red');
  }
}

// Run the tests
runSecurityTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});