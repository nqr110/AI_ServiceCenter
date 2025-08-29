#!/bin/bash

# Smart Center 3D地图项目启动脚本
# 适用于 Linux/macOS 系统

echo "========================================"
echo "    Smart Center 3D地图项目启动脚本"
echo "========================================"
echo

echo "[1/3] 检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未检测到Node.js，请先安装Node.js"
    echo "下载地址：https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js环境正常 ($(node --version))"

echo
echo "[2/3] 安装项目依赖..."
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已存在，跳过安装"
fi

echo
echo "[3/3] 启动开发服务器..."
echo "🚀 正在启动服务器，请稍候..."
echo "📱 服务器启动后将自动打开浏览器"
echo "🌐 访问地址：http://localhost:8080"
echo
echo "⚠️  按 Ctrl+C 可停止服务器"
echo "========================================"
echo

npm run dev

echo
echo "服务器已停止"