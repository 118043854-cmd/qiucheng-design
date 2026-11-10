/**
 * 创作参考 / 灵感库 / renderReference
 */
function renderReference(root) {
  const state = { category: "全部", keyword: "", items: [], categories: ["全部"] };

  root.innerHTML = `
    <div class="page-header">
      <div class="page-title">创作参考 / 灵感库</div>
      <div class="page-subtitle">瀑布流灵感墙，可按品类筛选，一键「用作参考」带入生图任务</div>
    </div>

    <div class="card" style="padding:14px 20px;margin-bottom:16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
      <div class="tabs" style="margin-bottom:0;">
        <div class="tab active" data-cat="全部">全部</div>
      </div>
      <input class="input" id="kw" placeholder="搜索灵感名称…" style="flex:1;max-width:240px;" />
    </div>

    <div class="waterfall" id="wf"></div>
  `;

  // 加载
  load();

  async function load() {
    try {
      const data = await api(`/api/reference/list?category=${encodeURIComponent(state.category)}&keyword=${encodeURIComponent(state.keyword)}`);
      state.items = data.items;
      state.categories = data.categories || ["全部"];
      renderCats();
      renderGrid();
    } catch (e) { console.error(e); }
  }

  function renderCats() {
    const cats = state.categories;
    const box = $(".tabs", root);
    box.innerHTML = cats.map(c => `
      <div class="tab ${c === state.category ? "active" : ""}" data-cat="${c}">${c}</div>
    `).join("");
    $$(".tab[data-cat]", box).forEach(t => t.addEventListener("click", () => {
      state.category = t.dataset.cat;
      load();
    }));
  }

  function renderGrid() {
    const wf = $("#wf", root);
    if (!state.items.length) {
      wf.innerHTML = `<div class="hint" style="text-align:center;padding:40px;">暂无灵感，换个品类试试吧</div>`;
      return;
    }
    wf.innerHTML = state.items.map(item => {
      // 给瀑布流一点高度变化
      const ratios = ["8/10", "10/10", "9/10", "7/10"];
      const ratio = ratios[Math.abs(hashCode(item.id)) % ratios.length];
      return `
        <div class="wf-item" data-id="${item.id}" style="aspect-ratio:${ratio};">
          <img src="${item.url}" alt="${item.name}" />
          <div class="wf-mask">
            <button class="btn btn-sm btn-secondary" data-act="use">用作参考</button>
            <button class="btn btn-sm btn-ghost" data-act="${item.favorited ? 'unfav' : 'fav'}">${item.favorited ? '★ 已收藏' : '☆ 收藏'}</button>
          </div>
        </div>
      `;
    }).join("");

    $$(".wf-item", wf).forEach(it => {
      it.addEventListener("click", async e => {
        const act = e.target.dataset.act;
        if (!act) return;
        const id = it.dataset.id;
        if (act === "use") {
          // 跳转到商品主图
          toast("已选作参考，将带入商品主图任务");
          setTimeout(() => location.hash = "#/main-image", 400);
        } else if (act === "fav") {
          await api("/api/reference/favorite", { method: "POST", body: { id, category: state.category, url: "" } });
          toast("已收藏"); load();
        } else if (act === "unfav") {
          await api("/api/reference/unfavorite", { method: "POST", body: { id, category: state.category, url: "" } });
          toast("已取消收藏"); load();
        }
      });
    });
  }

  function hashCode(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i); return h; }

  // 搜索
  let _kt;
  $("#kw", root).addEventListener("input", e => {
    clearTimeout(_kt);
    _kt = setTimeout(() => { state.keyword = e.target.value; load(); }, 400);
  });
}
registerRoute("reference", renderReference, "创作参考 · 秋成设计室");
