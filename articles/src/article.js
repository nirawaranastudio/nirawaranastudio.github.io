"use strict";

/**
 * Nirawarana — article.js  (Phase 4)
 * Features:
 *   Theme sync · Reading progress + time remaining · TOC (scroll-spy + mobile toggle)
 *   Copy-code · Prev/Next · Related articles · Mermaid dark-mode sync
 *   Image lightbox · Share button · Keyboard shortcuts · Scroll to top
 */

/* ─── meta helpers ─────────────────────────────────────── */
const meta = (name) =>
  document.querySelector(`meta[name="article:${name}"]`)?.content?.trim() || "";

/* ─── init ─────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initReadingProgress();
  initReadingEstimate();
  buildTOC();
  initTOCMobileToggle();
  initCopyCode();
  initPrevNext();
  renderRelated();
  initMermaid();
  initImageLightbox();
  initShareButton();
  initScrollTop();
  initKeyboardShortcuts();
});

/* ══════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════ */
function initTheme() {
  const KEY     = "nirawarana-theme";
  const saved   = localStorage.getItem(KEY);
  const prefer  = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  applyTheme(saved || prefer, false);

  document.getElementById("theme-toggle")
    ?.addEventListener("click", () => {
      const cur  = document.documentElement.getAttribute("data-theme") || "light";
      const next = cur === "dark" ? "light" : "dark";
      applyTheme(next);
      // Re-init mermaid when theme flips
      setTimeout(rerenderMermaid, 50);
    });
}

function applyTheme(theme, save = true) {
  document.documentElement.setAttribute("data-theme", theme);
  if (save) localStorage.setItem("nirawarana-theme", theme);
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.innerHTML = theme === "dark" ? ICON_SUN : ICON_MOON;
  btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
}

/* ══════════════════════════════════════════════════════════
   READING PROGRESS BAR + TIME REMAINING
   ══════════════════════════════════════════════════════════ */
function initReadingProgress() {
  const bar   = document.getElementById("reading-progress");
  const prose = document.querySelector(".prose");
  if (!bar || !prose) return;

  const update = () => {
    const rect   = prose.getBoundingClientRect();
    const total  = prose.offsetHeight - window.innerHeight;
    const pct    = total > 0
      ? Math.min(100, (Math.abs(rect.top) / total) * 100)
      : 100;
    bar.style.width = pct + "%";
    bar.setAttribute("aria-valuenow", Math.round(pct));
  };

  window.addEventListener("scroll", update, { passive: true });
  update();
}

function initReadingEstimate() {
  const readtime = parseInt(meta("readtime"), 10);
  if (!readtime) return;

  const label = document.getElementById("reading-estimate");
  const prose = document.querySelector(".prose");
  if (!label || !prose) return;

  window.addEventListener("scroll", () => {
    const rect     = prose.getBoundingClientRect();
    const total    = prose.offsetHeight - window.innerHeight;
    const scrolled = Math.max(0, Math.abs(rect.top));
    const pct      = total > 0 ? Math.min(1, scrolled / total) : 1;
    const remaining = Math.max(0, Math.ceil(readtime * (1 - pct)));
    label.textContent = remaining <= 0 ? "✓ Selesai" : `⏱ ~${remaining} menit lagi`;
  }, { passive: true });
}

/* ══════════════════════════════════════════════════════════
   TABLE OF CONTENTS
   ══════════════════════════════════════════════════════════ */
function buildTOC() {
  const toc   = document.getElementById("toc");
  const prose = document.querySelector(".prose");
  if (!toc || !prose) return;

  const headings = [...prose.querySelectorAll("h2, h3")];
  if (headings.length < 2) { toc.style.display = "none"; return; }

  // Assign stable IDs
  const seen = {};
  headings.forEach(h => {
    if (!h.id) {
      const base = h.textContent.trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 60);
      const id = seen[base] ? `${base}-${seen[base]}` : base;
      seen[base] = (seen[base] || 0) + 1;
      h.id = id;
    }
  });

  // Build list
  const list = document.createElement("ul");
  list.className = "toc-list";

  headings.forEach(h => {
    const li  = document.createElement("li");
    li.className = h.tagName === "H3" ? "toc-h3" : "toc-h2";
    const a   = document.createElement("a");
    a.href    = "#" + h.id;
    a.textContent = h.textContent;
    a.addEventListener("click", e => {
      e.preventDefault();
      document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      // Close mobile TOC if open
      closeMobileTOC();
    });
    li.appendChild(a);
    list.appendChild(li);
  });

  const title = document.createElement("p");
  title.className = "toc-title";
  title.textContent = "Daftar Isi";
  toc.innerHTML = "";
  toc.appendChild(title);
  toc.appendChild(list);

  // Scroll-spy via IntersectionObserver
  const links = [...list.querySelectorAll("a")];
  let activeLink = null;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const link = links.find(l => l.getAttribute("href") === "#" + entry.target.id);
      if (!link || link === activeLink) return;
      activeLink?.classList.remove("active");
      link.classList.add("active");
      activeLink = link;

      // Auto-scroll TOC list to keep active visible
      link.scrollIntoView({ block: "nearest" });
    });
  }, { rootMargin: "-10% 0px -80% 0px", threshold: 0 });

  headings.forEach(h => observer.observe(h));
}

/* ── TOC Mobile Toggle ── */
function initTOCMobileToggle() {
  const btn = document.getElementById("toc-toggle-btn");
  const toc = document.getElementById("toc");
  if (!btn || !toc) return;

  btn.addEventListener("click", () => {
    const isOpen = toc.classList.toggle("toc-mobile-open");
    btn.setAttribute("aria-expanded", String(isOpen));
    btn.innerHTML = isOpen
      ? `${ICON_CLOSE} Tutup Daftar Isi`
      : `${ICON_LIST} Daftar Isi`;
  });
}

function closeMobileTOC() {
  const toc = document.getElementById("toc");
  const btn = document.getElementById("toc-toggle-btn");
  toc?.classList.remove("toc-mobile-open");
  if (btn) {
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = `${ICON_LIST} Daftar Isi`;
  }
}

/* ══════════════════════════════════════════════════════════
   COPY-CODE BUTTONS
   ══════════════════════════════════════════════════════════ */
function initCopyCode() {
  document.querySelectorAll(".prose pre").forEach(pre => {
    const code = pre.querySelector("code");
    if (!code) return;

    // Detect language
    const lang = [...code.classList]
      .find(c => c.startsWith("language-"))
      ?.replace("language-", "") || "";

    // Language badge
    if (lang) {
      const badge = document.createElement("span");
      badge.className = "code-lang";
      badge.textContent = lang.toUpperCase();
      pre.appendChild(badge);
    }

    // Copy button
    const btn    = document.createElement("button");
    btn.className = "copy-btn";
    btn.setAttribute("aria-label", "Salin kode");
    btn.innerHTML = ICON_COPY + "<span>salin</span>";

    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.innerText.trim());
        btn.innerHTML = ICON_CHECK + "<span>tersalin!</span>";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.innerHTML = ICON_COPY + "<span>salin</span>";
          btn.classList.remove("copied");
        }, 2200);
      } catch {
        btn.innerHTML = "<span>gagal</span>";
        setTimeout(() => { btn.innerHTML = ICON_COPY + "<span>salin</span>"; }, 2000);
      }
    });

    pre.appendChild(btn);
  });
}

/* ══════════════════════════════════════════════════════════
   PREV / NEXT NAVIGATION
   ══════════════════════════════════════════════════════════ */
function initPrevNext() {
  const slug = meta("slug");
  if (!slug || typeof ARTICLES === "undefined") return;

  const idx  = ARTICLES.findIndex(a => a.slug === slug);
  if (idx === -1) return;

  const prev = idx > 0                  ? ARTICLES[idx - 1] : null;
  const next = idx < ARTICLES.length - 1 ? ARTICLES[idx + 1] : null;

  setNavBtn("btn-prev-article", prev, "← Artikel Sebelumnya");
  setNavBtn("btn-next-article", next, "Artikel Berikutnya →");
}

function setNavBtn(id, article, dir) {
  const btn = document.getElementById(id);
  if (!btn) return;
  if (!article) { btn.classList.add("disabled"); btn.removeAttribute("href"); return; }
  btn.href = resolveArticleURL(article.url);
  btn.querySelector(".nav-dir").textContent = dir;
  btn.querySelector(".nav-title").textContent = article.title;
  btn.classList.remove("disabled");
}

/* ══════════════════════════════════════════════════════════
   RELATED ARTICLES
   ══════════════════════════════════════════════════════════ */
function renderRelated() {
  const container = document.getElementById("related-grid");
  if (!container || typeof ARTICLES === "undefined") return;

  const slug = meta("slug");
  const cat  = meta("category");

  let related = ARTICLES.filter(a => a.slug !== slug && a.category === cat).slice(0, 3);

  // Fallback: fill with any other articles
  if (related.length < 3) {
    const extra = ARTICLES
      .filter(a => a.slug !== slug && !related.find(r => r.slug === a.slug))
      .slice(0, 3 - related.length);
    related = [...related, ...extra];
  }

  if (related.length === 0) {
    container.closest(".related-articles")?.remove();
    return;
  }

  const getCatColor = (catId) => {
    const c = (typeof CATEGORIES !== "undefined" ? CATEGORIES : []).find(c => c.id === catId);
    return c?.color || "#5340c8";
  };

  container.innerHTML = related.map(a => `
    <a href="${resolveArticleURL(a.url)}" class="related-card">
      <span class="related-card-dot" style="background:${getCatColor(a.category)}"></span>
      <div>
        <p class="related-card-title">${escHtml(a.title)}</p>
        <p class="related-card-meta">${formatDate(a.date)} · ${a.readtime} menit baca</p>
      </div>
    </a>`).join("");
}

/* ══════════════════════════════════════════════════════════
   MERMAID INIT + DARK MODE RE-RENDER
   ══════════════════════════════════════════════════════════ */
function initMermaid() {
  if (typeof mermaid === "undefined") return;
  const theme = document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark" : "default";
  mermaid.initialize({
    startOnLoad: true,
    theme,
    fontFamily: "'Inter', system-ui, sans-serif",
    flowchart:  { useMaxWidth: true, htmlLabels: true },
    sequence:   { useMaxWidth: true },
  });
}

function rerenderMermaid() {
  const diagrams = document.querySelectorAll(".mermaid");
  if (!diagrams.length || typeof mermaid === "undefined") return;

  const isDark = document.documentElement.getAttribute("data-theme") === "dark";

  // Restore original source from data-original (stored on first render)
  diagrams.forEach(el => {
    if (el.dataset.original) {
      el.removeAttribute("data-processed");
      el.innerHTML = el.dataset.original;
    } else {
      el.dataset.original = el.innerHTML;
    }
  });

  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? "dark" : "default",
    fontFamily: "'Inter', system-ui, sans-serif",
  });

  mermaid.run({ nodes: [...diagrams] }).catch(() => {});
}

/* Store original mermaid source before first render */
document.querySelectorAll(".mermaid").forEach(el => {
  el.dataset.original = el.innerHTML;
});

/* ══════════════════════════════════════════════════════════
   IMAGE LIGHTBOX
   ══════════════════════════════════════════════════════════ */
function initImageLightbox() {
  const prose = document.querySelector(".prose");
  if (!prose) return;

  // Create overlay (once)
  const overlay = document.createElement("div");
  overlay.id = "lightbox";
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("hidden", "");
  overlay.innerHTML = `
    <div class="lightbox-backdrop"></div>
    <div class="lightbox-content">
      <img class="lightbox-img" src="" alt="">
      <p class="lightbox-caption"></p>
    </div>
    <button class="lightbox-close" aria-label="Tutup">${ICON_CLOSE}</button>`;
  document.body.appendChild(overlay);

  const lbImg     = overlay.querySelector(".lightbox-img");
  const lbCaption = overlay.querySelector(".lightbox-caption");

  const open = (src, alt, caption) => {
    lbImg.src = src;
    lbImg.alt = alt || "";
    lbCaption.textContent = caption || alt || "";
    overlay.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    overlay.querySelector(".lightbox-close").focus();
  };

  const close = () => {
    overlay.setAttribute("hidden", "");
    document.body.style.overflow = "";
    lbImg.src = "";
  };

  // Attach to all article images
  prose.querySelectorAll("img").forEach(img => {
    img.style.cursor = "zoom-in";
    img.setAttribute("role", "button");
    img.setAttribute("tabindex", "0");
    img.addEventListener("click", () => {
      const caption = img.closest("figure")?.querySelector("figcaption")?.textContent;
      open(img.src, img.alt, caption);
    });
    img.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        img.click();
      }
    });
  });

  // Close events
  overlay.querySelector(".lightbox-close").addEventListener("click", close);
  overlay.querySelector(".lightbox-backdrop").addEventListener("click", close);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !overlay.hasAttribute("hidden")) close();
  });
}

/* ══════════════════════════════════════════════════════════
   SHARE BUTTON
   ══════════════════════════════════════════════════════════ */
function initShareButton() {
  const btn = document.getElementById("share-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const url   = location.href;
    const title = document.title;

    // Use native share on mobile if available
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {}
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      const orig = btn.innerHTML;
      btn.innerHTML = ICON_CHECK + " Tersalin!";
      btn.classList.add("share-copied");
      setTimeout(() => { btn.innerHTML = orig; btn.classList.remove("share-copied"); }, 2500);
    } catch {
      prompt("Salin URL artikel ini:", url);
    }
  });
}

/* ══════════════════════════════════════════════════════════
   SCROLL TO TOP
   ══════════════════════════════════════════════════════════ */
function initScrollTop() {
  const btn = document.getElementById("scroll-top");
  if (!btn) return;
  btn.innerHTML = ICON_CHEVRON_UP;
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 600);
  }, { passive: true });
}

/* ══════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
   ══════════════════════════════════════════════════════════ */
function initKeyboardShortcuts() {
  document.addEventListener("keydown", e => {
    const tag    = document.activeElement?.tagName.toLowerCase();
    const isInput = ["input","textarea","select"].includes(tag);
    if (isInput) return;

    // Alt+← / Alt+→  Prev / Next article
    if (e.altKey && e.key === "ArrowLeft") {
      document.getElementById("btn-prev-article")?.click();
    }
    if (e.altKey && e.key === "ArrowRight") {
      document.getElementById("btn-next-article")?.click();
    }

    // T — toggle TOC on mobile
    if (e.key === "t" || e.key === "T") {
      document.getElementById("toc-toggle-btn")?.click();
    }

    // P — print
    if (e.key === "p" || e.key === "P") {
      window.print();
    }
  });
}

/* ══════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════ */
function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric"
  });
}

function escHtml(s) {
  return String(s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

/**
 * Resolve article URL (root-relative) to a path relative to current page.
 * Works regardless of how deep the current page is.
 */
function resolveArticleURL(rootRelUrl) {
  /**
   * Works on both local server and GitHub Pages sub-path (e.g. /nirawarana/).
   * Strategy: find "articles" in current pathname, count depth from its parent.
   *
   * Example (GitHub Pages):
   *   pathname = /nirawarana/articles/rendering/directx/technique/pbr.html
   *   artIdx=1  depthFromArticles=3  levelsUp=4  prefix=../../../../
   *   → ../../../../articles/rendering/vulkan/vulkan-init.html ✅
   *
   * Example (local /):
   *   pathname = /articles/rendering/directx/technique/pbr.html
   *   artIdx=0  depthFromArticles=3  levelsUp=4  prefix=../../../../  ✅
   */
  const dirParts = location.pathname.split("/").filter(Boolean).slice(0, -1);
  const artIdx   = dirParts.lastIndexOf("articles");

  if (artIdx === -1) return rootRelUrl.replace(/^\//, "");

  const depthFromArticles = dirParts.length - artIdx - 1;
  const levelsUp          = depthFromArticles + 1;           // +1 to exit "articles/"
  const prefix            = "../".repeat(levelsUp);
  return prefix + rootRelUrl.replace(/^\//, "");
}

/* ══════════════════════════════════════════════════════════
   INLINE SVG ICONS
   ══════════════════════════════════════════════════════════ */
const ICON_MOON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const ICON_SUN  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const ICON_CHEVRON_UP = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>`;
const ICON_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const ICON_COPY  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="13" height="13"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const ICON_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>`;
const ICON_LIST  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>`;
