/**
 * 爆款复刻页面 / renderRemix
 */
function renderRemix(root) {
  const state = {
    referenceImages: [],    // [{path, name}]
    productImages: [],
    productDesc: "",
    remixType: "main",
    taskId: null,
    parsing: false,
  };

  root.innerHTML = `
    <div class="page-header">
      <div class="page-title">爆款复刻</div>
      <div class="page-subtitle">复刻参考图的构图与版式，商品本体保持一致</div>
    </div>

    <div class="work-cols">
      <div class="col-left">
        <div class="step-block">
          <div class="step-head"><div class="step-badge">①</div><div class="step-title">复刻参考图</div></div>

          <div class="tabs">
            <div class="tab active" data-tab="upload">上传参考图</div>
            <div class="tab" data-tab="url">导入链接</div>
          </div>

          <div id="panel-upload">
            <div class="dropzone" id="dz-ref">
              <input type="file" id="file-ref" multiple accept="image/*" hidden />
              <div class="dz-icon">
                <svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              </div>
              <div class="dz-title">点击或拖拽上传参考图</div>
              <div class="dz-hint">最多 12 张</div>
            </div>
            <div class="thumb-list" id="thumbs-ref"></div>
          </div>

          <div id="panel-url" class="hidden">
            <div class="url-parse-area">
              <input class="input" id="url-input" placeholder="粘贴同行商品链接，例：https://detail.tmall.com/item.htm?..." />
              <button class="btn btn-secondary" id="btn-parse">解析链接</button>
            </div>
            <div id="url-status" class="hint"></div>
            <div class="thumb-list" id="thumbs-url" style="margin-top:12px;"></div>
          </div>

          <div style="margin-top:16px;">
            <div class="hint" style="margin-bottom:8px;">复刻类型：</div>
            <div class="tabs" style="margin-bottom:0;">
              <div class="tab active" data-type="main">复刻主图</div>
              <div class="tab" data-type="detail">复刻详情页</div>
            </div>
            <div class="hint" style="margin-top:6px;">
              解析后点下方图片进行选择，选几张就复刻几张；详情页可选（最多 12 张）。
            </div>
          </div>
        </div>

        <div class="step-block">
          <div class="step-head"><div class="step-badge">②</div><div class="step-title">我的商品图</div></div>
          <div class="dropzone" id="dz-product">
            <input type="file" id="file-product" multiple accept="image/*" hidden />
            <div class="dz-icon">
              <svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </div>
            <div class="dz-title">上传我的商品图 最多 5 张</div>
            <div class="dz-hint">这是复刻时要替换的目标商品</div>
          </div>
          <div class="thumb-list" id="thumbs-product"></div>

          <div style="margin-top:14px;">
            <label class="label">商品描述（帮助模型理解）</label>
            <textarea class="textarea" id="product-desc" placeholder="例：白色高帮运动鞋，女款，春夏上新"></textarea>
          </div>
        </div>

        <button class="btn btn-primary" id="btn-generate" style="margin-top:8px;">+ 开始生成</button>
      </div>

      <div class="col-right">
        <div class="preview-card">
          <div class="card-head"><div class="card-title">复刻结果（与参考图对比）</div></div>
          <div id="preview-body">
            <div class="preview-empty">
              <div class="pe-icon">
                <svg viewBox="0 0 24 24"><rect x="9" y="9" width="10" height="10" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </div>
              <div>提交任务后，生成结果与参考图并排对比展示</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ---- Tab ----
  $$(".tab[data-tab]", root).forEach(t => t.addEventListener("click", () => {
    $$(".tab[data-tab]", root).forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    $("#panel-upload", root).classList.toggle("hidden", t.dataset.tab !== "upload");
    $("#panel-url", root).classList.toggle("hidden", t.dataset.tab !== "url");
  }));
  $$(".tab[data-type]", root).forEach(t => t.addEventListener("click", () => {
    $$(".tab[data-type]", root).forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    state.remixType = t.dataset.type;
  }));

  // ---- 上传参考 ----
  bindDrop("#dz-ref", "#file-ref", state.referenceImages, "#thumbs-ref");
  // ---- 上传商品 ----
  bindDrop("#dz-product", "#file-product", state.productImages, "#thumbs-product");

  function bindDrop(dzSel, fileSel, arr, thumbsSel) {
    const dz = $(dzSel, root), file = $(fileSel, root);
    dz.addEventListener("click", () => file.click());
    dz.addEventListener("dragover", e => { e.preventDefault(); dz.classList.add("dragging"); });
    dz.addEventListener("dragleave", () => dz.classList.remove("dragging"));
    dz.addEventListener("drop", async e => {
      e.preventDefault(); dz.classList.remove("dragging");
      await handleFiles(e.dataTransfer.files, arr, thumbsSel);
    });
    file.addEventListener("change", async () => {
      await handleFiles(file.files, arr, thumbsSel); file.value = "";
    });
  }

  async function handleFiles(files, arr, thumbsSel) {
    if (!files.length) return;
    const fd = new FormData();
    [...files].forEach(f => fd.append("files", f));
    try {
      const data = await api("/api/remix/upload", { method: "POST", body: fd });
      data.files.forEach(f => arr.push({ path: f.path, url: f.path }));
      renderThumbs(arr, thumbsSel);
      toast(`已上传 ${data.files.length} 张`);
    } catch (e) { console.error(e); }
  }

  function renderThumbs(arr, sel) {
    const box = $(sel, root);
    box.innerHTML = arr.map((img, i) => `
      <div class="thumb" data-i="${i}"><img src="${img.url}"/><div class="remove">×</div></div>
    `).join("");
    $$(".remove", box).forEach(b => b.addEventListener("click", () => {
      const i = +b.parentElement.dataset.i; arr.splice(i, 1); renderThumbs(arr, sel);
    }));
  }

  // ---- 解析链接 ----
  $("#btn-parse", root).addEventListener("click", async () => {
    const url = $("#url-input", root).value.trim();
    if (!url) { toast("请输入商品链接"); return; }
    state.parsing = true;
    $("#url-status", root).textContent = "解析中…正在读取商品图片…";
    try {
      const data = await api("/api/remix/parse-url", { method: "POST", body: { url, product_desc: "爆款复刻" } });
      data.reference_images.forEach(u => state.referenceImages.push({ path: u, url: u }));
      renderThumbs(state.referenceImages, "#thumbs-ref");
      $("#url-status", root).textContent = "解析成功，已导入 " + data.reference_images.length + " 张参考图";
      toast("解析成功");
    } catch {
      $("#url-status", root).textContent = "解析失败，请换一个链接或手动上传参考图";
    } finally { state.parsing = false; }
  });

  // ---- 描述 ----
  $("#product-desc", root).addEventListener("input", e => state.productDesc = e.target.value);

  // ---- 生成 ----
  $("#btn-generate", root).addEventListener("click", async () => {
    if (!state.referenceImages.length) { toast("请先上传或解析参考图"); return; }
    if (!state.productImages.length) { toast("请上传你的商品图"); return; }
    const btn = $("#btn-generate", root);
    btn.disabled = true; btn.textContent = "生成中…";
    try {
      const data = await api("/api/remix/generate", {
        method: "POST",
        body: {
          reference_paths: state.referenceImages.map(i => i.path),
          product_paths: state.productImages.map(i => i.path),
          product_desc: state.productDesc,
          remix_type: state.remixType,
          count: state.remixType === "detail" ? 6 : 4,
        },
      });
      state.taskId = data.task_id;
      poll(); toast("复刻任务已提交");
    } catch (e) { btn.disabled = false; btn.textContent = "+ 开始生成"; }
  });

  async function poll() {
    try {
      const data = await api(`/api/remix/tasks/${state.taskId}`);
      const t = data.task;
      if (t.status === "done") {
        renderResult(t.result_urls);
        const btn = $("#btn-generate", root); btn.disabled = false; btn.textContent = "+ 开始生成";
        return;
      }
      setTimeout(poll, 2000);
    } catch { setTimeout(poll, 2000); }
  }

  function renderResult(urls) {
    const refs = state.referenceImages.map(r => r.url).slice(0, 4);
    $("#preview-body", root).innerHTML = `
      <div class="compare-grid">
        <div class="compare-col">
          <div class="cc-head">📎 参考图</div>
          <div class="cc-body">${refs.map(u => `<img src="${u}">`).join("") || '<div class="hint" style="padding:10px;">无参考图</div>'}</div>
        </div>
        <div class="compare-col">
          <div class="cc-head">✨ 复刻结果</div>
          <div class="cc-body">${urls.map(u => `<img src="${u}" style="cursor:pointer" onclick="downloadURL('${u}')">`).join("")}</div>
        </div>
      </div>
    `;
  }
}

registerRoute("remix", renderRemix, "爆款复刻 · 秋成设计室");
