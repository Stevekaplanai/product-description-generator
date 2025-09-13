const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');
const htmlMinifier = require('html-minifier-terser');

// Configuration
const PUBLIC_DIR = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(__dirname, '..', 'dist');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Function to minify JavaScript
async function minifyJS(inputPath, outputPath) {
  try {
    const code = fs.readFileSync(inputPath, 'utf8');
    const result = await minify(code, {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
        passes: 2
      },
      mangle: {
        toplevel: true,
        reserved: ['$', 'jQuery', 'google', 'stripe', 'posthog'] // Preserve important globals
      },
      format: {
        comments: false
      }
    });

    if (result.code) {
      fs.writeFileSync(outputPath, result.code);
      const originalSize = fs.statSync(inputPath).size;
      const minifiedSize = Buffer.byteLength(result.code);
      const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(2);
      console.log(`✓ Minified ${path.basename(inputPath)}: ${originalSize} → ${minifiedSize} bytes (${savings}% savings)`);
    }
  } catch (error) {
    console.error(`✗ Error minifying ${inputPath}:`, error.message);
  }
}

// Function to minify CSS
function minifyCSS(inputPath, outputPath) {
  try {
    const input = fs.readFileSync(inputPath, 'utf8');
    const output = new CleanCSS({
      level: 2,
      compatibility: 'ie11'
    }).minify(input);

    if (output.styles) {
      fs.writeFileSync(outputPath, output.styles);
      const originalSize = fs.statSync(inputPath).size;
      const minifiedSize = Buffer.byteLength(output.styles);
      const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(2);
      console.log(`✓ Minified ${path.basename(inputPath)}: ${originalSize} → ${minifiedSize} bytes (${savings}% savings)`);
    }
  } catch (error) {
    console.error(`✗ Error minifying ${inputPath}:`, error.message);
  }
}

// Function to optimize HTML
async function optimizeHTML(inputPath, outputPath) {
  try {
    let html = fs.readFileSync(inputPath, 'utf8');

    // Add lazy loading to images
    html = html.replace(/<img([^>]*?)src=/g, '<img$1loading="lazy" src=');

    // Add resource hints for critical domains
    const resourceHints = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://cdn.jsdelivr.net">
    <link rel="preconnect" href="https://api.stripe.com">
    <link rel="dns-prefetch" href="https://accounts.google.com">
    <link rel="dns-prefetch" href="https://res.cloudinary.com">`;

    // Add resource hints after <head> tag
    if (!html.includes('rel="preconnect"')) {
      html = html.replace('<head>', '<head>' + resourceHints);
    }

    // Add performance optimizations
    const performanceScript = `
    <script>
      // Defer non-critical CSS
      function loadCSS(href) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }

      // Progressive image loading
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
              }
            }
          });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
          imageObserver.observe(img);
        });
      }

      // Service Worker registration for caching
      if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        navigator.serviceWorker.register('/sw.js').catch(function(err) {
          console.log('Service worker registration failed:', err);
        });
      }
    </script>`;

    // Add performance script before closing body tag
    if (!html.includes('IntersectionObserver')) {
      html = html.replace('</body>', performanceScript + '</body>');
    }

    // Minify HTML
    const minified = await htmlMinifier.minify(html, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
      minifyCSS: true,
      minifyJS: true
    });

    fs.writeFileSync(outputPath, minified);
    const originalSize = fs.statSync(inputPath).size;
    const minifiedSize = Buffer.byteLength(minified);
    const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(2);
    console.log(`✓ Optimized ${path.basename(inputPath)}: ${originalSize} → ${minifiedSize} bytes (${savings}% savings)`);
  } catch (error) {
    console.error(`✗ Error optimizing ${inputPath}:`, error.message);
  }
}

// Main optimization function
async function optimize() {
  console.log('🚀 Starting optimization...\n');

  // JavaScript files to minify
  const jsFiles = [
    'app.js',
    'create-favicon.js',
    'performance-config.js'
  ];

  for (const file of jsFiles) {
    const inputPath = path.join(PUBLIC_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);
    if (fs.existsSync(inputPath)) {
      await minifyJS(inputPath, outputPath);
    }
  }

  // CSS files to minify
  const cssDir = path.join(PUBLIC_DIR, 'css');
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
    const cssOutputDir = path.join(OUTPUT_DIR, 'css');
    if (!fs.existsSync(cssOutputDir)) {
      fs.mkdirSync(cssOutputDir, { recursive: true });
    }

    for (const file of cssFiles) {
      const inputPath = path.join(cssDir, file);
      const outputPath = path.join(cssOutputDir, file);
      minifyCSS(inputPath, outputPath);
    }
  }

  // HTML files to optimize
  const htmlFiles = fs.readdirSync(PUBLIC_DIR).filter(f => f.endsWith('.html'));
  for (const file of htmlFiles) {
    const inputPath = path.join(PUBLIC_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);
    await optimizeHTML(inputPath, outputPath);
  }

  console.log('\n✅ Optimization complete!');
  console.log(`📁 Optimized files saved to: ${OUTPUT_DIR}`);
}

// Run optimization
optimize().catch(console.error);