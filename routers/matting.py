# -*- coding: utf-8 -*-
"""一键抠图 /api/matting"""
import os
from pathlib import Path
from datetime import datetime
from typing import List

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from task_manager import task_manager

router = APIRouter()

_assets_root = Path(os.environ.get("RENDER_DATA_DIR", Path(__file__).parent.parent)) / "assets"
BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = _assets_root / "_uploads" / "matting"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class GenerateMattingReq(BaseModel):
    image_paths: List[str]
    bg_style: str = "transparent"  # transparent / warm / sand / scene
    count: int = 1


BG_DESC = {
    "transparent": "透明底 PNG",
    "warm": "暖橙色波浪质感背景",
    "sand": "沙丘/米色质感背景",
    "scene": "温和奶油米色电商场景",
}


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
        saved.append({"name": f.filename, "path": f"/assets/_uploads/matting/{name}", "size": len(content)})
    return {"files": saved}


@router.post("/generate")
def generate(req: GenerateMattingReq):
    from prompts import MATTE_TEMPLATE
    items = []
    for ip in req.image_paths:
        for _ in range(req.count):
            prompt = MATTE_TEMPLATE.format(bg_desc=BG_DESC.get(req.bg_style, "透明底"))
            items.append({"type": "matting", "label": f"抠图", "prompt": prompt})

    task_id = task_manager.create_task(task_type="matting", count_plan=items)
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
    return {"ok": True, "task": {
        "id": t["id"], "type": t["type"], "status": t["status"],
        "progress": t["progress"], "total": t["total"],
        "error_msg": t["error_msg"], "result_urls": urls,
    }}
