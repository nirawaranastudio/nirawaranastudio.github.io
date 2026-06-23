"use strict";

/**
 * Nirawarana — search.js
 * Search engine, filter, highlight, suggestions, sort.
 * Used by app.js (homepage) and articles/index.html (archive).
 */

/* ============================================================
   SEARCH — Full-text with relevance scoring
   ============================================================ */

/**
 * Search articles by query string.
 * Scores by: title match > exact tag > excerpt > partial word.
 * @param {object[]} articles
 * @param {string}   query
 * @returns {object[]} sorted by score DESC
 */
function searchArticles(articles, query) {
  const q = query.toLowerCase().trim();
  if (!q) return articles;

  return articles
    .map(a => {
      let score = 0;
      const title   = a.title.toLowerCase();
      const excerpt = a.excerpt.toLowerCase();
      const tags    = a.tags.map(t => t.toLowerCase());

      // Title matches — highest weight
      if (title === q)              score += 50;
      if (title.startsWith(q))      score += 20;
      if (title.includes(q))        score += 10;

      // Word-level title match
      title.split(/\s+/).forEach(w => { if (w.startsWith(q)) score += 5; });

      // Exact tag match
      if (tags.includes(q))         score += 15;
      if (tags.some(t => t.includes(q))) score += 3;

      // Excerpt match
      if (excerpt.includes(q))      score += 4;

      return score > 0 ? { ...a, _score: score } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b._score - a._score || new Date(b.date) - new Date(a.date));
}

/* ============================================================
   FILTER — Category & Tag
   ============================================================ */

function filterByCategory(articles, categoryId) {
  if (!categoryId || categoryId === "all") return articles;
  return articles.filter(a => a.category === categoryId);
}

function filterByTag(articles, tag) {
  if (!tag) return articles;
  const t = tag.toLowerCase();
  return articles.filter(a => a.tags.some(at => at.toLowerCase() === t));
}

/**
 * Combined filter entry point.
 * @param {object[]} articles
 * @param {object}   opts — { category, query, tag }
 */
function filterArticles(articles, { category = "all", query = "", tag = "" } = {}) {
  let result = filterByCategory(articles, category);
  if (tag)   result = filterByTag(result, tag);
  if (query) result = searchArticles(result, query);
  else       result = [...result].sort((a, b) => new Date(b.date) - new Date(a.date));
  return result;
}

/* ============================================================
   SORT
   ============================================================ */

/**
 * Sort article array in-place.
 * @param {object[]} articles
 * @param {"date"|"title"|"readtime"} sortKey
 */
function sortArticles(articles, sortKey = "date") {
  const fns = {
    date:     (a, b) => new Date(b.date) - new Date(a.date),
    title:    (a, b) => a.title.localeCompare(b.title, "id"),
    readtime: (a, b) => b.readtime - a.readtime,
  };
  return [...articles].sort(fns[sortKey] || fns.date);
}

/* ============================================================
   HIGHLIGHT — Wrap matching terms in <mark>
   ============================================================ */

/**
 * Wrap all occurrences of `query` in `text` with <mark class="search-hl">.
 * Safe: escapes HTML first, then wraps.
 * @param {string} text
 * @param {string} query
 * @returns {string} HTML string
 */
function highlightText(text, query) {
  const safe = escSearchHtml(text);
  if (!query || !query.trim()) return safe;

  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped})`, "gi");
  return safe.replace(re, '<mark class="search-hl">$1</mark>');
}

/** Minimal HTML escape (for use inside highlight only) */
function escSearchHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ============================================================
   SUGGESTIONS — Quick-match article titles
   ============================================================ */

/**
 * Generate autocomplete suggestions from article titles + tags.
 * @param {object[]} articles
 * @param {string}   query
 * @param {number}   limit
 * @returns {{ title, url, category, matchType }[]}
 */
function generateSuggestions(articles, query, limit = 5) {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const results = [];

  // Title matches
  articles.forEach(a => {
    if (a.title.toLowerCase().includes(q)) {
      results.push({ title: a.title, url: a.url, category: a.category, matchType: "article" });
    }
  });

  // Tag matches (unique tags only)
  const tagHits = new Set();
  articles.forEach(a => {
    a.tags.forEach(t => {
      if (t.toLowerCase().includes(q) && !tagHits.has(t)) {
        tagHits.add(t);
        results.push({ title: `#${t}`, url: null, category: null, matchType: "tag", tag: t });
      }
    });
  });

  return results.slice(0, limit);
}

/* ============================================================
   TAG CLOUD — Frequency-sorted unique tags
   ============================================================ */

/**
 * @param {object[]} articles
 * @param {number}   limit
 * @returns {{ tag: string, count: number }[]}
 */
function getTagCloud(articles, limit = 20) {
  const freq = {};
  articles.forEach(a => a.tags.forEach(t => {
    freq[t] = (freq[t] || 0) + 1;
  }));
  return Object.entries(freq)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
