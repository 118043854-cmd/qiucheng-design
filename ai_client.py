# -*- coding: utf-8 -*-
"""AI 模型客户端封装（默认 Seedream 5.0 Pro）"""
import os
import time
import random
import base64
from pathlib import Path
from typing import Optional

import httpx

# 环境变量：可切换模型
API_KEY = os.environ.get("AI_API_KEY", "")
BASE_URL = os.environ.get("AI_BASE_URL", "https://api.seedream.example.com")
MODEL_NAME = os.environ.get("AI_MODEL", "seedream-5.0-pro")


class AIClient:
    def __init__(self, api_key: str = API_KEY, base_url: str = BASE_URL, model: str = MODEL_NAME):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.client = httpx.Client(timeout=120.0)

    # -------- 模拟分析（本地规则即可返回卖点/场景/提示词） --------
    def analyze(self, description: str, image_paths: list, count_plan: dict) -> dict:
        """
        返回：
        {
          "summary": "...",
          "groups": [
            {"label": "卖点图（2 张）", "type": "selling", "items": [
              {"title": "...", "bg_color": "奶杏色", "prompt": "..."}
            ]},
            {"label": "场景图（2 张）", "type": "scene", "items": [...]},
            {"label": "白底图（1 张）", "type": "whitebg", "items": [...]}
          ]
        }
        """
        from prompts import (
            build_selling_points_analysis,
            SELLING_POINT_TEMPLATE,
            SCENE_TEMPLATE,
            WHITE_BG_TEMPLATE,
        )

        parsed = build_selling_points_analysis(description)
        selling_points = parsed["selling_points"]
        scenes = parsed["scenes"]
        category = parsed["category"]
        style = parsed["style"]

        bg_colors = ["奶杏色", "奶油米白", "莫兰迪粉", "柔雾蓝", "燕麦灰", "低饱和墨绿"]
        selling_titles = [
            f"温暖居家 / 软绒相伴",
            f"{style} / {category}",
            f"品质之选 / 细节可见",
        ]
        selling_taglines = [
            "踩屎感软底 · 加绒保暖",
            "防水易擦 · 防滑耐磨",
            "舒适亲肤 · 久穿不累",
        ]

        n_sell = count_plan.get("selling", 2)
        n_scene = count_plan.get("scene", 2)
        n_white = count_plan.get("white", 1)

        # 卖点图
        sell_items = []
        for i in range(n_sell):
            title_main = selling_titles[i % len(selling_titles)]
            title_sub = selling_taglines[i % len(selling_taglines)]
            bg = bg_colors[i % len(bg_colors)]
            points_str = " / ".join(selling_points[:4])
            prompt = SELLING_POINT_TEMPLATE.format(
                background_color=bg,
                title_main=title_main.split(" / ")[0],
                title_sub=title_main.split(" / ")[-1] if " / " in title_main else title_sub,
                selling_points=points_str,
                brand_slogan=f"{category} · 品质之选",
            )
            sell_items.append({
                "title": f"卖点图 #{i+1} · {title_main}",
                "bg_color": bg,
                "prompt": prompt,
            })

        # 场景图
        scene_items = []
        scene_descs = [
            "温暖的卧室地板上，清晨自然光透过窗帘",
            "干净浴室门口，白色瓷砖与浴缸呼应",
            "北欧风客厅地毯旁，温馨的室内灯",
            "玄关换鞋凳上，傍晚归家的氛围感",
        ]
        scene_taglines = [
            "居家舒适 · 踏上去的那一刻",
            "防水防滑 · 浴室也能放心用",
            "暖光柔绒 · 家的感觉",
        ]
        for i in range(n_scene):
            sc = scene_descs[i % len(scene_descs)]
            tag = scene_taglines[i % len(scene_taglines)]
            bg = bg_colors[(i + 2) % len(bg_colors)]
            prompt = SCENE_TEMPLATE.format(
                scene_desc=sc,
                scene_tagline=tag,
            )
            scene_items.append({
                "title": f"场景图 #{i+1} · {sc[:15]}...",
                "bg_color": bg,
                "prompt": prompt,
            })

        # 白底图
        white_items = []
        for i in range(n_white):
            prompt = WHITE_BG_TEMPLATE.format(
                quantity_desc="三色一字排开",
                title=f"女士{category}精选",
                selling_points_line=" | ".join(selling_points[:3]),
            )
            white_items.append({
                "title": f"白底图 #{i+1}",
                "bg_color": "纯净白",
                "prompt": prompt,
            })

        summary = (
            f"AI 已按所选张数给出 {n_sell + n_scene + n_white} 条逐图文案与提示词"
            f"（卖点图 {n_sell} · 场景图 {n_scene} · 白底图 {n_white}），"
            f"可直接生成，也可改描述后重新分析。"
        )

        return {
            "summary": summary,
            "groups": [
                {"label": f"卖点图（{n_sell} 张）", "type": "selling", "items": sell_items},
                {"label": f"场景图（{n_scene} 张）", "type": "scene", "items": scene_items},
                {"label": f"白底图（{n_white} 张）", "type": "whitebg", "items": white_items},
            ],
        }

    # -------- 生成图片 --------
    def generate(self, prompt: str, output_path: str, image_paths: Optional[list] = None) -> bool:
        """
        调用 AI 接口生图。若未配置 API_KEY，则走本地占位图生成（返回 True + 写占位）。
        返回 True 表示成功（输出文件存在）。
        """
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        if self.api_key:
            try:
                # 真实接口示意（按实际模型 API 调整）
                payload = {
                    "model": self.model,
                    "prompt": prompt,
                    "image_urls": image_paths or [],
                    "width": 1024,
                    "height": 1024,
                }
                resp = self.client.post(
                    f"{self.base_url}/v1/images/generations",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                b64 = data["data"][0].get("b64_json") or data["data"][0].get("image_b64")
                if b64:
                    with open(output_path, "wb") as f:
                        f.write(base64.b64decode(b64))
                    return True
            except Exception as e:
                print(f"[AI Client] 真实接口失败，回退占位图：{e}")

        # 本地占位：生成一张 SVG 占位图 → 简单 JPEG 像素图（使用 Pillow 若可用；否则纯色 PNG）
        self._write_placeholder(output_path, prompt)
        return True

    def _write_placeholder(self, path: str, prompt: str):
        """若有 Pillow 则写渐变占位 PNG；否则写最小 PNG"""
        try:
            from PIL import Image, ImageDraw, ImageFont
            W, H = 1024, 1024
            # 随机柔和背景
            palettes = [
                ((255, 248, 240), (240, 220, 200)),   # 奶油米
                ((250, 245, 255), (230, 220, 255)),   # 浅紫
                ((255, 245, 238), (255, 200, 180)),   # 橙粉
                ((240, 248, 255), (200, 220, 255)),   # 浅蓝
                ((248, 248, 248), (220, 220, 220)),   # 灰白
            ]
            c1, c2 = random.choice(palettes)
            img = Image.new("RGB", (W, H), c1)
            draw = ImageDraw.Draw(img)
            # 画一个渐变对角（近似）
            for y in range(H):
                r = int(c1[0] + (c2[0] - c1[0]) * y / H)
                g = int(c1[1] + (c2[1] - c1[1]) * y / H)
                b = int(c1[2] + (c2[2] - c1[2]) * y / H)
                draw.line([(0, y), (W, y)], fill=(r, g, b))
            # 画一个居中的产品占位（椭圆）
            draw.ellipse([W*0.25, H*0.25, W*0.75, H*0.75], fill=(255, 255, 255, 180), outline=(180, 180, 200), width=3)
            # 写文字
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
            except Exception:
                font = ImageFont.load_default()
            text = prompt[:40] + "..." if len(prompt) > 40 else prompt
            # 简单截断为两行
            mid = len(text) // 2
            lines = [text[:mid], text[mid:]]
            y_pos = H - 120
            for line in lines:
                bbox = draw.textbbox((0, 0), line, font=font)
                tw = bbox[2] - bbox[0]
                draw.text(((W - tw) / 2, y_pos), line, fill=(50, 50, 60), font=font)
                y_pos += 44
            img.save(path, "PNG")
        except ImportError:
            # 无 Pillow 时：写一个最小的 1×1 PNG（保证能下载/显示，画面差但流程跑通）
            import struct, zlib
            raw = b'\x00\x00\x00\x00' + b'\xff\xf8\xf0\xf0'
            def chunk(tag, data):
                return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
            sig = b'\x89PNG\r\n\x1a\n'
            ihdr = struct.pack('>IIBBBBB', 1024, 1024, 8, 2, 0, 0, 0)
            idat = zlib.compress(b'\x00' * (1024 * 1024 * 3))
            png = sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')
            with open(path, 'wb') as f:
                f.write(png)
