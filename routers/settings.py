# -*- coding: utf-8 -*-
"""设置 /api/settings"""
import os
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

ENV_FILE = Path(__file__).parent.parent / ".env.local"


class SettingsUpdate(BaseModel):
    api_key: str = ""
    base_url: str = ""
    model: str = ""


@router.get("/")
def get_settings():
    return {
        "ok": True,
        "api_key_set": bool(os.environ.get("AI_API_KEY")),
        "base_url": os.environ.get("AI_BASE_URL", "https://api.seedream.example.com"),
        "model": os.environ.get("AI_MODEL", "seedream-5.0-pro"),
    }


@router.post("/")
def update_settings(req: SettingsUpdate):
    # 写入 .env.local，并立即在本进程生效
    content = ""
    if req.api_key:
        os.environ["AI_API_KEY"] = req.api_key
        content += f"AI_API_KEY={req.api_key}\n"
    if req.base_url:
        os.environ["AI_BASE_URL"] = req.base_url
        content += f"AI_BASE_URL={req.base_url}\n"
    if req.model:
        os.environ["AI_MODEL"] = req.model
        content += f"AI_MODEL={req.model}\n"
    if content:
        ENV_FILE.write_text(content, encoding="utf-8")
    return {"ok": True}
