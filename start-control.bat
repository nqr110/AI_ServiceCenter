@echo off
echo 启动Smart Center控制面板服务器...
echo 控制面板将在端口4000上运行
echo 主页面在端口3000上运行
echo.
echo 访问地址:
echo 主页面: http://localhost:3000
echo 控制面板: http://localhost:4000
echo.
npx http-server . -p 4000 -o control.html
pause