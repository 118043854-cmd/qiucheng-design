# -*- coding: utf-8 -*-
"""秋成设计室 - AI 电商生图平台 / FastAPI 入口"""
import os
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).parent
sys.path.insert(0, str(BASE_DIR))

# 生产环境（Render）下 /assets 和 DB 需要持久化磁盘
# Render 免费版没有持久化磁盘，所以 assets 存在 BASE_DIR 里就行（实例重启会丢，免费版限制）
# 如果用户绑了持久化磁盘（/data 或 /storage），自动使用
if os.environ.get("RENDER"):
    DATA_DIR = Path(os.environ.get("RENDER_DATA_DIR", BASE_DIR))
else:
    DATA_DIR = BASE_DIR

ASSETS_DIR = DATA_DIR / "assets"
ASSETS_DIR.mkdir(parents=True, exist_ok=True)

import routers.main_image
import routers.detail
import routers.remix
import routers.matting
import routers.watermark
import routers.retouch
import routers.reference
import routers.settings

app = FastAPI(title="秋成设计室 AI 电商生图平台", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- 路由 ----------
app.include_router(routers.main_image.router, prefix="/api/main-image", tags=["商品主图"])
app.include_router(routers.detail.router, prefix="/api/detail", tags=["商品详情图"])
app.include_router(routers.remix.router, prefix="/api/remix", tags=["爆款复刻"])
app.include_router(routers.matting.router, prefix="/api/matting", tags=["一键抠图"])
app.include_router(routers.watermark.router, prefix="/api/watermark", tags=["去除水印"])
app.include_router(routers.retouch.router, prefix="/api/retouch", tags=["产品精修"])
app.include_router(routers.reference.router, prefix="/api/reference", tags=["创作参考"])
app.include_router(routers.settings.router, prefix="/api/settings", tags=["设置"])

# ---------- 静态文件 ----------
app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")


@app.get("/", response_class=HTMLResponse)
async def root():
    return HTMLResponse(content=(BASE_DIR / "static" / "index.html").read_text(encoding="utf-8"))


@app.get("/api/health")
async def health():
    return {"ok": True, "service": "秋成设计室", "env": os.environ.get("RENDER") and "render" or "local"}


@app.on_event("startup")
async def on_startup():
    port = os.environ.get("PORT", "4400")
    banner = f"""
============================================================
  秋成设计室 · AI 电商生图平台  已启动
  端口      {port}
  访问地址  http://localhost:{port}/#/workbench
  静态资源  /static/   生成图  /assets/
  API 文档  http://localhost:{port}/docs
  运行环境  {"Render / 生产" if os.environ.get("RENDER") else "本地开发"}
============================================================
"""
    print(banner)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "4400"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=(not os.environ.get("RENDER")))
