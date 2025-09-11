/**
 * Email notification service using Loops.so via Zapier webhook
 * This handles all transactional emails for the application
 */

const ZAPIER_WEBHOOK_URL = process.env.ZAPIER_WEBHOOK_URL || '';
const LOOPS_API_KEY = process.env.LOOPS_API_KEY || '';

// Email templates
const emailTemplates = {
  welcome: {
    subject: 'Welcome to ProductDescriptions.io!',
    template: 'welcome_subscriber'
  },
  paymentSuccess: {
    subject: 'Payment Successful - Your subscription is active',
    template: 'payment_success'
  },
  paymentFailed: {
    subject: 'Payment Failed - Action Required',
    template: 'payment_failed'
  },
  subscriptionCancelled: {
    subject: 'Subscription Cancelled',
    template: 'subscription_cancelled'
  },
  usageLimitWarning: {
    subject: 'Approaching Usage Limit',
    template: 'usage_limit_warning'
  },
  upgradeSuccess: {
    subject: 'Plan Upgraded Successfully',
    template: 'upgrade_success'
  },
  bulkProcessingStarted: {
    subject: 'Bulk Processing Started',
    template: 'bulk_processing_started'
  },
  bulkProcessingComplete: {
    subject: 'Your Bulk Processing is Complete!',
    template: 'bulk_processing_complete'
  },
  bulkProcessingFailed: {
    subject: 'Bulk Processing Failed - Action Required',
    template: 'bulk_processing_failed'
  },
  videoGenerationComplete: {
    subject: 'Your Product Video is Ready!',
    template: 'video_generation_complete'
  },
  videoGenerationFailed: {
    subject: 'Video Generation Failed',
    template: 'video_generation_failed'
  }
};

// Send email via Zapier webhook to Loops.so
async function sendEmailViaZapier(to, emailType, data = {}) {
  if (!ZAPIER_WEBHOOK_URL) {
    console.log('Zapier webhook not configured, skipping email:', emailType, 'to:', to);
    return false;
  }

  const template = emailTemplates[emailType];
  if (!template) {
    console.error('Unknown email type:', emailType);
    return false;
  }

  try {
    const payload = {
      to,
      subject: template.subject,
      template: template.template,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        appUrl: process.env.APP_URL || 'https://productdescriptions.io'
      }
    };

    const response = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Zapier webhook failed: ${response.status}`);
    }

    console.log(`Email sent successfully: ${emailType} to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email via Zapier:', error);
    return false;
  }
}

// Direct Loops.so API integration (alternative to Zapier)
async function sendEmailViaLoops(to, emailType, data = {}) {
  if (!LOOPS_API_KEY) {
    console.log('Loops API key not configured, skipping email:', emailType, 'to:', to);
    return false;
  }

  const template = emailTemplates[emailType];
  if (!template) {
    console.error('Unknown email type:', emailType);
    return false;
  }

  try {
    const response = await fetch('https://app.loops.so/api/v1/transactional', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: to,
        transactionalId: template.template,
        dataVariables: {
          subject: template.subject,
          ...data
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Loops API failed: ${response.status}`);
    }

    console.log(`Email sent successfully via Loops: ${emailType} to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email via Loops:', error);
    return false;
  }
}

// Main export - API endpoint
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, emailType, data } = req.body;

    if (!to || !emailType) {
      return res.status(400).json({ error: 'Missing required fields: to, emailType' });
    }

    // Try Zapier first, fallback to direct Loops API
    let success = await sendEmailViaZapier(to, emailType, data);
    
    if (!success && LOOPS_API_KEY) {
      success = await sendEmailViaLoops(to, emailType, data);
    }

    if (success) {
      return res.status(200).json({ success: true, message: 'Email sent' });
    } else {
      return res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Error in email endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Export functions for use in other modules
module.exports.sendEmail = async (to, emailType, data = {}) => {
  let success = await sendEmailViaZapier(to, emailType, data);
  if (!success && LOOPS_API_KEY) {
    success = await sendEmailViaLoops(to, emailType, data);
  }
  return success;
};

// Email notification functions for specific events
module.exports.sendWelcomeEmail = (to, data) => 
  module.exports.sendEmail(to, 'welcome', data);

module.exports.sendPaymentSuccessEmail = (to, data) => 
  module.exports.sendEmail(to, 'paymentSuccess', data);

module.exports.sendPaymentFailedEmail = (to, data) => 
  module.exports.sendEmail(to, 'paymentFailed', data);

module.exports.sendSubscriptionCancelledEmail = (to, data) => 
  module.exports.sendEmail(to, 'subscriptionCancelled', data);

module.exports.sendUsageLimitWarningEmail = (to, data) => 
  module.exports.sendEmail(to, 'usageLimitWarning', data);

module.exports.sendUpgradeSuccessEmail = (to, data) => 
  module.exports.sendEmail(to, 'upgradeSuccess', data);