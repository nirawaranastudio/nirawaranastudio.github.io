"use strict";

/**
 * Nirawarana — app.js
 * Homepage logic: theme, render, pagination, search, filter, suggestions.
 * Depends on: data.js (ARTICLES, CATEGORIES), search.js
 */

const PER_PAGE     = 5;
const STORAGE_THEME = "nirawarana-theme";

const state = {
  allArticles:    [],
  filtered:       [],
  currentPage:    1,
  activeCategory: "all",
  activeTag:      "",
  searchQuery:    "",
  sortKey:        "date",
};

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  state.allArticles = typeof ARTICLES    !== "undefined" ? ARTICLES    : [];
  state.categories  = typeof CATEGORIES  !== "undefined" ? CATEGORIES  : [];

  initTheme();
  parseURLState();
  renderCategoryPills();
  applyFilter();
  renderSidebar();
  initEventListeners();
  initSearchSuggestions();
  initKeyboardShortcuts();
  initScrollTop();
});

/* ============================================================
   THEME
   ============================================================ */
function initTheme() {
  const saved     = localStorage.getItem(STORAGE_THEME);
  const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  applyTheme(saved || preferred, false);
}

function applyTheme(theme, save = true) {
  document.documentElement.setAttribute("data-theme", theme);
  if (save) localStorage.setItem(STORAGE_THEME, theme);
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.innerHTML = theme === "dark" ? iconSun() : iconMoon();
  btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(cur === "dark" ? "light" : "dark");
}

/* ============================================================
   URL STATE
   ============================================================ */
function parseURLState() {
  const p = new URLSearchParams(window.location.search);
  state.currentPage     = Math.max(1, parseInt(p.get("page") || "1", 10));
  state.activeCategory  = p.get("category") || "all";
  state.activeTag       = p.get("tag") || "";
  state.searchQuery     = p.get("q") || "";
  state.sortKey         = p.get("sort") || "date";

  const input = document.getElementById("search-input");
  if (input && state.searchQuery) input.value = state.searchQuery;
  toggleClearBtn(!!state.searchQuery);
}

function pushURLState() {
  const p = new URLSearchParams();
  if (state.currentPage > 1)           p.set("page",     state.currentPage);
  if (state.activeCategory !== "all")  p.set("category", state.activeCategory);
  if (state.activeTag)                 p.set("tag",      state.activeTag);
  if (state.searchQuery)               p.set("q",        state.searchQuery);
  if (state.sortKey !== "date")        p.set("sort",     state.sortKey);
  const qs = p.toString();
  history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
}

/* ============================================================
   FILTER + RENDER
   ============================================================ */
function applyFilter() {
  // Use search.js filterArticles
  state.filtered = typeof filterArticles === "function"
    ? filterArticles(state.allArticles, {
        category: state.activeCategory,
        query:    state.searchQuery,
        tag:      state.activeTag,
      })
    : state.allArticles;

  // Apply sort (only when not searching — search already scored)
  if (!state.searchQuery && typeof sortArticles === "function") {
    state.filtered = sortArticles(state.filtered, state.sortKey);
  }

  renderArticleList();
  renderPagination();
  pushURLState();
  updateActivePill();
  updateTagActiveState();
}

/* ============================================================
   RENDER ARTICLE LIST
   ============================================================ */
function renderArticleList() {
  const grid = document.getElementById("articles-grid");
  if (!grid) return;

  const total      = state.filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  if (state.currentPage > totalPages) state.currentPage = totalPages;

  const start = (state.currentPage - 1) * PER_PAGE;
  const slice = state.filtered.slice(start, start + PER_PAGE);

  // Result info
  const info = document.getElementById("result-info");
  if (info) {
    let label = "";
    if (state.searchQuery)     label += `"${state.searchQuery}"`;
    if (state.activeTag)       label += `${label ? " · " : ""}#${state.activeTag}`;
    if (state.activeCategory !== "all") label += `${label ? " · " : ""}${getCategoryLabel(state.activeCategory)}`;
    info.innerHTML = total === 0
      ? "Tidak ada artikel ditemukan."
      : `<strong>${total}</strong> artikel${label ? ` — ${label}` : ""}`;
  }

  if (slice.length === 0) {
    grid.innerHTML = buildEmptyState();
    return;
  }

  grid.innerHTML = slice.map(a => buildCard(a)).join("");

  // Tag click on cards
  grid.querySelectorAll(".card-tag").forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      const tag = el.dataset.tag;
      if (!tag) return;
      state.activeTag    = state.activeTag === tag ? "" : tag;
      state.currentPage  = 1;
      applyFilter();
      updateTagActiveState();
    });
  });
}

function buildCard(a) {
  const color   = getCategoryColor(a.category);
  const label   = getCategoryLabel(a.category);
  const date    = formatDate(a.date);
  const q       = state.searchQuery;

  // Highlighted title & excerpt
  const titleHTML   = q && typeof highlightText === "function"
    ? highlightText(a.title, q)
    : escHtml(a.title);
  const excerptHTML = q && typeof highlightText === "function"
    ? highlightText(a.excerpt, q)
    : escHtml(a.excerpt);

  // Cover
  const coverHTML = a.cover
    ? `<img src="${a.cover}" alt="" loading="lazy" onerror="this.style.display='none'">`
    : `<div class="card-cover-placeholder">${iconImage()}</div>`;

  // Tags (max 3 shown)
  const tagPills = (a.tags || []).slice(0, 3).map(t =>
    `<span class="card-tag${state.activeTag === t ? " active" : ""}" data-tag="${escHtml(t)}">#${escHtml(t)}</span>`
  ).join("");

  return `
<article class="card" role="listitem">
  <a href="${a.url}" class="card-link">
    <div class="card-cover">
      <div class="card-accent" style="background:${color}"></div>
      ${coverHTML}
    </div>
    <div class="card-body">
      <div class="card-meta-top">
        <span class="category-badge" style="color:${color};border-color:${color}22;background:${color}11">
          <span class="dot" style="background:${color}"></span>${label}
        </span>
        <time class="card-date" datetime="${a.date}">${date}</time>
      </div>
      <h2 class="card-title">${titleHTML}</h2>
      <p class="card-excerpt">${excerptHTML}</p>
      <div class="card-meta-bottom">
        <div class="card-tags">${tagPills}</div>
        <span class="card-read-more">Baca →</span>
      </div>
    </div>
  </a>
</article>`;
}

function buildEmptyState() {
  // Suggest popular tags
  const tags = typeof getTagCloud === "function"
    ? getTagCloud(state.allArticles, 6).map(t =>
        `<button class="tag-pill" data-tag="${t.tag}">#${t.tag}</button>`).join("")
    : "";

  return `
<div class="empty-state">
  ${iconEmpty()}
  <p>Tidak ada artikel yang cocok.</p>
  ${state.searchQuery || state.activeTag || state.activeCategory !== "all"
    ? `<button class="btn-reset-filter" id="btn-reset">Hapus filter</button>` : ""}
  ${tags ? `<div class="empty-state-tags"><p>Coba topik populer:</p><div class="tag-cloud">${tags}</div></div>` : ""}
</div>`;
}

/* ============================================================
   PAGINATION
   ============================================================ */
function renderPagination() {
  const nav = document.getElementById("pagination");
  if (!nav) return;

  const total      = state.filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  if (totalPages <= 1) { nav.innerHTML = ""; return; }

  // Page numbers (show max 5 around current)
  const pages = buildPageNumbers(state.currentPage, totalPages);

  nav.innerHTML = `
    <button class="page-btn" id="btn-prev" ${state.currentPage <= 1 ? "disabled" : ""}>
      ${iconChevronLeft()} Sebelumnya
    </button>
    <div class="page-numbers">
      ${pages.map(p => p === "…"
        ? `<span class="page-ellipsis">…</span>`
        : `<button class="page-num${p === state.currentPage ? " active" : ""}" data-page="${p}">${p}</button>`
      ).join("")}
    </div>
    <button class="page-btn" id="btn-next" ${state.currentPage >= totalPages ? "disabled" : ""}>
      Selanjutnya ${iconChevronRight()}
    </button>`;

  nav.querySelector("#btn-prev")?.addEventListener("click", () => changePage(-1));
  nav.querySelector("#btn-next")?.addEventListener("click", () => changePage(1));
  nav.querySelectorAll(".page-num").forEach(btn => {
    btn.addEventListener("click", () => {
      state.currentPage = parseInt(btn.dataset.page, 10);
      renderArticleList();
      renderPagination();
      pushURLState();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function changePage(dir) {
  const total      = state.filtered.length;
  const totalPages = Math.ceil(total / PER_PAGE);
  const next       = state.currentPage + dir;
  if (next < 1 || next > totalPages) return;
  state.currentPage = next;
  renderArticleList();
  renderPagination();
  pushURLState();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  pages.push(1);
  if (current > 3) pages.push("…");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

/* ============================================================
   CATEGORY PILLS
   ============================================================ */
function renderCategoryPills() {
  const container = document.getElementById("category-pills");
  if (!container) return;

  const cats = state.categories || [];
  container.innerHTML = cats.map(cat => {
    const color = cat.color || "var(--accent)";
    const isAll = cat.id === "all";
    return `
      <button class="cat-pill${state.activeCategory === cat.id ? " active" : ""}" data-cat="${cat.id}">
        ${!isAll ? `<span class="dot" style="background:${color}"></span>` : ""}
        ${cat.label}
        <span class="pill-count">${cat.count}</span>
      </button>`;
  }).join("");

  container.addEventListener("click", e => {
    const pill = e.target.closest(".cat-pill");
    if (!pill) return;
    state.activeCategory = pill.dataset.cat;
    state.activeTag      = "";
    state.currentPage    = 1;
    applyFilter();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function updateActivePill() {
  document.querySelectorAll(".cat-pill").forEach(p => {
    p.classList.toggle("active", p.dataset.cat === state.activeCategory);
  });
}

/* ============================================================
   SIDEBAR
   ============================================================ */
function renderSidebar() {
  // Recent articles
  const recentList = document.getElementById("recent-list");
  if (recentList) {
    const recent = [...state.allArticles]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
    recentList.innerHTML = recent.map((a, i) => `
      <li class="recent-item">
        <span class="recent-item-num">0${i + 1}</span>
        <a href="${a.url}">
          <span class="recent-item-title">${escHtml(a.title)}</span>
          <span class="recent-item-date">${formatDate(a.date)}</span>
        </a>
      </li>`).join("");
  }

  // Category list
  const catList = document.getElementById("sidebar-cat-list");
  if (catList) {
    const cats = (state.categories || []).filter(c => c.id !== "all");
    catList.innerHTML = cats.map(cat => `
      <li class="sidebar-cat-item" data-cat="${cat.id}">
        <span><span class="dot" style="background:${cat.color}"></span>${cat.label}</span>
        <span class="sidebar-cat-count">${cat.count}</span>
      </li>`).join("");
    catList.addEventListener("click", e => {
      const item = e.target.closest(".sidebar-cat-item");
      if (!item) return;
      state.activeCategory = item.dataset.cat;
      state.activeTag      = "";
      state.currentPage    = 1;
      applyFilter();
      renderCategoryPills();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Tag cloud
  renderTagCloud();
}

function renderTagCloud() {
  const cloud = document.getElementById("tag-cloud");
  if (!cloud || typeof getTagCloud !== "function") return;

  const tags = getTagCloud(state.allArticles, 18);
  cloud.innerHTML = tags.map(({ tag, count }) =>
    `<button class="tag-pill${state.activeTag === tag ? " active" : ""}" data-tag="${escHtml(tag)}" title="${count} artikel">
      #${escHtml(tag)}
    </button>`
  ).join("");

  cloud.addEventListener("click", e => {
    const btn = e.target.closest(".tag-pill");
    if (!btn) return;
    const tag = btn.dataset.tag;
    state.activeTag    = state.activeTag === tag ? "" : tag;
    state.currentPage  = 1;
    applyFilter();
    updateTagActiveState();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function updateTagActiveState() {
  document.querySelectorAll(".tag-pill, .card-tag").forEach(el => {
    el.classList.toggle("active", el.dataset.tag === state.activeTag);
  });
}

/* ============================================================
   SEARCH SUGGESTIONS DROPDOWN
   ============================================================ */
function initSearchSuggestions() {
  const input = document.getElementById("search-input");
  const box   = document.getElementById("search-suggestions");
  if (!input || !box) return;

  let timer;

  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const q = input.value.trim();
      if (q.length < 2) { closeSuggestions(box); return; }

      const suggestions = typeof generateSuggestions === "function"
        ? generateSuggestions(state.allArticles, q, 6)
        : [];

      if (suggestions.length === 0) { closeSuggestions(box); return; }
      renderSuggestions(box, suggestions, q);
    }, 180);
  });

  // Close on outside click / Escape
  document.addEventListener("click", e => {
    if (!input.contains(e.target) && !box.contains(e.target)) closeSuggestions(box);
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeSuggestions(box);
      if (!input.value) {
        state.searchQuery = "";
        state.currentPage = 1;
        applyFilter();
        toggleClearBtn(false);
      }
    }
    // Arrow navigation
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const first = box.querySelector(".suggestion-item");
      first?.focus();
    }
  });

  // Keyboard nav inside suggestions
  box.addEventListener("keydown", e => {
    const items = [...box.querySelectorAll(".suggestion-item")];
    const idx   = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[idx + 1]?.focus(); }
    if (e.key === "ArrowUp")   { e.preventDefault(); idx > 0 ? items[idx - 1]?.focus() : input.focus(); }
    if (e.key === "Escape")    { closeSuggestions(box); input.focus(); }
  });
}

function renderSuggestions(box, suggestions, query) {
  const color = cat => {
    const c = (typeof CATEGORIES !== "undefined" ? CATEGORIES : []).find(c => c.id === cat);
    return c?.color || "var(--accent)";
  };

  box.innerHTML = suggestions.map(s => {
    if (s.matchType === "tag") {
      return `<button class="suggestion-item suggestion-tag" data-tag="${escHtml(s.tag)}">
        <span class="suggestion-icon">#</span>
        <span class="suggestion-text">${escHtml(s.title)}</span>
        <span class="suggestion-type">tag</span>
      </button>`;
    }
    return `<a class="suggestion-item suggestion-article" href="${s.url}" tabindex="0">
      <span class="suggestion-dot" style="background:${color(s.category)}"></span>
      <span class="suggestion-text">${typeof highlightText === "function" ? highlightText(s.title, query) : escHtml(s.title)}</span>
      <span class="suggestion-type">${getCategoryLabel(s.category)}</span>
    </a>`;
  }).join("") + `<div class="suggestion-footer">
    <button class="suggestion-search-all" id="suggestion-search-all">
      Cari "<strong>${escHtml(query)}</strong>" di semua artikel →
    </button>
  </div>`;

  box.removeAttribute("hidden");
  box.setAttribute("aria-hidden", "false");

  // "Search all" button
  box.querySelector("#suggestion-search-all")?.addEventListener("click", () => {
    const input = document.getElementById("search-input");
    state.searchQuery = input?.value.trim() || query;
    state.currentPage = 1;
    closeSuggestions(box);
    applyFilter();
    toggleClearBtn(!!state.searchQuery);
  });

  // Tag suggestions
  box.querySelectorAll(".suggestion-tag").forEach(btn => {
    btn.addEventListener("click", () => {
      state.activeTag    = btn.dataset.tag;
      state.currentPage  = 1;
      closeSuggestions(box);
      const input = document.getElementById("search-input");
      if (input) { input.value = ""; }
      state.searchQuery = "";
      toggleClearBtn(false);
      applyFilter();
      updateTagActiveState();
    });
  });
}

function closeSuggestions(box) {
  if (!box) return;
  box.innerHTML = "";
  box.setAttribute("hidden", "");
  box.setAttribute("aria-hidden", "true");
}

/* ============================================================
   KEYBOARD SHORTCUTS
   ============================================================ */
function initKeyboardShortcuts() {
  document.addEventListener("keydown", e => {
    const tag  = document.activeElement?.tagName.toLowerCase();
    const isInput = tag === "input" || tag === "textarea" || tag === "select";

    // "/" or Ctrl+K → focus search
    if (!isInput && (e.key === "/" || (e.ctrlKey && e.key === "k"))) {
      e.preventDefault();
      const input = document.getElementById("search-input");
      input?.focus();
      input?.select();
    }
  });
}

/* ============================================================
   CLEAR SEARCH BUTTON
   ============================================================ */
function toggleClearBtn(show) {
  const btn = document.getElementById("clear-search");
  if (!btn) return;
  btn.style.display = show ? "flex" : "none";
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */
function initEventListeners() {
  // Theme toggle
  document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);

  // Search input — debounced
  let timer;
  document.getElementById("search-input")?.addEventListener("input", e => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.searchQuery = e.target.value.trim();
      state.currentPage = 1;
      applyFilter();
      toggleClearBtn(!!state.searchQuery);
    }, 300);
  });

  // Clear search button
  document.getElementById("clear-search")?.addEventListener("click", () => {
    const input = document.getElementById("search-input");
    if (input) input.value = "";
    state.searchQuery = "";
    state.currentPage = 1;
    closeSuggestions(document.getElementById("search-suggestions"));
    applyFilter();
    toggleClearBtn(false);
  });

  // Empty state reset button (delegated)
  document.getElementById("article-list")?.addEventListener("click", e => {
    if (e.target.id === "btn-reset") {
      state.searchQuery    = "";
      state.activeCategory = "all";
      state.activeTag      = "";
      state.currentPage    = 1;
      const input = document.getElementById("search-input");
      if (input) input.value = "";
      applyFilter();
      renderCategoryPills();
      toggleClearBtn(false);
    }
    if (e.target.closest(".tag-pill[data-tag]")) {
      const tag = e.target.closest("[data-tag]")?.dataset.tag;
      if (tag) {
        state.activeTag   = state.activeTag === tag ? "" : tag;
        state.currentPage = 1;
        applyFilter();
        updateTagActiveState();
      }
    }
  });

  // Back/forward
  window.addEventListener("popstate", () => {
    parseURLState();
    applyFilter();
  });
}

/* ============================================================
   SCROLL TO TOP
   ============================================================ */
function initScrollTop() {
  const btn = document.getElementById("scroll-top");
  if (!btn) return;
  btn.innerHTML = iconChevronUp();
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 400);
  }, { passive: true });
}

/* ============================================================
   MOBILE NAV
   ============================================================ */
(function initMobileNav() {
  const btn = document.getElementById("mobile-menu-btn");
  const nav = document.querySelector(".main-nav");
  if (!btn || !nav) return;

  const drawer = document.createElement("div");
  drawer.id = "mobile-drawer";
  drawer.setAttribute("aria-hidden", "true");
  drawer.innerHTML = nav.innerHTML;
  document.body.appendChild(drawer);

  const style = document.createElement("style");
  style.textContent = `
    #mobile-drawer {
      position: fixed; inset: 60px 0 0 0;
      background: var(--bg); border-top: 1px solid var(--border);
      padding: var(--sp-6); display: flex; flex-direction: column; gap: var(--sp-2);
      transform: translateY(-8px); opacity: 0; pointer-events: none;
      transition: opacity 200ms ease, transform 200ms ease; z-index: 90;
    }
    #mobile-drawer.open { opacity: 1; pointer-events: auto; transform: translateY(0); }
    #mobile-drawer a {
      padding: var(--sp-3) var(--sp-4); border-radius: var(--r-md);
      font-size: 1rem; font-weight: 500; color: var(--text-muted);
      border: 1.5px solid transparent; transition: all var(--transition);
    }
    #mobile-drawer a:hover { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); }
  `;
  document.head.appendChild(style);

  btn.addEventListener("click", () => {
    const isOpen = drawer.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(isOpen));
    drawer.setAttribute("aria-hidden", String(!isOpen));
  });

  document.addEventListener("click", e => {
    if (!drawer.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      drawer.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
  });
})();

/* ============================================================
   HELPERS
   ============================================================ */
function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function getCategoryColor(catId) {
  return (state.categories || []).find(c => c.id === catId)?.color || "var(--accent)";
}

function getCategoryLabel(catId) {
  return (state.categories || []).find(c => c.id === catId)?.label || catId;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ============================================================
   SVG ICONS
   ============================================================ */
function iconMoon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}
function iconSun() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>`;
}
function iconChevronLeft() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>`;
}
function iconChevronRight() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>`;
}
function iconChevronUp() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>`;
}
function iconImage() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
}
function iconEmpty() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" width="40" height="40"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`;
}
