/**
 * 商品主图页面 / renderMainImage
 */
function renderMainImage(root) {
  const state = {
    productImages: [],      // [{path, name}]
    refImages: [],          // [{path, name}]
    description: "",
    countPlan: { selling: 2, scene: 2, white: 1 },
    analyzedResult: null,
    taskId: null,
    pollTimer: null,
  };

  root.innerHTML = `
    <div class="page-header">
      <div class="page-title">商品主图</div>
      <div class="page-subtitle">上传商品图 → AI 分析 → 一键生成卖点图、场景图、白底图套图</div>
    </div>

    <div class="work-cols">
      <!-- ============ 左栏 ============ -->
      <div class="col-left">
        <!-- 步骤 1：上传商品 -->
        <div class="step-block">
          <div class="step-head">
            <div class="step-badge">①</div>
            <div class="step-title">上传商品</div>
          </div>

          <div style="font-size:13px;color:var(--text-1);font-weight:500;margin-bottom:8px;">
            * 上传商品图<span style="color:var(--text-3);font-weight:400;margin-left:4px;">最多 5 张</span>
          </div>

          <div class="dropzone" id="dz-product">
            <input type="file" id="file-product" multiple accept="image/jpeg,image/png,image/webp" hidden />
            <div class="dz-icon">
              <svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </div>
            <div class="dz-title">点击上传或拖拽图片到此处</div>
            <div class="dz-hint">支持 JPG/PNG，单张 ≤10MB</div>
          </div>
          <div class="thumb-list" id="thumbs-product"></div>

          <div style="margin-top:18px;padding:14px;background:#FAFBFC;border-radius:10px;border:1px solid var(--border);display:flex;gap:12px;align-items:flex-start;">
            <div style="flex:0 0 auto;">
              <div class="dropzone" id="dz-ref" style="padding:16px 12px;min-width:110px;">
                <input type="file" id="file-ref" accept="image/*" hidden />
                <div class="dz-icon" style="width:32px;height:32px;">
                  <svg viewBox="0 0 24 24" style="width:16px;height:16px;"><path d="M12 5v14M5 12h14"/></svg>
                </div>
                <div class="dz-title" style="font-size:12px;">+ 上传参考图</div>
              </div>
            </div>
            <div style="flex:1;font-size:12px;color:var(--text-2);line-height:1.6;">
              <div style="color:var(--text-1);font-weight:500;margin-bottom:4px;">参考图 <span style="color:var(--text-3);font-weight:400;">可选</span></div>
              按参考图的视觉风格与文字排版重新设计，商品外观保持不变。<br/>
              点击或拖拽图片到左侧图框，也可从右侧灵感库「用作参考」。
            </div>
          </div>
          <div class="thumb-list" id="thumbs-ref" style="margin-top:10px;"></div>
        </div>

        <!-- 步骤 2：商品描述 -->
        <div class="step-block">
          <div class="step-head">
            <div class="step-badge">②</div>
            <div class="step-title">商品描述</div>
          </div>

          <textarea class="textarea" id="desc-input" placeholder="用一段话描述商品与想要的效果，例如：这是一双加绒防水的棉拖鞋，想在浴室和卧室的真实居家场景里展示，风格要干净高级、文字大而清晰，突出防水易擦、加绒保暖、厚底不累脚"></textarea>
          <div class="hint" style="margin-top:6px;">
            名称、品类、卖点与风格都由这段描述自动提取，同时会按品类自动检索同类型商品主图作参考。
          </div>

          <div id="analysis-area" style="margin-top:14px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <button class="btn btn-secondary" id="btn-analyze">AI 分析</button>
              <span class="hint" id="analysis-tip">先上传商品图并填写商品描述…</span>
            </div>
          </div>
        </div>

        <!-- 步骤 3：生成数量 -->
        <div class="step-block">
          <div class="step-head">
            <div class="step-badge">③</div>
            <div class="step-title">生成数量（共 5 张套图）</div>
          </div>

          <div id="steppers">
            ${stepperHTML("selling", "卖点图", "爆款主文案", 2)}
            ${stepperHTML("scene", "场景图", "氛围场景", 2)}
            ${stepperHTML("white", "白底图", "纯净展示", 1)}
          </div>
          <div style="font-size:12.5px;color:var(--text-1);margin-top:10px;font-weight:500;">
            将生成 <span id="total-count" style="color:var(--primary);font-weight:700;">5</span> 张图片
            <span style="color:var(--text-3);margin-left:4px;" id="count-detail">（卖点 2 · 场景 2 · 白底 1）</span>
          </div>
          <div class="hint" style="margin-top:6px;">
            只以你的商品图为外观依据；名称、品类、卖点与风格从描述自动提取，并自动检索同类型商品主图作参考。
          </div>

          <div class="advanced-toggle" id="adv-toggle">
            <span class="arrow">▸</span> 高级设置
          </div>
          <div class="advanced-panel" id="adv-panel">
            <label class="label">图片尺寸</label>
            <select class="select" id="adv-size">
              <option value="1024x1024">1:1 方形 (1024×1024)</option>
              <option value="1024x1365">3:4 竖版 (1024×1365)</option>
              <option value="1365x1024">4:3 横版 (1365×1024)</option>
            </select>
            <label class="label" style="margin-top:12px;">生图风格</label>
            <select class="select" id="adv-style">
              <option value="clean">干净高级（默认）</option>
              <option value="warm">温暖居家</option>
              <option value="premium">品质奢华</option>
              <option value="minimal">极简纯净</option>
            </select>
          </div>

          <button class="btn btn-primary" id="btn-generate" style="margin-top:20px;">+ 开始生成</button>
        </div>
      </div>

      <!-- ============ 右栏 ============ -->
      <div class="col-right">
        <!-- 效果图预览 -->
        <div class="preview-card">
          <div class="card-head">
            <div class="card-title">效果图预览</div>
            <button class="download-all hidden" id="btn-download-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              下载全部 (<span id="dn-count">0</span>)
            </button>
          </div>

          <div id="preview-body">
            <div class="preview-empty">
              <div class="pe-icon">
                <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              </div>
              <div>提交任务后，生成结果将在此处展示</div>
            </div>
          </div>
        </div>

        <!-- 资产库 -->
        <div class="preview-card">
          <div class="card-head">
            <div class="card-title">资产库</div>
            <span class="hint" id="assets-time"></span>
          </div>
          <div id="assets-body">
            <div class="hint" style="text-align:center;padding:30px;">暂无历史生成图片</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ============ 上传商品图 ============
  bindUpload(root, "#dz-product", "#file-product", state.productImages, "#thumbs-product");
  bindUpload(root, "#dz-ref", "#file-ref", state.refImages, "#thumbs-ref");

  function bindUpload(root, dzSel, fileSel, arr, thumbsSel) {
    const dz = $(dzSel, root);
    const file = $(fileSel, root);
    if (!dz) return;
    dz.addEventListener("click", () => file.click());
    dz.addEventListener("dragover", e => { e.preventDefault(); dz.classList.add("dragging"); });
    dz.addEventListener("dragleave", () => dz.classList.remove("dragging"));
    dz.addEventListener("drop", async e => {
      e.preventDefault();
      dz.classList.remove("dragging");
      await handleFiles(e.dataTransfer.files, arr, thumbsSel);
    });
    file.addEventListener("change", async () => {
      await handleFiles(file.files, arr, thumbsSel);
      file.value = "";
    });
  }

  async function handleFiles(fileList, arr, thumbsSel) {
    const files = [...fileList];
    if (!files.length) return;
    const fd = new FormData();
    files.forEach(f => fd.append("files", f));
    try {
      const data = await api("/api/main-image/upload", { method: "POST", body: fd });
      data.files.forEach(f => {
        arr.push({ path: f.path, name: f.name, url: f.path });
      });
      renderThumbs(arr, thumbsSel);
      toast(`已上传 ${data.files.length} 张`);
    } catch (e) { console.error(e); }
  }

  function renderThumbs(arr, sel) {
    const box = $(sel, root);
    if (!box) return;
    box.innerHTML = arr.map((img, i) => `
      <div class="thumb" data-i="${i}">
        <img src="${img.url || img.path}" alt="" />
        <div class="remove" title="移除">×</div>
      </div>
    `).join("");
    $$(".remove", box).forEach(btn => {
      btn.addEventListener("click", e => {
        const i = +btn.parentElement.dataset.i;
        arr.splice(i, 1);
        renderThumbs(arr, sel);
      });
    });
  }

  // ============ 描述 ============
  const descInput = $("#desc-input", root);
  descInput.addEventListener("input", () => { state.description = descInput.value; });

  // ============ 步进器 ============
  $$(".stepper-control", root).forEach((ctrl, idx) => {
    const keys = ["selling", "scene", "white"];
    const key = keys[idx];
    const val = $(".stepper-val", ctrl);
    const dec = $(".stepper-dec", ctrl);
    const inc = $(".stepper-inc", ctrl);
    const update = () => {
      state.countPlan[key] = +val.textContent;
      const t = state.countPlan;
      const total = t.selling + t.scene + t.white;
      $("#total-count").textContent = total;
      $("#count-detail").textContent = `（卖点 ${t.selling} · 场景 ${t.scene} · 白底 ${t.white}）`;
      dec.disabled = +val.textContent <= 0;
    };
    dec.addEventListener("click", () => { val.textContent = Math.max(0, +val.textContent - 1); update(); });
    inc.addEventListener("click", () => { val.textContent = Math.min(10, +val.textContent + 1); update(); });
  });

  // ============ 高级设置折叠 ============
  const advToggle = $("#adv-toggle", root);
  const advPanel = $("#adv-panel", root);
  advToggle.addEventListener("click", () => {
    advToggle.classList.toggle("open");
    advPanel.classList.toggle("open");
  });

  // ============ AI 分析 ============
  $("#btn-analyze", root).addEventListener("click", async () => {
    if (!state.description.trim()) { toast("请填写商品描述"); return; }
    if (!state.productImages.length) { toast("请先上传商品图"); return; }
    const btn = $("#btn-analyze", root);
    const tip = $("#analysis-tip", root);
    const area = $("#analysis-area", root);
    btn.disabled = true;
    btn.textContent = "分析中…";
    tip.textContent = "正在按所选张数逐图写文案与提示词（卖点 " + state.countPlan.selling + " · 场景 " + state.countPlan.scene + " · 白底 " + state.countPlan.white + "），均需十几秒";

    try {
      const data = await api("/api/main-image/analyze", {
        method: "POST",
        body: {
          description: state.description,
          count_plan: state.countPlan,
          image_paths: state.productImages.map(i => i.path),
        },
      });
      state.analyzedResult = data.result;
      area.innerHTML = renderAnalysisResult(data.result);
      bindPromptToggles(area);
      toast("分析完成，可直接生成");
    } catch (e) {
      tip.textContent = "分析失败，请重试";
    } finally {
      btn.disabled = false;
      btn.textContent = "AI 分析";
    }
  });

  function renderAnalysisResult(result) {
    let html = `<div class="analysis-summary">${result.summary}</div>`;
    result.groups.forEach(g => {
      html += `<div class="group-prompt">
        <div class="group-prompt-title">▸ ${g.label}</div>`;
      g.items.forEach((item, idx) => {
        html += `
          <div class="prompt-item" data-open="false">
            <div class="prompt-item-head">
              <span class="pi-title">${item.title}</span>
              <span class="pi-bg">${item.bg_color}</span>
              <span class="pi-toggle">▸ 查看这张的生图提示词</span>
            </div>
            <div class="prompt-detail hidden">${item.prompt}</div>
          </div>
        `;
      });
      html += `</div>`;
    });
    return html;
  }

  function bindPromptToggles(area) {
    $$(".prompt-item", area).forEach(item => {
      item.addEventListener("click", () => {
        const open = item.dataset.open === "true";
        item.dataset.open = String(!open);
        item.querySelector(".prompt-detail").classList.toggle("hidden", open);
        item.querySelector(".pi-toggle").textContent = open ? "▸ 查看这张的生图提示词" : "▾ 收起提示词";
      });
    });
  }

  // ============ 开始生成 ============
  $("#btn-generate", root).addEventListener("click", async () => {
    if (!state.productImages.length) { toast("请先上传商品图"); return; }
    if (!state.description.trim()) { toast("请填写商品描述并点 AI 分析"); return; }

    const btn = $("#btn-generate", root);
    btn.disabled = true;
    btn.textContent = "生成中…";

    try {
      const data = await api("/api/main-image/generate", {
        method: "POST",
        body: {
          description: state.description,
          count_plan: state.countPlan,
          image_paths: state.productImages.map(i => i.path),
          analyze_result: state.analyzedResult,
        },
      });
      state.taskId = data.task_id;
      renderPreviewGenerating();
      pollTask(state.taskId);
      toast("任务已提交，正在生成…");
    } catch (e) {
      btn.disabled = false; btn.textContent = "+ 开始生成";
    }
  });

  function renderPreviewGenerating() {
    $("#preview-body", root).innerHTML = `
      <div style="text-align:center;padding:20px;">
        <div class="progress-bar"><div class="fill" id="pfill" style="width:0%"></div></div>
        <div class="progress-text" id="ptext">准备中…</div>
      </div>
    `;
  }

  async function pollTask(taskId) {
    try {
      const data = await api(`/api/main-image/tasks/${taskId}`);
      const t = data.task;
      const fill = $("#pfill", root);
      const ptext = $("#ptext", root);
      if (fill) {
        const pct = t.total > 0 ? Math.round(t.progress / t.total * 100) : 0;
        fill.style.width = pct + "%";
        ptext.textContent = `${t.progress}/${t.total}（${pct}%）`;
      }
      if (t.status === "done") {
        renderResultGrid(t.result_urls);
        loadAssets();
        const btn = $("#btn-generate", root);
        btn.disabled = false; btn.textContent = "+ 开始生成";
        return;
      } else if (t.status === "failed") {
        ptext.textContent = "生成失败：" + (t.error_msg || "未知错误");
        const btn = $("#btn-generate", root);
        btn.disabled = false; btn.textContent = "+ 开始生成";
        return;
      }
      setTimeout(() => pollTask(taskId), 2000);
    } catch (e) {
      setTimeout(() => pollTask(taskId), 2000);
    }
  }

  function renderResultGrid(urls) {
    if (!urls || !urls.length) return;
    $("#preview-body", root).innerHTML = `
      <div class="result-grid">
        ${urls.map((u, i) => `
          <div class="result-item">
            <div class="ri-img">
              <img src="${u}" alt="结果 ${i+1}" />
              <div class="ri-mask">
                <button onclick="downloadURL('${u}')">下载</button>
              </div>
            </div>
            <div class="ri-foot">
              <span>图 ${i+1}</span>
              <span style="color:var(--primary);cursor:pointer;" onclick="downloadURL('${u}')">下载 ↓</span>
            </div>
          </div>
        `).join("")}
      </div>
    `;
    $("#btn-download-all", root).classList.remove("hidden");
    $("#dn-count", root).textContent = urls.length;
  }

  // ============ 下载全部 ============
  $("#btn-download-all", root).addEventListener("click", async () => {
    if (!state.taskId) return;
    const data = await api(`/api/main-image/tasks/${state.taskId}`);
    const urls = data.task.result_urls;
    for (const u of urls) {
      await downloadURL(u, true);
    }
  });

  // ============ 资产库 ============
  loadAssets();
  async function loadAssets() {
    try {
      const data = await api("/api/main-image/assets");
      const body = $("#assets-body", root);
      const time = $("#assets-time", root);
      if (!data.groups || !Object.keys(data.groups).length) {
        body.innerHTML = `<div class="hint" style="text-align:center;padding:30px;">暂无历史生成图片</div>`;
        return;
      }
      time.textContent = `更新于 ${new Date().toLocaleTimeString()}`;
      body.innerHTML = Object.entries(data.groups).map(([day, items]) => `
        <div class="asset-group">
          <div class="asset-head">
            <span class="ah-title">${day}（${weekdayOf(day)}）</span>
            <span class="ah-count">${items.length} 张</span>
          </div>
          <div class="asset-grid">
            ${items.map(it => `
              <div class="asset-item" data-id="${it.id}">
                <img src="${it.path}" alt="" />
                <div class="ai-del" title="删除">×</div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("");

      $$(".ai-del", body).forEach(btn => {
        btn.addEventListener("click", async e => {
          e.stopPropagation();
          const id = btn.parentElement.dataset.id;
          await api(`/api/main-image/assets/${id}`, { method: "DELETE" });
          toast("已删除");
          loadAssets();
        });
      });
    } catch (e) { console.error(e); }
  }

  // ============ 暴露 downloadURL 到 window ============
  if (!window.downloadURL) {
    window.downloadURL = async function(url, silent) {
      try {
        const resp = await fetch(url);
        const blob = await resp.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = url.split("/").pop() || "image.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
        if (!silent) toast("已开始下载");
      } catch (e) {
        // 回退：直接打开
        window.open(url, "_blank");
      }
    };
  }
}

function stepperHTML(key, label, tag, defaultVal) {
  return `
    <div class="stepper">
      <span class="stepper-label">${label}<span class="stepper-tag" style="margin-left:6px;">${tag}</span></span>
      <div class="stepper-control">
        <button class="stepper-dec" type="button">−</button>
        <span class="stepper-val">${defaultVal}</span>
        <button class="stepper-inc" type="button">+</button>
      </div>
    </div>
  `;
}

function weekdayOf(dateStr) {
  // dateStr 形如 "11月3日"
  try {
    const [m, d] = dateStr.replace("日", "").split(/月/);
    const dt = new Date(new Date().getFullYear(), +m - 1, +d);
    const w = ["周日","周一","周二","周三","周四","周五","周六"][dt.getDay()];
    return w;
  } catch { return ""; }
}

registerRoute("main-image", renderMainImage, "商品主图 · 秋成设计室");
