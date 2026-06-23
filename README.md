# Nirawarana

Engineering knowledge base — deep-dive articles for Graphics Programmers, Game Engine Developers, Rendering Engineers, Mechanical Engineers, and Software Architects.

**Live:** `https://<username>.github.io/nirawarana/`

---

## Stack

| Layer | Tech |
|---|---|
| Markup | HTML5 |
| Style | CSS3 (native custom properties, no framework) |
| Logic | JavaScript ES6+ (vanilla, no build step) |
| Diagrams | Mermaid.js (CDN) |
| Syntax | Prism.js (CDN) |
| Hosting | GitHub Pages |

---

## Project Structure

```
nirawarana/
├── index.html              ← Landing page + article list (homepage)
├── 404.html                ← Custom 404
├── README.md
│
├── src/
│   ├── style.css           ← Design system (tokens, layout, components)
│   ├── app.js              ← Homepage logic (render, paginate, dark/light)
│   ├── search.js           ← Search & category filter logic
│   ├── data.js             ← Article registry (source of truth)
│   └── images/
│       ├── logo.svg
│       ├── favicon.ico
│       ├── og-cover.png
│       └── covers/         ← Article cover images
│
├── articles/
│   ├── index.html          ← All articles archive
│   ├── src/
│   │   ├── article.css     ← Article-specific styles
│   │   ├── article.js      ← TOC, prev/next, copy-code, progress bar
│   │   └── data.js         ← Copy of /src/data.js (keep in sync)
│   ├── _template/
│   │   └── article-template.html ← Master template for new articles
│   ├── rendering/
│   │   ├── directx/
│   │   └── vulkan/
│   ├── gameengine/
│   ├── architecture/
│   ├── engineering/
│   │   ├── mechanical/
│   │   └── software/
│   └── graphics/
│
└── .github/
    └── workflows/
        └── deploy.yml      ← GitHub Actions (optional)
```

---

## Categories

| ID | Label | Target Reader |
|---|---|---|
| `rendering` | Rendering | Graphics & Rendering Programmer |
| `gameengine` | Game Engine | Game Engine Programmer |
| `architecture` | Architecture | Software / Systems Engineer |
| `engineering` | Engineering | Mechanical & Software Engineer |
| `graphics` | Graphics | Graphics Programmer, Artist-Tech |

---

## Adding a New Article

1. Copy `articles/_template/article-template.html` to the appropriate category folder.
2. Fill in all `<meta>` tags at the top of the file.
3. Write content using the available components (code, mermaid, table, checklist, etc.).
4. Add a cover image to `src/images/covers/<slug>-cover.png`.
5. Register the article in `src/data.js` **and** `articles/src/data.js` (keep in sync).
6. Commit and push — GitHub Pages deploys automatically.

---

## Local Development

No build step required. Serve files from a local HTTP server:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .
```

Then open `http://localhost:8000`.

> ⚠️ Opening `index.html` via `file://` will block JS module loading in some browsers. Use a local server.

---

## Dark / Light Mode

The site respects `prefers-color-scheme` by default. Users can override via the toggle button in the header. The preference is saved to `localStorage` under the key `nirawarana-theme`.

---

## Deployment (GitHub Pages)

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Set source to **Deploy from branch → main → / (root)**.
4. Your site will be live at `https://<username>.github.io/nirawarana/`.

---

*Nirawarana — Knowledge for Engineers*
