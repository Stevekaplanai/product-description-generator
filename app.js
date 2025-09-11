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
                if (e.target.classList.contains('history-item')) {
                    self.loadFromHistory(e.target.dataset.id);
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
            if (!this.state.results) return;

            const container = document.querySelector('.results-content');
            if (!container) return;

            const descriptions = [
                this.state.results.description1 || '',
                this.state.results.description2 || '',
                this.state.results.description3 || ''
            ];

            let html = '<div class="results-tabs"><div class="tab-buttons">';
            
            descriptions.forEach(function(desc, i) {
                html += '<button class="tab-btn ' + (i === 0 ? 'active' : '') + '" data-tab="description' + (i + 1) + '">Version ' + (i + 1) + '</button>';
            });
            
            html += '</div><div class="tab-content">';
            
            descriptions.forEach(function(desc, i) {
                const wordCount = desc ? desc.split(' ').length : 0;
                html += '<div class="tab-pane ' + (i === 0 ? 'active' : '') + '" id="description' + (i + 1) + '">';
                html += '<div class="description-card">';
                html += '<div class="description-text">' + self.formatDescription(desc) + '</div>';
                html += '<div class="description-actions">';
                html += '<button class="copy-btn" data-content="' + self.escapeHtml(desc) + '"><span class="icon">📋</span> Copy</button>';
                html += '<div class="word-count">' + wordCount + ' words</div>';
                html += '</div></div></div>';
            });
            
            html += '</div></div>';
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
            return text
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
            const item = this.state.history.find(function(h) { return h.id == id; });
            if (!item) return;

            Object.entries(item.formData).forEach(function(entry) {
                const field = document.querySelector('[name="' + entry[0] + '"]');
                if (field) field.value = entry[1];
            });

            this.state.results = item.results;
            this.state.currentStep = 'results';
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