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
        console.log('Dropdown создан:', userDropdown);
    }

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
        
        const rect = hamburgerMenu.getBoundingClientRect();
        userDropdown.style.top = `${rect.bottom + window.scrollY + 5}px`;
        userDropdown.style.left = `${rect.left + window.scrollX}px`;
        
        userDropdown.classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
        if (!hamburgerMenu.contains(e.target) && !userDropdown.contains(e.target)) {
            hideDropdown();
        }
    });
    
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
                    <span style="font-weight: 500;">${file.is_folder ? '📁 ' : ''}${file.name}</span>
                    <span style="color: #666; font-size: 0.9rem;">${formatFileSize(file.size) || ''}</span>
                    <span style="color: #999; font-size: 0.8rem;">${file.mime_type || (file.is_folder ? 'Папка' : 'Файл')}</span>
                </div>
                <div class="file-actions">
                    ${file.is_folder ? '' : `<button class="btn btn-secondary" onclick="downloadFile('${file.id}')">Скачать</button>`}
                    <button class="btn btn-secondary" onclick="deleteFile('${file.id}')">Удалить</button>
                </div>
            </div>
        `).join('');
        fileListContainer.innerHTML = fileItems;
    }
    
    function formatFileSize(bytes) {
        if (!bytes) return '';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    // Загрузка файлов
    uploadBtn.onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = async (e) => {
            const files = Array.from(e.target.files);
            for (const file of files) {
                await uploadFile(file);
            }
            fetchAndShowFiles(); // Обновляем список после загрузки
        };
        input.click();
    };
    
    async function uploadFile(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('/api/v1/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                showNotification(`Файл ${file.name} успешно загружен`, 'success');
            } else {
                const error = await response.text();
                showNotification(`Ошибка загрузки ${file.name}: ${error}`, 'error');
            }
        } catch (error) {
            showNotification(`Ошибка сети при загрузке ${file.name}`, 'error');
        }
    }
    
    window.downloadFile = async (fileId) => {
        try {
            const response = await fetch(`/api/v1/files/${fileId}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'file'; // Имя файла будет получено из заголовков
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                showNotification('Файл скачивается', 'success');
            } else {
                showNotification('Ошибка скачивания файла', 'error');
            }
        } catch (error) {
            showNotification('Ошибка сети при скачивании', 'error');
        }
    };
    
    window.deleteFile = async (fileId) => {
        if (confirm('Удалить файл?')) {
            try {
                const response = await fetch(`/api/v1/files/${fileId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    showNotification('Файл удален', 'success');
                    fetchAndShowFiles(); // Обновляем список
                } else {
                    showNotification('Ошибка удаления файла', 'error');
                }
            } catch (error) {
                showNotification('Ошибка сети при удалении', 'error');
            }
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
            const res = await fetch('/api/v1/files', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                const files = data.files || [];
                renderFiles(files);
            } else if (res.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
            } else {
                showNotification('Не удалось загрузить файлы пользователя', 'error');
                showDemoFiles();
            }
        } catch (error) {
            console.error('Error fetching files:', error);
            showNotification('Ошибка сети при загрузке файлов', 'error');
            showDemoFiles();
        }
    }

    // Init
    fetchAndShowFiles();
}); 