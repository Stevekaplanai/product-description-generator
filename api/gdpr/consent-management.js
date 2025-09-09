const { securityMiddleware, createConsentRecord } = require('../lib/security-middleware');

// Consent types and their descriptions
const CONSENT_TYPES = {
  essential: {
    name: 'Essential Cookies',
    description: 'Required for the website to function properly',
    required: true,
    purpose: 'Enable core functionality like security, network management, and accessibility'
  },
  analytics: {
    name: 'Analytics & Performance',
    description: 'Help us understand how visitors interact with our website',
    required: false,
    purpose: 'Collect anonymous usage data to improve our services'
  },
  marketing: {
    name: 'Marketing & Advertising',
    description: 'Used to deliver personalized advertisements',
    required: false,
    purpose: 'Show relevant ads and marketing campaigns'
  },
  personalization: {
    name: 'Personalization',
    description: 'Remember your preferences and settings',
    required: false,
    purpose: 'Provide a personalized experience based on your preferences'
  },
  thirdParty: {
    name: 'Third-Party Services',
    description: 'Enable integration with external services',
    required: false,
    purpose: 'Connect with services like Stripe, OpenAI, and social media'
  }
};

// Store consent records (use database in production)
const consentRecords = new Map();

module.exports = async (req, res) => {
  // Apply security middleware
  const proceed = await securityMiddleware(req, res, {
    requireAuth: false, // Allow anonymous users to manage consent
    gdprCompliant: true
  });
  
  if (!proceed) return;
  
  const { method } = req;
  
  try {
    switch (method) {
      case 'GET':
        // Get current consent status
        const userId = req.user?.userId || req.headers['x-session-id'] || 'anonymous';
        const currentConsent = consentRecords.get(userId) || {
          essential: true,
          analytics: false,
          marketing: false,
          personalization: false,
          thirdParty: false
        };
        
        res.status(200).json({
          success: true,
          consentTypes: CONSENT_TYPES,
          currentConsent,
          lastUpdated: currentConsent.timestamp || null,
          gdprCompliant: true,
          userRights: [
            'Right to withdraw consent at any time',
            'Right to access your personal data',
            'Right to rectification',
            'Right to erasure ("right to be forgotten")',
            'Right to restrict processing',
            'Right to data portability',
            'Right to object'
          ]
        });
        break;
      
      case 'POST':
      case 'PUT':
        // Update consent preferences
        const { consent, acceptAll = false, rejectAll = false } = req.body;
        const sessionId = req.user?.userId || req.headers['x-session-id'] || 'anonymous';
        
        let newConsent = {
          essential: true // Always required
        };
        
        if (acceptAll) {
          // Accept all non-essential cookies
          Object.keys(CONSENT_TYPES).forEach(type => {
            newConsent[type] = true;
          });
        } else if (rejectAll) {
          // Reject all non-essential cookies
          Object.keys(CONSENT_TYPES).forEach(type => {
            newConsent[type] = type === 'essential';
          });
        } else if (consent) {
          // Custom consent selection
          Object.keys(CONSENT_TYPES).forEach(type => {
            if (type === 'essential') {
              newConsent[type] = true;
            } else {
              newConsent[type] = consent[type] === true;
            }
          });
        } else {
          return res.status(400).json({
            error: 'Invalid consent data',
            message: 'Please provide consent preferences'
          });
        }
        
        // Create consent record
        const consentRecord = createConsentRecord(sessionId, newConsent);
        consentRecord.ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
        consentRecord.userAgent = req.headers['user-agent'];
        consentRecord.source = req.headers.referer || 'direct';
        
        // Store consent record
        consentRecords.set(sessionId, consentRecord);
        
        // Set consent cookie (for client-side tracking)
        const consentCookie = Buffer.from(JSON.stringify({
          v: '1.0',
          c: newConsent,
          t: Date.now()
        })).toString('base64');
        
        res.setHeader('Set-Cookie', [
          `gdpr_consent=${consentCookie}; Path=/; Max-Age=31536000; SameSite=Strict; Secure; HttpOnly`,
          `consent_given=${newConsent.analytics || newConsent.marketing ? '1' : '0'}; Path=/; Max-Age=31536000`
        ]);
        
        res.status(200).json({
          success: true,
          message: 'Consent preferences updated successfully',
          consent: newConsent,
          record: {
            id: consentRecord.id || sessionId,
            timestamp: consentRecord.timestamp,
            withdrawable: true
          }
        });
        break;
      
      case 'DELETE':
        // Withdraw consent
        const userToDelete = req.user?.userId || req.headers['x-session-id'] || 'anonymous';
        
        // Set all non-essential consent to false
        const withdrawnConsent = {
          essential: true,
          analytics: false,
          marketing: false,
          personalization: false,
          thirdParty: false,
          withdrawn: true,
          withdrawnAt: new Date().toISOString()
        };
        
        consentRecords.set(userToDelete, withdrawnConsent);
        
        // Clear consent cookies
        res.setHeader('Set-Cookie', [
          'gdpr_consent=; Path=/; Max-Age=0',
          'consent_given=0; Path=/; Max-Age=31536000'
        ]);
        
        res.status(200).json({
          success: true,
          message: 'Consent withdrawn successfully',
          consent: withdrawnConsent,
          note: 'We will only process essential data required for service operation'
        });
        break;
      
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Consent management error:', error);
    res.status(500).json({
      error: 'Failed to process consent request',
      message: 'Please try again or contact support'
    });
  }
};