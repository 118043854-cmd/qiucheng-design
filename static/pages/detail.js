/**
 * 商品详情图页面 / renderDetail
 * 与主图同构：上传商品 → 描述 → 分屏数量 → 预览 + 资产库
 */
function renderDetail(root) {
  const state = { productImages: [], description: "", count: 6, taskId: null };

  root.innerHTML = `
    <div class="page-header">
      <div class="page-title">商品详情图</div>
      <div class="page-subtitle">上传商品图 → 描述 → 一键生成竖版长图详情页（支持整张导出）</div>
    </div>

    <div class="work-cols">
      <div class="col-left">
        <div class="step-block">
          <div class="step-head"><div class="step-badge">①</div><div class="step-title">上传商品图</div></div>
          <div class="dropzone" id="dz-product">
            <input type="file" id="file-product" multiple accept="image/*" hidden />
            <div class="dz-icon">
              <svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </div>
            <div class="dz-title">点击上传或拖拽图片到此处</div>
            <div class="dz-hint">支持 JPG/PNG，最多 5 张</div>
          </div>
          <div class="thumb-list" id="thumbs-product"></div>
        </div>

        <div class="step-block">
          <div class="step-head"><div class="step-badge">②</div><div class="step-title">商品描述</div></div>
          <textarea class="textarea" id="desc-input" placeholder="描述商品类型、目标人群、卖点、想要的风格，例如：这是一款北欧风实木书桌，适合租房小户型，卖点是环保 E0 板材和多尺寸可选，风格简约干净、品质感强。"></textarea>
          <div class="hint" style="margin-top:6px;">会自动为详情页规划首屏、卖点屏、细节屏、场景屏、收尾屏等分屏内容。</div>

          <div class="analysis-summary" style="margin-top:14px;">
            <b>AI 规划分屏（示例）</b><br/>
            ① 首屏 · 品牌大图　② 卖点屏 1　③ 卖点屏 2　④ 细节展示　⑤ 使用场景　⑥ 品牌收尾
          </div>
        </div>

        <div class="step-block">
          <div class="step-head"><div class="step-badge">③</div><div class="step-title">分屏数量</div></div>
          <div class="stepper">
            <span class="stepper-label">详情分屏</span>
            <span class="stepper-tag">一屏一屏拼接</span>
            <div class="stepper-control">
              <button class="stepper-dec">−</button>
              <span class="stepper-val">6</span>
              <button class="stepper-inc">+</button>
            </div>
          </div>
          <div class="hint" style="margin-top:8px;">建议 4–8 屏，过长导出可能影响加载速度。</div>
          <button class="btn btn-primary" id="btn-generate" style="margin-top:20px;">+ 生成详情图</button>
        </div>
      </div>

      <div class="col-right">
        <div class="preview-card">
          <div class="card-head">
            <div class="card-title">详情分屏预览</div>
            <button class="download-all hidden" id="btn-download-all">下载全部</button>
          </div>
          <div id="preview-body">
            <div class="preview-empty">
              <div class="pe-icon">
                <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
              </div>
              <div>提交任务后，生成结果将在此处展示</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ---- 上传 ----
  const dz = $("#dz-product", root);
  const file = $("#file-product", root);
  dz.addEventListener("click", () => file.click());
  dz.addEventListener("dragover", e => { e.preventDefault(); dz.classList.add("dragging"); });
  dz.addEventListener("dragleave", () => dz.classList.remove("dragging"));
  dz.addEventListener("drop", async e => {
    e.preventDefault(); dz.classList.remove("dragging");
    await handle(e.dataTransfer.files);
  });
  file.addEventListener("change", async () => { await handle(file.files); file.value = ""; });

  async function handle(files) {
    if (!files.length) return;
    const fd = new FormData();
    [...files].forEach(f => fd.append("files", f));
    try {
      const data = await api("/api/detail/upload", { method: "POST", body: fd });
      data.files.forEach(f => state.productImages.push(f.path));
      renderThumbs(); toast(`已上传 ${data.files.length} 张`);
    } catch (e) { console.error(e); }
  }

  function renderThumbs() {
    const box = $("#thumbs-product", root);
    box.innerHTML = state.productImages.map((p, i) => `
      <div class="thumb" data-i="${i}"><img src="${p}"/><div class="remove">×</div></div>
    `).join("");
    $$(".remove", box).forEach(b => b.addEventListener("click", () => {
      const i = +b.parentElement.dataset.i;
      state.productImages.splice(i, 1); renderThumbs();
    }));
  }

  // ---- 描述 ----
  $("#desc-input", root).addEventListener("input", e => state.description = e.target.value);

  // ---- 步进器 ----
  const valEl = $(".stepper-val", root);
  $(".stepper-dec", root).addEventListener("click", () => {
    state.count = Math.max(1, +valEl.textContent - 1); valEl.textContent = state.count;
  });
  $(".stepper-inc", root).addEventListener("click", () => {
    state.count = Math.min(12, +valEl.textContent + 1); valEl.textContent = state.count;
  });

  // ---- 生成 ----
  $("#btn-generate", root).addEventListener("click", async () => {
    if (!state.productImages.length) { toast("请上传商品图"); return; }
    const btn = $("#btn-generate", root);
    btn.disabled = true; btn.textContent = "生成中…";
    try {
      const data = await api("/api/detail/generate", {
        method: "POST",
        body: { description: state.description, count: state.count, image_paths: state.productImages },
      });
      state.taskId = data.task_id;
      poll();
      toast("任务已提交");
    } catch (e) { btn.disabled = false; btn.textContent = "+ 生成详情图"; }
  });

  async function poll() {
    try {
      const data = await api(`/api/detail/tasks/${state.taskId}`);
      const t = data.task;
      if (t.status === "done") {
        $("#preview-body", root).innerHTML = `
          <div class="result-grid" style="grid-template-columns:repeat(3,1fr);">
            ${t.result_urls.map((u, i) => `
              <div class="result-item">
                <div class="ri-img"><img src="${u}"/><div class="ri-mask"><button onclick="downloadURL('${u}')">下载</button></div></div>
                <div class="ri-foot"><span>分屏 ${i+1}</span><span style="color:var(--primary);cursor:pointer;" onclick="downloadURL('${u}')">下载 ↓</span></div>
              </div>
            `).join("")}
          </div>
        `;
        $("#btn-download-all", root).classList.remove("hidden");
        $("#btn-download-all", root).onclick = async () => {
          for (const u of t.result_urls) await downloadURL(u, true);
        };
        const btn = $("#btn-generate", root); btn.disabled = false; btn.textContent = "+ 生成详情图";
        return;
      }
      setTimeout(poll, 2000);
    } catch { setTimeout(poll, 2000); }
  }
}

registerRoute("detail", renderDetail, "商品详情图 · 秋成设计室");
