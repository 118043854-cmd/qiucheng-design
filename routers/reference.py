# -*- coding: utf-8 -*-
"""创作参考 /api/reference — 灵感库"""
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class FavoriteRef(BaseModel):
    id: str
    category: str
    url: str


# 内置一批演示参考图（SVG 占位，前端也可展示 asset 库图）
BUILTIN_REFS = [
    {"id": "ref-1", "category": "家居", "url": "/static/icons/ref-home-1.svg", "name": "奶油米白底 棉拖鞋"},
    {"id": "ref-2", "category": "家居", "url": "/static/icons/ref-home-2.svg", "name": "浅紫背景 收纳盒"},
    {"id": "ref-3", "category": "鞋履", "url": "/static/icons/ref-shoe-1.svg", "name": "橙红背景 白色高帮鞋"},
    {"id": "ref-4", "category": "鞋履", "url": "/static/icons/ref-shoe-2.svg", "name": "奶白底 小白鞋"},
    {"id": "ref-5", "category": "美妆", "url": "/static/icons/ref-beauty-1.svg", "name": "浅粉背景 护肤品"},
    {"id": "ref-6", "category": "美妆", "url": "/static/icons/ref-beauty-2.svg", "name": "莫兰迪绿 香薰"},
    {"id": "ref-7", "category": "数码", "url": "/static/icons/ref-tech-1.svg", "name": "灰白底 耳机"},
    {"id": "ref-8", "category": "数码", "url": "/static/icons/ref-tech-2.svg", "name": "深色 无线充"},
    {"id": "ref-9", "category": "服饰", "url": "/static/icons/ref-cloth-1.svg", "name": "米色针织"},
    {"id": "ref-10", "category": "食品", "url": "/static/icons/ref-food-1.svg", "name": "奶油色 蛋糕"},
    {"id": "ref-11", "category": "家居", "url": "/static/icons/ref-home-3.svg", "name": "燕麦灰 抱枕"},
    {"id": "ref-12", "category": "鞋履", "url": "/static/icons/ref-shoe-3.svg", "name": "柔雾蓝 运动鞋"},
]

CATEGORIES = ["全部", "家居", "鞋履", "美妆", "数码", "服饰", "食品"]

# 收藏（内存 + 可选 json 文件持久化）
_favorites = set()


@router.get("/list")
def list_references(category: str = "全部", keyword: str = ""):
    items = BUILTIN_REFS[:]
    if category and category != "全部":
        items = [r for r in items if r["category"] == category]
    if keyword:
        kw = keyword.lower()
        items = [r for r in items if kw in r["name"].lower()]
    for r in items:
        r["favorited"] = r["id"] in _favorites
    return {"ok": True, "items": items, "categories": CATEGORIES}


@router.post("/favorite")
def favorite(req: FavoriteRef):
    _favorites.add(req.id)
    return {"ok": True}


@router.post("/unfavorite")
def unfavorite(req: FavoriteRef):
    _favorites.discard(req.id)
    return {"ok": True}


@router.get("/favorites")
def get_favorites():
    favs = [r for r in BUILTIN_REFS if r["id"] in _favorites]
    return {"ok": True, "items": favs}
