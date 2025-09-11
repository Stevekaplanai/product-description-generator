// Product Description Generator - Refactored JavaScript
// Using event delegation instead of inline onclick handlers

(function() {
    'use strict';

    // State management
    const state = {
        generationHistory: JSON.parse(localStorage.getItem('generationHistory') || '[]'),
        currentTemplate: null,
        selectedPresets: [],
        analytics: {
            totalGenerations: parseInt(localStorage.getItem('totalGenerations') || '0'),
            avgWordCount: 0,
            seoScore: 85,
            readabilityScore: 8.5
        },
        generatedDescriptions: [],
        currentVideoId: null,
        currentPollInterval: null,
        currentProgressInterval: null
    };

    // DOM Elements
    const elements = {
        progressOverlay: document.getElementById('progressOverlay'),
        videoProgressOverlay: document.getElementById('videoProgressOverlay'),
        templatesModal: document.getElementById('templatesModal'),
        shortcutsModal: document.getElementById('shortcutsModal'),
        shareOptions: document.getElementById('shareOptions'),
        exportOptions: document.getElementById('exportOptions'),
        analyticsPanel: document.getElementById('analyticsPanel'),
        resultsArea: document.getElementById('resultsArea'),
        resultsPanel: document.getElementById('resultsPanel'),
        historyList: document.getElementById('historyList'),
        nameSuggestions: document.getElementById('nameSuggestions'),
        imagePreview: document.getElementById('imagePreview'),
        imageDropZone: document.getElementById('imageDropZone'),
        // Form inputs
        productName: document.getElementById('productName'),
        headlineInput: document.getElementById('headlineInput'),
        category: document.getElementById('category'),
        targetAudience: document.getElementById('targetAudience'),
        keyFeatures: document.getElementById('keyFeatures'),
        lengthSlider: document.getElementById('lengthSlider'),
        lengthValue: document.getElementById('lengthValue'),
        languages: document.getElementById('languages'),
        abTestMode: document.getElementById('abTestMode'),
        videoStyle: document.getElementById('videoStyle'),
        imageUpload: document.getElementById('imageUpload')
    };

    // Initialize application
    function init() {
        setupEventListeners();
        loadHistory();
        updateAnalytics();
        setupKeyboardShortcuts();
        startAutoSave();
        loadDraft();
        
        // Initialize dark mode from preference
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        }
        
        // Feature detection
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            console.log('Voice input available');
        }
    }

    // Event Listeners using delegation
    function setupEventListeners() {
        // Main click handler for all buttons and clickable elements
        document.addEventListener('click', handleClick);
        
        // Form input events
        elements.productName?.addEventListener('input', handleProductNameInput);
        elements.headlineInput?.addEventListener('blur', analyzeHeadline);
        elements.lengthSlider?.addEventListener('input', updateLengthValue);
        
        // Drag and drop for images
        setupImageUpload();
        
        // Close modals on backdrop click
        elements.templatesModal?.addEventListener('click', (e) => {
            if (e.target === elements.templatesModal) {
                closeTemplates();
            }
        });
        
        elements.shortcutsModal?.addEventListener('click', (e) => {
            if (e.target === elements.shortcutsModal) {
                closeShortcuts();
            }
        });
    }

    // Main click handler
    function handleClick(e) {
        const target = e.target.closest('[data-action], [data-tab], [data-template], [data-preset], [data-export], .history-item, .suggestion-item');
        
        if (!target) return;
        
        // Handle data-action buttons
        if (target.dataset.action) {
            handleAction(target.dataset.action, target);
        }
        
        // Handle tab switches
        if (target.dataset.tab) {
            switchTab(target.dataset.tab);
        }
        
        // Handle template selection
        if (target.dataset.template) {
            applyTemplate(target.dataset.template);
            closeTemplates();
        }
        
        // Handle preset selection
        if (target.dataset.preset) {
            selectPreset(target, target.dataset.preset);
        }
        
        // Handle export options
        if (target.dataset.export) {
            exportAs(target.dataset.export);
        }
        
        // Handle history item click
        if (target.classList.contains('history-item')) {
            loadFromHistory(JSON.parse(target.dataset.item));
        }
        
        // Handle suggestion item click
        if (target.classList.contains('suggestion-item')) {
            applySuggestion(target.textContent);
        }
    }

    // Handle various actions
    function handleAction(action, target) {
        switch(action) {
            case 'toggle-dark-mode':
                toggleDarkMode();
                break;
            case 'toggle-analytics':
                toggleAnalytics();
                break;
            case 'show-shortcuts':
                showShortcuts();
                break;
            case 'open-templates':
                openTemplates();
                break;
            case 'close-templates':
                closeTemplates();
                break;
            case 'close-shortcuts':
                closeShortcuts();
                break;
            case 'toggle-share':
                toggleShare();
                break;
            case 'export-results':
                exportResults();
                break;
            case 'copy-link':
                copyShareLink();
                break;
            case 'generate-content':
                generateContent();
                break;
            case 'generate-image':
                generateImage();
                break;
            case 'generate-video':
                generateVideo();
                break;
            case 'analyze-headline':
                analyzeHeadline();
                break;
            case 'image-upload':
                elements.imageUpload?.click();
                break;
            case 'remove-image':
                removeImage();
                break;
            case 'cancel-generation':
                cancelVideoGeneration();
                break;
            case 'copy-description':
                copyText(target.dataset.description);
                break;
            case 'edit-description':
                editDescription(parseInt(target.dataset.index));
                break;
        }
    }

    // Core Functions
    async function generateContent() {
        const productName = elements.productName?.value;
        if (!productName) {
            showNotification('Please enter a product name', 'error');
            return;
        }
        
        showProgress();
        
        const requestData = {
            productName,
            category: elements.category?.value,
            targetAudience: elements.targetAudience?.value,
            keyFeatures: elements.keyFeatures?.value,
            length: elements.lengthSlider?.value,
            languages: Array.from(elements.languages?.selectedOptions || []).map(o => o.value),
            template: state.currentTemplate,
            presets: state.selectedPresets,
            abTest: elements.abTestMode?.checked
        };
        
        try {
            // Use relative path for API calls to avoid CORS issues
            const apiUrl = '/api/generate-description';
                
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                const descriptions = data.descriptions || [data.description];
                displayResults(descriptions);
                saveToHistory(productName, descriptions[0]);
                
                // Update analytics
                state.analytics.totalGenerations++;
                state.analytics.avgWordCount = descriptions[0].split(' ').length;
                localStorage.setItem('totalGenerations', state.analytics.totalGenerations);
                updateAnalytics();
                
                // Track with PostHog if available
                if (typeof posthog !== 'undefined') {
                    posthog.capture('content_generated', { productName });
                }
            }
        } catch (error) {
            console.error('Generation error:', error);
            showNotification('Error generating content', 'error');
        } finally {
            hideProgress();
        }
    }

    async function generateImage() {
        const productName = elements.productName?.value;
        if (!productName) {
            showNotification('Please enter a product name', 'error');
            return;
        }
        
        showProgress();
        
        try {
            // Use relative path for API calls to avoid CORS issues
            const apiUrl = '/api/generate-description';
                
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName,
                    keyFeatures: elements.keyFeatures?.value,
                    imagesOnly: true
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.images?.length > 0) {
                const imagesPanel = document.getElementById('imagesPanel');
                if (imagesPanel) {
                    imagesPanel.innerHTML = '<h3>Generated Images:</h3>';
                    data.images.forEach(img => {
                        const imgContainer = document.createElement('div');
                        imgContainer.style.margin = '20px 0';
                        imgContainer.innerHTML = `
                            <img src="${img.url}" style="width: 100%; max-width: 500px; border-radius: 10px;" />
                            <p>Style: ${img.style}</p>
                            <button class="btn btn-secondary" data-action="download-image" data-url="${img.url}" data-name="${productName}">
                                Download Image
                            </button>
                        `;
                        imagesPanel.appendChild(imgContainer);
                    });
                }
                showNotification('Image generated successfully!');
                
                if (typeof posthog !== 'undefined') {
                    posthog.capture('image_generated', { productName });
                }
            }
        } catch (error) {
            console.error('Image generation error:', error);
            showNotification('Error generating image', 'error');
        } finally {
            hideProgress();
        }
    }

    async function generateVideo() {
        const productName = elements.productName?.value;
        if (!productName) {
            showNotification('Please enter a product name', 'error');
            return;
        }
        
        showVideoProgress();
        
        try {
            // Use relative path for API calls to avoid CORS issues
            const apiUrl = '/api/generate-video';
                
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName,
                    productDescription: elements.keyFeatures?.value || 'Premium quality product',
                    features: elements.keyFeatures?.value,
                    style: elements.videoStyle?.value
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (data.videoUrl) {
                    // Video is ready
                    displayVideoResult(data.videoUrl, productName);
                    showNotification('Video generated successfully!');
                } else if (data.videoId) {
                    // Video is processing
                    state.currentVideoId = data.videoId;
                    pollVideoStatus(data.videoId, productName);
                } else {
                    // Show status message
                    showNotification(data.message || 'Video generation in progress', 'info');
                }
                
                if (typeof posthog !== 'undefined') {
                    posthog.capture('video_generated', { productName });
                }
            } else {
                showNotification('Video generation failed', 'error');
            }
        } catch (error) {
            console.error('Video generation error:', error);
            showNotification('Error generating video', 'error');
        } finally {
            if (!state.currentVideoId) {
                hideVideoProgress();
            }
        }
    }

    function displayResults(descriptions) {
        const resultsArea = elements.resultsArea;
        if (!resultsArea) return;
        
        state.generatedDescriptions = descriptions;
        
        resultsArea.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>Generated Descriptions</h3>
                <div>
                    <button class="btn btn-secondary" data-action="export-results">📥 Export</button>
                    <button class="btn btn-secondary" data-action="toggle-share">🔗 Share</button>
                </div>
            </div>
        `;
        
        descriptions.forEach((desc, index) => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.innerHTML = `
                <h3>Variation ${index + 1}</h3>
                <p style="line-height: 1.8; margin-bottom: 15px;">${desc}</p>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary" data-action="copy-description" data-description="${desc.replace(/"/g, '&quot;')}">
                        📋 Copy
                    </button>
                    <button class="btn btn-secondary" data-action="edit-description" data-index="${index}">
                        ✏️ Edit
                    </button>
                </div>
            `;
            resultsArea.appendChild(card);
        });
    }

    function displayVideoResult(videoUrl, productName) {
        const resultsPanel = elements.resultsPanel;
        if (!resultsPanel) return;
        
        resultsPanel.innerHTML = `
            <div class="result-card">
                <h3>Generated Product Video</h3>
                <video controls style="width: 100%; border-radius: 10px; margin: 20px 0;">
                    <source src="${videoUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <button class="btn btn-secondary" data-action="download-video" data-url="${videoUrl}" data-name="${productName}">
                    Download Video
                </button>
            </div>
        `;
    }

    function pollVideoStatus(videoId, productName) {
        let pollCount = 0;
        const maxPolls = 60;
        
        state.currentPollInterval = setInterval(async () => {
            pollCount++;
            
            try {
                const response = await fetch(`/api/webhooks/did-video?videoId=${videoId}`);
                const data = await response.json();
                
                updateVideoProgress(pollCount, data.status);
                
                if (data.status === 'done' && data.result_url) {
                    clearInterval(state.currentPollInterval);
                    clearInterval(state.currentProgressInterval);
                    hideVideoProgress();
                    displayVideoResult(data.result_url, productName);
                    showNotification('Video generated successfully!');
                } else if (data.status === 'error' || pollCount >= maxPolls) {
                    clearInterval(state.currentPollInterval);
                    clearInterval(state.currentProgressInterval);
                    hideVideoProgress();
                    showNotification('Video generation failed', 'error');
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 2000);
    }

    function updateVideoProgress(seconds, status) {
        const progressFill = document.getElementById('progressFill');
        const statusText = document.getElementById('statusText');
        
        if (progressFill) {
            const progress = Math.min((seconds * 2 / 120) * 100, 95);
            progressFill.style.width = `${progress}%`;
        }
        
        if (statusText) {
            if (status === 'done') {
                statusText.textContent = 'Video ready!';
            } else if (status === 'error') {
                statusText.textContent = 'Generation failed';
            } else {
                statusText.textContent = `Processing... (${seconds * 2}s)`;
            }
        }
    }

    // UI Functions
    function switchTab(tab) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        // Remove active from all icons
        document.querySelectorAll('.sidebar-icon').forEach(icon => icon.classList.remove('active'));
        
        // Show selected tab
        const tabElement = document.getElementById(tab + 'Tab');
        if (tabElement) {
            tabElement.classList.add('active');
        }
        
        // Activate icon
        const icon = document.querySelector(`.sidebar-icon[data-tab="${tab}"]`);
        if (icon) {
            icon.classList.add('active');
        }
    }

    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    }

    function toggleAnalytics() {
        const panel = elements.analyticsPanel;
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    function updateAnalytics() {
        document.getElementById('totalGenerations').textContent = state.analytics.totalGenerations;
        document.getElementById('avgWordCount').textContent = state.analytics.avgWordCount;
        document.getElementById('seoScore').textContent = state.analytics.seoScore;
        document.getElementById('readabilityScore').textContent = state.analytics.readabilityScore;
    }

    function showProgress() {
        elements.progressOverlay?.classList.add('active');
    }

    function hideProgress() {
        elements.progressOverlay?.classList.remove('active');
    }

    function showVideoProgress() {
        elements.videoProgressOverlay?.classList.add('active');
        
        // Start progress animation
        let progress = 0;
        state.currentProgressInterval = setInterval(() => {
            progress += 1;
            const progressFill = document.getElementById('progressFill');
            if (progressFill) {
                progressFill.style.width = `${Math.min(progress, 95)}%`;
            }
        }, 600);
    }

    function hideVideoProgress() {
        elements.videoProgressOverlay?.classList.remove('active');
        if (state.currentProgressInterval) {
            clearInterval(state.currentProgressInterval);
        }
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function openTemplates() {
        elements.templatesModal?.classList.add('active');
    }

    function closeTemplates() {
        elements.templatesModal?.classList.remove('active');
    }

    function showShortcuts() {
        elements.shortcutsModal?.classList.add('active');
    }

    function closeShortcuts() {
        elements.shortcutsModal?.classList.remove('active');
    }

    function toggleShare() {
        elements.shareOptions?.classList.toggle('active');
    }

    function exportResults() {
        elements.exportOptions?.classList.toggle('active');
    }

    function copyShareLink() {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        showNotification('Link copied to clipboard!');
    }

    function copyText(text) {
        navigator.clipboard.writeText(text);
        showNotification('Copied to clipboard!');
    }

    function editDescription(index) {
        const desc = state.generatedDescriptions[index];
        if (desc) {
            const newDesc = prompt('Edit description:', desc);
            if (newDesc) {
                state.generatedDescriptions[index] = newDesc;
                displayResults(state.generatedDescriptions);
            }
        }
    }

    function exportAs(format) {
        const descriptions = state.generatedDescriptions;
        if (!descriptions.length) {
            showNotification('No content to export', 'error');
            return;
        }
        
        let content = '';
        let filename = 'product-descriptions';
        let mimeType = 'text/plain';
        
        switch(format) {
            case 'txt':
                content = descriptions.join('\n\n');
                filename += '.txt';
                break;
            case 'html':
                content = `<!DOCTYPE html><html><body>${descriptions.map(d => `<p>${d}</p>`).join('')}</body></html>`;
                filename += '.html';
                mimeType = 'text/html';
                break;
            case 'json':
                content = JSON.stringify({ descriptions, metadata: { date: new Date(), product: elements.productName?.value } }, null, 2);
                filename += '.json';
                mimeType = 'application/json';
                break;
            case 'docx':
                // For Word export, we'd need a library - for now just use HTML
                content = descriptions.join('\n\n');
                filename += '.docx';
                showNotification('Word export requires additional setup', 'info');
                return;
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification(`Exported as ${format.toUpperCase()}`);
    }

    function applyTemplate(template) {
        const templates = {
            electronics: {
                category: 'electronics',
                targetAudience: 'Tech enthusiasts and gadget lovers',
                keyFeatures: 'Advanced features, cutting-edge technology, user-friendly interface'
            },
            fashion: {
                category: 'fashion',
                targetAudience: 'Fashion-conscious individuals',
                keyFeatures: 'Trendy design, premium materials, comfortable fit'
            },
            food: {
                category: 'food',
                targetAudience: 'Food lovers and culinary enthusiasts',
                keyFeatures: 'Delicious taste, natural ingredients, nutritious'
            },
            beauty: {
                category: 'beauty',
                targetAudience: 'Beauty enthusiasts',
                keyFeatures: 'Natural ingredients, dermatologist tested, visible results'
            },
            home: {
                category: 'home',
                targetAudience: 'Homeowners and interior design enthusiasts',
                keyFeatures: 'Modern design, durable materials, space-saving'
            },
            sports: {
                category: 'sports',
                targetAudience: 'Athletes and fitness enthusiasts',
                keyFeatures: 'Performance-enhancing, durable construction, ergonomic design'
            }
        };
        
        const templateData = templates[template];
        if (templateData) {
            elements.category.value = templateData.category;
            elements.targetAudience.value = templateData.targetAudience;
            elements.keyFeatures.value = templateData.keyFeatures;
            state.currentTemplate = template;
            showNotification(`Applied ${template} template`);
        }
    }

    function selectPreset(btn, preset) {
        btn.classList.toggle('active');
        const index = state.selectedPresets.indexOf(preset);
        if (index > -1) {
            state.selectedPresets.splice(index, 1);
        } else {
            state.selectedPresets.push(preset);
        }
    }

    // History Functions
    function loadHistory() {
        const historyList = elements.historyList;
        if (!historyList) return;
        
        historyList.innerHTML = '';
        state.generationHistory.slice(0, 10).forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.dataset.item = JSON.stringify(item);
            historyItem.innerHTML = `
                <strong>${item.productName}</strong>
                <p style="font-size: 12px; color: #666; margin-top: 5px;">
                    ${new Date(item.timestamp).toLocaleDateString()}
                </p>
            `;
            historyList.appendChild(historyItem);
        });
    }

    function saveToHistory(productName, description) {
        const item = {
            productName,
            description,
            timestamp: Date.now()
        };
        state.generationHistory.unshift(item);
        state.generationHistory = state.generationHistory.slice(0, 50);
        localStorage.setItem('generationHistory', JSON.stringify(state.generationHistory));
        loadHistory();
    }

    function loadFromHistory(item) {
        elements.productName.value = item.productName;
        showNotification('Loaded from history');
    }

    // Auto-save Functions
    function startAutoSave() {
        setInterval(() => {
            const productName = elements.productName?.value;
            if (productName) {
                localStorage.setItem('draftProduct', JSON.stringify({
                    productName,
                    category: elements.category?.value,
                    targetAudience: elements.targetAudience?.value,
                    keyFeatures: elements.keyFeatures?.value
                }));
            }
        }, 10000);
    }

    function loadDraft() {
        const draft = localStorage.getItem('draftProduct');
        if (draft) {
            try {
                const data = JSON.parse(draft);
                elements.productName.value = data.productName || '';
                elements.category.value = data.category || '';
                elements.targetAudience.value = data.targetAudience || '';
                elements.keyFeatures.value = data.keyFeatures || '';
            } catch (e) {
                console.error('Error loading draft:', e);
            }
        }
    }

    // Keyboard Shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'Enter':
                        e.preventDefault();
                        generateContent();
                        break;
                    case 'e':
                        e.preventDefault();
                        exportResults();
                        break;
                    case 'd':
                        e.preventDefault();
                        toggleDarkMode();
                        break;
                    case 't':
                        e.preventDefault();
                        openTemplates();
                        break;
                }
            }
        });
    }

    // Input Handlers
    function handleProductNameInput(e) {
        const value = e.target.value;
        if (value.length > 2) {
            showAISuggestions(value);
        } else {
            elements.nameSuggestions?.classList.remove('active');
        }
    }

    function showAISuggestions(value) {
        const suggestionsDiv = elements.nameSuggestions;
        if (!suggestionsDiv) return;
        
        const suggestions = generateAISuggestions(value);
        
        suggestionsDiv.innerHTML = '';
        suggestions.forEach(s => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = s;
            suggestionsDiv.appendChild(item);
        });
        
        suggestionsDiv.classList.add('active');
    }

    function generateAISuggestions(input) {
        const suggestions = [];
        const keywords = input.toLowerCase().split(' ');
        
        if (keywords.includes('wireless') || keywords.includes('bluetooth')) {
            suggestions.push(input + ' - Premium Audio Experience');
            suggestions.push(input + ' with Active Noise Cancellation');
            suggestions.push(input + ' - Professional Grade');
        } else {
            suggestions.push(input + ' - Premium Edition');
            suggestions.push(input + ' - Professional Series');
            suggestions.push(input + ' - Limited Edition');
        }
        
        return suggestions.slice(0, 3);
    }

    function applySuggestion(suggestion) {
        elements.productName.value = suggestion;
        elements.nameSuggestions?.classList.remove('active');
    }

    function updateLengthValue(e) {
        const value = e.target.value;
        const lengthValue = document.getElementById('lengthValue');
        if (lengthValue) {
            lengthValue.textContent = `${value} words`;
        }
    }

    // Headline Analysis
    async function analyzeHeadline() {
        const headline = elements.headlineInput?.value;
        if (!headline) {
            showNotification('Please enter a headline to analyze', 'error');
            return;
        }
        
        showNotification('Analyzing headline...', 'info');
        
        try {
            const response = await fetch('/api/analyze-headline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ headline })
            });
            
            if (!response.ok) {
                performClientSideAnalysis(headline);
                return;
            }
            
            const data = await response.json();
            autoFillForm(data);
        } catch (error) {
            performClientSideAnalysis(headline);
        }
    }

    function performClientSideAnalysis(headline) {
        const analysis = {
            productName: '',
            category: '',
            targetAudience: '',
            features: []
        };
        
        // Extract product name
        const nameMatch = headline.match(/^([^,\-–—]+?)(?:\s+(?:with|for|featuring|\-|–|—)|$)/i);
        analysis.productName = nameMatch ? nameMatch[1].trim() : headline.split(' ').slice(0, 4).join(' ');
        
        // Detect category
        const categories = {
            'electronics': ['headphones', 'phone', 'laptop', 'tablet', 'camera', 'speaker', 'wireless', 'bluetooth', 'smart'],
            'fashion': ['shirt', 'dress', 'shoes', 'bag', 'jacket', 'jeans', 'style', 'fashion', 'wear'],
            'home': ['furniture', 'decor', 'kitchen', 'bathroom', 'bed', 'sofa', 'table', 'chair', 'home'],
            'beauty': ['cream', 'serum', 'makeup', 'skincare', 'perfume', 'cosmetic', 'beauty', 'skin'],
            'sports': ['fitness', 'gym', 'sport', 'exercise', 'workout', 'training', 'athletic'],
            'food': ['food', 'drink', 'snack', 'beverage', 'organic', 'natural', 'healthy']
        };
        
        const lowerHeadline = headline.toLowerCase();
        for (const [cat, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => lowerHeadline.includes(keyword))) {
                analysis.category = cat;
                break;
            }
        }
        
        // Extract target audience
        const audienceMatch = headline.match(/for\s+([^,\.\-–—]+)/i);
        if (audienceMatch) {
            analysis.targetAudience = audienceMatch[1].trim();
        }
        
        // Extract features
        const featureMatch = headline.match(/with\s+([^,\.\-–—]+)/gi);
        if (featureMatch) {
            analysis.features = featureMatch.map(f => f.replace(/^with\s+/i, '').trim());
        }
        
        autoFillForm(analysis);
    }

    function autoFillForm(data) {
        if (data.productName) {
            elements.productName.value = data.productName;
        }
        if (data.category) {
            elements.category.value = data.category;
        }
        if (data.targetAudience) {
            elements.targetAudience.value = data.targetAudience;
        }
        if (data.features && data.features.length > 0) {
            elements.keyFeatures.value = data.features.join(', ');
        }
        
        showNotification('Form auto-filled from headline analysis');
    }

    // Image Upload
    function setupImageUpload() {
        const dropZone = elements.imageDropZone;
        const fileInput = elements.imageUpload;
        
        if (!dropZone || !fileInput) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
        });
        
        dropZone.addEventListener('drop', handleDrop, false);
        fileInput.addEventListener('change', handleImageUpload, false);
        
        function handleDrop(e) {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleImageFile(files[0]);
            }
        }
    }

    async function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            handleImageFile(file);
        }
    }

    async function handleImageFile(file) {
        if (!file.type.startsWith('image/')) {
            showNotification('Please upload an image file', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const previewImg = document.getElementById('previewImg');
            if (previewImg) {
                previewImg.src = e.target.result;
                elements.imagePreview.style.display = 'block';
                elements.imageDropZone.style.display = 'none';
            }
            
            // Analyze image
            try {
                const base64 = e.target.result.split(',')[1];
                const response = await fetch('/api/analyze-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64 })
                });
                
                if (response.ok) {
                    const analysis = await response.json();
                    if (analysis.suggestedDescription) {
                        elements.keyFeatures.value = analysis.suggestedDescription;
                        showNotification('Image analyzed successfully');
                    }
                }
            } catch (error) {
                console.error('Image analysis error:', error);
            }
        };
        reader.readAsDataURL(file);
    }

    function removeImage() {
        elements.imagePreview.style.display = 'none';
        elements.imageDropZone.style.display = 'block';
        elements.imageUpload.value = '';
    }

    function cancelVideoGeneration() {
        if (state.currentPollInterval) {
            clearInterval(state.currentPollInterval);
        }
        if (state.currentProgressInterval) {
            clearInterval(state.currentProgressInterval);
        }
        hideVideoProgress();
        showNotification('Video generation cancelled');
    }

    // Initialize app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();