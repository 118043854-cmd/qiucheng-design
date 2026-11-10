#!/usr/bin/env bash
# 秋成设计室 - AI 电商生图平台 / 一键启动脚本（macOS / Linux / WSL）
set -e

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  秋成设计室 · AI 电商生图平台   一键启动"
echo "═══════════════════════════════════════════════════════════"
echo ""

cd "$(dirname "$0")"

# 1. 检查 Python
PY="python3"
if ! command -v python3 &>/dev/null; then
  PY="python"
fi
if ! $PY -c "import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)" 2>/dev/null; then
  echo "❌ 需要 Python 3.9+，当前版本：$($PY --version)"
  exit 1
fi
echo "✅ Python: $($PY --version)"

# 2. 建虚拟环境 + 装依赖
VENV=".venv"
if [ ! -d "$VENV" ]; then
  echo "📦 首次启动，创建虚拟环境并安装依赖（首次约 1 分钟）..."
  $PY -m venv "$VENV"
fi
source "$VENV/bin/activate"
pip install --quiet -r requirements.txt

# 3. 启动 uvicorn
PORT=4400
OPEN_URL="http://localhost:${PORT}/#/workbench"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ 启动成功！"
echo "  👉 浏览器打开：$OPEN_URL"
echo "  📂 生成图目录：$(pwd)/assets/"
echo "  🛑 停止服务：Ctrl + C"
echo "═══════════════════════════════════════════════════════════"
echo ""

# 自动尝试打开浏览器
sleep 1
case "$(uname)" in
  Darwin) open "$OPEN_URL" 2>/dev/null || true ;;
  Linux)  xdg-open "$OPEN_URL" 2>/dev/null || true ;;
esac

python -m uvicorn main:app --host 0.0.0.0 --port "$PORT" --reload
