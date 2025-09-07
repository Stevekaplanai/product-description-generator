# Fix Google OAuth Configuration

## Current Issue
Error 400: "The server cannot process the request because it is malformed"

## Root Cause
The OAuth client needs proper configuration of authorized origins and redirect URIs.

## OAuth Client Details
- **Client ID**: `33582369743-qn5tcsguqg16jo7ue7dlr4vg0e51d9io.apps.googleusercontent.com`
- **Project**: `rare-result-471417-k0` (product-description-generator)

## Required Configuration in Google Cloud Console

### 1. Authorized JavaScript Origins
Add ALL of these exactly as shown:
```
https://www.productdescriptions.io
https://productdescriptions.io
https://product-description-generator.vercel.app
http://localhost:3000
```

### 2. Authorized Redirect URIs
Add ALL of these exactly as shown:
```
https://www.productdescriptions.io/api/auth/google/callback
https://productdescriptions.io/api/auth/google/callback
https://product-description-generator.vercel.app/api/auth/google/callback
http://localhost:3000/api/auth/google/callback
```

## Steps to Fix

1. The browser should be open to the OAuth client configuration page
2. Click "ADD URI" under **Authorized JavaScript origins**
3. Add each origin from the list above
4. Click "ADD URI" under **Authorized redirect URIs**
5. Add each redirect URI from the list above
6. Click **SAVE** at the bottom

## Important Notes
- Make sure there are NO trailing slashes on the origins
- The URIs must match EXACTLY
- Both www and non-www versions are needed
- Save the configuration after adding all URIs

## Testing
After saving, test at: https://www.productdescriptions.io/auth.html
Click "Sign in with Google" - it should work now!