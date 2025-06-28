document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        // Создаем анимированную плашку
        const banner = document.createElement('div');
        banner.className = 'no-token-banner';
        banner.innerHTML = `
            <div class="no-token-content">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="24" cy="24" r="22" stroke="#e74c3c" stroke-width="4" fill="#fff3f3"/>
                  <path d="M16 32L32 16" stroke="#e74c3c" stroke-width="4" stroke-linecap="round"/>
                  <path d="M16 16L32 32" stroke="#e74c3c" stroke-width="4" stroke-linecap="round"/>
                </svg>
                <div class="no-token-title">Вы не авторизованы</div>
                <div class="no-token-desc">Для просмотра профиля необходимо войти в систему.<br>Сейчас вы будете перенаправлены на страницу входа...</div>
            </div>
        `;
        document.body.innerHTML = '';
        document.body.appendChild(banner);
        // Добавляем стили и анимацию
        const style = document.createElement('style');
        style.textContent = `
        .no-token-banner {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, #fff3f3 0%, #ffe6e6 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: fadeInBanner 0.7s cubic-bezier(.4,2,.6,1) both;
        }
        .no-token-content {
            background: #fff;
            border-radius: 24px;
            box-shadow: 0 8px 32px rgba(231,76,60,0.12);
            padding: 2.5rem 3.5rem;
            text-align: center;
            animation: popInBanner 0.7s cubic-bezier(.4,2,.6,1) both;
        }
        .no-token-title {
            color: #e74c3c;
            font-size: 2rem;
            font-weight: 700;
            margin-top: 1.2rem;
            margin-bottom: 0.5rem;
            letter-spacing: 0.5px;
        }
        .no-token-desc {
            color: #b94a48;
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
            margin-top: 0.5rem;
        }
        @keyframes fadeInBanner {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes popInBanner {
            0% { transform: scale(0.8) translateY(40px); opacity: 0; }
            80% { transform: scale(1.05) translateY(-8px); opacity: 1; }
            100% { transform: scale(1) translateY(0); }
        }
        `;
        document.head.appendChild(style);
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2500);
        return;
    }

    // DOM Elements
    const profileAvatar = document.getElementById('profile-avatar');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const changePasswordBtn = document.getElementById('change-password-btn');
    const resendVerificationBtn = document.getElementById('resend-verification-btn');
    
    // Display elements
    const displayUsername = document.getElementById('display-username');
    const displayEmail = document.getElementById('display-email');
    const displayRole = document.getElementById('display-role');
    const displayCreated = document.getElementById('display-created');
    const displayStatus = document.getElementById('display-status');
    const displayEmailVerified = document.getElementById('display-email-verified');
    const display2FA = document.getElementById('display-2fa');
    const displayLastLogin = document.getElementById('display-last-login');
    const displayStorageUsed = document.getElementById('display-storage-used');
    const displayStorageQuota = document.getElementById('display-storage-quota');
    const displayFailedAttempts = document.getElementById('display-failed-attempts');
    const displayLockedUntil = document.getElementById('display-locked-until');
    
    // Progress bar elements
    const storageProgressFill = document.getElementById('storage-progress-fill');
    const storagePercentage = document.getElementById('storage-percentage');
    
    // Modal elements
    const editModal = document.getElementById('edit-modal');
    const passwordModal = document.getElementById('password-modal');
    const editForm = document.getElementById('edit-profile-form');
    const passwordForm = document.getElementById('change-password-form');
    
    // Form elements
    const editUsername = document.getElementById('edit-username');
    const currentPassword = document.getElementById('current-password');
    const newPassword = document.getElementById('new-password');
    const confirmPassword = document.getElementById('confirm-password');

    // Utility functions
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    const showNotification = (message, type = 'info') => {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 3000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.background = '#27ae60';
                break;
            case 'error':
                notification.style.background = '#e74c3c';
                break;
            case 'warning':
                notification.style.background = '#f39c12';
                break;
            default:
                notification.style.background = '#3498db';
        }
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    };

    // Generate pixel art avatar
    const generateAvatar = (username) => {
        const colors = [
            '#3498db', '#e74c3c', '#2ecc71', '#f39c12', 
            '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
        ];
        
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const color1 = colors[Math.abs(hash) % colors.length];
        const color2 = colors[(Math.abs(hash) + 1) % colors.length];
        
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, 64, 64);
        
        ctx.fillStyle = color2;
        for (let i = 0; i < username.length; i++) {
            const x = (i * 7) % 64;
            const y = (i * 11) % 64;
            ctx.fillRect(x, y, 4, 4);
        }
        
        for (let i = 0; i < 8; i++) {
            const x = Math.floor(Math.random() * 64);
            const y = Math.floor(Math.random() * 64);
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            ctx.fillRect(x, y, 2, 2);
        }
        
        return canvas.toDataURL();
    };

    // Load user profile
    const loadUserProfile = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/v1/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const user = await res.json();
                updateProfileDisplay(user);
            } else if (res.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
            } else {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
            showNotification('Failed to load profile data', 'error');
            showDemoProfile();
        }
    };

    // Update profile display with user data
    const updateProfileDisplay = (user) => {
        // Basic information
        displayUsername.textContent = user.username || 'Unknown';
        displayEmail.textContent = user.email || 'Unknown';
        displayRole.textContent = user.role || 'User';
        displayCreated.textContent = formatDate(user.created_at);
        
        // Account status
        const statusBadge = displayStatus;
        if (user.is_active) {
            statusBadge.textContent = 'Active';
            statusBadge.className = 'status-badge success';
        } else {
            statusBadge.textContent = 'Inactive';
            statusBadge.className = 'status-badge error';
        }
        
        // Email verification
        const emailVerifiedBadge = displayEmailVerified;
        if (user.is_email_verified) {
            emailVerifiedBadge.textContent = 'Verified';
            emailVerifiedBadge.className = 'status-badge success';
            resendVerificationBtn.style.display = 'none';
        } else {
            emailVerifiedBadge.textContent = 'Not Verified';
            emailVerifiedBadge.className = 'status-badge warning';
            resendVerificationBtn.style.display = 'inline-block';
        }
        
        // Two-factor authentication
        const twoFactorBadge = display2FA;
        if (user.two_factor_enabled) {
            twoFactorBadge.textContent = 'Enabled';
            twoFactorBadge.className = 'status-badge success';
        } else {
            twoFactorBadge.textContent = 'Disabled';
            twoFactorBadge.className = 'status-badge info';
        }
        
        // Last login
        if (user.last_login_at) {
            document.getElementById('last-login-item').style.display = 'flex';
            displayLastLogin.textContent = formatDate(user.last_login_at);
        }
        
        // Storage information
        const usedSpace = user.used_space || 0;
        const storageQuota = user.storage_quota || 10737418240; // 10 GB default
        
        displayStorageUsed.textContent = formatBytes(usedSpace);
        displayStorageQuota.textContent = formatBytes(storageQuota);
        
        // Update progress bar
        const percentage = Math.min((usedSpace / storageQuota) * 100, 100);
        storageProgressFill.style.width = `${percentage}%`;
        storagePercentage.textContent = `${percentage.toFixed(1)}%`;
        
        // Change progress bar color based on usage
        if (percentage > 90) {
            storageProgressFill.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
        } else if (percentage > 70) {
            storageProgressFill.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
        } else {
            storageProgressFill.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        }
        
        // Security information (only show if there are issues)
        const securitySection = document.getElementById('security-section');
        const failedAttemptsItem = document.getElementById('failed-attempts-item');
        const lockedUntilItem = document.getElementById('locked-until-item');
        
        if (user.failed_login_attempts > 0 || user.locked_until) {
            securitySection.style.display = 'block';
            
            if (user.failed_login_attempts > 0) {
                failedAttemptsItem.style.display = 'flex';
                displayFailedAttempts.textContent = user.failed_login_attempts;
            }
            
            if (user.locked_until) {
                lockedUntilItem.style.display = 'flex';
                const lockedUntil = new Date(user.locked_until);
                const now = new Date();
                
                if (lockedUntil > now) {
                    displayLockedUntil.textContent = formatDate(user.locked_until);
                    displayLockedUntil.className = 'status-badge error';
                } else {
                    displayLockedUntil.textContent = 'Not locked';
                    displayLockedUntil.className = 'status-badge success';
                }
            }
        }
        
        // Generate and set avatar
        const username = user.username || user.email || 'User';
        const avatarDataUrl = generateAvatar(username);
        
        const avatarImg = document.createElement('img');
        avatarImg.src = avatarDataUrl;
        avatarImg.style.width = '100%';
        avatarImg.style.height = '100%';
        avatarImg.style.borderRadius = '50%';
        
        profileAvatar.innerHTML = '';
        profileAvatar.appendChild(avatarImg);
    };

    // Show demo profile when backend is not available
    const showDemoProfile = () => {
        const demoUser = {
            username: 'Demo User',
            email: 'demo@example.com',
            role: 'User',
            created_at: '2024-01-15T10:30:00Z',
            is_active: true,
            is_email_verified: false,
            two_factor_enabled: false,
            last_login_at: '2024-01-20T14:45:00Z',
            used_space: 2147483648, // 2 GB
            storage_quota: 10737418240, // 10 GB
            failed_login_attempts: 0,
            locked_until: null
        };
        
        updateProfileDisplay(demoUser);
        showNotification('Showing demo data - backend not available', 'warning');
    };

    // Modal management
    const openModal = (modal) => {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    };

    const closeModal = (modal) => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeModal(editModal);
        }
        if (e.target === passwordModal) {
            closeModal(passwordModal);
        }
    });

    // Close modals with X button
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeModal(editModal);
            closeModal(passwordModal);
        });
    });

    // Edit profile functionality
    editProfileBtn.addEventListener('click', () => {
        editUsername.value = displayUsername.textContent;
        openModal(editModal);
    });

    document.getElementById('cancel-edit').addEventListener('click', () => {
        closeModal(editModal);
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newUsername = editUsername.value.trim();
        if (newUsername === displayUsername.textContent) {
            closeModal(editModal);
            return;
        }
        
        try {
            const res = await fetch(`/api/v1/users/${getUserIdFromToken()}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: newUsername
                })
            });
            
            if (res.ok) {
                showNotification('Profile updated successfully!', 'success');
                closeModal(editModal);
                loadUserProfile(); // Reload profile data
            } else {
                const error = await res.text();
                throw new Error(error || `HTTP ${res.status}`);
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            showNotification(`Failed to update profile: ${error.message}`, 'error');
        }
    });

    // Change password functionality
    changePasswordBtn.addEventListener('click', () => {
        currentPassword.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
        openModal(passwordModal);
    });

    document.getElementById('cancel-password').addEventListener('click', () => {
        closeModal(passwordModal);
    });

    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const oldPassword = currentPassword.value;
        const newPass = newPassword.value;
        const confirmPass = confirmPassword.value;
        
        if (newPass !== confirmPass) {
            showNotification('New passwords do not match', 'error');
            return;
        }
        
        if (newPass.length < 6) {
            showNotification('Password must be at least 6 characters long', 'error');
            return;
        }
        
        try {
            const res = await fetch(`/api/v1/users/${getUserIdFromToken()}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPass
                })
            });
            
            if (res.ok) {
                showNotification('Password changed successfully!', 'success');
                closeModal(passwordModal);
            } else {
                const error = await res.text();
                throw new Error(error || `HTTP ${res.status}`);
            }
        } catch (error) {
            console.error('Failed to change password:', error);
            showNotification(`Failed to change password: ${error.message}`, 'error');
        }
    });

    // Resend verification email
    resendVerificationBtn.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/v1/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (res.ok) {
                showNotification('Verification email sent!', 'success');
            } else {
                const error = await res.text();
                throw new Error(error || `HTTP ${res.status}`);
            }
        } catch (error) {
            console.error('Failed to resend verification email:', error);
            showNotification(`Failed to send verification email: ${error.message}`, 'error');
        }
    });

    // Utility function to get user ID from token
    const getUserIdFromToken = () => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.user_id;
        } catch (error) {
            console.error('Failed to parse token:', error);
            return null;
        }
    };

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Initial load
    loadUserProfile();
}); 