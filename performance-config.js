// Performance Optimization Configuration
// This file contains performance optimizations for the application

// Lazy Loading for Images
document.addEventListener('DOMContentLoaded', function() {
    // Add lazy loading to all images
    const images = document.querySelectorAll('img');
    
    if ('loading' in HTMLImageElement.prototype) {
        // Native lazy loading supported
        images.forEach(img => {
            if (!img.complete) {
                img.loading = 'lazy';
            }
        });
    } else {
        // Fallback to Intersection Observer
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => {
            if (!img.complete) {
                imageObserver.observe(img);
            }
        });
    }
});

// Preload critical resources
function preloadCriticalResources() {
    // Preload fonts
    const fontPreload = document.createElement('link');
    fontPreload.rel = 'preload';
    fontPreload.as = 'font';
    fontPreload.type = 'font/woff2';
    fontPreload.crossOrigin = 'anonymous';
    fontPreload.href = 'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2';
    document.head.appendChild(fontPreload);
}

// Resource hints for faster connections
function addResourceHints() {
    const hints = [
        { rel: 'dns-prefetch', href: 'https://api.openai.com' },
        { rel: 'dns-prefetch', href: 'https://generativelanguage.googleapis.com' },
        { rel: 'dns-prefetch', href: 'https://res.cloudinary.com' },
        { rel: 'dns-prefetch', href: 'https://api.d-id.com' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true }
    ];
    
    hints.forEach(hint => {
        const link = document.createElement('link');
        link.rel = hint.rel;
        link.href = hint.href;
        if (hint.crossorigin) link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
    });
}

// Debounce function for input handlers
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll handlers
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Cache API responses
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function cachedFetch(url, options = {}) {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    const cached = apiCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return Promise.resolve(cached.response.clone());
    }
    
    const response = await fetch(url, options);
    apiCache.set(cacheKey, {
        response: response.clone(),
        timestamp: Date.now()
    });
    
    return response;
}

// WebP support detection and fallback
function supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
}

// Progressive image loading
function loadImageProgressive(img, lowQualitySrc, highQualitySrc) {
    const tempImg = new Image();
    
    // Load low quality first
    img.src = lowQualitySrc;
    img.classList.add('loading');
    
    // Then load high quality
    tempImg.onload = function() {
        img.src = highQualitySrc;
        img.classList.remove('loading');
        img.classList.add('loaded');
    };
    tempImg.src = highQualitySrc;
}

// Initialize performance optimizations
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        preloadCriticalResources();
        addResourceHints();
    });
} else {
    preloadCriticalResources();
    addResourceHints();
}

// Export utilities for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debounce,
        throttle,
        cachedFetch,
        supportsWebP,
        loadImageProgressive
    };
}