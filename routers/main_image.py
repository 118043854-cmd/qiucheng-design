# -*- coding: utf-8 -*-
"""商品主图 /api/main-image"""
import os
import json
import uuid
from pathlib import Path
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from ai_client import AIClient
from task_manager import task_manager

router = APIRouter()

_assets_root = Path(os.environ.get("RENDER_DATA_DIR", Path(__file__).parent.parent)) / "assets"
BASE_DIR = Path(__file__).parent.parent  # 项目根（用于 URL 相对路径计算）
UPLOAD_DIR = _assets_root / "_uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class AnalyzeReq(BaseModel):
    description: str
    count_plan: Optional[dict] = None
    image_paths: Optional[List[str]] = None


class GenerateReq(BaseModel):
    description: str
    analyze_result: Optional[dict] = None  # 前端已拿 analyze 结果直接传
    count_plan: Optional[dict] = None
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
            "path": f"/assets/_uploads/{name}",
            "size": len(content),
        })
    return {"files": saved}


@router.post("/analyze")
def analyze(req: AnalyzeReq):
    client = AIClient()
    plan = req.count_plan or {"selling": 2, "scene": 2, "white": 1}
    result = client.analyze(req.description, req.image_paths or [], plan)
    return {"ok": True, "result": result}


@router.post("/generate")
def generate(req: GenerateReq):
    # 如果前端没传 analyze_result，先跑 analyze
    if req.analyze_result and req.analyze_result.get("groups"):
        groups = req.analyze_result["groups"]
    else:
        client = AIClient()
        plan = req.count_plan or {"selling": 2, "scene": 2, "white": 1}
        analyzed = client.analyze(req.description, req.image_paths or [], plan)
        groups = analyzed["groups"]

    count_plan_items = []
    for g in groups:
        for item in g.get("items", []):
            count_plan_items.append({
                "type": g["type"],
                "label": item["title"],
                "bg_color": item.get("bg_color", ""),
                "prompt": item["prompt"],
            })

    task_id = task_manager.create_task(
        task_type="main_image",
        prompt=req.description,
        count_plan=count_plan_items,
    )
    return {"ok": True, "task_id": task_id}


@router.get("/tasks/{task_id}")
def get_task(task_id: str):
    t = task_manager.get_task(task_id)
    if not t:
        raise HTTPException(404, "task not found")
    # result_paths 反序列化为前端可用 URL
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


@router.get("/tasks")
def list_tasks():
    return {"ok": True, "tasks": task_manager.list_tasks(limit=30)}


@router.get("/assets")
def list_assets():
    rows = task_manager.list_assets()
    # 按日期分组
    groups = {}
    for a in rows:
        dt = datetime.fromisoformat(a["created_at"])
        day_key = dt.strftime("%m月%d日")
        if day_key not in groups:
            groups[day_key] = []
        rel = a["path"].replace(str(BASE_DIR), "").replace("\\", "/")
        groups[day_key].append({
            "id": a["id"],
            "path": rel,
            "name": a["name"],
            "size": a["size"],
            "created_at": a["created_at"],
        })
    return {"ok": True, "groups": groups}


@router.delete("/assets/{asset_id}")
def del_asset(asset_id: str):
    ok = task_manager.delete_asset(asset_id)
    return {"ok": ok}
