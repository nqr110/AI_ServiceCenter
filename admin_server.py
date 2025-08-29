from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import json
import os
import threading
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")

# 数据持久化文件路径
DATA_FILE = 'district_status.json'

# 加载地块状态数据
def load_district_status():
    """从文件加载地块状态数据"""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"加载状态数据失败: {e}")
    
    # 如果文件不存在或加载失败，返回默认状态
    default_status = {}
    for i in range(1, 107):
        default_status[f'区块{i}'] = {'status': 'normal', 'color': '#5698c3'}
    return default_status

# 保存地块状态数据
def save_district_status():
    """保存地块状态数据到文件"""
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(district_status, f, ensure_ascii=False, indent=2)
        print("状态数据已保存")
    except Exception as e:
        print(f"保存状态数据失败: {e}")

# 地块状态数据 - 从文件加载或使用默认值
district_status = load_district_status()

# 地名映射 - 修改为支持区块1到区块106
district_names = {}
for i in range(1, 107):
    district_names[f'区块{i}'] = f'区块{i}'

@app.route('/')
def admin_index():
    """后台管理主页面"""
    return render_template('admin.html')

@app.route('/api/district-status')
def get_district_status():
    """获取所有地块状态"""
    return jsonify(district_status)

@app.route('/api/update-status', methods=['POST'])
def update_district_status():
    """更新地块状态"""
    try:
        data = request.get_json()
        district = data.get('district')
        new_status = data.get('status')
        
        if district not in district_status:
            return jsonify({'error': '地块不存在'}), 400
            
        if new_status not in ['normal', 'warning']:
            return jsonify({'error': '状态值无效'}), 400
        
        # 更新状态和颜色
        district_status[district]['status'] = new_status
        if new_status == 'normal':
            district_status[district]['color'] = '#5698c3'  # 蓝色
        else:  # warning
            district_status[district]['color'] = '#ffc107'  # 警告黄色
        
        # 保存状态数据到文件
        save_district_status()
        
        # 通过WebSocket广播状态更新到前端
        socketio.emit('status_update', {
            'district': district,
            'status': new_status,
            'color': district_status[district]['color']
        }, room='frontend')
        
        return jsonify({
            'success': True,
            'district': district,
            'status': new_status,
            'color': district_status[district]['color']
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@socketio.on('connect')
def handle_connect():
    """处理客户端连接"""
    print(f'客户端已连接: {request.sid}')

@socketio.on('disconnect')
def handle_disconnect():
    """处理客户端断开连接"""
    print(f'客户端已断开连接: {request.sid}')

@socketio.on('join_frontend')
def handle_join_frontend():
    """前端客户端加入房间"""
    join_room('frontend')
    print(f'前端客户端加入房间: {request.sid}')
    # 发送当前状态给新连接的客户端
    emit('initial_status', district_status)

@socketio.on('join_admin')
def handle_join_admin():
    """后台管理客户端加入房间"""
    join_room('admin')
    print(f'后台管理客户端加入房间: {request.sid}')

if __name__ == '__main__':
    print("后台管理服务器启动中...")
    print("访问地址: http://localhost:5005")
    print("前端连接WebSocket: ws://localhost:5005")
    print(f"数据持久化已启用，状态文件: {DATA_FILE}")
    
    # 统计当前状态
    normal_count = sum(1 for status in district_status.values() if status['status'] == 'normal')
    warning_count = sum(1 for status in district_status.values() if status['status'] == 'warning')
    print(f"当前状态统计 - 正常: {normal_count}, 警告: {warning_count}")
    
    socketio.run(app, debug=True, host='0.0.0.0', port=5005)