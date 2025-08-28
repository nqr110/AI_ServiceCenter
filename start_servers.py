#!/usr/bin/env python3
"""
启动脚本 - 同时运行主应用和后台管理服务器
"""

import subprocess
import sys
import time
import os
from threading import Thread

def run_main_app():
    """运行主应用 (端口5000)"""
    print("启动主应用服务器 (端口5000)...")
    try:
        subprocess.run([sys.executable, 'app.py'], check=True)
    except KeyboardInterrupt:
        print("\n主应用服务器已停止")
    except Exception as e:
        print(f"主应用服务器启动失败: {e}")

def run_admin_server():
    """运行后台管理服务器 (端口5005)"""
    print("启动后台管理服务器 (端口5005)...")
    try:
        subprocess.run([sys.executable, 'admin_server.py'], check=True)
    except KeyboardInterrupt:
        print("\n后台管理服务器已停止")
    except Exception as e:
        print(f"后台管理服务器启动失败: {e}")

def main():
    print("=== 金华市地图系统启动器 ===")
    print("主应用地址: http://localhost:5000")
    print("后台管理地址: http://localhost:5005")
    print("按 Ctrl+C 停止所有服务器")
    print("=" * 40)
    
    # 检查依赖
    try:
        import flask
        import flask_socketio
        print("✓ 依赖检查通过")
    except ImportError as e:
        print(f"✗ 缺少依赖: {e}")
        print("请运行: pip install -r requirements.txt")
        return
    
    # 启动两个服务器线程
    main_thread = Thread(target=run_main_app, daemon=True)
    admin_thread = Thread(target=run_admin_server, daemon=True)
    
    try:
        main_thread.start()
        time.sleep(2)  # 延迟启动第二个服务器
        admin_thread.start()
        
        # 等待线程结束
        main_thread.join()
        admin_thread.join()
        
    except KeyboardInterrupt:
        print("\n正在停止所有服务器...")
        sys.exit(0)

if __name__ == '__main__':
    main()
