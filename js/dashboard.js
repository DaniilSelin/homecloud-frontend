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

    // Текущая папка и стек для навигации
    let currentFolderId = null;
    let currentFolderPath = '';
    // Храним стек переходов, чтобы корректно возвращаться «назад»
    const folderStack = []; // элементы вида { id, name }

    // Создаем модальное окно для создания файла
    const createFileModal = document.createElement('div');
    createFileModal.className = 'modal';
    createFileModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Создать</h2>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="item-name">Имя:</label>
                    <input type="text" id="item-name" placeholder="Введите имя файла или папки">
                </div>
                <div class="form-group" id="file-content-group">
                    <label for="file-content">Содержимое файла:</label>
                    <textarea id="file-content" rows="6" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;" placeholder="Введите содержимое файла"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeCreateFileModal()">Отмена</button>
                <button class="btn btn-primary" onclick="createNewFolder()">Создать папку</button>
                <button class="btn btn-primary" onclick="createNewFile()">Создать файл</button>
            </div>
        </div>
    `;
    document.body.appendChild(createFileModal);

    // Функции для работы с модальным окном создания файла
    window.closeCreateFileModal = () => {
        createFileModal.classList.remove('show');
        document.getElementById('item-name').value = '';
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
        const fileName = document.getElementById('item-name').value.trim();
        const fileContent = document.getElementById('file-content').value;
        
        if (!fileName) {
            showNotification('Введите имя файла', 'error');
            return;
        }

        try {
            // Готовим payload согласно API (POST /api/v1/files)
            const payload = {
                name: fileName,
                content: btoa(unescape(encodeURIComponent(fileContent))), // base64
                mime_type: 'text/plain',
                size: fileContent.length,
                is_folder: false,
                parent_id: currentFolderId || null
            };

            const response = await fetch('http://localhost:3000/api/v1/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
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

    // Функция создания новой папки
    window.createNewFolder = async () => {
        const folderName = document.getElementById('item-name').value.trim();

        if (!folderName) {
            showNotification('Введите имя папки', 'error');
            return;
        }

        try {
            const payload = {
                name: folderName,
                is_folder: true,
                parent_id: currentFolderId || null
            };

            const response = await fetch('http://localhost:3000/api/v1/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                showNotification(`Папка ${folderName} создана`, 'success');
                closeCreateFileModal();
                fetchAndShowFiles();
            } else {
                const error = await response.text();
                showNotification(`Ошибка создания папки: ${error}`, 'error');
            }
        } catch (error) {
            showNotification(`Ошибка сети при создании папки: ${error.message}`, 'error');
        }
    };

    // Создаем меню пользователя, если его еще нет
    let userMenu = document.getElementById('user-menu');
    if (!userMenu) {
        userMenu = document.createElement('div');
        userMenu.id = 'user-menu';
        userMenu.className = 'user-menu';
        userMenu.innerHTML = `
            <a href="/dashboard.html" class="menu-item">
                <span class="material-icons">folder</span>
                Файлы
            </a>
            <a href="/profile.html" class="menu-item">
                <span class="material-icons">person</span>
                Профиль
            </a>
            <button class="menu-item logout" id="logout-btn">
                <span class="material-icons">logout</span>
                Выйти
            </button>
        `;
        document.body.appendChild(userMenu);
    }

    // Обработчики для меню пользователя
    function toggleUserMenu(event) {
        event.stopPropagation();
        userMenu.classList.toggle('show');
        
        if (userMenu.classList.contains('show')) {
            const rect = hamburgerMenu.getBoundingClientRect();
            userMenu.style.top = `${rect.bottom + 5}px`;
            userMenu.style.left = `${rect.left}px`;
        }
    }

    function hideUserMenu(event) {
        if (!hamburgerMenu.contains(event.target) && !userMenu.contains(event.target)) {
            userMenu.classList.remove('show');
        }
    }

    // Добавляем обработчики событий
    hamburgerMenu.addEventListener('click', toggleUserMenu);
    document.addEventListener('click', hideUserMenu);
    
    // Обработчик выхода
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });

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
            fileListContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--muted);">
                    <span class="material-icons" style="font-size: 3rem; margin-bottom: 1rem;">folder_open</span>
                    <p>Папка пуста. Загрузите файлы или создайте новую папку!</p>
                </div>`;
            return;
        }

        // Добавляем breadcrumb навигацию
        const breadcrumb = document.getElementById('breadcrumb');
        const pathParts = currentFolderPath ? currentFolderPath.split('/') : [];
        
        breadcrumb.innerHTML = `
            ${currentFolderId || currentFolderPath ? `
                <button class="btn btn-secondary" onclick="navigateBack()">
                    <span class="material-icons">arrow_back</span>
                    Назад
                </button>
            ` : ''}
            ${pathParts.map((part, index) => {
                const path = pathParts.slice(0, index + 1).join('/');
                return `
                    <span class="breadcrumb-separator">/</span>
                    <span class="breadcrumb-item" onclick="navigateToPath('${path}')">${part}</span>
                `;
            }).join('')}
        `;

        const fileItems = files.map(file => `
            <div class="file-item" onclick="${file.is_folder ? `navigateToFolder('${file.id}', '${file.name}')` : `showFileDetails('${file.id}')`}">
                <div class="file-info">
                    <span class="material-icons ${file.is_folder ? 'folder-icon' : ''}">${file.is_folder ? 'folder' : getFileIcon(file.mime_type)}</span>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-meta">
                            ${!file.is_folder ? formatFileSize(file.size) : ''}
                            ${file.created_at ? `• ${formatDate(file.created_at)}` : ''}
                        </div>
                    </div>
                </div>
                <div class="file-actions">
                    ${file.is_folder ? `
                        <button class="btn btn-secondary" onclick="event.stopPropagation(); navigateToFolder('${file.id}', '${file.name}')">
                            <span class="material-icons">folder_open</span>
                            Открыть
                        </button>
                    ` : `
                        <button class="btn btn-secondary" onclick="event.stopPropagation(); downloadFile('${file.id}', '${file.name}')">
                            <span class="material-icons">download</span>
                            Скачать
                        </button>
                    `}
                    <button class="btn btn-danger" onclick="event.stopPropagation(); deleteFile('${file.id}')">
                        <span class="material-icons">delete</span>
                        Удалить
                    </button>
                </div>
            </div>
        `).join('');

        fileListContainer.innerHTML = fileItems;
    }
    
    function getFileIcon(mimeType) {
        if (!mimeType) return 'description';
        
        const iconMap = {
            'text/': 'description',
            'image/': 'image',
            'video/': 'movie',
            'audio/': 'audiotrack',
            'application/pdf': 'picture_as_pdf',
            'application/msword': 'description',
            'application/vnd.openxmlformats-officedocument.wordprocessingml': 'description',
            'application/vnd.ms-excel': 'table_chart',
            'application/vnd.openxmlformats-officedocument.spreadsheetml': 'table_chart',
            'application/vnd.ms-powerpoint': 'slideshow',
            'application/vnd.openxmlformats-officedocument.presentationml': 'slideshow',
            'application/zip': 'folder_zip',
            'application/x-rar-compressed': 'folder_zip',
            'application/x-tar': 'folder_zip',
            'application/x-7z-compressed': 'folder_zip'
        };

        for (const [type, icon] of Object.entries(iconMap)) {
            if (mimeType.startsWith(type)) return icon;
        }
        return 'insert_drive_file';
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
            // Читаем файл и конвертируем в base64
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result;
                    // reader.result = data:<mime>;base64,XXXX
                    const encoded = result.split(',')[1];
                    resolve(encoded);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const payload = {
                name: file.name,
                content: base64,
                mime_type: file.type || 'application/octet-stream',
                size: file.size,
                is_folder: false,
                parent_id: currentFolderId || null
            };
            
            const response = await fetch('http://localhost:3000/api/v1/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
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
        if (folderId) {
            folderStack.push({ id: folderId, name: folderName });
        } else {
            // переход в корень – очищаем стек
            folderStack.length = 0;
        }

        currentFolderId = folderId;
        currentFolderPath = folderStack.map(f => f.name).join('/');

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
        console.log('Downloading file', fileId, fileName);

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

    // Кнопка «Назад»
    window.navigateBack = async () => {
        if (folderStack.length > 0) {
            folderStack.pop();
        }
        const last = folderStack[folderStack.length - 1];
        currentFolderId = last ? last.id : null;
        currentFolderPath = folderStack.map(f => f.name).join('/');

        updateFolderTitle();
        await fetchAndShowFiles();
    };

    // Обновляем обработчик для корневой папки
    document.getElementById('root-folder-btn').addEventListener('click', () => {
        navigateToFolder(null);
    });

    // Init
    fetchAndShowFiles();
});