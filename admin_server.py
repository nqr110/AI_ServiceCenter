from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import json
import os
import threading
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")

# 地块状态数据
district_status = {
    'A地': {'status': 'normal', 'color': '#5698c3'},  # 正常状态 - 蓝色
    'B地': {'status': 'normal', 'color': '#5698c3'},
    'C地': {'status': 'normal', 'color': '#5698c3'},
    'D地': {'status': 'normal', 'color': '#5698c3'},
    'E地': {'status': 'normal', 'color': '#5698c3'},
    'F地': {'status': 'normal', 'color': '#5698c3'},
    'G地': {'status': 'normal', 'color': '#5698c3'},
    'H地': {'status': 'normal', 'color': '#5698c3'},
    'I地': {'status': 'normal', 'color': '#5698c3'}
}

# 地名映射
district_names = {
    'A地': 'A市',
    'B地': 'B市',
    'C地': 'C市',
    'D地': 'D市',
    'E地': 'E市',
    'F地': 'F市',
    'G地': 'G市',
    'H地': 'H市',
    'I地': 'I市'
}

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
    socketio.run(app, debug=True, host='0.0.0.0', port=5005)

