/**
 * 设置页 / renderSettings
 */
function renderSettings(root) {
  root.innerHTML = `
    <div class="page-header">
      <div class="page-title">设置</div>
      <div class="page-subtitle">配置 AI 生图模型 API（可选，不配则使用本地占位图走通流程）</div>
    </div>

    <div class="card" style="padding:24px;">
      <div class="settings-form">
        <div style="margin-bottom:18px;padding:14px;background:#FAFBFC;border-radius:10px;border:1px solid var(--border);">
          <div style="font-weight:600;margin-bottom:6px;">🔑 AI 模型配置</div>
          <div class="hint">配置后才能真正调用 Seedream 5.0 Pro 等在线模型生图。未配置时也能跑通全流程（输出本地占位图用于演示）。</div>
        </div>

        <label class="label">API Key</label>
        <input class="input" id="api-key" type="password" placeholder="填入 AI 服务提供方的 API Key" />
        <div class="hint" style="margin-top:4px;">当前：<span id="api-key-status">未配置</span></div>

        <label class="label" style="margin-top:14px;">API Base URL</label>
        <input class="input" id="base-url" placeholder="https://api.seedream.example.com" />

        <label class="label" style="margin-top:14px;">模型名</label>
        <input class="input" id="model" placeholder="seedream-5.0-pro" />

        <button class="btn btn-secondary" id="btn-save" style="margin-top:20px;">保存设置</button>

        <hr style="margin:28px 0;border:none;border-top:1px solid var(--border);" />

        <div style="font-weight:600;margin-bottom:12px;">📦 服务信息</div>
        <div class="hint">
          <div>服务端口：<b>4400</b></div>
          <div>启动命令：<code style="background:#F5F7FA;padding:2px 6px;border-radius:4px;">python -m uvicorn main:app --reload</code></div>
          <div>API 文档：<a href="/docs" target="_blank" style="color:var(--primary);">http://localhost:4400/docs</a></div>
          <div>静态资源：<code>/static/</code>　生成图：<code>/assets/</code></div>
        </div>
      </div>
    </div>
  `;

  loadSettings();

  async function loadSettings() {
    try {
      const data = await api("/api/settings/");
      $("#api-key-status", root).textContent = data.api_key_set ? "✓ 已配置" : "未配置（将使用本地占位图）";
      $("#base-url", root).value = data.base_url || "";
      $("#model", root).value = data.model || "";
    } catch (e) { console.error(e); }
  }

  $("#btn-save", root).addEventListener("click", async () => {
    const body = {
      api_key: $("#api-key", root).value.trim(),
      base_url: $("#base-url", root).value.trim(),
      model: $("#model", root).value.trim(),
    };
    if (!body.api_key && !body.base_url && !body.model) { toast("没改啥就不用保存啦 ✨"); return; }
    try {
      await api("/api/settings/", { method: "POST", body });
      toast("设置已保存（需重启服务生效）");
      loadSettings();
      $("#api-key", root).value = "";
    } catch (e) { console.error(e); }
  });
}
registerRoute("settings", renderSettings, "设置 · 秋成设计室");
