// Authentication and User Management
let currentUser = null;
let authToken = null;

async function checkAuth() {
    // Get token from localStorage
    authToken = localStorage.getItem('token') || localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    // Allow guest access for free tier (production and development)
    if (!authToken) {
        // Check if user has used free tier
        const currentMonth = new Date().getMonth() + '_' + new Date().getFullYear();
        const usageKey = 'free_usage_' + currentMonth;
        const monthlyUsage = JSON.parse(localStorage.getItem(usageKey) || '{"count": 0, "sessions": []}');
        
        // Allow guest access for free tier
        currentUser = { 
            email: 'guest@free-tier', 
            name: 'Free User',
            subscription: 'free',
            isGuest: true
        };
        
        // Only show login prompt if they've exhausted free tier
        if (monthlyUsage.count >= 5) {
            showUpgradePrompt();
        } else {
            showFreeTierWelcome();
        }
        
        return true;
    }
    
    try {
        // Verify token with backend
        const response = await fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            // Token invalid or expired
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showLoginPrompt();
            return false;
        }
        
        // Token valid - set user
        currentUser = userStr ? JSON.parse(userStr) : null;
        showUserDashboard();
        return true;
        
    } catch (error) {
        console.error('Auth check failed:', error);
        showLoginPrompt();
        return false;
    }
}

function showLoginPrompt() {
    // Create login prompt overlay
    const overlay = document.createElement('div');
    overlay.id = 'authOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    overlay.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 20px; max-width: 450px; width: 100%; text-align: center;">
            <h2 style="margin-bottom: 20px; color: #333;">Welcome to ProductDescriptions.io</h2>
            <p style="color: #666; margin-bottom: 30px;">Sign in to start generating amazing product content with AI</p>
            
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <a href="/auth.html" style="display: block; padding: 14px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
                    Sign In / Sign Up
                </a>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
                Sign up to get 5 free descriptions per month
            </p>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

function showUserDashboard() {
    // Remove any login overlay
    const overlay = document.getElementById('authOverlay');
    if (overlay) overlay.remove();
    
    // Don't show dashboard if no valid user
    if (!currentUser || !currentUser.email) {
        return;
    }
    
    // Add user info to header
    const header = document.querySelector('header');
    const userSection = document.createElement('div');
    userSection.id = 'userDashboard';
    userSection.style.cssText = `
        background: rgba(255,255,255,0.1);
        border-radius: 10px;
        padding: 10px 20px;
        margin-top: 20px;
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
    `;
    
    userSection.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            ${currentUser?.picture ? `<img src="${currentUser.picture}" alt="Profile" style="width: 40px; height: 40px; border-radius: 50%;">` : ''}
            <div>
                <div style="color: white; font-weight: 600;">${currentUser?.name || 'Guest User'}</div>
                <div style="color: rgba(255,255,255,0.8); font-size: 14px;">${currentUser?.email || 'Not signed in'}</div>
            </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
            <span style="color: white; font-size: 14px; background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 20px;">
                ${currentUser?.subscription === 'free' ? 'Free Plan' : currentUser?.subscription || 'Guest'}
            </span>
            ${currentUser ? `
                <button onclick="manageAccount()" style="padding: 8px 15px; background: white; color: #667eea; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">
                    Manage Account
                </button>
                <button onclick="logout()" style="padding: 8px 15px; background: transparent; color: white; border: 1px solid white; border-radius: 5px; cursor: pointer;">
                    Logout
                </button>
            ` : `
                <a href="/auth.html" style="padding: 8px 15px; background: white; color: #667eea; text-decoration: none; border-radius: 5px; font-weight: 600;">
                    Sign In
                </a>
            `}
        </div>
    `;
    
    // Insert after header content
    const existingDashboard = document.getElementById('userDashboard');
    if (!existingDashboard) {
        header.appendChild(userSection);
        
        // Adjust body padding on mobile to account for header height
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                const headerHeight = header.offsetHeight;
                document.body.style.paddingTop = (headerHeight + 10) + 'px';
            }, 100);
        }
    }
}

// Guest mode removed - users must sign up

function manageAccount() {
    // Check if user has Stripe subscription
    if (currentUser?.subscription && currentUser.subscription !== 'free' && currentUser.subscription !== 'guest') {
        openCustomerPortal();
    } else {
        showPricingModal();
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('monthlyUsage');
    window.location.href = '/';
}

// Initialize auth check on page load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', checkAuth);
    
    // Handle window resize and orientation changes
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const header = document.querySelector('header');
            if (header && window.innerWidth <= 768) {
                const headerHeight = header.offsetHeight;
                document.body.style.paddingTop = (headerHeight + 10) + 'px';
            }
        }, 250);
    });
}

// Show free tier welcome for new users
function showFreeTierWelcome() {
    // Don't show if already seen
    if (localStorage.getItem('seen_free_tier_welcome')) {
        return;
    }
    
    const welcome = document.createElement('div');
    welcome.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        max-width: 500px;
        width: 90%;
        z-index: 10001;
        text-align: center;
        animation: fadeIn 0.3s ease;
    `;
    
    welcome.innerHTML = `
        <h2 style="color: #667eea; margin-bottom: 20px; font-size: 28px;">🎉 Welcome to ProductDescriptions.io!</h2>
        <p style="color: #666; font-size: 18px; margin-bottom: 25px;">
            Start creating amazing product content with AI - <strong>no signup required!</strong>
        </p>
        <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 20px; border-radius: 12px; margin-bottom: 25px;">
            <h3 style="color: #667eea; margin-bottom: 15px;">Your Free Tier Includes:</h3>
            <ul style="text-align: left; color: #555; list-style: none; padding: 0;">
                <li style="margin-bottom: 10px;">✅ <strong>5 free generations</strong> per month</li>
                <li style="margin-bottom: 10px;">✅ SEO-optimized descriptions</li>
                <li style="margin-bottom: 10px;">✅ Professional product images</li>
                <li style="margin-bottom: 10px;">✅ Multiple variations</li>
                <li>✅ No credit card required</li>
            </ul>
        </div>
        <button onclick="this.parentElement.remove(); localStorage.setItem('seen_free_tier_welcome', 'true');" 
                style="padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 25px; font-size: 18px; font-weight: bold; cursor: pointer; transition: transform 0.2s;">
            Start Creating Free
        </button>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
            Upgrade anytime for unlimited generations
        </p>
    `;
    
    document.body.appendChild(welcome);
}

// Show upgrade prompt when free tier is exhausted
function showUpgradePrompt() {
    const prompt = document.createElement('div');
    prompt.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
        color: white;
        padding: 12px 25px;
        border-radius: 25px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    
    prompt.innerHTML = `
        ⚠️ Free tier limit reached! 
        <a href="/auth.html" style="color: white; text-decoration: underline; margin-left: 10px;">Sign up for unlimited access →</a>
    `;
    
    document.body.appendChild(prompt);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { checkAuth, currentUser, authToken };
}