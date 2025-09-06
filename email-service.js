const axios = require('axios');

// Loops.so API configuration
const LOOPS_API_KEY = process.env.LOOPS_API_KEY;
const LOOPS_API_URL = 'https://app.loops.so/api/v1';

class EmailService {
    constructor() {
        this.apiKey = LOOPS_API_KEY;
        this.headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };
    }

    // Add or update a contact in Loops
    async addContact(email, userData = {}) {
        try {
            const response = await axios.post(
                `${LOOPS_API_URL}/contacts/create`,
                {
                    email: email,
                    ...userData
                },
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error adding contact to Loops:', error.response?.data || error.message);
            throw error;
        }
    }    // Send a transactional email
    async sendTransactionalEmail(transactionalId, email, dataVariables = {}) {
        try {
            const response = await axios.post(
                `${LOOPS_API_URL}/transactional`,
                {
                    transactionalId: transactionalId,
                    email: email,
                    dataVariables: dataVariables
                },
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error sending transactional email:', error.response?.data || error.message);
            throw error;
        }
    }

    // Send welcome email
    async sendWelcomeEmail(email, name = '') {
        return this.sendTransactionalEmail('welcome', email, {
            name: name,
            product_name: 'AI Product Description Generator'
        });
    }

    // Send purchase confirmation
    async sendPurchaseConfirmation(email, orderData) {
        return this.sendTransactionalEmail('purchase_confirmation', email, {
            order_id: orderData.orderId,
            amount: orderData.amount,
            tier: orderData.tier,            product_name: orderData.productName,
            date: new Date().toLocaleDateString()
        });
    }

    // Send video creation notification
    async sendVideoCreated(email, videoData) {
        return this.sendTransactionalEmail('video_created', email, {
            product_name: videoData.productName,
            video_url: videoData.videoUrl,
            duration: videoData.duration
        });
    }

    // Send usage limit warning
    async sendUsageLimitWarning(email, usageData) {
        return this.sendTransactionalEmail('usage_limit_warning', email, {
            used: usageData.used,
            limit: usageData.limit,
            percentage: Math.round((usageData.used / usageData.limit) * 100)
        });
    }

    // Add contact to newsletter list
    async subscribeToNewsletter(email, userData = {}) {
        try {
            const response = await axios.post(
                `${LOOPS_API_URL}/contacts/create`,
                {
                    email: email,
                    mailingLists: ['newsletter'],
                    ...userData                },
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error subscribing to newsletter:', error.response?.data || error.message);
            throw error;
        }
    }

    // Send event to Loops
    async sendEvent(email, eventName, eventData = {}) {
        try {
            const response = await axios.post(
                `${LOOPS_API_URL}/events/send`,
                {
                    email: email,
                    eventName: eventName,
                    eventProperties: eventData
                },
                { headers: this.headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error sending event to Loops:', error.response?.data || error.message);
            throw error;
        }
    }

    // Track product generation event
    async trackGeneration(email, generationType, productData) {
        return this.sendEvent(email, 'product_generated', {            type: generationType,
            product_name: productData.productName,
            tier: productData.tier,
            timestamp: new Date().toISOString()
        });
    }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;