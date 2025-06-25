document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const userAvatar = document.getElementById('user-avatar');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const fileListContainer = document.getElementById('file-list');
    const uploadBtn = document.getElementById('upload-btn');

    // Dropdown menu logic
    let userDropdown = document.getElementById('user-dropdown');
    if (!userDropdown) {
        userDropdown = document.createElement('div');
        userDropdown.id = 'user-dropdown';
        userDropdown.className = 'user-dropdown';
        userDropdown.innerHTML = `
            <div class="user-dropdown-item" id="menu-me">Профиль</div>
            <div class="user-dropdown-item logout" id="logout-btn">Выйти</div>
        `;
        document.body.appendChild(userDropdown);
        console.log('Dropdown создан:', userDropdown); // Проверка
    }
    // Диагностика
    console.log('hamburgerMenu:', hamburgerMenu);
    console.log('userDropdown:', userDropdown);

    function positionDropdown() {
        const rect = hamburgerMenu.getBoundingClientRect();
        userDropdown.style.top = (window.scrollY + rect.bottom + 8) + 'px';
        userDropdown.style.left = (window.scrollX + rect.left) + 'px';
        userDropdown.style.right = '';
        userDropdown.style.zIndex = 2000;
    }
    function showDropdown() {
        userDropdown.classList.add('show');
        positionDropdown();
    }
    function hideDropdown() {
        userDropdown.classList.remove('show');
    }
    hamburgerMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Принудительное обновление позиции
        const rect = hamburgerMenu.getBoundingClientRect();
        userDropdown.style.top = `${rect.bottom + window.scrollY + 5}px`;
        userDropdown.style.left = `${rect.left + window.scrollX}px`;
        
        // Переключение видимости
        userDropdown.classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
        if (!hamburgerMenu.contains(e.target) && !userDropdown.contains(e.target)) {
            hideDropdown();
        }
    });
    // Навигация
    userDropdown.querySelector('#menu-me').onclick = () => { window.location.href = '/me'; };
    userDropdown.querySelector('#logout-btn').onclick = () => {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    };

    // File actions (demo)
    function showDemoFiles() {
        const demoFiles = [
            { id: 1, name: 'document.pdf', size: '2.5 MB', type: 'PDF', createdAt: '2024-01-15' },
            { id: 2, name: 'image.jpg', size: '1.8 MB', type: 'Image', createdAt: '2024-01-14' },
            { id: 3, name: 'presentation.pptx', size: '5.2 MB', type: 'Presentation', createdAt: '2024-01-13' }
        ];
        renderFiles(demoFiles);
    }
    function renderFiles(files) {
        if (!files || files.length === 0) {
            fileListContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: #666;">
                <p>Нет файлов. Загрузите первый файл!</p>
            </div>`;
            return;
        }
        const fileItems = files.map(file => `
            <div class="file-item">
                <div class="file-info">
                    <span style="font-weight: 500;">${file.isFolder ? '📁 ' : ''}${file.name}</span>
                    <span style="color: #666; font-size: 0.9rem;">${file.size || ''}</span>
                    <span style="color: #999; font-size: 0.8rem;">${file.type || (file.isFolder ? 'Папка' : 'Файл')}</span>
                </div>
                <div class="file-actions">
                    ${file.isFolder ? '' : `<button class="btn btn-secondary" onclick="downloadFile('${file.id}')">Скачать</button>`}
                    <button class="btn btn-secondary" onclick="deleteFile('${file.id}')">Удалить</button>
                </div>
            </div>
        `).join('');
        fileListContainer.innerHTML = fileItems;
    }
    uploadBtn.onclick = () => {
        showNotification('Загрузка файлов будет реализована позже', 'info');
    };
    window.downloadFile = (fileId) => {
        showNotification(`Скачать файл ${fileId} — функция будет реализована позже`, 'info');
    };
    window.deleteFile = (fileId) => {
        if (confirm('Удалить файл?')) {
            showNotification(`Удаление файла ${fileId} — функция будет реализована позже`, 'info');
        }
    };
    // Уведомления
    function showNotification(message, type = 'info') {
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
            case 'success': notification.style.background = '#27ae60'; break;
            case 'error': notification.style.background = '#e74c3c'; break;
            case 'warning': notification.style.background = '#f39c12'; break;
            default: notification.style.background = '#3498db';
        }
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) notification.parentNode.removeChild(notification);
            }, 300);
        }, 4000);
    }
    // Анимации для уведомлений
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // File actions (реальные данные)
    async function fetchAndShowFiles() {
        try {
            const res = await fetch('/api/folders/browse', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // data.files — обычные файлы, data.folders — папки
                const files = (data.folders || []).map(f => ({
                    ...f,
                    type: 'Папка',
                    size: '',
                    isFolder: true
                })).concat(
                    (data.files || []).map(f => ({
                        ...f,
                        type: f.type || 'Файл',
                        isFolder: false
                    }))
                );
                renderFiles(files);
            } else if (res.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
            } else {
                showNotification('Не удалось загрузить файлы пользователя', 'error');
                showDemoFiles();
            }
        } catch (error) {
            showNotification('Ошибка сети при загрузке файлов', 'error');
            showDemoFiles();
        }
    }

    // Init
    fetchAndShowFiles();
}); 