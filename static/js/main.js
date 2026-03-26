class App {
    constructor() {
        this.sections = [];
        this.currentMode = 'edit'; // 'edit' or 'browse'
        this.currentSection = null;
        this.debounceTimer = null;
        
        this.init();
    }

    init() {
        // 初始化拖拽功能
        this.dragDrop = new DragDrop('canvas', this.handlePositionChange.bind(this));
        this.browseDragDrop = new DragDrop('browse-canvas', this.handlePositionChange.bind(this));
        
        // 绑定事件监听器
        this.bindEventListeners();
        
        // 加载已保存的模块
        this.loadSections();
    }

    bindEventListeners() {
        // 模式切换
        document.getElementById('mode-toggle').addEventListener('click', this.toggleMode.bind(this));
        
        // 文本保存
        document.getElementById('save-text').addEventListener('click', this.saveText.bind(this));
        
        // 图片上传
        document.getElementById('save-image').addEventListener('click', this.saveImage.bind(this));
        
        // 模态框关闭
        document.getElementById('close-modal').addEventListener('click', this.closeModal.bind(this));
        document.getElementById('close-modal-btn').addEventListener('click', this.closeModal.bind(this));
        
        // 模块删除
        document.getElementById('delete-section').addEventListener('click', this.deleteSection.bind(this));
        
        // 重置按钮
        document.getElementById('reset-btn').addEventListener('click', this.resetApp.bind(this));
        
        // 保存所有按钮
        document.getElementById('save-all').addEventListener('click', this.saveAll.bind(this));
    }

    async loadSections() {
        try {
            const sections = await API.getSections();
            this.sections = sections;
            this.renderSections();
        } catch (error) {
            this.showError('加载模块失败');
        }
    }

    renderSections() {
        // 清空画布
        document.getElementById('canvas').innerHTML = '';
        document.getElementById('browse-canvas').innerHTML = '';
        
        // 渲染每个模块
        this.sections.forEach(section => {
            this.renderSection(section);
        });
        
        // 渲染模块连接线（仅在浏览模式）
        this.renderConnections();
    }

    renderConnections() {
        // 按创建时间排序模块
        const sortedSections = [...this.sections].sort((a, b) => {
            return new Date(a.created_at) - new Date(b.created_at);
        });
        
        // 渲染连接线
        for (let i = 0; i < sortedSections.length - 1; i++) {
            const currentSection = sortedSections[i];
            const nextSection = sortedSections[i + 1];
            this.createConnection(currentSection, nextSection);
        }
    }

    createConnection(fromSection, toSection) {
        // 在浏览模式画布中创建连接线
        const canvas = document.getElementById('browse-canvas');
        
        const fromElement = canvas.querySelector(`[data-id="${fromSection.id}"]`);
        const toElement = canvas.querySelector(`[data-id="${toSection.id}"]`);
        
        if (fromElement && toElement) {
            const fromRect = fromElement.getBoundingClientRect();
            const toRect = toElement.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            
            // 计算连接线的起点和终点
            const fromX = (fromRect.left + fromRect.width / 2) - canvasRect.left;
            const fromY = (fromRect.top + fromRect.height / 2) - canvasRect.top;
            const toX = (toRect.left + toRect.width / 2) - canvasRect.left;
            const toY = (toRect.top + toRect.height / 2) - canvasRect.top;
            
            // 创建连接线元素
            const connection = document.createElement('div');
            connection.className = 'connector';
            
            // 计算连接线的长度和角度
            const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
            const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
            
            // 设置连接线的样式
            connection.style.left = `${fromX}px`;
            connection.style.top = `${fromY}px`;
            connection.style.width = `${length}px`;
            connection.style.transform = `rotate(${angle}deg)`;
            
            // 添加到画布
            canvas.appendChild(connection);
        }
    }

    renderSection(section) {
        const sectionElement = this.createSectionElement(section);
        
        // 添加到编辑模式画布
        const canvas = document.getElementById('canvas');
        canvas.appendChild(sectionElement);
        
        // 添加到浏览模式画布
        const browseCanvas = document.getElementById('browse-canvas');
        const browseSectionElement = this.createSectionElement(section);
        browseCanvas.appendChild(browseSectionElement);
    }

    createSectionElement(section) {
        const element = document.createElement('div');
        element.className = `section section-${section.type}`;
        element.dataset.id = section.id;
        element.style.left = `${section.position.x}px`;
        element.style.top = `${section.position.y}px`;
        
        // 添加点击事件，打开详情模态框
        element.addEventListener('click', (e) => {
            // 阻止拖拽事件
            e.stopPropagation();
            this.openModal(section);
        });
        
        if (section.type === 'text') {
            // XSS防护：转义HTML特殊字符
            const safeTitle = this.escapeHtml(section.title);
            const safeContent = this.escapeHtml(section.content);
            element.innerHTML = `
                <div class="section-text__title">${safeTitle}</div>
                <div class="section-text__content">${safeContent.substring(0, 100)}${safeContent.length > 100 ? '...' : ''}</div>
            `;
        } else if (section.type === 'image') {
            // 图片懒加载
            const safeTitle = this.escapeHtml(section.title);
            element.innerHTML = `
                <div class="section-image__title">${safeTitle}</div>
                <img class="section-image__img" data-src="/${section.path}" alt="${safeTitle}">
            `;
            
            // 初始化懒加载
            this.initLazyLoad(element.querySelector('img'));
        }
        
        return element;
    }

    escapeHtml(text) {
        // XSS防护：转义HTML特殊字符
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    initLazyLoad(img) {
        // 图片懒加载实现
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    img.src = img.dataset.src;
                    observer.unobserve(img);
                }
            });
        });
        
        observer.observe(img);
    }

    async saveText() {
        const title = document.getElementById('text-title').value;
        const content = document.getElementById('text-content').value;
        
        if (!title || !content) {
            this.showError('请填写标题和内容');
            return;
        }
        
        try {
            const section = {
                type: 'text',
                title: title,
                content: content,
                position: { x: 100, y: 100 }
            };
            
            const savedSection = await API.createSection(section);
            this.sections.push(savedSection);
            this.renderSection(savedSection);
            
            // 清空表单
            document.getElementById('text-title').value = '';
            document.getElementById('text-content').value = '';
            
            this.showSuccess('文本模块保存成功');
        } catch (error) {
            this.showError('保存失败');
        }
    }

    async saveImage() {
        const title = document.getElementById('image-title').value;
        const fileInput = document.getElementById('image-upload');
        const file = fileInput.files[0];
        
        if (!title || !file) {
            this.showError('请填写标题并选择图片');
            return;
        }
        
        try {
            // 上传图片
            const uploadResult = await API.uploadImage(file);
            
            // 创建图片模块
            const section = {
                type: 'image',
                title: title,
                filename: uploadResult.filename,
                path: uploadResult.path,
                position: { x: 300, y: 100 }
            };
            
            const savedSection = await API.createSection(section);
            this.sections.push(savedSection);
            this.renderSection(savedSection);
            
            // 清空表单
            document.getElementById('image-title').value = '';
            fileInput.value = '';
            
            this.showSuccess('图片模块保存成功');
        } catch (error) {
            this.showError('上传失败');
        }
    }

    async handlePositionChange(sectionId, position) {
        const section = this.sections.find(s => s.id === sectionId);
        if (section) {
            section.position = position;
            
            // 防抖保存，避免频繁请求
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(async () => {
                try {
                    await API.updateSection(sectionId, section);
                    // 重新渲染连接线
                    this.renderSections();
                } catch (error) {
                    console.error('更新位置失败:', error);
                }
            }, 300); // 300ms防抖
        }
    }

    openModal(section) {
        this.currentSection = section;
        
        // XSS防护：转义HTML特殊字符
        const safeTitle = this.escapeHtml(section.title);
        document.getElementById('modal-title').textContent = safeTitle;
        
        const modalBody = document.getElementById('modal-body');
        if (section.type === 'text') {
            const safeContent = this.escapeHtml(section.content);
            modalBody.innerHTML = `<p>${safeContent}</p>`;
        } else if (section.type === 'image') {
            modalBody.innerHTML = `<img src="/${section.path}" alt="${safeTitle}" style="max-width: 100%; max-height: 300px;">`;
        }
        
        document.getElementById('detail-modal').style.display = 'flex';
    }

    closeModal() {
        document.getElementById('detail-modal').style.display = 'none';
        this.currentSection = null;
    }

    async deleteSection() {
        if (!this.currentSection) return;
        
        try {
            await API.deleteSection(this.currentSection.id);
            this.sections = this.sections.filter(s => s.id !== this.currentSection.id);
            this.renderSections();
            this.closeModal();
            this.showSuccess('模块删除成功');
        } catch (error) {
            this.showError('删除失败');
        }
    }

    toggleMode() {
        const editMode = document.getElementById('edit-mode');
        const browseMode = document.getElementById('browse-mode');
        const modeToggle = document.getElementById('mode-toggle');
        
        if (this.currentMode === 'edit') {
            this.currentMode = 'browse';
            editMode.style.display = 'none';
            browseMode.style.display = 'block';
            modeToggle.textContent = '切换到编辑模式';
        } else {
            this.currentMode = 'edit';
            editMode.style.display = 'flex';
            browseMode.style.display = 'none';
            modeToggle.textContent = '切换到浏览模式';
        }
    }

    resetApp() {
        if (confirm('确定要重置所有内容吗？此操作不可恢复。')) {
            // 清空本地数据
            this.sections = [];
            this.renderSections();
            this.showSuccess('已重置所有内容');
        }
    }

    saveAll() {
        // 重新保存所有模块（确保位置等信息已更新）
        this.sections.forEach(async (section) => {
            try {
                await API.updateSection(section.id, section);
            } catch (error) {
                console.error('保存模块失败:', error);
            }
        });
        
        this.showSuccess('所有内容已保存');
    }

    showError(message) {
        const errorToast = document.getElementById('error-toast');
        document.getElementById('error-message').textContent = message;
        errorToast.style.display = 'block';
        
        setTimeout(() => {
            errorToast.style.display = 'none';
        }, 3000);
    }

    showSuccess(message) {
        const successToast = document.getElementById('success-toast');
        document.getElementById('success-message').textContent = message;
        successToast.style.display = 'block';
        
        setTimeout(() => {
            successToast.style.display = 'none';
        }, 3000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new App();
});