// Page Transitions and Loading Effects
document.addEventListener('DOMContentLoaded', () => {
    // Add fade-in animation to the body
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    // Fade in the page
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);

    // Add transition effects to all links
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            // Don't apply transition to external links or anchor links
            if (link.hostname !== window.location.hostname || link.hash) {
                return;
            }
            
            e.preventDefault();
            
            // Add loading effect
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Loading...</p>
                </div>
            `;
            document.body.appendChild(loadingOverlay);
            
            // Fade out current page
            document.body.style.opacity = '0';
            
            // Navigate after fade out
            setTimeout(() => {
                window.location.href = link.href;
            }, 300);
        });
    });

    // Add hover effects to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add smooth scroll to top when page loads
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Add CSS for loading overlay
const style = document.createElement('style');
style.textContent = `
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(102, 126, 234, 0.9);
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
    }

    .loading-spinner {
        text-align: center;
        color: white;
    }

    .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top: 4px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }

    .loading-spinner p {
        font-size: 1.2rem;
        font-weight: 600;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    /* Smooth transitions for all elements */
    * {
        transition: all 0.3s ease;
    }

    /* Enhanced button hover effects */
    .btn {
        position: relative;
        overflow: hidden;
    }

    .btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s;
    }

    .btn:hover::before {
        left: 100%;
    }

    /* Card hover effects */
    .welcome-card, .profile-container, .file-list-container {
        transition: all 0.3s ease;
    }

    .welcome-card:hover, .profile-container:hover, .file-list-container:hover {
        transform: translateY(-5px);
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
    }

    /* Avatar hover effects */
    .avatar-circle {
        transition: all 0.3s ease;
    }

    .avatar-circle:hover {
        transform: scale(1.1) rotate(5deg);
    }

    /* File item hover effects */
    .file-item {
        transition: all 0.3s ease;
    }

    .file-item:hover {
        transform: translateX(10px) scale(1.02);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
`;
document.head.appendChild(style); 