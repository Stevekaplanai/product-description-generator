/**
 * Automated Google OAuth Setup
 * Opens the browser to the right pages to set up Google OAuth
 */

const { exec } = require('child_process');
const fs = require('fs');

console.log('\n🔐 Automated Google OAuth Setup for ProductDescriptions.io\n');

// Sample Client ID for testing (you'll need to replace this)
const SAMPLE_CLIENT_ID = '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com';

console.log('📝 Opening Google Cloud Console to create OAuth credentials...\n');

// Open the OAuth credentials page
exec('start https://console.cloud.google.com/apis/credentials');

console.log('Follow these steps in the browser:\n');
console.log('1. Click "CREATE CREDENTIALS" > "OAuth client ID"');
console.log('2. Select "Web application"');
console.log('3. Name it: ProductDescriptions.io');
console.log('4. Add these Authorized JavaScript origins:');
console.log('   - http://localhost:3000');
console.log('   - https://product-description-generator.vercel.app');
console.log('   - https://productdescriptions.io');
console.log('   - https://www.productdescriptions.io\n');
console.log('5. Click CREATE and copy the Client ID\n');

// For now, let's use a test client ID to set up the environment
console.log('⚠️  Using a placeholder Client ID for now. You MUST replace this with your actual Client ID.\n');

// Add to Vercel using their CLI
console.log('📦 Setting up Vercel environment variable...\n');
exec('vercel env add GOOGLE_CLIENT_ID production', (error, stdout, stderr) => {
  if (!error) {
    console.log('✅ Vercel env command started. Paste your actual Client ID when prompted.\n');
  } else {
    console.log('❌ Could not run vercel command. Add manually with:');
    console.log('   vercel env add GOOGLE_CLIENT_ID production\n');
  }
});

// Create a temporary env file with instructions
const envContent = `# Google OAuth Configuration
# Replace this with your actual Client ID from Google Cloud Console
GOOGLE_CLIENT_ID=${SAMPLE_CLIENT_ID}

# To get your Client ID:
# 1. Go to https://console.cloud.google.com/apis/credentials
# 2. Create an OAuth 2.0 Client ID
# 3. Add the authorized origins and redirect URIs listed above
# 4. Copy the Client ID and replace the value above
`;

fs.writeFileSync('.env.production', envContent);
console.log('✅ Created .env.production with placeholder - UPDATE WITH YOUR ACTUAL CLIENT ID\n');

console.log('📋 Next Steps:');
console.log('1. Get your Client ID from the Google Cloud Console');
console.log('2. Run: vercel env add GOOGLE_CLIENT_ID production');
console.log('3. Paste your Client ID when prompted');
console.log('4. Deploy: vercel --prod\n');

console.log('🌐 Opening OAuth consent screen configuration...');
exec('start https://console.cloud.google.com/apis/credentials/consent');

process.exit(0);