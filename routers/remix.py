# -*- coding: utf-8 -*-
"""爆款复刻 /api/remix"""
import os
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
UPLOAD_DIR = _assets_root / "_uploads" / "remix"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class ParseUrlReq(BaseModel):
    url: str
    product_desc: str = "爆款复刻主图"


class GenerateRemixReq(BaseModel):
    reference_paths: List[str]
    product_paths: List[str]
    product_desc: str
    remix_type: str = "main"  # main / detail
    count: int = 4


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
            "path": f"/assets/_uploads/remix/{name}",
            "size": len(content),
        })
    return {"files": saved}


@router.post("/parse-url")
def parse_url(req: ParseUrlReq):
    """解析商品链接，返回参考图列表（演示：mock 3 张）"""
    # 真实场景：用 httpx + BeautifulSoup 抓商品图，这里走占位
    return {
        "ok": True,
        "url": req.url,
        "reference_images": [
            "/static/icons/remix-ref-1.svg",
            "/static/icons/remix-ref-2.svg",
            "/static/icons/remix-ref-3.svg",
        ],
        "brand": "未识别",
        "title": "复刻参考（解析成功）",
    }


@router.post("/generate")
def generate(req: GenerateRemixReq):
    from prompts import REMIX_TEMPLATE
    count_plan_items = []
    for i in range(req.count):
        prompt = REMIX_TEMPLATE.format(product_desc=req.product_desc)
        count_plan_items.append({
            "type": "remix",
            "label": f"复刻图 #{i+1}",
            "prompt": prompt,
        })

    task_id = task_manager.create_task(
        task_type="remix",
        prompt=req.product_desc,
        count_plan=count_plan_items,
    )
    return {"ok": True, "task_id": task_id}


@router.get("/tasks/{task_id}")
def get_task(task_id: str):
    return _task_to_response(task_id)


def _task_to_response(task_id: str):
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
