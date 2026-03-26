class API {
    static async getSections() {
        try {
            const response = await fetch('/api/sections');
            if (!response.ok) {
                throw new Error('获取模块失败');
            }
            return await response.json();
        } catch (error) {
            console.error('API错误:', error);
            throw error;
        }
    }

    static async createSection(section) {
        try {
            const response = await fetch('/api/sections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(section)
            });
            if (!response.ok) {
                throw new Error('创建模块失败');
            }
            return await response.json();
        } catch (error) {
            console.error('API错误:', error);
            throw error;
        }
    }

    static async updateSection(sectionId, section) {
        try {
            const response = await fetch(`/api/sections/${sectionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(section)
            });
            if (!response.ok) {
                throw new Error('更新模块失败');
            }
            return await response.json();
        } catch (error) {
            console.error('API错误:', error);
            throw error;
        }
    }

    static async deleteSection(sectionId) {
        try {
            const response = await fetch(`/api/sections/${sectionId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error('删除模块失败');
            }
            return await response.json();
        } catch (error) {
            console.error('API错误:', error);
            throw error;
        }
    }

    static async uploadImage(file) {
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                throw new Error('图片上传失败');
            }
            return await response.json();
        } catch (error) {
            console.error('API错误:', error);
            throw error;
        }
    }
}