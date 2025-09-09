const { securityMiddleware, anonymizePersonalData } = require('../lib/security-middleware');

// Mock database - in production, use actual database
const getUserData = async (userId) => {
  // This should fetch from your actual database
  return {
    profile: {
      userId,
      email: 'user@example.com',
      name: 'User Name',
      createdAt: new Date().toISOString()
    },
    usage: {
      descriptions: [],
      images: [],
      videos: []
    },
    consent: {
      marketing: false,
      analytics: true,
      essential: true
    }
  };
};

module.exports = async (req, res) => {
  // Apply security middleware
  const proceed = await securityMiddleware(req, res, {
    requireAuth: true,
    gdprCompliant: true
  });
  
  if (!proceed) return;
  
  try {
    const userId = req.user.userId;
    
    // Fetch all user data
    const userData = await getUserData(userId);
    
    // Prepare GDPR-compliant data export
    const exportData = {
      exportDate: new Date().toISOString(),
      dataSubject: {
        userId,
        email: userData.profile.email,
        name: userData.profile.name
      },
      personalData: {
        profile: userData.profile,
        accountSettings: userData.settings || {},
        consentHistory: userData.consent,
        usageStatistics: {
          totalDescriptions: userData.usage.descriptions.length,
          totalImages: userData.usage.images.length,
          totalVideos: userData.usage.videos.length
        }
      },
      generatedContent: {
        descriptions: userData.usage.descriptions.map(d => ({
          ...d,
          createdAt: d.createdAt,
          productName: d.productName
        })),
        images: userData.usage.images.map(img => ({
          url: img.url,
          createdAt: img.createdAt,
          productName: img.productName
        })),
        videos: userData.usage.videos.map(vid => ({
          url: vid.url,
          createdAt: vid.createdAt,
          productName: vid.productName
        }))
      },
      thirdPartyServices: {
        stripe: {
          customerId: userData.stripeCustomerId || null,
          subscriptionStatus: userData.subscription || 'free'
        },
        analytics: {
          posthogId: userData.posthogId || null,
          eventsTracked: userData.analyticsConsent || false
        }
      },
      dataRetentionPolicy: {
        retentionPeriod: '90 days',
        deletionScheduled: false,
        lastModified: userData.profile.updatedAt || userData.profile.createdAt
      },
      exportFormat: 'JSON',
      gdprCompliant: true,
      dataPortability: 'Article 20 GDPR'
    };
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-export-${userId}-${Date.now()}.json"`);
    
    res.status(200).json({
      success: true,
      message: 'Data export completed successfully',
      data: exportData
    });
    
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({
      error: 'Failed to export user data',
      message: 'Please contact support if this issue persists'
    });
  }
};