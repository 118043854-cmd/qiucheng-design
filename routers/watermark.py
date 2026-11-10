# -*- coding: utf-8 -*-
"""去除水印 /api/watermark"""
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
UPLOAD_DIR = _assets_root / "_uploads" / "watermark"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class GenerateWatermarkReq(BaseModel):
    image_paths: List[str]


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
        saved.append({"name": f.filename, "path": f"/assets/_uploads/watermark/{name}", "size": len(content)})
    return {"files": saved}


@router.post("/generate")
def generate(req: GenerateWatermarkReq):
    from prompts import WATERMARK_TEMPLATE
    items = []
    for ip in req.image_paths:
        items.append({"type": "watermark", "label": "去水印", "prompt": WATERMARK_TEMPLATE})
    task_id = task_manager.create_task(task_type="watermark", count_plan=items)
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
