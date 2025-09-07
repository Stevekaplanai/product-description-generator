# Google OAuth Setup Instructions

## Quick Setup Steps

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select or create a project

2. **Enable Google Sign-In API**
   - Go to APIs & Services > Library
   - Search for "Google+ API" or "Google Identity Platform"
   - Click Enable

3. **Create OAuth 2.0 Credentials**
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Name: "ProductDescriptions.io"

4. **Configure OAuth Settings**
   - **Authorized JavaScript origins:**
     - http://localhost:3000
     - https://product-description-generator.vercel.app
     - https://productdescriptions.io (if custom domain)
   
   - **Authorized redirect URIs:**
     - http://localhost:3000/api/auth/google/callback
     - https://product-description-generator.vercel.app/api/auth/google/callback
     - https://productdescriptions.io/api/auth/google/callback (if custom domain)

5. **Copy Client ID**
   - After creating, copy the Client ID
   - It will look like: `xxxxxxxxxxxxx.apps.googleusercontent.com`

6. **Add to Vercel Environment Variables**
   ```bash
   vercel env add GOOGLE_CLIENT_ID production
   ```
   Then paste your Client ID when prompted

7. **Configure OAuth Consent Screen**
   - Go to APIs & Services > OAuth consent screen
   - Choose "External" user type
   - Fill in:
     - App name: ProductDescriptions.io
     - User support email: Your email
     - App logo: Upload if available
     - Application home page: https://product-description-generator.vercel.app
     - Privacy policy: https://product-description-generator.vercel.app/privacy.html
     - Terms of service: https://product-description-generator.vercel.app/terms.html
   - Add scopes: email, profile, openid
   - Add test users if in testing mode

## Testing
After setup, visit your app and test the "Sign in with Google" button.

## Troubleshooting
- If you see "redirect_uri_mismatch", check that your redirect URIs match exactly
- If login fails, check browser console for errors
- Ensure GOOGLE_CLIENT_ID is set in Vercel environment variables