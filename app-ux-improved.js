// Improved UX JavaScript for Product Description Generator
// Simplified flow with progressive disclosure

const AppUX = {
    // State management
    state: {
        currentStep: 'start',
        selectedMethod: null,
        formData: {},
        history: [],
        userId: null,
        results: null,
        activeTab: 'description1'
    },

    // Initialize app
    init() {
        this.loadState();
        this.attachEventListeners();
        this.updateUI();
        this.loadHistory();
        this.initUserId();
    },

    // Load saved state
    loadState() {
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

    // Save state
    saveState() {
        localStorage.setItem('appState', JSON.stringify(this.state));
    },

    // Initialize user ID
    initUserId() {
        if (!this.state.userId) {
            this.state.userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            this.saveState();
        }
    },

    // Attach event listeners
    attachEventListeners() {
        // Start options
        document.querySelectorAll('.start-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const method = e.currentTarget.dataset.method;
                this.selectMethod(method);
            });
        });

        // Form submission
        const form = document.getElementById('productForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateDescriptions();
            });
        }

        // Back button
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.goBack());
        }

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // History toggle
        const historyToggle = document.querySelector('.history-toggle');
        if (historyToggle) {
            historyToggle.addEventListener('click', () => this.toggleHistory());
        }

        // Smart fill
        const smartFillBtn = document.querySelector('.smart-fill-btn');
        if (smartFillBtn) {
            smartFillBtn.addEventListener('click', () => this.smartFill());
        }

        // Copy buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-btn')) {
                this.copyToClipboard(e.target);
            }
            if (e.target.classList.contains('history-item')) {
                this.loadFromHistory(e.target.dataset.id);
            }
        });
    },

    // Select generation method
    selectMethod(method) {
        this.state.selectedMethod = method;
        this.state.currentStep = 'form';
        this.saveState();
        this.updateUI();
        this.showMethodForm(method);
    },

    // Show appropriate form based on method
    showMethodForm(method) {
        const formContainer = document.querySelector('.form-container');
        if (!formContainer) return;

        // Hide all sections first
        document.querySelectorAll('.form-section').forEach(section => {
            section.style.display = 'none';
        });

        // Show relevant sections based on method
        switch(method) {
            case 'template':
                document.querySelector('.template-section')?.style.display = 'block';
                document.querySelector('.basic-section')?.style.display = 'block';
                break;
            case 'image':
                document.querySelector('.image-section')?.style.display = 'block';
                document.querySelector('.basic-section')?.style.display = 'block';
                break;
            case 'manual':
                document.querySelectorAll('.form-section').forEach(section => {
                    section.style.display = 'block';
                });
                break;
        }

        // Update step indicator
        this.updateStepIndicator();
    },

    // Update step indicator
    updateStepIndicator() {
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active', 'completed');
        });

        switch(this.state.currentStep) {
            case 'start':
                document.querySelector('.step[data-step="choose"]')?.classList.add('active');
                break;
            case 'form':
                document.querySelector('.step[data-step="choose"]')?.classList.add('completed');
                document.querySelector('.step[data-step="fill"]')?.classList.add('active');
                break;
            case 'results':
                document.querySelector('.step[data-step="choose"]')?.classList.add('completed');
                document.querySelector('.step[data-step="fill"]')?.classList.add('completed');
                document.querySelector('.step[data-step="generate"]')?.classList.add('active');
                break;
        }
    },

    // Go back
    goBack() {
        if (this.state.currentStep === 'results') {
            this.state.currentStep = 'form';
        } else if (this.state.currentStep === 'form') {
            this.state.currentStep = 'start';
            this.state.selectedMethod = null;
        }
        this.saveState();
        this.updateUI();
    },

    // Update UI based on state
    updateUI() {
        // Hide all main sections
        document.querySelectorAll('.start-section, .form-container, .results-container').forEach(section => {
            section.style.display = 'none';
        });

        // Show current section
        switch(this.state.currentStep) {
            case 'start':
                document.querySelector('.start-section')?.style.display = 'block';
                break;
            case 'form':
                document.querySelector('.form-container')?.style.display = 'block';
                break;
            case 'results':
                document.querySelector('.results-container')?.style.display = 'block';
                this.displayResults();
                break;
        }

        this.updateStepIndicator();
    },

    // Smart fill form
    async smartFill() {
        const productUrl = document.getElementById('productUrl')?.value;
        if (!productUrl) {
            this.showNotification('Please enter a product URL first', 'warning');
            return;
        }

        const btn = document.querySelector('.smart-fill-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Analyzing...';
        btn.disabled = true;

        try {
            const response = await fetch('/api/extract-product-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: productUrl })
            });

            const data = await response.json();
            
            if (data.success && data.productInfo) {
                // Fill form fields
                if (data.productInfo.name) {
                    document.getElementById('productName').value = data.productInfo.name;
                }
                if (data.productInfo.category) {
                    document.getElementById('productCategory').value = data.productInfo.category;
                }
                if (data.productInfo.features) {
                    document.getElementById('keyFeatures').value = data.productInfo.features;
                }
                if (data.productInfo.description) {
                    document.getElementById('productDescription').value = data.productInfo.description;
                }
                
                this.showNotification('Product information extracted successfully!', 'success');
            } else {
                throw new Error(data.error || 'Failed to extract product information');
            }
        } catch (error) {
            this.showNotification('Failed to extract product information. Please fill manually.', 'error');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    },

    // Generate descriptions
    async generateDescriptions() {
        const formData = new FormData(document.getElementById('productForm'));
        const data = Object.fromEntries(formData);
        
        // Store form data
        this.state.formData = data;
        
        // Show loading
        this.state.currentStep = 'results';
        this.updateUI();
        this.showLoading();

        try {
            const response = await fetch('/api/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.success) {
                this.state.results = result;
                this.addToHistory(data, result);
                await this.trackGeneration(data, result);
                this.displayResults();
            } else {
                throw new Error(result.error || 'Generation failed');
            }
        } catch (error) {
            this.showNotification('Failed to generate descriptions. Please try again.', 'error');
            this.state.currentStep = 'form';
            this.updateUI();
        }
    },

    // Show loading state
    showLoading() {
        const container = document.querySelector('.results-content');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Generating your product descriptions...</p>
                </div>
            `;
        }
    },

    // Display results
    displayResults() {
        if (!this.state.results) return;

        const container = document.querySelector('.results-content');
        if (!container) return;

        const descriptions = [
            this.state.results.description1,
            this.state.results.description2,
            this.state.results.description3
        ];

        container.innerHTML = `
            <div class="results-tabs">
                <div class="tab-buttons">
                    ${descriptions.map((_, i) => `
                        <button class="tab-btn ${i === 0 ? 'active' : ''}" data-tab="description${i + 1}">
                            Version ${i + 1}
                        </button>
                    `).join('')}
                </div>
                <div class="tab-content">
                    ${descriptions.map((desc, i) => `
                        <div class="tab-pane ${i === 0 ? 'active' : ''}" id="description${i + 1}">
                            <div class="description-card">
                                <div class="description-text">${this.formatDescription(desc)}</div>
                                <div class="description-actions">
                                    <button class="copy-btn" data-content="${this.escapeHtml(desc)}">
                                        <span class="icon">📋</span> Copy
                                    </button>
                                    <div class="word-count">${desc.split(' ').length} words</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Reattach tab listeners
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    },

    // Switch tabs
    switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === tabId);
        });
        this.state.activeTab = tabId;
    },

    // Format description for display
    formatDescription(text) {
        return text
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    },

    // Add to history
    addToHistory(formData, result) {
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

    // Track generation in database
    async trackGeneration(formData, result) {
        try {
            await fetch('/api/track-generation', {
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
            });
        } catch (error) {
            console.error('Failed to track generation:', error);
        }
    },

    // Load history
    loadHistory() {
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

    // Update history UI
    updateHistoryUI() {
        const container = document.querySelector('.history-list');
        if (!container) return;

        if (this.state.history.length === 0) {
            container.innerHTML = '<p class="history-empty">No history yet</p>';
            return;
        }

        container.innerHTML = this.state.history.map(item => `
            <div class="history-item" data-id="${item.id}">
                <div class="history-time">${this.formatTime(item.timestamp)}</div>
                <div class="history-title">${this.escapeHtml(item.productName)}</div>
            </div>
        `).join('');
    },

    // Load from history
    loadFromHistory(id) {
        const item = this.state.history.find(h => h.id == id);
        if (!item) return;

        // Load form data
        Object.entries(item.formData).forEach(([key, value]) => {
            const field = document.querySelector(`[name="${key}"]`);
            if (field) field.value = value;
        });

        // Show results
        this.state.results = item.results;
        this.state.currentStep = 'results';
        this.updateUI();
    },

    // Toggle history sidebar
    toggleHistory() {
        const sidebar = document.querySelector('.history-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
        }
    },

    // Copy to clipboard
    async copyToClipboard(button) {
        const content = button.dataset.content;
        try {
            await navigator.clipboard.writeText(content);
            const originalText = button.innerHTML;
            button.innerHTML = '<span class="icon">✅</span> Copied!';
            setTimeout(() => {
                button.innerHTML = originalText;
            }, 2000);
        } catch (error) {
            this.showNotification('Failed to copy to clipboard', 'error');
        }
    },

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // Format time
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        
        return date.toLocaleDateString();
    },

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AppUX.init());
} else {
    AppUX.init();
}