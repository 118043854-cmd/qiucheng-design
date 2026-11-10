# -*- coding: utf-8 -*-
"""商品详情图 /api/detail — 竖版长图详情页"""
import os
import json
import uuid
from pathlib import Path
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from ai_client import AIClient
from task_manager import task_manager

router = APIRouter()

_assets_root = Path(os.environ.get("RENDER_DATA_DIR", Path(__file__).parent.parent)) / "assets"
BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = _assets_root / "_uploads" / "detail"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class AnalyzeDetailReq(BaseModel):
    description: str
    image_paths: Optional[List[str]] = None


class GenerateDetailReq(BaseModel):
    description: str
    count: int = 6
    image_paths: Optional[List[str]] = None


@router.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    saved = []
    for f in files:
        if not f.filename:
            continue
        ext = Path(f.filename).suffix.lower() or ".png"
        name = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}{ext}"
        target = UPLOAD_DIR / name
        content = await f.read()
        target.write_bytes(content)
        saved.append({
            "name": f.filename,
            "path": f"/assets/_uploads/detail/{name}",
            "size": len(content),
        })
    return {"files": saved}


@router.post("/analyze")
def analyze(req: AnalyzeDetailReq):
    """为详情图按 count 规划分屏文案"""
    from prompts import build_selling_points_analysis, DETAIL_TEMPLATE
    parsed = build_selling_points_analysis(req.description)
    screens = [
        {"title": "首屏 · 品牌大图", "prompt": DETAIL_TEMPLATE},
        {"title": f"卖点屏 1 · {parsed['selling_points'][0] if parsed['selling_points'] else '品质优良'}", "prompt": "详情分屏，主卖点特写+文案"},
        {"title": f"卖点屏 2 · {parsed['selling_points'][1] if len(parsed['selling_points']) > 1 else '工艺精湛'}", "prompt": "详情分屏，第二卖点"},
        {"title": "细节展示 · 特写", "prompt": "详情分屏，工艺细节特写"},
        {"title": "使用场景屏", "prompt": "详情分屏，场景展示"},
        {"title": "收尾屏 · 品牌语", "prompt": "详情分屏，品牌收尾"},
    ]
    return {"ok": True, "summary": "已规划详情页分屏", "screens": screens}


@router.post("/generate")
def generate(req: GenerateDetailReq):
    from prompts import DETAIL_TEMPLATE
    items = []
    for i in range(req.count):
        prompt = DETAIL_TEMPLATE.format(style_desc="干净高级 奶米色调")
        items.append({"type": "detail", "label": f"详情分屏 #{i+1}", "prompt": prompt})

    task_id = task_manager.create_task(
        task_type="detail",
        prompt=req.description,
        count_plan=items,
    )
    return {"ok": True, "task_id": task_id}


@router.get("/tasks/{task_id}")
def get_task(task_id: str):
    t = task_manager.get_task(task_id)
    if not t:
        raise HTTPException(404, "task not found")
    try:
        paths = json.loads(t["result_paths"]) if t["result_paths"] else []
    except Exception:
        paths = []
    urls = [p.replace(str(BASE_DIR), "").replace("\\", "/") for p in paths]
    return {
        "ok": True,
        "task": {
            "id": t["id"],
            "type": t["type"],
            "status": t["status"],
            "progress": t["progress"],
            "total": t["total"],
            "error_msg": t["error_msg"],
            "result_urls": urls,
        },
    }
