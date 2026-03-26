import os
import json
import time
from flask import current_app


def get_data_file_path():
    """获取数据文件路径"""
    data_folder = current_app.config['DATA_FOLDER']
    data_file = current_app.config['DATA_FILE']
    return os.path.join(data_folder, data_file)


def get_backup_folder_path():
    """获取备份文件夹路径"""
    data_folder = current_app.config['DATA_FOLDER']
    backup_folder = current_app.config['BACKUP_FOLDER']
    return os.path.join(data_folder, backup_folder)


def load_data():
    """加载数据"""
    data_file = get_data_file_path()
    
    # 确保数据目录存在
    os.makedirs(os.path.dirname(data_file), exist_ok=True)
    
    # 如果文件不存在，返回默认数据结构
    if not os.path.exists(data_file):
        return {'sections': []}
    
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        current_app.logger.error(f'数据加载失败: {str(e)}')
        # 尝试从备份恢复
        return restore_from_backup()


def save_data(data):
    """保存数据并创建备份"""
    data_file = get_data_file_path()
    backup_folder = get_backup_folder_path()
    
    # 确保目录存在
    os.makedirs(os.path.dirname(data_file), exist_ok=True)
    os.makedirs(backup_folder, exist_ok=True)
    
    try:
        # 创建备份
        create_backup()
        
        # 保存数据
        with open(data_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        current_app.logger.error(f'数据保存失败: {str(e)}')
        return False


def create_backup():
    """创建数据备份"""
    data_file = get_data_file_path()
    backup_folder = get_backup_folder_path()
    
    if os.path.exists(data_file):
        timestamp = int(time.time())
        backup_file = os.path.join(backup_folder, f'plan_data_{timestamp}.json')
        
        try:
            import shutil
            shutil.copy2(data_file, backup_file)
            return True
        except Exception as e:
            current_app.logger.error(f'备份创建失败: {str(e)}')
            return False
    return False


def restore_from_backup():
    """从备份恢复数据"""
    backup_folder = get_backup_folder_path()
    
    if not os.path.exists(backup_folder):
        return {'sections': []}
    
    # 获取最新的备份文件
    backup_files = [f for f in os.listdir(backup_folder) if f.startswith('plan_data_') and f.endswith('.json')]
    if not backup_files:
        return {'sections': []}
    
    # 按时间戳排序，获取最新的备份
    backup_files.sort(reverse=True)
    latest_backup = os.path.join(backup_folder, backup_files[0])
    
    try:
        with open(latest_backup, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        current_app.logger.error(f'备份恢复失败: {str(e)}')
        return {'sections': []}


def add_section(section):
    """添加新的模块"""
    data = load_data()
    data['sections'].append(section)
    return save_data(data)


def update_section(section_id, updated_section):
    """更新模块"""
    data = load_data()
    
    for i, section in enumerate(data['sections']):
        if section['id'] == section_id:
            data['sections'][i] = updated_section
            return save_data(data)
    
    return False


def delete_section(section_id):
    """删除模块"""
    data = load_data()
    
    new_sections = [section for section in data['sections'] if section['id'] != section_id]
    if len(new_sections) != len(data['sections']):
        data['sections'] = new_sections
        return save_data(data)
    
    return False