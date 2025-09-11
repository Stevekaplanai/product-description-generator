# D-ID API Support Request - 500 Server Errors

## Account Information
- **Account Type**: API Usage Plan (Paid)
- **Issue**: Consistent 500 Internal Server Errors when calling the /talks endpoint
- **API Endpoint**: https://api.d-id.com/talks
- **Application**: Product Description Generator (https://productdescriptions.io)

## Issue Description
We are experiencing consistent 500 Internal Server Errors when attempting to create talk videos via the D-ID API. The errors occur on every request to the `/talks` endpoint, preventing our video generation feature from functioning.

## Error Details

### Request Configuration
```javascript
POST https://api.d-id.com/talks
Headers:
{
  'Authorization': 'Basic [base64_encoded_api_key]',
  'Content-Type': 'application/json',
  'accept': 'application/json'
}

Body:
{
  "script": {
    "type": "text",
    "input": "Script text here (limited to 200 chars)",
    "provider": {
      "type": "microsoft",
      "voice_id": "en-US-JennyNeural"
    }
  },
  "source_url": "https://create-images-results.d-id.com/DefaultPresenters/Noelle_t/image.jpeg",
  "webhook": "https://productdescriptions.io/api/webhooks/did-video",
  "user_data": "{\"productName\":\"Test Product\",\"timestamp\":\"2025-09-11T09:00:00.000Z\"}"
}
```

### Error Response
```
Status: 500 Internal Server Error
Content-Type: text/html; charset=utf-8

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>TypeError: Converting circular structure to JSON
    --> starting at object with constructor 'TLSSocket'
    |     property 'parser' -> object with constructor 'HTTPParser'
    --- property 'socket' closes the circle
    at JSON.stringify (<anonymous>)
    at Q7a (/var/task/sr...
</pre>
</body>
</html>
```

## Authentication Methods Tested

We have tested multiple authentication approaches based on D-ID documentation:

1. **Basic Auth with API key as username (empty password)**:
   ```
   Authorization: Basic base64(API_KEY:)
   ```
   Result: 500 error with circular structure JSON error

2. **Bearer Token**:
   ```
   Authorization: Bearer API_KEY
   ```
   Result: 401 Unauthorized

3. **Basic Auth with raw API key**:
   ```
   Authorization: Basic API_KEY
   ```
   Result: 500 error with circular structure JSON error

## Environment Details
- **Runtime**: Node.js 18.x (Vercel Serverless Functions)
- **HTTP Client**: node-fetch v2
- **Deployment Platform**: Vercel
- **API Key Format**: 42-character string without colons or special prefixes

## Steps to Reproduce
1. Make a POST request to https://api.d-id.com/talks with the configuration shown above
2. Use Basic authentication with base64-encoded API key
3. Observe 500 error response with "Converting circular structure to JSON" message

## Expected Behavior
The API should return a 201 Created response with a talk ID for video generation.

## Actual Behavior
Consistent 500 Internal Server Error with a server-side JSON serialization error.

## What We've Verified
- ✅ API key is correctly configured in environment variables
- ✅ API key is from an active paid account with available credits
- ✅ Request payload follows the documented schema
- ✅ Using a known working presenter image URL
- ✅ Content-Type and Accept headers are properly set

## Questions
1. Is there a specific authentication format required for the new API usage plans?
2. Are there any known issues with the /talks endpoint?
3. Is the "Converting circular structure to JSON" error a known issue on the D-ID server side?
4. Should we be using a different authentication method or header format?
5. Are there any IP whitelist or CORS requirements for API access from Vercel?

## Request for Assistance
Please help us identify why all requests to the /talks endpoint are resulting in 500 errors. This appears to be a server-side issue within the D-ID API infrastructure, as the error message indicates a JSON serialization problem in the API's code (`/var/task/sr...`).

We are happy to provide additional debugging information or test specific configurations as needed.

## Contact Information
- **Application URL**: https://productdescriptions.io
- **API Endpoint URL**: https://productdescriptions.io/api/generate-video
- **Response Time**: Please respond as soon as possible as this is affecting our production service

Thank you for your assistance in resolving this issue.