// Utility functions for ProductDescriptions.io

// Loading Spinner Component
class LoadingSpinner {
    constructor() {
        this.spinner = null;
    }

    show(container, message = 'Loading...') {
        this.hide(); // Remove any existing spinner
        
        const spinnerHTML = `
            <div class="loading-spinner-container">
                <div class="loading-spinner"></div>
                <p class="loading-message">${message}</p>
            </div>
        `;
        
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (container) {
            this.spinner = document.createElement('div');
            this.spinner.className = 'loading-overlay';
            this.spinner.innerHTML = spinnerHTML;
            container.appendChild(this.spinner);
        }
    }

    hide() {
        if (this.spinner && this.spinner.parentNode) {
            this.spinner.parentNode.removeChild(this.spinner);
            this.spinner = null;
        }
    }
}

// Image Compression Utility
function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        if (!file.type.match(/image.*/)) {
            reject(new Error('File is not an image'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        // Create new file with compressed blob
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    } else {
                        reject(new Error('Compression failed'));
                    }
                }, 'image/jpeg', quality);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// Image Preview Utility
function createImagePreview(file, container) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <div class="image-info">
                    <span class="image-name">${file.name}</span>
                    <span class="image-size">${(file.size / 1024).toFixed(2)} KB</span>
                </div>
                <button class="remove-image" onclick="this.parentElement.remove()">×</button>
            `;
            
            if (typeof container === 'string') {
                container = document.querySelector(container);
            }
            
            if (container) {
                container.appendChild(preview);
            }
            resolve(preview);
        };
        reader.readAsDataURL(file);
    });
}

// Auto-save Functionality
class AutoSave {
    constructor(form, storageKey = 'formDraft', interval = 2000) {
        this.form = typeof form === 'string' ? document.querySelector(form) : form;
        this.storageKey = storageKey;
        this.interval = interval;
        this.timer = null;
        this.lastSave = null;
        
        if (this.form) {
            this.init();
        }
    }

    init() {
        // Add event listeners to form inputs
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.scheduleSave());
            input.addEventListener('change', () => this.scheduleSave());
        });
        
        // Load saved draft on init
        this.loadDraft();
    }

    scheduleSave() {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.save(), this.interval);
    }

    save() {
        const formData = new FormData(this.form);
        const data = {};
        
        formData.forEach((value, key) => {
            data[key] = value;
        });
        
        localStorage.setItem(this.storageKey, JSON.stringify({
            data: data,
            timestamp: Date.now()
        }));
        
        this.lastSave = Date.now();
        this.showSaveIndicator();
    }

    loadDraft() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                const { data, timestamp } = JSON.parse(saved);
                
                // Only load if draft is less than 24 hours old
                if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                    Object.entries(data).forEach(([key, value]) => {
                        const input = this.form.querySelector(`[name="${key}"]`);
                        if (input) {
                            input.value = value;
                        }
                    });
                    
                    this.showNotification('Draft loaded', 'info');
                }
            } catch (e) {
                console.error('Failed to load draft:', e);
            }
        }
    }

    clearDraft() {
        localStorage.removeItem(this.storageKey);
        this.showNotification('Draft cleared', 'success');
    }

    showSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'save-indicator';
        indicator.textContent = 'Draft saved';
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            indicator.classList.remove('show');
            setTimeout(() => indicator.remove(), 300);
        }, 2000);
    }

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
    }
}

// Form Validation Helper
class FormValidator {
    constructor(form) {
        this.form = typeof form === 'string' ? document.querySelector(form) : form;
        this.errors = {};
        this.validators = {};
        
        if (this.form) {
            this.init();
        }
    }

    init() {
        this.form.addEventListener('submit', (e) => {
            if (!this.validateAll()) {
                e.preventDefault();
                this.showErrors();
            }
        });
        
        // Add real-time validation
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => {
                if (this.errors[input.name]) {
                    this.validateField(input);
                }
            });
        });
    }

    addValidator(fieldName, validator, message) {
        if (!this.validators[fieldName]) {
            this.validators[fieldName] = [];
        }
        this.validators[fieldName].push({ validator, message });
    }

    validateField(field) {
        const fieldName = field.name;
        const value = field.value;
        
        // Clear previous errors
        delete this.errors[fieldName];
        this.clearFieldError(field);
        
        // Required validation
        if (field.hasAttribute('required') && !value.trim()) {
            this.setFieldError(field, `${this.getFieldLabel(field)} is required`);
            return false;
        }
        
        // Custom validators
        if (this.validators[fieldName]) {
            for (const { validator, message } of this.validators[fieldName]) {
                if (!validator(value)) {
                    this.setFieldError(field, message);
                    return false;
                }
            }
        }
        
        // Built-in HTML5 validation
        if (!field.checkValidity()) {
            this.setFieldError(field, field.validationMessage);
            return false;
        }
        
        this.setFieldSuccess(field);
        return true;
    }

    validateAll() {
        const inputs = this.form.querySelectorAll('input, textarea, select');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    setFieldError(field, message) {
        this.errors[field.name] = message;
        field.classList.add('error');
        field.classList.remove('success');
        
        // Show error message
        let errorEl = field.parentElement.querySelector('.field-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'field-error';
            field.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = message;
    }

    setFieldSuccess(field) {
        field.classList.remove('error');
        field.classList.add('success');
        this.clearFieldError(field);
    }

    clearFieldError(field) {
        const errorEl = field.parentElement.querySelector('.field-error');
        if (errorEl) {
            errorEl.remove();
        }
    }

    getFieldLabel(field) {
        const label = this.form.querySelector(`label[for="${field.id}"]`);
        return label ? label.textContent : field.name;
    }

    showErrors() {
        const firstError = this.form.querySelector('.error');
        if (firstError) {
            firstError.focus();
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// Progress Bar Component
class ProgressBar {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            showPercentage: true,
            showText: true,
            animated: true,
            ...options
        };
        this.current = 0;
        this.total = 100;
        
        if (this.container) {
            this.render();
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="progress-bar-wrapper">
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: 0%"></div>
                </div>
                ${this.options.showText ? '<div class="progress-text"></div>' : ''}
                ${this.options.showPercentage ? '<div class="progress-percentage">0%</div>' : ''}
            </div>
        `;
        
        this.fillElement = this.container.querySelector('.progress-bar-fill');
        this.textElement = this.container.querySelector('.progress-text');
        this.percentageElement = this.container.querySelector('.progress-percentage');
        
        if (this.options.animated) {
            this.fillElement.style.transition = 'width 0.3s ease';
        }
    }

    update(current, total, text = '') {
        this.current = current;
        this.total = total || 100;
        
        const percentage = Math.min(100, Math.round((current / this.total) * 100));
        
        if (this.fillElement) {
            this.fillElement.style.width = `${percentage}%`;
        }
        
        if (this.percentageElement) {
            this.percentageElement.textContent = `${percentage}%`;
        }
        
        if (this.textElement) {
            this.textElement.textContent = text || `${current} / ${this.total}`;
        }
    }

    setProgress(percentage, text = '') {
        this.update(percentage, 100, text);
    }

    complete(message = 'Complete!') {
        this.update(this.total, this.total, message);
        
        if (this.fillElement) {
            this.fillElement.classList.add('complete');
        }
    }

    reset() {
        this.update(0, 100, '');
        
        if (this.fillElement) {
            this.fillElement.classList.remove('complete');
        }
    }
}

// Touch Gesture Support
class TouchGestures {
    constructor(element, options = {}) {
        this.element = typeof element === 'string' ? document.querySelector(element) : element;
        this.options = {
            swipeThreshold: 50,
            ...options
        };
        this.touchStart = null;
        
        if (this.element) {
            this.init();
        }
    }

    init() {
        this.element.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.element.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
        this.element.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    }

    handleTouchStart(e) {
        this.touchStart = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            time: Date.now()
        };
    }

    handleTouchMove(e) {
        if (!this.touchStart) return;
        
        const deltaX = e.touches[0].clientX - this.touchStart.x;
        const deltaY = e.touches[0].clientY - this.touchStart.y;
        
        // Prevent scrolling if horizontal swipe is detected
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            e.preventDefault();
        }
    }

    handleTouchEnd(e) {
        if (!this.touchStart) return;
        
        const touchEnd = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
            time: Date.now()
        };
        
        const deltaX = touchEnd.x - this.touchStart.x;
        const deltaY = touchEnd.y - this.touchStart.y;
        const deltaTime = touchEnd.time - this.touchStart.time;
        
        // Detect swipe
        if (Math.abs(deltaX) > this.options.swipeThreshold && deltaTime < 500) {
            if (deltaX > 0) {
                this.element.dispatchEvent(new CustomEvent('swiperight', { detail: { deltaX, deltaY } }));
            } else {
                this.element.dispatchEvent(new CustomEvent('swipeleft', { detail: { deltaX, deltaY } }));
            }
        }
        
        if (Math.abs(deltaY) > this.options.swipeThreshold && deltaTime < 500) {
            if (deltaY > 0) {
                this.element.dispatchEvent(new CustomEvent('swipedown', { detail: { deltaX, deltaY } }));
            } else {
                this.element.dispatchEvent(new CustomEvent('swipeup', { detail: { deltaX, deltaY } }));
            }
        }
        
        // Detect tap
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
            this.element.dispatchEvent(new CustomEvent('tap', { detail: { x: touchEnd.x, y: touchEnd.y } }));
        }
        
        this.touchStart = null;
    }
}

// Keyboard Shortcuts
class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    add(key, callback, options = {}) {
        const shortcut = {
            key: key.toLowerCase(),
            ctrl: options.ctrl || false,
            alt: options.alt || false,
            shift: options.shift || false,
            meta: options.meta || false,
            callback,
            description: options.description || ''
        };
        
        const id = this.getShortcutId(shortcut);
        this.shortcuts.set(id, shortcut);
    }

    remove(key, options = {}) {
        const shortcut = {
            key: key.toLowerCase(),
            ctrl: options.ctrl || false,
            alt: options.alt || false,
            shift: options.shift || false,
            meta: options.meta || false
        };
        
        const id = this.getShortcutId(shortcut);
        this.shortcuts.delete(id);
    }

    getShortcutId(shortcut) {
        const parts = [];
        if (shortcut.ctrl) parts.push('ctrl');
        if (shortcut.alt) parts.push('alt');
        if (shortcut.shift) parts.push('shift');
        if (shortcut.meta) parts.push('meta');
        parts.push(shortcut.key);
        return parts.join('+');
    }

    handleKeydown(e) {
        const shortcut = {
            key: e.key.toLowerCase(),
            ctrl: e.ctrlKey,
            alt: e.altKey,
            shift: e.shiftKey,
            meta: e.metaKey
        };
        
        const id = this.getShortcutId(shortcut);
        const handler = this.shortcuts.get(id);
        
        if (handler) {
            e.preventDefault();
            handler.callback(e);
        }
    }

    getList() {
        const list = [];
        this.shortcuts.forEach(shortcut => {
            const keys = [];
            if (shortcut.ctrl) keys.push('Ctrl');
            if (shortcut.alt) keys.push('Alt');
            if (shortcut.shift) keys.push('Shift');
            if (shortcut.meta) keys.push('Cmd/Win');
            keys.push(shortcut.key.toUpperCase());
            
            list.push({
                combo: keys.join(' + '),
                description: shortcut.description
            });
        });
        return list;
    }
}

// Export utilities
window.AppUtils = {
    LoadingSpinner,
    compressImage,
    createImagePreview,
    AutoSave,
    FormValidator,
    ProgressBar,
    TouchGestures,
    KeyboardShortcuts
};