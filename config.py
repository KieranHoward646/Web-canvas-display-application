import os

class Config:
    # 应用配置
    SECRET_KEY = 'dev'
    
    # 上传配置
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB限制
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    
    # 数据存储配置
    DATA_FOLDER = 'data'
    DATA_FILE = 'plan_data.json'
    BACKUP_FOLDER = 'backups'
    
    # 图片处理配置
    MAX_IMAGE_WIDTH = 1200
    MAX_IMAGE_HEIGHT = 800
    
    @staticmethod
    def init_app(app):
        # 确保必要的目录存在
        for folder in [Config.UPLOAD_FOLDER, os.path.join(Config.DATA_FOLDER, Config.BACKUP_FOLDER)]:
            os.makedirs(folder, exist_ok=True)