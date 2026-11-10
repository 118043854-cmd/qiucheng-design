/**
 * 一键抠图 / renderMatting
 */
function renderMatting(root) {
  const state = { images: [], bg: "transparent", taskId: null };
  root.innerHTML = pageShell("一键抠图", "自动去背景，输出透明底或带场景背景的成品", `
    <div class="step-block">
      <div class="step-head"><div class="step-badge">①</div><div class="step-title">上传商品图（批量）</div></div>
      <div class="dropzone" id="dz">
        <input type="file" id="file" multiple accept="image/*" hidden />
        <div class="dz-icon"><svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg></div>
        <div class="dz-title">点击或拖拽图片到此处</div>
        <div class="dz-hint">支持批量上传，去背景后统一生成</div>
      </div>
      <div class="thumb-list" id="thumbs"></div>
    </div>
    <div class="step-block">
      <div class="step-head"><div class="step-badge">②</div><div class="step-title">背景风格</div></div>
      <div class="tabs">
        <div class="tab active" data-bg="transparent">透明底</div>
        <div class="tab" data-bg="warm">暖橙波浪</div>
        <div class="tab" data-bg="sand">沙丘质感</div>
        <div class="tab" data-bg="scene">场景背景</div>
      </div>
      <div class="hint" style="margin-top:6px;">透明底输出 PNG，其他风格为成品 JPEG</div>
    </div>
    <button class="btn btn-primary" id="btn-gen" style="margin-top:4px;">+ 一键抠图</button>
  `, true);

  bindDrop("#dz", "#file", state.images, "#thumbs");
  $$(".tab[data-bg]", root).forEach(t => t.addEventListener("click", () => {
    $$(".tab[data-bg]", root).forEach(x => x.classList.remove("active"));
    t.classList.add("active"); state.bg = t.dataset.bg;
  }));

  $("#btn-gen", root).addEventListener("click", async () => {
    if (!state.images.length) { toast("请上传图片"); return; }
    const btn = $("#btn-gen", root); btn.disabled = true; btn.textContent = "处理中…";
    try {
      const data = await api("/api/matting/generate", {
        method: "POST",
        body: { image_paths: state.images.map(i => i.path), bg_style: state.bg },
      });
      state.taskId = data.task_id; poll(); toast("已提交");
    } catch (e) { btn.disabled = false; btn.textContent = "+ 一键抠图"; }
  });

  async function poll() {
    try {
      const data = await api(`/api/matting/tasks/${state.taskId}`);
      const t = data.task;
      if (t.status === "done") { renderResult(t.result_urls); const b = $("#btn-gen", root); b.disabled=false; b.textContent="+ 一键抠图"; return; }
      setTimeout(poll, 2000);
    } catch { setTimeout(poll, 2000); }
  }
}

function renderWatermark(root) {
  const state = { images: [], taskId: null };
  root.innerHTML = pageShell("去除水印", "一键清除水印与 LOGO，修补被遮挡区域", `
    <div class="step-block">
      <div class="step-head"><div class="step-badge">①</div><div class="step-title">上传带水印商品图</div></div>
      <div class="dropzone" id="dz">
        <input type="file" id="file" multiple accept="image/*" hidden />
        <div class="dz-icon"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>
        <div class="dz-title">点击或拖拽图片到此处</div>
        <div class="dz-hint">支持批量上传</div>
      </div>
      <div class="thumb-list" id="thumbs"></div>
    </div>
    <button class="btn btn-primary" id="btn-gen" style="margin-top:4px;">⚡ 一键处理</button>
  `, true);

  bindDrop("#dz", "#file", state.images, "#thumbs");
  $("#btn-gen", root).addEventListener("click", async () => {
    if (!state.images.length) { toast("请上传图片"); return; }
    const btn = $("#btn-gen", root); btn.disabled = true; btn.textContent = "去水印中…";
    try {
      const data = await api("/api/watermark/generate", {
        method: "POST", body: { image_paths: state.images.map(i => i.path) },
      });
      state.taskId = data.task_id; poll(); toast("已提交");
    } catch (e) { btn.disabled = false; btn.textContent = "⚡ 一键处理"; }
  });
  async function poll() {
    try {
      const data = await api(`/api/watermark/tasks/${state.taskId}`);
      const t = data.task;
      if (t.status === "done") { renderResult(t.result_urls); const b = $("#btn-gen", root); b.disabled=false; b.textContent="⚡ 一键处理"; return; }
      setTimeout(poll, 2000);
    } catch { setTimeout(poll, 2000); }
  }
}

function renderRetouch(root) {
  const state = { images: [], taskId: null };
  root.innerHTML = pageShell("产品精修", "AI 去污渍、去反光、去背景杂点，输出电商级白底商品图", `
    <div class="step-block">
      <div class="step-head"><div class="step-badge">①</div><div class="step-title">上传实拍图</div></div>
      <div class="dropzone" id="dz">
        <input type="file" id="file" multiple accept="image/*" hidden />
        <div class="dz-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg></div>
        <div class="dz-title">点击或拖拽图片到此处</div>
        <div class="dz-hint">支持批量上传</div>
      </div>
      <div class="thumb-list" id="thumbs"></div>
    </div>
    <button class="btn btn-primary" id="btn-gen" style="margin-top:4px;">✨ 产品精修</button>
  `, true);

  bindDrop("#dz", "#file", state.images, "#thumbs");
  $("#btn-gen", root).addEventListener("click", async () => {
    if (!state.images.length) { toast("请上传图片"); return; }
    const btn = $("#btn-gen", root); btn.disabled = true; btn.textContent = "精修中…";
    try {
      const data = await api("/api/retouch/generate", {
        method: "POST", body: { image_paths: state.images.map(i => i.path) },
      });
      state.taskId = data.task_id; poll(); toast("已提交");
    } catch (e) { btn.disabled = false; btn.textContent = "✨ 产品精修"; }
  });
  async function poll() {
    try {
      const data = await api(`/api/retouch/tasks/${state.taskId}`);
      const t = data.task;
      if (t.status === "done") { renderResult(t.result_urls); const b = $("#btn-gen", root); b.disabled=false; b.textContent="✨ 产品精修"; return; }
      setTimeout(poll, 2000);
    } catch { setTimeout(poll, 2000); }
  }
}

/** 通用页面外壳：左栏表单 + 右栏预览（前后对比） */
function pageShell(title, subtitle, leftHTML, showCompare = true) {
  return `
    <div class="page-header">
      <div class="page-title">${title}</div>
      <div class="page-subtitle">${subtitle}</div>
    </div>
    <div class="work-cols">
      <div class="col-left">${leftHTML}</div>
      <div class="col-right">
        <div class="preview-card">
          <div class="card-head"><div class="card-title">${showCompare ? "前后对比 · 结果预览" : "结果预览"}</div></div>
          <div id="preview-body">
            <div class="preview-empty">
              <div class="pe-icon">
                <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              </div>
              <div>提交任务后，生成结果将在此处展示</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/** 通用上传绑定 */
function bindDrop(dzSel, fileSel, arr, thumbsSel) {
  const dz = $(dzSel), file = $(fileSel);
  dz.addEventListener("click", () => file.click());
  dz.addEventListener("dragover", e => { e.preventDefault(); dz.classList.add("dragging"); });
  dz.addEventListener("dragleave", () => dz.classList.remove("dragging"));
  dz.addEventListener("drop", async e => {
    e.preventDefault(); dz.classList.remove("dragging");
    await handleFiles(e.dataTransfer.files);
  });
  file.addEventListener("change", async () => { await handleFiles(file.files); file.value = ""; });

  async function handleFiles(files) {
    if (!files.length) return;
    const fd = new FormData();
    [...files].forEach(f => fd.append("files", f));
    const url = location.hash.startsWith("#/matting") ? "/api/matting/upload"
              : location.hash.startsWith("#/watermark") ? "/api/watermark/upload"
              : "/api/retouch/upload";
    try {
      const data = await api(url, { method: "POST", body: fd });
      data.files.forEach(f => arr.push({ path: f.path, url: f.path }));
      renderThumbs(); toast(`已上传 ${data.files.length} 张`);
    } catch (e) { console.error(e); }
  }

  function renderThumbs() {
    const box = $(thumbsSel);
    box.innerHTML = arr.map((img, i) => `
      <div class="thumb" data-i="${i}"><img src="${img.url}"/><div class="remove">×</div></div>
    `).join("");
    $$(".remove", box).forEach(b => b.addEventListener("click", () => {
      const i = +b.parentElement.dataset.i; arr.splice(i, 1); renderThumbs();
    }));
  }
}

/** 通用结果渲染（网格 + 下载） */
function renderResult(urls) {
  $("#preview-body").innerHTML = `
    <div class="result-grid" style="grid-template-columns:repeat(3,1fr);">
      ${urls.map((u, i) => `
        <div class="result-item">
          <div class="ri-img"><img src="${u}"/><div class="ri-mask"><button onclick="downloadURL('${u}')">下载</button></div></div>
          <div class="ri-foot"><span>结果 ${i+1}</span><span style="color:var(--primary);cursor:pointer;" onclick="downloadURL('${u}')">下载 ↓</span></div>
        </div>
      `).join("")}
    </div>
  `;
}

registerRoute("matting", renderMatting, "一键抠图 · 秋成设计室");
registerRoute("watermark", renderWatermark, "去除水印 · 秋成设计室");
registerRoute("retouch", renderRetouch, "产品精修 · 秋成设计室");
