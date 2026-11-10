/**
 * 工作台首页 / renderWorkbench
 */
function renderWorkbench(root) {
  root.innerHTML = `
    <div class="welcome-hero">
      <h1>欢迎使用秋成设计工作室</h1>
      <p>以你上传的商品图为唯一素材源，AI 生成可直接上架的电商图</p>
    </div>

    <div class="feature-list">
      ${featureCardHTML("main-image", "商品主图", "上传商品图，一键生成卖点图、场景图、白底图套图，满足天猫京东上架需求。")}
      ${featureCardHTML("remix", "爆款复刻", "复刻爆款参考图的构图与版式，只借鉴配色与排版，商品本体保持一致。")}
      ${featureCardHTML("detail", "商品详情图", "一屏一屏自动拼接竖版长图详情页，支持整张导出。")}
      ${featureCardHTML("matting", "一键抠图", "自动去背景，输出透明底或带场景背景的成品。")}
      ${featureCardHTML("watermark", "去除水印", "精准消除图片中的水印、LOGO、文字覆盖，修补被遮挡区域。")}
      ${featureCardHTML("retouch", "产品精修", "AI 去污渍、去反光、去背景杂点，输出电商级干净白底商品图。")}
      ${featureCardHTML("reference", "创作参考 / 灵感库", "瀑布流灵感墙，可按品类筛选，一键「用作参考」带入生图任务。")}
    </div>

    <!-- 悬浮面板 -->
    <div class="side-panel">
      <div class="side-panel-item active" data-ref="reference">💡 灵感库</div>
      <div class="side-panel-item" data-ref="favorites">⭐ 灵感收藏</div>
      <div class="side-panel-item" data-ref="history">📋 历史记录</div>
    </div>
  `;

  // 点击跳转
  $$(".feature-card", root).forEach(card => {
    card.addEventListener("click", () => {
      const route = card.dataset.route;
      location.hash = `#/${route}`;
    });
  });

  $$(".side-panel-item").forEach(item => {
    item.addEventListener("click", () => {
      location.hash = "#/reference";
    });
  });
}

function featureCardHTML(route, title, desc) {
  const icons = {
    "main-image": `<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>`,
    "remix": `<rect x="9" y="9" width="10" height="10" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>`,
    "detail": `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>`,
    "matting": `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>`,
    "watermark": `<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>`,
    "retouch": `<circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/>`,
    "reference": `<path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/>`,
  };
  return `
    <div class="feature-card" data-route="${route}">
      <div class="fc-visual">
        <div class="fc-big">图</div>
      </div>
      <div class="fc-body">
        <div class="fc-ico">
          <svg viewBox="0 0 24 24">${icons[route] || ""}</svg>
        </div>
        <div class="fc-title">${title}</div>
        <div class="fc-desc">${desc}</div>
      </div>
    </div>
  `;
}

registerRoute("workbench", renderWorkbench, "工作台 · 秋成设计室");
