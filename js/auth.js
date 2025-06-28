document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Show notification function
    const showNotification = (message, type = 'info') => {
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
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    };

    // Show loading state
    const showLoading = (form, isLoading) => {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Loading...';
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.originalText || 'Submit';
        }
    };

    // Initialize submit button text
    if (loginForm) {
        const loginBtn = loginForm.querySelector('button[type="submit"]');
        loginBtn.dataset.originalText = loginBtn.textContent;
    }
    if (registerForm) {
        const registerBtn = registerForm.querySelector('button[type="submit"]');
        registerBtn.dataset.originalText = registerBtn.textContent;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = loginForm.email.value.trim();
            const password = loginForm.password.value;

            // Basic validation
            if (!email || !password) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            if (!email.includes('@')) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }

            showLoading(loginForm, true);

            try {
                const res = await fetch('http://localhost:3000/api/v1/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                        showNotification('Login successful!', 'success');
                        setTimeout(() => {
                            window.location.href = '/dashboard.html';
                        }, 1000);
                    } else {
                        showNotification('Login successful! Please login again.', 'success');
                        setTimeout(() => {
                            window.location.href = '/login.html';
                        }, 1000);
                    }
                } else {
                    const errorText = await res.text();
                    let errorMessage = 'Login failed';
                    try {
                        const error = JSON.parse(errorText);
                        errorMessage = error.message || error.error || 'Login failed';
                    } catch {
                        errorMessage = errorText || `HTTP ${res.status}: Login failed`;
                    }
                    showNotification(errorMessage, 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showNotification('Network error. Please check your connection.', 'error');
            } finally {
                showLoading(loginForm, false);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = registerForm.username.value.trim();
            const email = registerForm.email.value.trim();
            const password = registerForm.password.value;

            // Basic validation (оставим для UX)
            if (!username || !email || !password) {
                showNotification('Пожалуйста, заполните все поля.', 'error');
                return;
            }
            if (!email.includes('@')) {
                showNotification('Введите корректный email.', 'error');
                return;
            }
            if (username.length < 3 || username.length > 50) {
                showNotification('Имя пользователя должно содержать от 3 до 50 символов.', 'error');
                return;
            }
            if (password.length < 6) {
                showNotification('Пароль должен содержать не менее 6 символов.', 'error');
                return;
            }

            showLoading(registerForm, true);

            try {
                const res = await fetch('http://localhost:3000/api/v1/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                });

                if (res.ok) {
                    showNotification('Регистрация успешна! Пожалуйста, войдите.', 'success');
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 1200);
                } else {
                    const errorText = await res.text();
                    let errorMessage = 'Ошибка регистрации. Попробуйте позже.';

                    // Маппинг ошибок backend на красивые сообщения
                    if (errorText.includes('email already exists')) {
                        errorMessage = 'Пользователь с таким email уже зарегистрирован.';
                    } else if (errorText.includes('username already exists')) {
                        errorMessage = 'Имя пользователя уже занято.';
                    } else if (errorText.includes('username must be between 3 and 50 characters')) {
                        errorMessage = 'Имя пользователя должно содержать от 3 до 50 символов.';
                    } else if (errorText.includes('password must be at least 6 characters')) {
                        errorMessage = 'Пароль должен содержать не менее 6 символов.';
                    } else if (errorText.includes('invalid email format')) {
                        errorMessage = 'Введите корректный email.';
                    } else if (errorText.includes('all fields are required')) {
                        errorMessage = 'Пожалуйста, заполните все поля.';
                    } else if (errorText.includes('file service is not available')) {
                        errorMessage = 'Внутренняя ошибка сервера. Попробуйте позже.';
                    }

                    showNotification(errorMessage, 'error');
                }
            } catch (error) {
                showNotification('Ошибка сети. Проверьте соединение.', 'error');
            } finally {
                showLoading(registerForm, false);
            }
        });
    }

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
        
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
}); 