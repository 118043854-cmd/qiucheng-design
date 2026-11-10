@echo off
REM 秋成设计室 - AI 电商生图平台 / 一键启动脚本（Windows）
chcp 65001 >nul 2>&1

echo.
echo ============================================================
echo   秋成设计室 · AI 电商生图平台   一键启动 (Windows)
echo ============================================================
echo.

cd /d "%~dp0"

REM 1. 检查 Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到 Python，请先安装 Python 3.9+ 并添加到 PATH
    echo    下载：https://www.python.org/downloads/
    pause
    exit /b 1
)

REM 2. 虚拟环境
if not exist ".venv" (
    echo 📦 首次启动，创建虚拟环境并安装依赖（首次约 1 分钟）...
    python -m venv .venv
)
call .venv\Scripts\activate.bat
pip install --quiet -r requirements.txt

REM 3. 启动
set PORT=4400
set OPEN_URL=http://localhost:%PORT%/#/workbench

echo.
echo ============================================================
echo   ✅ 启动成功！
echo   👉 浏览器打开：%OPEN_URL%
echo   📂 生成图目录：%cd%\assets\
echo   🛑 停止服务：Ctrl + C
echo ============================================================
echo.

start "" "%OPEN_URL%" 2>nul

python -m uvicorn main:app --host 0.0.0.0 --port %PORT% --reload
pause
