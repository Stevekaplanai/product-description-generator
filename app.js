(function() {
    'use strict';
    
    window.AppUX = {
        state: {
            currentStep: 'start',
            selectedMethod: null,
            formData: {},
            history: [],
            userId: null,
            results: null,
            activeTab: 'description1'
        },

        init: function() {
            console.log('AppUX initializing...');
            this.loadState();
            this.attachEventListeners();
            this.updateUI();
            this.loadHistory();
            this.initUserId();
            this.updateCreditsDisplay(); // Initialize credits display
            console.log('AppUX initialized successfully');
        },

        loadState: function() {
            const saved = localStorage.getItem('appState');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    Object.assign(this.state, parsed);
                } catch (e) {
                    console.error('Failed to load state:', e);
                }
            }
        },

        saveState: function() {
            localStorage.setItem('appState', JSON.stringify(this.state));
        },

        initUserId: function() {
            if (!this.state.userId) {
                this.state.userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                this.saveState();
            }
        },

        attachEventListeners: function() {
            const self = this;
            
            document.querySelectorAll('.start-option').forEach(function(option) {
                option.addEventListener('click', function(e) {
                    const method = e.currentTarget.dataset.method;
                    self.selectMethod(method);
                });
            });

            const form = document.getElementById('productForm');
            if (form) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    self.generateDescriptions();
                });
            }

            document.querySelectorAll('.back-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    self.goBack();
                });
            });

            const historyToggle = document.querySelector('.history-toggle');
            if (historyToggle) {
                historyToggle.addEventListener('click', function() {
                    self.toggleHistory();
                });
            }

            const smartFillBtn = document.querySelector('.smart-fill-btn');
            if (smartFillBtn) {
                smartFillBtn.addEventListener('click', function() {
                    self.smartFill();
                });
            }

            document.addEventListener('click', function(e) {
                if (e.target.classList.contains('copy-btn')) {
                    self.copyToClipboard(e.target);
                }
                // Fix history click - check if clicked on history item or its children
                const historyItem = e.target.closest('.history-item');
                if (historyItem) {
                    self.loadFromHistory(historyItem.dataset.id);
                }
                if (e.target.classList.contains('tab-btn')) {
                    self.switchTab(e.target.dataset.tab);
                }
            });
        },

        selectMethod: function(method) {
            this.state.selectedMethod = method;
            this.state.currentStep = 'form';
            this.saveState();
            this.updateUI();
            this.showMethodForm(method);
        },

        showMethodForm: function(method) {
            const formContainer = document.querySelector('.form-container');
            if (!formContainer) return;

            document.querySelectorAll('.form-section').forEach(function(section) {
                section.style.display = 'none';
            });

            switch(method) {
                case 'template':
                    const templateSection = document.querySelector('.template-section');
                    const basicSection1 = document.querySelector('.basic-section');
                    if (templateSection) templateSection.style.display = 'block';
                    if (basicSection1) basicSection1.style.display = 'block';
                    break;
                case 'image':
                    const imageSection = document.querySelector('.image-section');
                    const basicSection2 = document.querySelector('.basic-section');
                    if (imageSection) imageSection.style.display = 'block';
                    if (basicSection2) basicSection2.style.display = 'block';
                    break;
                case 'manual':
                    document.querySelectorAll('.form-section').forEach(function(section) {
                        if (!section.classList.contains('bulk-section')) {
                            section.style.display = 'block';
                        }
                    });
                    break;
                case 'bulk':
                    const bulkSection = document.querySelector('.bulk-section');
                    if (bulkSection) {
                        bulkSection.style.display = 'block';
                        this.initBulkUpload();
                    }
                    break;
            }

            this.updateStepIndicator();
        },

        updateStepIndicator: function() {
            document.querySelectorAll('.step').forEach(function(step) {
                step.classList.remove('active', 'completed');
            });

            const chooseStep = document.querySelector('.step[data-step="choose"]');
            const fillStep = document.querySelector('.step[data-step="fill"]');
            const generateStep = document.querySelector('.step[data-step="generate"]');

            switch(this.state.currentStep) {
                case 'start':
                    if (chooseStep) chooseStep.classList.add('active');
                    break;
                case 'form':
                    if (chooseStep) chooseStep.classList.add('completed');
                    if (fillStep) fillStep.classList.add('active');
                    break;
                case 'results':
                    if (chooseStep) chooseStep.classList.add('completed');
                    if (fillStep) fillStep.classList.add('completed');
                    if (generateStep) generateStep.classList.add('active');
                    break;
            }
        },

        goBack: function() {
            if (this.state.currentStep === 'results') {
                this.state.currentStep = 'form';
            } else if (this.state.currentStep === 'form') {
                this.state.currentStep = 'start';
                this.state.selectedMethod = null;
            }
            this.saveState();
            this.updateUI();
        },

        updateUI: function() {
            const startSection = document.querySelector('.start-section');
            const formContainer = document.querySelector('.form-container');
            const resultsContainer = document.querySelector('.results-container');

            if (startSection) startSection.style.display = 'none';
            if (formContainer) formContainer.style.display = 'none';
            if (resultsContainer) resultsContainer.style.display = 'none';

            switch(this.state.currentStep) {
                case 'start':
                    if (startSection) startSection.style.display = 'block';
                    break;
                case 'form':
                    if (formContainer) formContainer.style.display = 'block';
                    break;
                case 'results':
                    if (resultsContainer) resultsContainer.style.display = 'block';
                    this.displayResults();
                    break;
            }

            this.updateStepIndicator();
        },

        smartFill: function() {
            const self = this;
            const productUrl = document.getElementById('productUrl');
            if (!productUrl || !productUrl.value) {
                this.showNotification('Please enter a product URL first', 'warning');
                return;
            }

            const btn = document.querySelector('.smart-fill-btn');
            const originalText = btn.textContent;
            btn.textContent = 'Analyzing...';
            btn.disabled = true;

            fetch('/api/extract-product-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: productUrl.value })
            })
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data.success && data.productInfo) {
                    const productName = document.getElementById('productName');
                    const productCategory = document.getElementById('productCategory');
                    const keyFeatures = document.getElementById('keyFeatures');
                    
                    if (data.productInfo.name && productName) {
                        productName.value = data.productInfo.name;
                    }
                    if (data.productInfo.category && productCategory) {
                        productCategory.value = data.productInfo.category;
                    }
                    if (data.productInfo.features && keyFeatures) {
                        keyFeatures.value = data.productInfo.features;
                    }
                    
                    self.showNotification('Product information extracted successfully!', 'success');
                } else {
                    throw new Error(data.error || 'Failed to extract product information');
                }
            })
            .catch(function(error) {
                self.showNotification('Failed to extract product information. Please fill manually.', 'error');
            })
            .finally(function() {
                btn.textContent = originalText;
                btn.disabled = false;
            });
        },

        generateDescriptions: function() {
            const self = this;
            
            // Check if this is a bulk upload
            if (this.state.selectedMethod === 'bulk') {
                this.processBulkProducts();
                return;
            }
            
            const formData = new FormData(document.getElementById('productForm'));
            const data = {};
            formData.forEach(function(value, key) {
                data[key] = value;
            });
            
            this.state.formData = data;
            this.state.currentStep = 'results';
            this.updateUI();
            this.showLoading();

            fetch('/api/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(function(response) { return response.json(); })
            .then(function(result) {
                if (result.success) {
                    self.state.results = result;
                    self.addToHistory(data, result);
                    self.trackGeneration(data, result);
                    self.displayResults();
                } else {
                    throw new Error(result.error || 'Generation failed');
                }
            })
            .catch(function(error) {
                self.showNotification('Failed to generate descriptions. Please try again.', 'error');
                self.state.currentStep = 'form';
                self.updateUI();
            });
        },

        showLoading: function() {
            const container = document.querySelector('.results-content');
            if (container) {
                container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Generating your product descriptions...</p></div>';
            }
        },

        displayResults: function() {
            const self = this;
            if (!this.state.results) {
                console.error('No results to display');
                return;
            }

            const container = document.querySelector('.results-content');
            if (!container) {
                console.error('Results container not found');
                return;
            }

            // Handle both array format (new) and individual properties (legacy)
            let descriptions;
            if (this.state.results.descriptions && Array.isArray(this.state.results.descriptions)) {
                descriptions = this.state.results.descriptions;
                console.log('Using array format descriptions:', descriptions.length, 'items');
            } else {
                descriptions = [
                    this.state.results.description1 || '',
                    this.state.results.description2 || '',
                    this.state.results.description3 || ''
                ];
                console.log('Using legacy format descriptions');
            }
            
            // Filter out empty descriptions
            descriptions = descriptions.filter(function(desc) { return desc && desc.trim(); });
            
            if (descriptions.length === 0) {
                console.error('No valid descriptions found');
                container.innerHTML = '<div class="error-state">No descriptions were generated. Please try again.</div>';
                return;
            }

            let html = '<div class="results-tabs"><div class="tab-buttons">';
            
            descriptions.forEach(function(desc, i) {
                html += '<button class="tab-btn ' + (i === 0 ? 'active' : '') + '" data-tab="description' + (i + 1) + '">Version ' + (i + 1) + '</button>';
            });
            
            html += '</div><div class="tab-content">';
            
            descriptions.forEach(function(desc, i) {
                if (!desc || !desc.trim()) return; // Skip empty descriptions
                const wordCount = desc.split(' ').length;
                html += '<div class="tab-pane ' + (i === 0 ? 'active' : '') + '" id="description' + (i + 1) + '">';
                html += '<div class="description-card">';
                html += '<div class="description-text">' + self.formatDescription(desc) + '</div>';
                html += '<div class="description-actions">';
                html += '<button class="copy-btn" data-content="' + self.escapeHtml(desc) + '"><span class="icon">📋</span> Copy</button>';
                html += '<div class="word-count">' + wordCount + ' words</div>';
                html += '</div></div></div>';
            });
            
            html += '</div>';
            
            // Add image and video generation section
            html += '<div class="generation-options">';
            html += '<h3 class="options-title">Enhance Your Product</h3>';
            html += '<div class="options-grid">';
            
            // Image Generation
            html += '<div class="option-card">';
            html += '<div class="option-icon">🎨</div>';
            html += '<h4>Generate Product Images</h4>';
            html += '<p>Create professional product photos with AI</p>';
            html += '<div class="option-features">';
            html += '<span class="feature-tag">Hero Shots</span>';
            html += '<span class="feature-tag">Lifestyle</span>';
            html += '<span class="feature-tag">4K Quality</span>';
            html += '</div>';
            html += '<button class="generate-btn" onclick="AppUX.generateImages()">Generate Images</button>';
            html += '</div>';
            
            // Video Generation
            html += '<div class="option-card">';
            html += '<div class="option-icon">🎬</div>';
            html += '<h4>Create UGC Videos</h4>';
            html += '<p>AI avatars present your product</p>';
            html += '<div class="option-features">';
            html += '<span class="feature-tag">100+ Avatars</span>';
            html += '<span class="feature-tag">29 Languages</span>';
            html += '<span class="feature-tag">HD Video</span>';
            html += '</div>';
            html += '<button class="generate-btn" onclick="AppUX.generateVideo()">Create Video</button>';
            html += '</div>';
            
            // Bulk Export
            html += '<div class="option-card">';
            html += '<div class="option-icon">📊</div>';
            html += '<h4>Bulk Export</h4>';
            html += '<p>Download all content in multiple formats</p>';
            html += '<div class="option-features">';
            html += '<span class="feature-tag">CSV</span>';
            html += '<span class="feature-tag">JSON</span>';
            html += '<span class="feature-tag">PDF</span>';
            html += '</div>';
            html += '<button class="generate-btn" onclick="AppUX.exportContent()">Export All</button>';
            html += '</div>';
            
            html += '</div></div></div>';
            container.innerHTML = html;
        },

        switchTab: function(tabId) {
            document.querySelectorAll('.tab-btn').forEach(function(btn) {
                btn.classList.toggle('active', btn.dataset.tab === tabId);
            });
            document.querySelectorAll('.tab-pane').forEach(function(pane) {
                pane.classList.toggle('active', pane.id === tabId);
            });
            this.state.activeTab = tabId;
        },

        formatDescription: function(text) {
            if (!text) return '';
            // First escape HTML to prevent XSS, then format
            const escaped = this.escapeHtml(text);
            return escaped
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>')
                .replace(/^/, '<p>')
                .replace(/$/, '</p>');
        },

        addToHistory: function(formData, result) {
            const historyItem = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                productName: formData.productName,
                formData: formData,
                results: result
            };

            this.state.history.unshift(historyItem);
            if (this.state.history.length > 20) {
                this.state.history = this.state.history.slice(0, 20);
            }

            localStorage.setItem('generationHistory', JSON.stringify(this.state.history));
            this.updateHistoryUI();
        },

        generateImages: function() {
            const self = this;
            
            console.log('generateImages called');
            console.log('Current formData:', this.state.formData);
            
            // Check if user has credits or subscription
            if (!this.checkCredits('image')) {
                this.showPaywall('image');
                return;
            }
            
            // Try to get product info from multiple sources
            let productName = '';
            let features = '';
            let category = '';
            
            // First try formData (this should be set when loading from history)
            if (this.state.formData && this.state.formData.productName) {
                console.log('Using formData from state');
                productName = this.state.formData.productName;
                features = this.state.formData.keyFeatures || '';
                category = this.state.formData.productCategory || this.state.formData.category || '';
            }
            // Then try to get from results if we have them
            else if (this.state.results && this.state.results.product) {
                console.log('Using product info from results');
                productName = this.state.results.product;
                // Also check if we have the formData in history
                if (this.state.history && this.state.history.length > 0) {
                    const lastItem = this.state.history[0];
                    if (lastItem.productName === productName || lastItem.formData.productName === productName) {
                        features = lastItem.formData.keyFeatures || '';
                        category = lastItem.formData.productCategory || lastItem.formData.category || '';
                        // Update formData for consistency
                        this.state.formData = lastItem.formData;
                    }
                }
            }
            // Finally try to get from current form if visible
            else {
                console.log('Trying to get from form fields');
                const nameField = document.querySelector('[name="productName"]');
                const featuresField = document.querySelector('[name="keyFeatures"]');
                const categoryField = document.querySelector('[name="productCategory"]');
                
                if (nameField && nameField.value) {
                    productName = nameField.value;
                    features = featuresField ? featuresField.value : '';
                    category = categoryField ? categoryField.value : '';
                    
                    // Store for future use
                    this.state.formData = {
                        productName: productName,
                        keyFeatures: features,
                        productCategory: category
                    };
                }
            }
            
            console.log('Product details:', { productName, features, category });
            
            if (!productName) {
                console.error('No product name found');
                this.showError('Product name is required. Please enter product details first.');
                return;
            }
            
            this.showLoadingModal('Generating product images...');
            
            fetch('/api/generate-image-hybrid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName: productName,  // Fixed: API expects productName not product
                    keyFeatures: features,     // Fixed: API expects keyFeatures not features
                    productCategory: category,  // Fixed: API expects productCategory not category
                    targetAudience: this.state.formData?.targetAudience || 'General Consumers',
                    imageTypes: ['hero', 'lifestyle', 'detail']  // Fixed: API expects imageTypes not types
                })
            })
            .then(function(response) { return response.json(); })
            .then(function(result) {
                self.hideLoadingModal();
                if (result.success) {
                    self.displayImageResults(result.images);
                    self.updateCredits(-1);
                } else {
                    throw new Error(result.error || 'Image generation failed');
                }
            })
            .catch(function(error) {
                self.hideLoadingModal();
                self.showError('Failed to generate images: ' + error.message);
            });
        },
        
        generateVideo: function() {
            const self = this;
            
            // Check if user has credits or subscription
            if (!this.checkCredits('video')) {
                this.showPaywall('video');
                return;
            }
            
            this.showComingSoon('Video generation');
        },
        
        exportContent: function() {
            const self = this;
            
            // Check if user has subscription
            if (!this.checkSubscription()) {
                this.showPaywall('export');
                return;
            }
            
            // Create export data
            const exportData = {
                productName: this.state.formData.productName,
                descriptions: this.state.results,
                timestamp: new Date().toISOString()
            };
            
            // Download as JSON
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'product-content.json';
            a.click();
        },
        
        checkCredits: function(type) {
            // Check user credits from state or localStorage
            const credits = parseInt(localStorage.getItem('userCredits') || '3');
            return credits > 0;
        },
        
        checkSubscription: function() {
            // Check if user has active subscription
            const subscription = localStorage.getItem('userSubscription');
            return subscription === 'active';
        },
        
        updateCredits: function(amount) {
            const credits = parseInt(localStorage.getItem('userCredits') || '3');
            const newCredits = Math.max(0, credits + amount);
            localStorage.setItem('userCredits', newCredits.toString());
            this.updateCreditsDisplay();
        },
        
        updateCreditsDisplay: function() {
            const credits = parseInt(localStorage.getItem('userCredits') || '3');
            const display = document.querySelector('.credits-display');
            if (display) {
                display.textContent = credits + ' credits remaining';
            }
        },
        
        showPaywall: function(feature) {
            const modal = document.createElement('div');
            modal.className = 'paywall-modal';
            modal.innerHTML = `
                <div class="paywall-content">
                    <button class="close-modal" onclick="this.parentElement.parentElement.remove()">×</button>
                    <h2>🔐 Upgrade to Continue</h2>
                    <p>You've used your free credits. Upgrade to generate unlimited content!</p>
                    
                    <div class="pricing-options">
                        <div class="price-card">
                            <h3>Starter</h3>
                            <div class="price">$29/mo</div>
                            <ul>
                                <li>✓ 100 descriptions/month</li>
                                <li>✓ 50 images/month</li>
                                <li>✓ Basic support</li>
                            </ul>
                            <button class="upgrade-btn" onclick="AppUX.subscribePlan('starter')">Choose Starter</button>
                        </div>
                        
                        <div class="price-card featured">
                            <div class="badge">MOST POPULAR</div>
                            <h3>Professional</h3>
                            <div class="price">$79/mo</div>
                            <ul>
                                <li>✓ Unlimited descriptions</li>
                                <li>✓ 500 images/month</li>
                                <li>✓ 10 videos/month</li>
                                <li>✓ Priority support</li>
                            </ul>
                            <button class="upgrade-btn primary" onclick="AppUX.subscribePlan('professional')">Choose Professional</button>
                        </div>
                        
                        <div class="price-card">
                            <h3>Enterprise</h3>
                            <div class="price">Custom</div>
                            <ul>
                                <li>✓ Everything unlimited</li>
                                <li>✓ Custom AI models</li>
                                <li>✓ API access</li>
                                <li>✓ Dedicated support</li>
                            </ul>
                            <button class="upgrade-btn" onclick="AppUX.contactSales()">Contact Sales</button>
                        </div>
                    </div>
                    
                    <p class="guarantee">✓ 14-day money-back guarantee • Cancel anytime</p>
                </div>
            `;
            document.body.appendChild(modal);
        },
        
        subscribePlan: function(plan) {
            // Redirect to Stripe checkout
            const prices = {
                starter: process.env.STRIPE_PRICE_STARTER,
                professional: process.env.STRIPE_PRICE_PROFESSIONAL
            };
            
            window.location.href = '/api/create-checkout?plan=' + plan;
        },
        
        contactSales: function() {
            window.location.href = 'mailto:sales@productdescriptions.io?subject=Enterprise%20Plan%20Inquiry';
        },
        
        showLoadingModal: function(message) {
            const modal = document.createElement('div');
            modal.className = 'loading-modal';
            modal.innerHTML = '<div class="loading-content"><div class="spinner"></div><p>' + message + '</p></div>';
            document.body.appendChild(modal);
        },
        
        hideLoadingModal: function() {
            const modal = document.querySelector('.loading-modal');
            if (modal) modal.remove();
        },
        
        showComingSoon: function(feature) {
            alert(feature + ' is coming soon! Join our Professional plan to get early access.');
        },
        
        showError: function(message) {
            const modal = document.createElement('div');
            modal.className = 'error-modal';
            modal.innerHTML = '<div class="error-content"><p>' + message + '</p><button onclick="this.parentElement.parentElement.remove()">OK</button></div>';
            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
            modal.querySelector('.error-content').style.cssText = 'background:white;padding:30px;border-radius:10px;max-width:400px;text-align:center;';
            document.body.appendChild(modal);
        },
        
        displayImageResults: function(images) {
            const modal = document.createElement('div');
            modal.className = 'image-results-modal';
            let html = '<div class="image-results-content">';
            html += '<button class="close-modal" onclick="this.parentElement.parentElement.remove()">×</button>';
            html += '<h2>Your Generated Images</h2>';
            html += '<div class="images-grid">';
            
            images.forEach(function(img) {
                html += '<div class="image-card">';
                html += '<img src="' + img.url + '" alt="' + img.type + '">';
                html += '<div class="image-actions">';
                html += '<button onclick="window.open(\'' + img.url + '\', \'_blank\')">Download</button>';
                html += '</div></div>';
            });
            
            html += '</div></div>';
            modal.innerHTML = html;
            document.body.appendChild(modal);
        },
        
        trackGeneration: function(formData, result) {
            fetch('/api/track-generation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.state.userId,
                    type: 'description',
                    data: {
                        productName: formData.productName,
                        category: formData.productCategory,
                        timestamp: new Date().toISOString()
                    }
                })
            }).catch(function(error) {
                console.error('Failed to track generation:', error);
            });
        },

        loadHistory: function() {
            const saved = localStorage.getItem('generationHistory');
            if (saved) {
                try {
                    this.state.history = JSON.parse(saved);
                    this.updateHistoryUI();
                } catch (e) {
                    console.error('Failed to load history:', e);
                }
            }
        },

        updateHistoryUI: function() {
            const self = this;
            const container = document.querySelector('.history-list');
            if (!container) return;

            if (this.state.history.length === 0) {
                container.innerHTML = '<p class="history-empty">No history yet</p>';
                return;
            }

            let html = '';
            this.state.history.forEach(function(item) {
                html += '<div class="history-item" data-id="' + item.id + '">';
                html += '<div class="history-time">' + self.formatTime(item.timestamp) + '</div>';
                html += '<div class="history-title">' + self.escapeHtml(item.productName) + '</div>';
                html += '</div>';
            });
            container.innerHTML = html;
        },

        loadFromHistory: function(id) {
            console.log('Loading from history:', id);
            const item = this.state.history.find(function(h) { return h.id == id; });
            if (!item) {
                console.error('History item not found:', id);
                return;
            }

            // Restore form data and ensure it persists
            this.state.formData = item.formData;
            // Also ensure the results have the product name for compatibility
            if (!item.results.product && item.formData.productName) {
                item.results.product = item.formData.productName;
            }
            
            Object.entries(item.formData).forEach(function(entry) {
                const field = document.querySelector('[name="' + entry[0] + '"]');
                if (field) field.value = entry[1];
            });

            // Restore results and show them
            this.state.results = item.results;
            this.state.currentStep = 'results';
            console.log('Restored formData:', this.state.formData);
            console.log('Restored results:', this.state.results);
            this.updateUI();
        },

        toggleHistory: function() {
            const sidebar = document.querySelector('.history-sidebar');
            if (sidebar) {
                sidebar.classList.toggle('collapsed');
            }
        },

        copyToClipboard: function(button) {
            const self = this;
            const content = button.dataset.content;
            
            navigator.clipboard.writeText(content)
                .then(function() {
                    const originalText = button.innerHTML;
                    button.innerHTML = '<span class="icon">✅</span> Copied!';
                    setTimeout(function() {
                        button.innerHTML = originalText;
                    }, 2000);
                })
                .catch(function(error) {
                    self.showNotification('Failed to copy to clipboard', 'error');
                });
        },

        showNotification: function(message, type) {
            const notification = document.createElement('div');
            notification.className = 'notification notification-' + (type || 'info');
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(function() {
                notification.classList.add('show');
            }, 10);

            setTimeout(function() {
                notification.classList.remove('show');
                setTimeout(function() { notification.remove(); }, 300);
            }, 3000);
        },

        formatTime: function(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            
            if (diff < 60000) return 'Just now';
            if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
            if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
            if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
            
            return date.toLocaleDateString();
        },

        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        initBulkUpload: function() {
            const self = this;
            const uploadArea = document.getElementById('uploadArea');
            const csvFile = document.getElementById('csvFile');
            
            if (uploadArea && csvFile) {
                // Click to upload
                uploadArea.addEventListener('click', function() {
                    csvFile.click();
                });
                
                // File selection
                csvFile.addEventListener('change', function(e) {
                    if (e.target.files.length > 0) {
                        self.handleCSVFile(e.target.files[0]);
                    }
                });
                
                // Drag and drop
                uploadArea.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    uploadArea.classList.add('drag-over');
                });
                
                uploadArea.addEventListener('dragleave', function() {
                    uploadArea.classList.remove('drag-over');
                });
                
                uploadArea.addEventListener('drop', function(e) {
                    e.preventDefault();
                    uploadArea.classList.remove('drag-over');
                    
                    if (e.dataTransfer.files.length > 0) {
                        self.handleCSVFile(e.dataTransfer.files[0]);
                    }
                });
            }
        },

        handleCSVFile: function(file) {
            const self = this;
            
            if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
                this.showNotification('Please upload a CSV file', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const csv = e.target.result;
                const products = self.parseCSV(csv);
                
                if (products.length > 0) {
                    self.showCSVPreview(products);
                    self.state.bulkProducts = products;
                } else {
                    self.showNotification('No valid products found in CSV', 'error');
                }
            };
            
            reader.readAsText(file);
        },

        parseCSV: function(csv) {
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const products = [];
            
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = lines[i].split(',');
                    const product = {};
                    
                    headers.forEach(function(header, index) {
                        product[header] = values[index] ? values[index].trim() : '';
                    });
                    
                    if (product['product name'] || product['name']) {
                        products.push(product);
                    }
                }
            }
            
            return products;
        },

        showCSVPreview: function(products) {
            const preview = document.getElementById('csvPreview');
            const content = document.getElementById('previewContent');
            
            if (preview && content) {
                let html = '<table><tr>';
                const headers = Object.keys(products[0]);
                
                headers.forEach(function(header) {
                    html += '<th>' + header + '</th>';
                });
                html += '</tr>';
                
                products.slice(0, 5).forEach(function(product) {
                    html += '<tr>';
                    headers.forEach(function(header) {
                        html += '<td>' + (product[header] || '') + '</td>';
                    });
                    html += '</tr>';
                });
                
                if (products.length > 5) {
                    html += '<tr><td colspan="' + headers.length + '">... and ' + (products.length - 5) + ' more products</td></tr>';
                }
                
                html += '</table>';
                content.innerHTML = html;
                preview.style.display = 'block';
                
                this.showNotification('Loaded ' + products.length + ' products', 'success');
            }
        },

        processBulkProducts: function() {
            const self = this;
            
            if (!this.state.bulkProducts || this.state.bulkProducts.length === 0) {
                this.showNotification('No products to process', 'error');
                return;
            }
            
            this.state.currentStep = 'results';
            this.updateUI();
            this.showLoading();
            
            // For now, redirect to bulk.html with the data
            // In production, this would process via API
            window.location.href = '/bulk.html';
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.AppUX.init();
        });
    } else {
        window.AppUX.init();
    }
})();