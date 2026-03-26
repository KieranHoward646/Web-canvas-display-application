from flask import Flask, request, jsonify, send_from_directory
import os
import uuid
from datetime import datetime

from config import Config
from utils.file_handler import save_and_compress_image, delete_file
from utils.data_manager import load_data, add_section, update_section, delete_section

app = Flask(__name__)
app.config.from_object(Config)
Config.init_app(app)

# 静态文件路由
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

# 上传文件路由
@app.route('/uploads/<filename>')
def serve_uploads(filename):
    return send_from_directory('uploads', filename)

# 主页面路由
@app.route('/')
def index():
    return send_from_directory('templates', 'index.html')

# API路由
@app.route('/api/sections', methods=['GET'])
def get_sections():
    """获取所有创业计划模块"""
    data = load_data()
    return jsonify(data['sections'])

@app.route('/api/sections', methods=['POST'])
def create_section():
    """添加新的文本/图片模块"""
    try:
        section = request.json
        section['id'] = f"section_{str(uuid.uuid4())[:8]}"
        section['created_at'] = datetime.now().isoformat()
        
        if add_section(section):
            return jsonify(section), 201
        else:
            return jsonify({'error': '创建模块失败'}), 500
    except Exception as e:
        app.logger.error(f'创建模块错误: {str(e)}')
        return jsonify({'error': '服务器内部错误'}), 500

@app.route('/api/sections/<section_id>', methods=['PUT'])
def update_section_endpoint(section_id):
    """更新模块"""
    try:
        updated_section = request.json
        
        if update_section(section_id, updated_section):
            return jsonify(updated_section)
        else:
            return jsonify({'error': '模块不存在或更新失败'}), 404
    except Exception as e:
        app.logger.error(f'更新模块错误: {str(e)}')
        return jsonify({'error': '服务器内部错误'}), 500

@app.route('/api/sections/<section_id>', methods=['DELETE'])
def delete_section_endpoint(section_id):
    """删除模块"""
    try:
        # 先获取模块信息，用于删除相关图片
        data = load_data()
        section_to_delete = None
        for section in data['sections']:
            if section['id'] == section_id:
                section_to_delete = section
                break
        
        if delete_section(section_id):
            # 如果是图片模块，删除对应的图片文件
            if section_to_delete and section_to_delete['type'] == 'image':
                image_path = os.path.join(app.config['UPLOAD_FOLDER'], section_to_delete['filename'])
                delete_file(image_path)
            return jsonify({'message': '模块删除成功'})
        else:
            return jsonify({'error': '模块不存在或删除失败'}), 404
    except Exception as e:
        app.logger.error(f'删除模块错误: {str(e)}')
        return jsonify({'error': '服务器内部错误'}), 500

@app.route('/api/upload/image', methods=['POST'])
def upload_image():
    """单独处理图片上传"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': '没有提供图片文件'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': '文件名为空'}), 400
        
        filename = save_and_compress_image(file)
        return jsonify({
            'filename': filename,
            'path': f'uploads/{filename}'
        }), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        app.logger.error(f'图片上传错误: {str(e)}')
        return jsonify({'error': '服务器内部错误'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)