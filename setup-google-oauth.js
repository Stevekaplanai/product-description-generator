/**
 * Google OAuth Setup Helper Script
 * Since gcloud CLI is not accessible, this script helps set up Google OAuth
 */

const readline = require('readline');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔐 Google OAuth Setup for ProductDescriptions.io\n');
console.log('Since gcloud CLI is not available, please follow these steps:\n');

console.log('1. Open Google Cloud Console:');
console.log('   https://console.cloud.google.com/\n');

console.log('2. Create or select a project\n');

console.log('3. Enable Google Identity API:');
console.log('   https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com\n');

console.log('4. Create OAuth 2.0 Credentials:');
console.log('   https://console.cloud.google.com/apis/credentials\n');
console.log('   - Click "Create Credentials" > "OAuth client ID"');
console.log('   - Application type: Web application');
console.log('   - Name: ProductDescriptions.io\n');

console.log('5. Add Authorized JavaScript origins:');
console.log('   - http://localhost:3000');
console.log('   - https://product-description-generator.vercel.app');
console.log('   - https://productdescriptions.io');
console.log('   - https://www.productdescriptions.io\n');

console.log('6. Add Authorized redirect URIs:');
console.log('   - http://localhost:3000/api/auth/google/callback');
console.log('   - https://product-description-generator.vercel.app/api/auth/google/callback');
console.log('   - https://productdescriptions.io/api/auth/google/callback');
console.log('   - https://www.productdescriptions.io/api/auth/google/callback\n');

console.log('7. Configure OAuth consent screen:');
console.log('   - User Type: External');
console.log('   - App name: ProductDescriptions.io');
console.log('   - User support email: Your email');
console.log('   - Developer contact: Your email');
console.log('   - Scopes: email, profile, openid\n');

rl.question('Once created, paste your Google Client ID here: ', (clientId) => {
  if (!clientId || !clientId.includes('.apps.googleusercontent.com')) {
    console.log('❌ Invalid Client ID format');
    rl.close();
    return;
  }

  console.log('\n✅ Client ID received:', clientId);
  console.log('\n📝 Adding to Vercel environment variables...\n');

  // Add to Vercel
  exec(`vercel env add GOOGLE_CLIENT_ID production`, (error, stdout, stderr) => {
    if (error) {
      console.log('Please run this command manually:');
      console.log(`vercel env add GOOGLE_CLIENT_ID production`);
      console.log(`Then paste: ${clientId}`);
    } else {
      console.log('Vercel command started. Paste the Client ID when prompted.');
    }
  });

  // Create local .env file
  const fs = require('fs');
  const envContent = `GOOGLE_CLIENT_ID=${clientId}\n`;
  
  fs.appendFileSync('.env.local', envContent);
  console.log('\n✅ Added to .env.local for local testing');

  console.log('\n🎉 Setup complete! Next steps:');
  console.log('1. Deploy to Vercel: vercel --prod');
  console.log('2. Test Google Sign-In on your site');
  
  rl.close();
});