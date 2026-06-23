"use strict";

/**
 * Nirawarana — article.js
 * Logic for individual article pages:
 *   - Theme init
 *   - Reading progress bar
 *   - Table of contents (auto-build + active highlight)
 *   - Copy-code buttons
 *   - Prev / Next navigation
 *   - Related articles
 *   - Mermaid init
 *   - Scroll to top
 */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initReadingProgress();
  buildTOC();
  initCopyCode();
  initPrevNext();
  renderRelated();
  initMermaid();
  initScrollTop();
});

/* ============================================================
   THEME
   ============================================================ */
function initTheme() {
  const STORAGE_KEY = "nirawarana-theme";
  const saved = localStorage.getItem(STORAGE_KEY);
  const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const theme = saved || preferred;
  applyTheme(theme, false);

  document.getElementById("theme-toggle")
    ?.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") || "light";
      applyTheme(cur === "dark" ? "light" : "dark");
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

/* ============================================================
   READING PROGRESS BAR
   ============================================================ */
function initReadingProgress() {
  const bar = document.getElementById("reading-progress");
  if (!bar) return;

  const prose = document.querySelector(".prose");
  if (!prose) return;

  window.addEventListener("scroll", () => {
    const rect = prose.getBoundingClientRect();
    const total = prose.offsetHeight - window.innerHeight;
    const scrolled = Math.abs(rect.top);
    const pct = total > 0 ? Math.min(100, (scrolled / total) * 100) : 0;
    bar.style.width = pct + "%";
  }, { passive: true });
}

/* ============================================================
   TABLE OF CONTENTS
   ============================================================ */
function buildTOC() {
  const toc = document.getElementById("toc");
  const prose = document.querySelector(".prose");
  if (!toc || !prose) return;

  const headings = [...prose.querySelectorAll("h2, h3")];
  if (headings.length < 2) { toc.style.display = "none"; return; }

  // Auto-assign IDs
  headings.forEach((h, i) => {
    if (!h.id) {
      h.id = "section-" + i + "-" + h.textContent.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    }
  });

  const list = document.createElement("ul");
  list.className = "toc-list";

  headings.forEach(h => {
    const li = document.createElement("li");
    li.className = h.tagName === "H3" ? "toc-h3" : "toc-h2";
    const a = document.createElement("a");
    a.href = "#" + h.id;
    a.textContent = h.textContent;
    li.appendChild(a);
    list.appendChild(li);
  });

  const label = document.createElement("p");
  label.className = "toc-title";
  label.textContent = "Isi Artikel";
  toc.appendChild(label);
  toc.appendChild(list);

  // Active section tracking via IntersectionObserver
  const links = [...list.querySelectorAll("a")];

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove("active"));
        const active = links.find(l => l.getAttribute("href") === "#" + entry.target.id);
        active?.classList.add("active");
      }
    });
  }, { rootMargin: "-20% 0px -75% 0px" });

  headings.forEach(h => observer.observe(h));
}

/* ============================================================
   COPY CODE BUTTONS
   ============================================================ */
function initCopyCode() {
  document.querySelectorAll(".prose pre").forEach(pre => {
    const code = pre.querySelector("code");
    if (!code) return;

    // Language badge
    const lang = [...code.classList]
      .find(c => c.startsWith("language-"))
      ?.replace("language-", "") || "";

    if (lang) {
      const badge = document.createElement("span");
      badge.className = "code-lang";
      badge.textContent = lang;
      pre.appendChild(badge);
    }

    // Copy button
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.textContent = "copy";
    btn.setAttribute("aria-label", "Copy code");

    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.innerText);
        btn.textContent = "copied!";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = "copy";
          btn.classList.remove("copied");
        }, 2000);
      } catch {
        btn.textContent = "failed";
        setTimeout(() => { btn.textContent = "copy"; }, 2000);
      }
    });

    pre.appendChild(btn);
  });
}

/* ============================================================
   PREV / NEXT NAVIGATION
   ============================================================ */
function initPrevNext() {
  const slug = document.querySelector("meta[name='article:slug']")?.content;
  if (!slug || typeof ARTICLES === "undefined") return;

  const idx = ARTICLES.findIndex(a => a.slug === slug);
  if (idx === -1) return;

  const prev = idx > 0 ? ARTICLES[idx - 1] : null;
  const next = idx < ARTICLES.length - 1 ? ARTICLES[idx + 1] : null;

  // Prev button
  const prevBtn = document.getElementById("btn-prev-article");
  if (prevBtn) {
    if (prev) {
      prevBtn.href = resolveArticleURL(prev.url);
      prevBtn.querySelector(".nav-title").textContent = prev.title;
    } else {
      prevBtn.classList.add("disabled");
    }
  }

  // Next button
  const nextBtn = document.getElementById("btn-next-article");
  if (nextBtn) {
    if (next) {
      nextBtn.href = resolveArticleURL(next.url);
      nextBtn.querySelector(".nav-title").textContent = next.title;
    } else {
      nextBtn.classList.add("disabled");
    }
  }
}

/* ============================================================
   RELATED ARTICLES
   ============================================================ */
function renderRelated() {
  const container = document.getElementById("related-grid");
  const slug = document.querySelector("meta[name='article:slug']")?.content;
  const category = document.querySelector("meta[name='article:category']")?.content;

  if (!container || !slug || typeof ARTICLES === "undefined") return;

  const related = ARTICLES
    .filter(a => a.slug !== slug && a.category === category)
    .slice(0, 3);

  if (related.length === 0) {
    container.closest(".related-articles")?.remove();
    return;
  }

  container.innerHTML = related.map(a => `
    <a href="${resolveArticleURL(a.url)}" class="related-card">
      <p class="related-card-title">${escHtml(a.title)}</p>
      <p class="related-card-meta">${formatDate(a.date)} · ${a.readtime} menit</p>
    </a>`).join("");
}

/* ============================================================
   MERMAID
   ============================================================ */
function initMermaid() {
  if (typeof mermaid === "undefined") return;
  mermaid.initialize({
    startOnLoad: true,
    theme: document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark" : "default",
    fontFamily: "Inter, system-ui, sans-serif",
    flowchart: { useMaxWidth: true, htmlLabels: true },
  });
}

/* ============================================================
   SCROLL TO TOP
   ============================================================ */
function initScrollTop() {
  const btn = document.getElementById("scroll-top");
  if (!btn) return;
  btn.innerHTML = ICON_CHEVRON_UP;
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 500);
  }, { passive: true });
}

/* ============================================================
   HELPERS
   ============================================================ */
function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Resolve an article URL relative to the current page.
 * article.url is always relative to site root.
 * We need to compute the right relative path from the current page.
 */
function resolveArticleURL(url) {
  // Count how many directories deep we are from root
  const depth = location.pathname.split("/").filter(Boolean).length;
  // Go up (depth - 1) times (minus the filename itself) from root
  const prefix = "../".repeat(Math.max(0, depth - 1));
  return prefix + url;
}

/* ============================================================
   ICONS
   ============================================================ */
const ICON_MOON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
</svg>`;

const ICON_SUN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
  <circle cx="12" cy="12" r="5"/>
  <line x1="12" y1="1"  x2="12" y2="3"/>
  <line x1="12" y1="21" x2="12" y2="23"/>
  <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
  <line x1="1" y1="12"  x2="3"  y2="12"/>
  <line x1="21" y1="12" x2="23" y2="12"/>
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
</svg>`;

const ICON_CHEVRON_UP = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
  <polyline points="18 15 12 9 6 15"/>
</svg>`;
