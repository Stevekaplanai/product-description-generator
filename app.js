// Enhanced Product Description Generator
// Modern UX with history storage and Redis integration

(function() {
    'use strict';

    // Application State
    const state = {
        history: [],
        currentGeneration: null,
        stats: {
            totalGenerations: 0,
            avgWordCount: 0,
            totalTimeSaved: 0,
            seoScore: 0
        },
        selectedPresets: new Set(),
        darkMode: false,
        activeTab: 'generate',
        userId: localStorage.getItem('userId') || generateUserId()
    };

    // Generate unique user ID if needed
    function generateUserId() {
        const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', id);
        return id;
    }

    // DOM Elements Cache
    const elements = {
        // Overlays
        progressOverlay: document.getElementById('progressOverlay'),
        templatesModal: document.getElementById('templatesModal'),
        
        // Form inputs
        productName: document.getElementById('productName'),
        headlineInput: document.getElementById('headlineInput'),
        category: document.getElementById('category'),
        targetAudience: document.getElementById('targetAudience'),
        keyFeatures: document.getElementById('keyFeatures'),
        lengthSlider: document.getElementById('lengthSlider'),
        lengthValue: document.getElementById('lengthValue'),
        tone: document.getElementById('tone'),
        abTestMode: document.getElementById('abTestMode'),
        seoOptimized: document.getElementById('seoOptimized'),
        imageUpload: document.getElementById('imageUpload'),
        imageDropZone: document.getElementById('imageDropZone'),
        imagePreview: document.getElementById('imagePreview'),
        previewImg: document.getElementById('previewImg'),
        
        // Results areas
        resultsArea: document.getElementById('resultsArea'),
        historyList: document.getElementById('historyList'),
        statsPanel: document.getElementById('statsPanel'),
        
        // Stats
        totalGenerations: document.getElementById('totalGenerations'),
        avgWordCount: document.getElementById('avgWordCount'),
        seoScore: document.getElementById('seoScore'),
        savedTime: document.getElementById('savedTime')
    };

    // Initialize Application
    function init() {
        console.log('Initializing enhanced app...');
        
        // Load saved state
        loadState();
        
        // Setup event listeners
        setupEventListeners();
        
        // Load history from localStorage and server
        loadHistory();
        
        // Update UI
        updateStats();
        renderHistory();
        
        // Apply saved preferences
        applyPreferences();
        
        // Start auto-save
        startAutoSave();
        
        // Setup keyboard shortcuts
        setupKeyboardShortcuts();
    }

    // Setup Event Listeners
    function setupEventListeners() {
        // Global click handler
        document.addEventListener('click', handleGlobalClick);
        
        // Form events
        elements.lengthSlider?.addEventListener('input', updateLengthDisplay);
        elements.headlineInput?.addEventListener('blur', analyzeHeadline);
        
        // Image upload
        setupImageUpload();
        
        // Modal close on backdrop click
        elements.templatesModal?.addEventListener('click', (e) => {
            if (e.target === elements.templatesModal) {
                closeModal();
            }
        });
    }

    // Global Click Handler
    function handleGlobalClick(e) {
        const target = e.target.closest('[data-action], [data-tab], [data-template], [data-preset], .history-card');
        
        if (!target) return;
        
        // Handle actions
        if (target.dataset.action) {
            handleAction(target.dataset.action, target);
        }
        
        // Handle tabs
        if (target.dataset.tab) {
            switchTab(target.dataset.tab);
        }
        
        // Handle templates
        if (target.dataset.template) {
            applyTemplate(target.dataset.template);
        }
        
        // Handle presets
        if (target.dataset.preset) {
            togglePreset(target, target.dataset.preset);
        }
        
        // Handle history items
        if (target.classList.contains('history-card')) {
            loadHistoryItem(target.dataset.id);
        }
    }

    // Action Handler
    function handleAction(action, element) {
        switch(action) {
            case 'generate':
                generateDescription();
                break;
            case 'toggle-dark-mode':
                toggleDarkMode();
                break;
            case 'toggle-analytics':
                toggleAnalytics();
                break;
            case 'shortcuts':
                showShortcuts();
                break;
            case 'settings':
                showSettings();
                break;
            case 'analyze-headline':
                analyzeHeadline();
                break;
            case 'remove-image':
                removeImage();
                break;
            case 'clear-history':
                clearHistory();
                break;
            case 'close-modal':
                closeModal();
                break;
            case 'copy':
                copyToClipboard(element.dataset.content);
                break;
            case 'edit':
                editDescription(element.dataset.id);
                break;
            case 'delete':
                deleteFromHistory(element.dataset.id);
                break;
            case 'share':
                shareContent();
                break;
            case 'export':
                exportContent();
                break;
        }
    }

    // Generate Description
    async function generateDescription() {
        const productName = elements.productName?.value.trim();
        
        if (!productName) {
            showToast('Please enter a product name', 'error');
            return;
        }
        
        // Show progress
        showProgress('Generating description...');
        
        // Prepare data
        const formData = {
            productName,
            category: elements.category?.value,
            targetAudience: elements.targetAudience?.value,
            keyFeatures: elements.keyFeatures?.value,
            tone: elements.tone?.value || 'professional',
            wordCount: parseInt(elements.lengthSlider?.value || 150),
            abTestMode: elements.abTestMode?.checked,
            seoOptimized: elements.seoOptimized?.checked,
            presets: Array.from(state.selectedPresets),
            userId: state.userId
        };
        
        // Add image if uploaded
        if (state.uploadedImage) {
            formData.imageAnalysis = state.imageAnalysis;
            formData.hasUploadedImage = true;
        }
        
        try {
            // Call API
            const response = await fetch('/api/generate-description', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate description');
            }
            
            const result = await response.json();
            
            // Store in history (both locally and in Redis via API)
            const historyItem = {
                id: Date.now().toString(),
                productName,
                descriptions: result.descriptions,
                metadata: formData,
                timestamp: new Date().toISOString(),
                wordCount: result.descriptions[0]?.split(' ').length || 0
            };
            
            // Save to local history
            addToHistory(historyItem);
            
            // Track generation in Redis
            await trackGeneration(historyItem);
            
            // Display results
            displayResults(result.descriptions);
            
            // Update stats
            updateStats();
            
            // Show success
            showToast('Description generated successfully!', 'success');
            
        } catch (error) {
            console.error('Generation error:', error);
            showToast('Failed to generate description. Please try again.', 'error');
        } finally {
            hideProgress();
        }
    }

    // Track generation in Redis
    async function trackGeneration(historyItem) {
        try {
            await fetch('/api/track-generation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: state.userId,
                    type: 'description',
                    data: historyItem
                })
            });
        } catch (error) {
            console.error('Failed to track generation:', error);
        }
    }

    // Display Results
    function displayResults(descriptions) {
        if (!descriptions || descriptions.length === 0) {
            elements.resultsArea.innerHTML = '<p>No descriptions generated</p>';
            return;
        }
        
        const html = descriptions.map((desc, index) => `
            <div class="result-card" style="animation-delay: ${index * 0.1}s">
                <div class="result-header">
                    <h3 class="result-title">Variation ${index + 1}</h3>
                    <div class="result-actions">
                        <button class="action-btn" data-action="copy" data-content="${escapeHtml(desc)}" title="Copy">
                            📋
                        </button>
                        <button class="action-btn" data-action="edit" data-id="${index}" title="Edit">
                            ✏️
                        </button>
                    </div>
                </div>
                <div class="result-content">
                    ${escapeHtml(desc)}
                </div>
                <div class="result-meta">
                    <div class="meta-item">
                        <span>📝</span>
                        <span>${desc.split(' ').length} words</span>
                    </div>
                    <div class="meta-item">
                        <span>📊</span>
                        <span>SEO Score: ${calculateSEOScore(desc)}</span>
                    </div>
                    <div class="meta-item">
                        <span>📖</span>
                        <span>Readability: ${calculateReadability(desc)}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        elements.resultsArea.innerHTML = html;
    }

    // Add to History
    function addToHistory(item) {
        // Add to beginning of array
        state.history.unshift(item);
        
        // Limit history to 50 items
        if (state.history.length > 50) {
            state.history = state.history.slice(0, 50);
        }
        
        // Save to localStorage
        saveHistory();
        
        // Re-render history
        renderHistory();
    }

    // Render History
    function renderHistory() {
        if (!elements.historyList) return;
        
        if (state.history.length === 0) {
            elements.historyList.innerHTML = `
                <div style="text-align: center; padding: 24px; color: var(--text-light);">
                    <p>No history yet. Generate your first description!</p>
                </div>
            `;
            return;
        }
        
        const html = state.history.slice(0, 10).map(item => `
            <div class="history-card" data-id="${item.id}">
                <button class="action-btn" data-action="delete" data-id="${item.id}" 
                        style="position: absolute; top: 12px; right: 12px;">
                    🗑️
                </button>
                <div class="history-time">${formatTime(item.timestamp)}</div>
                <div class="history-title">${escapeHtml(item.productName)}</div>
                <div class="history-preview">
                    ${escapeHtml(item.descriptions[0]?.substring(0, 100) || '')}...
                </div>
            </div>
        `).join('');
        
        elements.historyList.innerHTML = html;
    }

    // Load History Item
    function loadHistoryItem(id) {
        const item = state.history.find(h => h.id === id);
        if (!item) return;
        
        // Populate form
        if (elements.productName) elements.productName.value = item.metadata.productName;
        if (elements.category) elements.category.value = item.metadata.category || '';
        if (elements.targetAudience) elements.targetAudience.value = item.metadata.targetAudience || '';
        if (elements.keyFeatures) elements.keyFeatures.value = item.metadata.keyFeatures || '';
        if (elements.tone) elements.tone.value = item.metadata.tone || 'professional';
        
        // Display results
        displayResults(item.descriptions);
        
        showToast('Loaded from history', 'info');
    }

    // Image Upload Setup
    function setupImageUpload() {
        const dropZone = elements.imageDropZone;
        const fileInput = elements.imageUpload;
        
        if (!dropZone || !fileInput) return;
        
        // Click to upload
        dropZone.addEventListener('click', () => fileInput.click());
        
        // File input change
        fileInput.addEventListener('change', handleFileSelect);
        
        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });
    }

    // Handle File Select
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    }

    // Handle File
    async function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            showToast('Please upload an image file', 'error');
            return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            if (elements.previewImg) {
                elements.previewImg.src = e.target.result;
                elements.imagePreview.style.display = 'block';
                elements.imageDropZone.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
        
        // Analyze image
        showProgress('Analyzing image...');
        
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            const response = await fetch('/api/analyze-image', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error('Image analysis failed');
            
            const analysis = await response.json();
            
            // Store analysis
            state.uploadedImage = file;
            state.imageAnalysis = analysis;
            
            // Auto-fill form
            if (analysis.productName && elements.productName) {
                elements.productName.value = analysis.productName;
            }
            if (analysis.category && elements.category) {
                elements.category.value = analysis.category;
            }
            if (analysis.features && elements.keyFeatures) {
                elements.keyFeatures.value = analysis.features.join(', ');
            }
            
            showToast('Image analyzed successfully!', 'success');
            
        } catch (error) {
            console.error('Image analysis error:', error);
            showToast('Failed to analyze image', 'error');
        } finally {
            hideProgress();
        }
    }

    // Remove Image
    function removeImage() {
        state.uploadedImage = null;
        state.imageAnalysis = null;
        
        if (elements.imagePreview) {
            elements.imagePreview.style.display = 'none';
        }
        if (elements.imageDropZone) {
            elements.imageDropZone.style.display = 'block';
        }
        if (elements.imageUpload) {
            elements.imageUpload.value = '';
        }
    }

    // Analyze Headline
    async function analyzeHeadline() {
        const headline = elements.headlineInput?.value.trim();
        if (!headline) return;
        
        showProgress('Analyzing headline...');
        
        try {
            // Simple AI-like analysis (in production, this would call an API)
            const analysis = parseHeadline(headline);
            
            // Auto-fill form
            if (analysis.productName && elements.productName) {
                elements.productName.value = analysis.productName;
            }
            if (analysis.category && elements.category) {
                elements.category.value = analysis.category;
            }
            if (analysis.features && elements.keyFeatures) {
                elements.keyFeatures.value = analysis.features.join(', ');
            }
            if (analysis.audience && elements.targetAudience) {
                elements.targetAudience.value = analysis.audience;
            }
            
            showToast('Form auto-filled from headline!', 'success');
            
        } catch (error) {
            console.error('Headline analysis error:', error);
        } finally {
            hideProgress();
        }
    }

    // Parse Headline (simplified version)
    function parseHeadline(headline) {
        const lower = headline.toLowerCase();
        
        // Extract product name (first few words)
        const productName = headline.split(' ').slice(0, 4).join(' ');
        
        // Detect category
        let category = 'other';
        if (lower.includes('headphone') || lower.includes('speaker') || lower.includes('wireless')) {
            category = 'electronics';
        } else if (lower.includes('shirt') || lower.includes('dress') || lower.includes('shoe')) {
            category = 'fashion';
        } else if (lower.includes('beauty') || lower.includes('skincare') || lower.includes('makeup')) {
            category = 'beauty';
        }
        
        // Extract features
        const features = [];
        if (lower.includes('wireless')) features.push('Wireless connectivity');
        if (lower.includes('noise cancell')) features.push('Noise cancellation');
        if (lower.includes('premium')) features.push('Premium quality');
        if (lower.includes('eco') || lower.includes('sustainable')) features.push('Eco-friendly');
        
        // Detect audience
        let audience = 'General consumers';
        if (lower.includes('professional') || lower.includes('pro')) {
            audience = 'Professionals';
        } else if (lower.includes('music lover') || lower.includes('audiophile')) {
            audience = 'Music enthusiasts';
        } else if (lower.includes('gamer') || lower.includes('gaming')) {
            audience = 'Gamers';
        }
        
        return { productName, category, features, audience };
    }

    // Toggle Preset
    function togglePreset(element, preset) {
        element.classList.toggle('active');
        
        if (state.selectedPresets.has(preset)) {
            state.selectedPresets.delete(preset);
        } else {
            state.selectedPresets.add(preset);
        }
    }

    // Apply Template
    function applyTemplate(template) {
        const templates = {
            electronics: {
                category: 'electronics',
                tone: 'technical',
                features: 'High-performance, cutting-edge technology, user-friendly interface',
                audience: 'Tech enthusiasts and early adopters'
            },
            fashion: {
                category: 'fashion',
                tone: 'luxury',
                features: 'Premium materials, trendy design, comfortable fit',
                audience: 'Fashion-conscious individuals'
            },
            food: {
                category: 'food',
                tone: 'casual',
                features: 'Fresh ingredients, delicious taste, healthy options',
                audience: 'Food lovers and health-conscious consumers'
            },
            beauty: {
                category: 'beauty',
                tone: 'luxury',
                features: 'Natural ingredients, clinically tested, visible results',
                audience: 'Beauty enthusiasts seeking quality skincare'
            },
            home: {
                category: 'home',
                tone: 'professional',
                features: 'Durable construction, modern design, space-saving',
                audience: 'Homeowners and interior design enthusiasts'
            },
            sports: {
                category: 'sports',
                tone: 'casual',
                features: 'High-performance, durable, comfortable',
                audience: 'Athletes and fitness enthusiasts'
            }
        };
        
        const tmpl = templates[template];
        if (!tmpl) return;
        
        // Apply template values
        if (elements.category) elements.category.value = tmpl.category;
        if (elements.tone) elements.tone.value = tmpl.tone;
        if (elements.keyFeatures) elements.keyFeatures.value = tmpl.features;
        if (elements.targetAudience) elements.targetAudience.value = tmpl.audience;
        
        closeModal();
        showToast(`Applied ${template} template`, 'success');
    }

    // Update Stats
    function updateStats() {
        // Calculate stats from history
        state.stats.totalGenerations = state.history.length;
        
        if (state.history.length > 0) {
            const totalWords = state.history.reduce((sum, item) => sum + (item.wordCount || 0), 0);
            state.stats.avgWordCount = Math.round(totalWords / state.history.length);
            state.stats.totalTimeSaved = Math.round(state.history.length * 15 / 60); // Assume 15 min saved per generation
            state.stats.seoScore = 85; // Placeholder
        }
        
        // Update UI
        if (elements.totalGenerations) {
            elements.totalGenerations.textContent = state.stats.totalGenerations;
        }
        if (elements.avgWordCount) {
            elements.avgWordCount.textContent = state.stats.avgWordCount;
        }
        if (elements.seoScore) {
            elements.seoScore.textContent = state.stats.seoScore;
        }
        if (elements.savedTime) {
            elements.savedTime.textContent = state.stats.totalTimeSaved + 'h';
        }
    }

    // Calculate SEO Score (simplified)
    function calculateSEOScore(text) {
        let score = 70; // Base score
        
        // Check for keywords density
        if (text.length > 100) score += 5;
        if (text.length > 200) score += 5;
        
        // Check for power words
        const powerWords = ['premium', 'quality', 'best', 'innovative', 'exclusive'];
        powerWords.forEach(word => {
            if (text.toLowerCase().includes(word)) score += 2;
        });
        
        // Cap at 100
        return Math.min(score, 100);
    }

    // Calculate Readability
    function calculateReadability(text) {
        const sentences = text.split(/[.!?]+/).length;
        const words = text.split(' ').length;
        const avgWordsPerSentence = words / sentences;
        
        if (avgWordsPerSentence < 15) return 'Easy';
        if (avgWordsPerSentence < 20) return 'Medium';
        return 'Complex';
    }

    // Toggle Dark Mode
    function toggleDarkMode() {
        state.darkMode = !state.darkMode;
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', state.darkMode);
        showToast(state.darkMode ? 'Dark mode enabled' : 'Light mode enabled', 'info');
    }

    // Toggle Analytics
    function toggleAnalytics() {
        const panel = elements.statsPanel;
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    // Setup Keyboard Shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to generate
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                generateDescription();
            }
            
            // Ctrl/Cmd + D for dark mode
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                toggleDarkMode();
            }
            
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveCurrentWork();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                closeModal();
            }
        });
    }

    // Show/Hide Progress
    function showProgress(message) {
        if (elements.progressOverlay) {
            elements.progressOverlay.classList.add('active');
            const messageEl = elements.progressOverlay.querySelector('h3');
            if (messageEl) messageEl.textContent = message;
        }
    }

    function hideProgress() {
        if (elements.progressOverlay) {
            elements.progressOverlay.classList.remove('active');
        }
    }

    // Show Toast Notification
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Copy to Clipboard
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Failed to copy', 'error');
        });
    }

    // Close Modal
    function closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // Clear History
    function clearHistory() {
        if (confirm('Are you sure you want to clear all history?')) {
            state.history = [];
            saveHistory();
            renderHistory();
            updateStats();
            showToast('History cleared', 'info');
        }
    }

    // Delete from History
    function deleteFromHistory(id) {
        state.history = state.history.filter(item => item.id !== id);
        saveHistory();
        renderHistory();
        updateStats();
    }

    // Save/Load State
    function saveHistory() {
        localStorage.setItem('generationHistory', JSON.stringify(state.history));
    }

    function loadHistory() {
        try {
            const saved = localStorage.getItem('generationHistory');
            if (saved) {
                state.history = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }

    function loadState() {
        // Load dark mode preference
        state.darkMode = localStorage.getItem('darkMode') === 'true';
        
        // Load history
        loadHistory();
    }

    function applyPreferences() {
        if (state.darkMode) {
            document.body.classList.add('dark-mode');
        }
    }

    // Auto-save
    function startAutoSave() {
        setInterval(() => {
            saveCurrentWork();
        }, 30000); // Every 30 seconds
    }

    function saveCurrentWork() {
        const draft = {
            productName: elements.productName?.value,
            category: elements.category?.value,
            targetAudience: elements.targetAudience?.value,
            keyFeatures: elements.keyFeatures?.value,
            tone: elements.tone?.value
        };
        
        localStorage.setItem('draft', JSON.stringify(draft));
    }

    // Update Length Display
    function updateLengthDisplay() {
        if (elements.lengthValue && elements.lengthSlider) {
            elements.lengthValue.textContent = elements.lengthSlider.value + ' words';
        }
    }

    // Utility: Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Utility: Format Time
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' min ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' hours ago';
        
        return date.toLocaleDateString();
    }

    // Switch Tab
    function switchTab(tab) {
        // Update nav icons
        document.querySelectorAll('.nav-icon').forEach(icon => {
            icon.classList.remove('active');
            if (icon.dataset.tab === tab) {
                icon.classList.add('active');
            }
        });
        
        state.activeTab = tab;
        
        // Handle special tabs
        if (tab === 'templates') {
            document.getElementById('templatesModal')?.classList.add('active');
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();