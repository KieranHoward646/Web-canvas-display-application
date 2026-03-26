import os
import uuid
from PIL import Image
from flask import current_app


def allowed_file(filename):
    """检查文件是否为允许的图片类型"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']


def generate_unique_filename(filename):
    """生成唯一的文件名"""
    ext = filename.rsplit('.', 1)[1].lower()
    unique_id = str(uuid.uuid4())
    return f"{unique_id}.{ext}"


def save_and_compress_image(file):
    """保存并压缩图片"""
    if not allowed_file(file.filename):
        raise ValueError('不支持的文件类型')
    
    # 生成唯一文件名
    filename = generate_unique_filename(file.filename)
    upload_folder = current_app.config['UPLOAD_FOLDER']
    file_path = os.path.join(upload_folder, filename)
    
    # 保存文件
    file.save(file_path)
    
    # 压缩图片
    compress_image(file_path)
    
    return filename


def compress_image(image_path):
    """压缩图片到合适尺寸"""
    try:
        with Image.open(image_path) as img:
            # 调整图片尺寸
            max_width = current_app.config['MAX_IMAGE_WIDTH']
            max_height = current_app.config['MAX_IMAGE_HEIGHT']
            
            img.thumbnail((max_width, max_height), Image.LANCZOS)
            img.save(image_path, optimize=True, quality=85)
    except Exception as e:
        current_app.logger.error(f'图片压缩失败: {str(e)}')


def delete_file(file_path):
    """删除文件"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception as e:
        current_app.logger.error(f'文件删除失败: {str(e)}')
        return False