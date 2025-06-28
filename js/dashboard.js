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
    const createFileBtn = document.getElementById('create-file-btn');

    // Текущая папка для навигации
    let currentFolderId = null;
    let currentFolderPath = '';

    // Создаем модальное окно для создания файла
    const createFileModal = document.createElement('div');
    createFileModal.className = 'modal';
    createFileModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Создать новый файл</h2>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="file-name">Имя файла:</label>
                    <input type="text" id="file-name" placeholder="Введите имя файла">
                </div>
                <div class="form-group">
                    <label for="file-content">Содержимое файла:</label>
                    <textarea id="file-content" rows="6" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;" placeholder="Введите содержимое файла"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeCreateFileModal()">Отмена</button>
                <button class="btn btn-primary" onclick="createNewFile()">Создать</button>
            </div>
        </div>
    `;
    document.body.appendChild(createFileModal);

    // Функции для работы с модальным окном создания файла
    window.closeCreateFileModal = () => {
        createFileModal.classList.remove('show');
        document.getElementById('file-name').value = '';
        document.getElementById('file-content').value = '';
    };

    createFileBtn.onclick = () => {
        createFileModal.classList.add('show');
    };

    // Закрытие модального окна при клике вне его
    createFileModal.onclick = (e) => {
        if (e.target === createFileModal) {
            closeCreateFileModal();
        }
    };

    // Функция создания нового файла
    window.createNewFile = async () => {
        const fileName = document.getElementById('file-name').value.trim();
        const fileContent = document.getElementById('file-content').value;
        
        if (!fileName) {
            showNotification('Введите имя файла', 'error');
            return;
        }

        try {
            // Создаем Blob из содержимого
            const blob = new Blob([fileContent], { type: 'text/plain' });
            const file = new File([blob], fileName, { type: 'text/plain' });
            
            // Создаем FormData и добавляем файл
            const formData = new FormData();
            formData.append('file', file);
            
            // Если мы в папке, добавляем путь
            if (currentFolderPath) {
                formData.append('filePath', `${currentFolderPath}/${fileName}`);
            }
            
            const response = await fetch('http://localhost:3000/api/v1/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                showNotification(`Файл ${fileName} успешно создан`, 'success');
                closeCreateFileModal();
                fetchAndShowFiles(); // Обновляем список файлов
            } else {
                const error = await response.text();
                showNotification(`Ошибка создания файла: ${error}`, 'error');
            }
        } catch (error) {
            showNotification(`Ошибка при создании файла: ${error.message}`, 'error');
        }
    };

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

        // Добавляем breadcrumb навигацию
        let breadcrumbHtml = '';
        const pathParts = currentFolderPath ? currentFolderPath.split('/') : [];
        
        breadcrumbHtml = `
            <div class="breadcrumb">
                <div class="breadcrumb-buttons">
                    ${currentFolderId || currentFolderPath ? `
                        <button class="btn btn-secondary" onclick="navigateBack()">
                            ⬅️ Назад
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="navigateToFolder(null)">
                        🏠 Корневая папка
                    </button>
                </div>
                <div class="breadcrumb-path">
                    ${pathParts.map((part, index) => {
                        const path = pathParts.slice(0, index + 1).join('/');
                        return `
                            <span class="breadcrumb-separator">/</span>
                            <span class="breadcrumb-item" onclick="navigateToPath('${path}')">${part}</span>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        const fileItems = files.map(file => `
            <div class="file-item" onclick="${file.is_folder ? `navigateToFolder('${file.id}', '${file.name}')` : `showFileDetails('${file.id}')`}" style="cursor: pointer;">
                <div class="file-info">
                    <span style="font-weight: 500;">${file.is_folder ? '📁 ' : getFileIcon(file.mime_type)}${file.name}</span>
                    <span style="color: #666; font-size: 0.9rem;">${formatFileSize(file.size) || ''}</span>
                    <span style="color: #999; font-size: 0.8rem;">${file.mime_type || (file.is_folder ? 'Папка' : 'Файл')}</span>
                    <span style="color: #999; font-size: 0.8rem;">${formatDate(file.created_at)}</span>
                </div>
                <div class="file-actions" onclick="event.stopPropagation();">
                    ${file.is_folder ? 
                        `<button class="btn btn-primary" onclick="navigateToFolder('${file.id}', '${file.name}')">📁 Открыть</button>` : 
                        `<button class="btn btn-primary" onclick="downloadFile('${file.id}', '${file.name}')">⬇️ Скачать</button>`
                    }
                    <button class="btn btn-danger" onclick="deleteFile('${file.id}', '${file.name}', ${file.is_folder})">🗑️ Удалить</button>
                </div>
            </div>
        `).join('');
        
        fileListContainer.innerHTML = breadcrumbHtml + fileItems;
    }
    
    function getFileIcon(mimeType) {
        if (!mimeType) return '📄';
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎥';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.includes('pdf')) return '📕';
        if (mimeType.includes('word') || mimeType.includes('document')) return '📘';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📗';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📙';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return '📦';
        if (mimeType.includes('text/')) return '📄';
        return '📄';
    }
    
    function formatFileSize(bytes) {
        if (!bytes) return '';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
            
            // Если мы в папке, добавляем путь
            if (currentFolderPath) {
                formData.append('filePath', `${currentFolderPath}/${file.name}`);
            }
            
            const response = await fetch('http://localhost:3000/api/v1/upload', {
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
    
    // Навигация по папкам
    window.navigateToFolder = async (folderId, folderName) => {
        currentFolderId = folderId;
        if (folderName) {
            currentFolderPath = currentFolderPath ? `${currentFolderPath}/${folderName}` : folderName;
        } else {
            currentFolderPath = '';
        }
        
        // Обновляем заголовок
        updateFolderTitle();
        
        await fetchAndShowFiles();
    };
    
    // Навигация по пути (для breadcrumbs)
    window.navigateToPath = async (path) => {
        currentFolderPath = path;
        currentFolderId = null; // Сбрасываем ID, так как переходим по пути
        
        // Обновляем заголовок и список файлов
        updateFolderTitle();
        await fetchAndShowFiles();
    };
    
    function updateFolderTitle() {
        const titleElement = document.getElementById('current-folder-title');
        if (titleElement) {
            if (currentFolderPath) {
                titleElement.textContent = `📁 ${currentFolderPath}`;
            } else {
                titleElement.textContent = 'Мои файлы';
            }
        }
    }
    
    // Получение детальной информации о файле
    window.showFileDetails = async (fileId) => {
        try {
            const response = await fetch(`http://localhost:3000/api/v1/files/${fileId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const file = await response.json();
                showFileDetailsModal(file);
            } else {
                showNotification('Не удалось получить информацию о файле', 'error');
            }
        } catch (error) {
            showNotification('Ошибка сети при получении информации о файле', 'error');
        }
    };
    
    function showFileDetailsModal(file) {
        // Удаляем существующее модальное окно
        const existingModal = document.getElementById('file-details-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'file-details-modal';
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 3000;
        `
    }

    // Улучшаем функцию скачивания файла
    window.downloadFile = async (fileId, fileName) => {
        try {
            showNotification('Начинается скачивание файла...', 'info');
            
            const response = await fetch(`http://localhost:3000/api/v1/files/${fileId}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error('Ошибка при скачивании файла');
            }
            
            // Создаем ссылку для скачивания
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showNotification(`Файл ${fileName} успешно скачан`, 'success');
        } catch (error) {
            showNotification(`Ошибка при скачивании файла: ${error.message}`, 'error');
        }
    };
    
    window.deleteFile = async (fileId, fileName, isFolder) => {
        const message = isFolder ? 
            `Удалить папку "${fileName}" и все её содержимое? Это действие необратимо!` :
            `Удалить файл "${fileName}"? Это действие необратимо!`;
            
        if (confirm(message)) {
            try {
                const response = await fetch(`http://localhost:3000/api/v1/files/${fileId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    showNotification(`${isFolder ? 'Папка' : 'Файл'} удален`, 'success');
                    fetchAndShowFiles(); // Обновляем список
                } else {
                    showNotification(`Ошибка удаления ${isFolder ? 'папки' : 'файла'}`, 'error');
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
            let url = 'http://localhost:3000/api/v1/files';
            if (currentFolderId) {
                url += `/?parent_id=${currentFolderId}`;
            }
            
            const res = await fetch(url, {
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