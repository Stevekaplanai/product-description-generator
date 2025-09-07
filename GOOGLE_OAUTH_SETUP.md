# Google OAuth Setup for ProductDescriptions.io

## Project Configuration
- **Google Cloud Project**: gen-lang-client-0539106581 (Gemini API)
- **Account**: steve@gtmvp.com

## OAuth Client Configuration

The browser should be open to create the OAuth client. Configure it as follows:

### Application Type
Select: **Web application**

### Name
`ProductDescriptions.io`

### Authorized JavaScript Origins
Add ALL of these origins:
```
http://localhost:3000
https://product-description-generator.vercel.app
https://productdescriptions.io
https://www.productdescriptions.io
```

### Authorized Redirect URIs  
Add ALL of these URIs:
```
http://localhost:3000/api/auth/google/callback
https://product-description-generator.vercel.app/api/auth/google/callback
https://productdescriptions.io/api/auth/google/callback
https://www.productdescriptions.io/api/auth/google/callback
```

## After Creating the OAuth Client

1. **Copy the Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)

2. **Add to Vercel Environment Variables**:
   ```bash
   vercel env add GOOGLE_CLIENT_ID production
   ```
   Then paste your Client ID when prompted

3. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

## OAuth Consent Screen Configuration

If not already configured, set up the OAuth consent screen:

1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=gen-lang-client-0539106581
2. User Type: **External**
3. App Information:
   - App name: `ProductDescriptions.io`
   - User support email: `steve@gtmvp.com`
   - App domain: `https://productdescriptions.io`
4. Developer contact: `steve@gtmvp.com`
5. Scopes: Add these scopes:
   - `email`
   - `profile`
   - `openid`

## Testing

After setup:
1. Visit https://www.productdescriptions.io/auth.html
2. Click "Sign in with Google"
3. Should redirect to Google OAuth and back to your app

## Troubleshooting

- If you see "redirect_uri_mismatch": Double-check all URIs match exactly
- If you see "client_id not found": Ensure GOOGLE_CLIENT_ID is set in Vercel
- Check browser console for detailed error messages