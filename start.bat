@echo off
title Vue3 System Launcher
color 0A

echo ==========================================
echo       正在初始化系统环境 (System Init)...
echo ==========================================

:: 1. 检查并安装 Mock 服务依赖 (首次运行需要)
if not exist "mock-server\node_modules" (
    echo [System] 检测到 Mock 服务未安装依赖，正在自动安装...
    call npm run init:mock
)

:: 2. 启动服务
echo.
echo [System] 正在启动前端与 Mock 服务...
echo [System] 请勿关闭此窗口
echo.

call npm run start

pause