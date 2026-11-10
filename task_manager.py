# -*- coding: utf-8 -*-
"""任务队列 + 状态轮询管理"""
import os
import sqlite3
import threading
import time
import uuid
from pathlib import Path
from datetime import datetime
from enum import Enum
from typing import Optional


DB_PATH = Path(os.environ.get("RENDER_DATA_DIR") or Path(__file__).parent) / "qiucheng.db"


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"


_lock = threading.Lock()


# ===================== DB 初始化 =====================
def init_db():
    with _lock:
        conn = sqlite3.connect(str(DB_PATH))
        cur = conn.cursor()
        cur.executescript("""
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT,
            description TEXT,
            image_paths TEXT,  -- JSON list
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            type TEXT,          -- main_image / detail / remix / matting / watermark / retouch
            status TEXT,        -- pending/running/done/failed
            prompt TEXT,
            count_plan TEXT,    -- JSON list of sub-prompts
            progress INTEGER DEFAULT 0,
            total INTEGER DEFAULT 1,
            result_paths TEXT,  -- JSON list
            created_at TEXT,
            error_msg TEXT
        );

        CREATE TABLE IF NOT EXISTS assets (
            id TEXT PRIMARY KEY,
            task_id TEXT,
            path TEXT,
            name TEXT,
            created_at TEXT,
            size INTEGER
        );
        """)
        conn.commit()
        conn.close()


# ===================== DB 工具 =====================
def _conn():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def _now() -> str:
    return datetime.now().isoformat()


# ===================== Task 管理 =====================
class TaskManager:
    def __init__(self):
        init_db()
        self._running = True
        self._thread = threading.Thread(target=self._worker_loop, daemon=True)
        self._thread.start()

    def shutdown(self):
        self._running = False

    def _worker_loop(self):
        """后台轮询 pending 任务并执行"""
        while self._running:
            try:
                conn = _conn()
                cur = conn.cursor()
                cur.execute("SELECT id FROM tasks WHERE status='pending' ORDER BY created_at ASC LIMIT 3")
                pending = [r["id"] for r in cur.fetchall()]
                conn.close()
                for tid in pending:
                    self._execute_task(tid)
            except Exception as e:
                print(f"[TaskManager] worker error: {e}")
            time.sleep(1.0)

    def _execute_task(self, task_id: str):
        from ai_client import AIClient
        import json

        conn = _conn()
        cur = conn.cursor()
        cur.execute("SELECT * FROM tasks WHERE id=?", (task_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return

        # 标记为 running
        cur.execute("UPDATE tasks SET status='running', progress=0 WHERE id=?", (task_id,))
        conn.commit()
        conn.close()

        try:
            client = AIClient()
            plan = json.loads(row["count_plan"]) if row["count_plan"] else []
            result_paths = []

            # 构造输出目录
            assets_dir = Path(__file__).parent / "assets" / task_id
            assets_dir.mkdir(parents=True, exist_ok=True)

            total = len(plan) if plan else 1
            for i, item in enumerate(plan):
                prompt = item.get("prompt") or row["prompt"] or "电商产品图，奶油米白底，柔和顶光"
                fname = f"{i:02d}_{uuid.uuid4().hex[:8]}.png"
                out_path = assets_dir / fname

                ok = client.generate(prompt, str(out_path))
                if not ok:
                    raise RuntimeError(f"生成第 {i+1} 张失败")

                result_paths.append(str(out_path))

                # 写入 assets 表
                conn = _conn()
                cur = conn.cursor()
                cur.execute(
                    "INSERT INTO assets(id, task_id, path, name, created_at, size) VALUES (?,?,?,?,?,?)",
                    (uuid.uuid4().hex, task_id, str(out_path), fname, _now(), out_path.stat().st_size),
                )
                cur.execute("UPDATE tasks SET progress=? WHERE id=?", (i + 1, task_id))
                conn.commit()
                conn.close()

                # 模拟进度感知
                time.sleep(0.3)

            conn = _conn()
            cur = conn.cursor()
            cur.execute(
                "UPDATE tasks SET status='done', progress=?, total=?, result_paths=? WHERE id=?",
                (total, total, json.dumps(result_paths, ensure_ascii=False), task_id),
            )
            conn.commit()
            conn.close()

        except Exception as e:
            print(f"[TaskManager] task {task_id} failed: {e}")
            conn = _conn()
            cur = conn.cursor()
            cur.execute("UPDATE tasks SET status='failed', error_msg=? WHERE id=?", (str(e), task_id))
            conn.commit()
            conn.close()

    # ---- API ----
    def create_task(self, task_type: str, prompt: str = "", count_plan: Optional[list] = None) -> str:
        import json
        task_id = uuid.uuid4().hex
        conn = _conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO tasks(id, type, status, prompt, count_plan, total, created_at) VALUES (?,?,?,?,?,?,?)",
            (
                task_id, task_type, TaskStatus.PENDING.value,
                prompt,
                json.dumps(count_plan or [], ensure_ascii=False),
                len(count_plan) if count_plan else 1,
                _now(),
            ),
        )
        conn.commit()
        conn.close()
        return task_id

    def get_task(self, task_id: str) -> Optional[dict]:
        conn = _conn()
        cur = conn.cursor()
        cur.execute("SELECT * FROM tasks WHERE id=?", (task_id,))
        row = cur.fetchone()
        conn.close()
        return dict(row) if row else None

    def list_tasks(self, limit: int = 50) -> list:
        conn = _conn()
        cur = conn.cursor()
        cur.execute("SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows

    def list_assets(self, limit: int = 200) -> list:
        conn = _conn()
        cur = conn.cursor()
        cur.execute("SELECT * FROM assets ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows

    def delete_asset(self, asset_id: str) -> bool:
        conn = _conn()
        cur = conn.cursor()
        cur.execute("SELECT path FROM assets WHERE id=?", (asset_id,))
        row = cur.fetchone()
        if row:
            try:
                Path(row["path"]).unlink(missing_ok=True)
            except Exception:
                pass
        cur.execute("DELETE FROM assets WHERE id=?", (asset_id,))
        conn.commit()
        conn.close()
        return bool(row)


# 全局单例
task_manager = TaskManager()
