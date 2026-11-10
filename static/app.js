/**
 * 秋成设计室 - AI 电商生图平台 / 前端通用入口
 * 负责 hash 路由、侧边栏高亮、全局 toast、API 封装
 */

// ============ 工具函数 ============
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function toast(msg, ms = 2400) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add("hidden"), ms);
}

async function api(url, opts = {}) {
  opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
  if (opts.body && typeof opts.body !== "string" && !(opts.body instanceof FormData)) {
    opts.body = JSON.stringify(opts.body);
  }
  if (opts.body instanceof FormData) {
    delete opts.headers["Content-Type"];
  }
  try {
    const r = await fetch(url, opts);
    const text = await r.text();
    const data = text ? JSON.parse(text) : {};
    if (!r.ok) {
      toast(data.detail || data.message || `请求失败 (${r.status})`);
      throw data;
    }
    return data;
  } catch (e) {
    if (e && e.detail) toast(e.detail);
    throw e;
  }
}

// ============ 路由表（各页面 JS 末尾向此表注册） ============
const ROUTES = {};
const pageTitles = {};

function registerRoute(key, fn, title) {
  ROUTES[key] = fn;
  if (title) pageTitles[key] = title;
}

function parseHash() {
  const h = (location.hash || "#/workbench").replace(/^#\/?/, "");
  return h.split("/")[0] || "workbench";
}

function navigate() {
  const key = parseHash();
  $$(".page").forEach(p => p.classList.add("hidden"));
  const page = $(`#page-${key}`);
  if (page) page.classList.remove("hidden");

  $$(".nav-item").forEach(a => {
    a.classList.toggle("active", a.dataset.route === key);
  });

  if (page) {
    page.innerHTML = "";
    const fn = ROUTES[key] || ROUTES.workbench;
    if (!fn) {
      page.innerHTML = `<div class="preview-empty"><div class="pe-icon" style="background:#FFE8E8;color:#C93333"><svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div><div>页面渲染函数未加载：${key}</div></div>`;
    } else {
      try { fn(page); } catch (e) {
        console.error(e);
        page.innerHTML = `<div style="color:#C93333;padding:20px;">渲染错误：${e.message}<pre style="margin-top:8px;font-size:11px;white-space:pre-wrap;color:#8F959E;">${e.stack}</pre></div>`;
      }
    }
  }
  document.title = pageTitles[key] || "秋成设计室";
}

window.addEventListener("hashchange", navigate);
document.addEventListener("DOMContentLoaded", () => {
  if (!location.hash) location.hash = "#/workbench";
  // 等所有 script 加载完再首次渲染
  setTimeout(navigate, 50);
});
