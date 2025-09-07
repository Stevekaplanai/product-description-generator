// Redirect to main auth handler
// This is needed because Shopify requires a specific callback URL

module.exports = async (req, res) => {
  // Forward all query parameters to the auth endpoint
  const queryString = Object.entries(req.query)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  // Redirect to auth handler
  res.writeHead(302, {
    Location: `/api/shopify/auth?${queryString}`
  });
  res.end();
};