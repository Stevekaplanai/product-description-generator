// Upgrade Modal and Payment Handler
const UpgradeHandler = {
    // Stripe price IDs from environment
    PRICES: {
        starter: 'price_starter_monthly', // Will be replaced with actual from config
        professional: 'price_professional_monthly',
        enterprise: null // Contact sales
    },

    init() {
        this.attachEventListeners();
        this.loadStripeConfig();
    },

    async loadStripeConfig() {
        try {
            const response = await fetch('/api/stripe-config');
            if (response.ok) {
                const config = await response.json();
                this.PRICES.starter = config.prices?.starter || this.PRICES.starter;
                this.PRICES.professional = config.prices?.professional || this.PRICES.professional;
            }
        } catch (error) {
            console.log('Using default price IDs');
        }
    },

    showUpgradeModal(reason = 'credits') {
        // Remove any existing modal
        const existingModal = document.getElementById('upgradeModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div id="upgradeModal" class="modal-overlay" style="display: flex;">
                <div class="modal-content upgrade-modal">
                    <button class="modal-close" onclick="UpgradeHandler.closeModal()">&times;</button>

                    <div class="modal-header">
                        <span class="lock-icon">🔒</span>
                        <h2>Upgrade to Continue</h2>
                        <p>${reason === 'credits' ? "You've used your free credits. Upgrade to generate unlimited content!" : "Upgrade to access premium features!"}</p>
                    </div>

                    <div class="pricing-cards">
                        <!-- Starter Plan -->
                        <div class="pricing-card">
                            <h3 class="plan-name">Starter</h3>
                            <div class="price">
                                <span class="currency">$</span>
                                <span class="amount">29</span>
                                <span class="period">/mo</span>
                            </div>
                            <ul class="features">
                                <li>✓ 100 descriptions/month</li>
                                <li>✓ 50 images/month</li>
                                <li>✓ Basic support</li>
                            </ul>
                            <button class="btn-upgrade btn-starter" onclick="UpgradeHandler.handleUpgrade('starter')">
                                Choose Starter
                            </button>
                        </div>

                        <!-- Professional Plan -->
                        <div class="pricing-card featured">
                            <div class="badge">MOST POPULAR</div>
                            <h3 class="plan-name">Professional</h3>
                            <div class="price">
                                <span class="currency">$</span>
                                <span class="amount">79</span>
                                <span class="period">/mo</span>
                            </div>
                            <ul class="features">
                                <li>✓ Unlimited descriptions</li>
                                <li>✓ 500 images/month</li>
                                <li>✓ 10 videos/month</li>
                                <li>✓ Priority support</li>
                            </ul>
                            <button class="btn-upgrade btn-professional" onclick="UpgradeHandler.handleUpgrade('professional')">
                                Choose Professional
                            </button>
                        </div>

                        <!-- Enterprise Plan -->
                        <div class="pricing-card">
                            <h3 class="plan-name">Enterprise</h3>
                            <div class="price">
                                <span class="custom">Custom</span>
                            </div>
                            <ul class="features">
                                <li>✓ Everything unlimited</li>
                                <li>✓ Custom AI models</li>
                                <li>✓ API access</li>
                                <li>✓ Dedicated support</li>
                            </ul>
                            <button class="btn-upgrade btn-enterprise" onclick="UpgradeHandler.handleContactSales()">
                                Contact Sales
                            </button>
                        </div>
                    </div>

                    <p class="guarantee">✓ 14-day money-back guarantee • Cancel anytime</p>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.addModalStyles();
    },

    addModalStyles() {
        if (document.getElementById('upgradeModalStyles')) return;

        const styles = `
            <style id="upgradeModalStyles">
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    backdrop-filter: blur(4px);
                }

                .upgrade-modal {
                    background: white;
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 900px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }

                .modal-close {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: none;
                    border: none;
                    font-size: 30px;
                    cursor: pointer;
                    color: #999;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.3s;
                }

                .modal-close:hover {
                    background: #f0f0f0;
                    color: #333;
                }

                .modal-header {
                    text-align: center;
                    margin-bottom: 40px;
                }

                .lock-icon {
                    font-size: 48px;
                    margin-bottom: 20px;
                    display: block;
                }

                .modal-header h2 {
                    font-size: 32px;
                    margin-bottom: 10px;
                    color: #333;
                }

                .modal-header p {
                    color: #666;
                    font-size: 16px;
                }

                .pricing-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .pricing-card {
                    border: 2px solid #e5e7eb;
                    border-radius: 16px;
                    padding: 30px;
                    text-align: center;
                    position: relative;
                    transition: all 0.3s;
                }

                .pricing-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                }

                .pricing-card.featured {
                    border-color: #5046e5;
                    transform: scale(1.05);
                }

                .badge {
                    position: absolute;
                    top: -12px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #5046e5;
                    color: white;
                    padding: 4px 16px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .plan-name {
                    font-size: 24px;
                    margin-bottom: 20px;
                    color: #333;
                }

                .price {
                    margin-bottom: 30px;
                }

                .currency {
                    font-size: 24px;
                    color: #5046e5;
                    vertical-align: top;
                }

                .amount {
                    font-size: 48px;
                    font-weight: 700;
                    color: #5046e5;
                }

                .period {
                    font-size: 18px;
                    color: #666;
                }

                .custom {
                    font-size: 36px;
                    color: #5046e5;
                    font-weight: 600;
                }

                .features {
                    list-style: none;
                    padding: 0;
                    margin-bottom: 30px;
                }

                .features li {
                    padding: 10px 0;
                    color: #666;
                    font-size: 14px;
                }

                .btn-upgrade {
                    width: 100%;
                    padding: 14px 24px;
                    border: 2px solid #5046e5;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    background: white;
                    color: #5046e5;
                }

                .btn-upgrade:hover {
                    background: #5046e5;
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(80, 70, 229, 0.3);
                }

                .pricing-card.featured .btn-upgrade {
                    background: #5046e5;
                    color: white;
                }

                .pricing-card.featured .btn-upgrade:hover {
                    background: #4338ca;
                }

                .guarantee {
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                    margin: 0;
                }

                @media (max-width: 768px) {
                    .pricing-cards {
                        grid-template-columns: 1fr;
                    }

                    .pricing-card.featured {
                        transform: none;
                    }

                    .upgrade-modal {
                        padding: 20px;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    },

    async handleUpgrade(plan) {
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Processing...';
        button.disabled = true;

        try {
            // Create checkout session
            const response = await fetch('/api/create-subscription-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    plan: plan,
                    successUrl: window.location.origin + '/dashboard.html',
                    cancelUrl: window.location.href
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const data = await response.json();

            if (data.url) {
                // Redirect to Stripe Checkout
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (error) {
            console.error('Upgrade error:', error);
            button.textContent = originalText;
            button.disabled = false;
            alert('Unable to process upgrade. Please try again or contact support.');
        }
    },

    handleContactSales() {
        window.location.href = 'mailto:sales@productdescriptions.io?subject=Enterprise%20Plan%20Inquiry';
    },

    closeModal() {
        const modal = document.getElementById('upgradeModal');
        if (modal) {
            modal.remove();
        }
    },

    // Video generation specific upgrade prompt
    showVideoUpgrade() {
        const modalHTML = `
            <div id="videoUpgradeModal" class="modal-overlay" style="display: flex;">
                <div class="modal-content video-upgrade-modal" style="text-align: center; max-width: 500px;">
                    <button class="modal-close" onclick="UpgradeHandler.closeVideoModal()">&times;</button>

                    <div class="modal-header">
                        <span style="font-size: 72px; margin-bottom: 20px; display: block;">🎬</span>
                        <h2>Video Generation</h2>
                        <p style="font-size: 18px; margin: 20px 0;">Upgrade to Professional or Enterprise plan to create AI videos!</p>
                    </div>

                    <div class="video-benefits" style="text-align: left; margin: 30px 0;">
                        <h4 style="margin-bottom: 15px;">With video generation you get:</h4>
                        <ul style="list-style: none; padding: 0;">
                            <li style="padding: 8px 0;">✨ Professional AI avatars</li>
                            <li style="padding: 8px 0;">🎙️ Multiple voice options</li>
                            <li style="padding: 8px 0;">📹 HD quality videos</li>
                            <li style="padding: 8px 0;">🚀 Fast processing</li>
                        </ul>
                    </div>

                    <button class="btn-upgrade" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 16px 40px;
                        border: none;
                        border-radius: 10px;
                        font-size: 18px;
                        font-weight: 600;
                        cursor: pointer;
                        margin: 20px 0;
                    " onclick="UpgradeHandler.showUpgradeModal('video')">
                        View Upgrade Options
                    </button>

                    <p style="color: #666; font-size: 14px; margin-top: 20px;">
                        Professional: 10 videos/month • Enterprise: Unlimited
                    </p>
                </div>
            </div>
        `;

        // Remove any existing modal
        const existing = document.getElementById('videoUpgradeModal');
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    closeVideoModal() {
        const modal = document.getElementById('videoUpgradeModal');
        if (modal) {
            modal.remove();
        }
    },

    attachEventListeners() {
        // Listen for credit exhaustion events
        document.addEventListener('creditsExhausted', () => {
            this.showUpgradeModal('credits');
        });

        // Listen for video access attempts
        document.addEventListener('videoAccessAttempt', () => {
            this.showVideoUpgrade();
        });
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        UpgradeHandler.init();
    });
} else {
    UpgradeHandler.init();
}

// Make available globally
window.UpgradeHandler = UpgradeHandler;