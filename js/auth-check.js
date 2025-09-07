// Authentication and User Management
let currentUser = null;
let authToken = null;

async function checkAuth() {
    // Get token from localStorage
    authToken = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!authToken) {
        // Not logged in - show login prompt
        showLoginPrompt();
        return false;
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
                
                <button onclick="continueAsGuest()" style="padding: 14px 20px; background: #f5f5f5; color: #333; border: none; border-radius: 10px; font-weight: 600; font-size: 16px; cursor: pointer;">
                    Continue as Guest (Limited)
                </button>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
                Free users get 5 descriptions per month
            </p>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

function showUserDashboard() {
    // Remove any login overlay
    const overlay = document.getElementById('authOverlay');
    if (overlay) overlay.remove();
    
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

function continueAsGuest() {
    // Allow limited guest access
    const overlay = document.getElementById('authOverlay');
    if (overlay) overlay.remove();
    
    // Set guest user
    currentUser = {
        name: 'Guest',
        email: null,
        subscription: 'guest'
    };
    
    showUserDashboard();
}

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

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { checkAuth, currentUser, authToken };
}