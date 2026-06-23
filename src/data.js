"use strict";

/**
 * Nirawarana — Article Registry
 * SOURCE OF TRUTH. Keep in sync with articles/src/data.js
 */

const ARTICLES = [
  {
    id: 1,
    slug: "pbr-technique-dx12",
    title: "PBR Rendering Technique with DirectX 12",
    category: "rendering",
    subcategory: "directx",
    tags: ["pbr", "directx12", "physically-based", "brdf", "ibl", "deferred"],
    date: "2025-02-12",
    readtime: 15,
    excerpt: "Setup GBuffer, Cook-Torrance BRDF, Image-Based Lighting, dan tone mapping — implementasi lengkap PBR pada pipeline DirectX 12.",
    cover: "src/images/covers/pbr-dx12-cover.png",
    url: "articles/rendering/directx/technique/pbr-technique-dx12.html",
    featured: true,
    author: "Admin"
  },
  {
    id: 2,
    slug: "vulkan-init",
    title: "Vulkan Initialization from Scratch",
    category: "rendering",
    subcategory: "vulkan",
    tags: ["vulkan", "initialization", "instance", "device", "queue", "validation-layers"],
    date: "2025-02-03",
    readtime: 20,
    excerpt: "Instance, physical device selection, logical device, queues, validation layers, dan debug messenger — fondasi Vulkan dari nol.",
    cover: "src/images/covers/vulkan-init-cover.png",
    url: "articles/rendering/vulkan/vulkan-init.html",
    featured: false,
    author: "Admin"
  },
  {
    id: 3,
    slug: "command-queue-dx12",
    title: "Understanding Command Queues in DirectX 12",
    category: "rendering",
    subcategory: "directx",
    tags: ["directx12", "command-queue", "command-list", "gpu", "synchronization"],
    date: "2025-01-30",
    readtime: 11,
    excerpt: "Cara kerja command queue, command allocator, dan command list di DX12 — termasuk multi-threading submission dan fence synchronization.",
    cover: "src/images/covers/command-queue-cover.png",
    url: "articles/rendering/directx/technique/command-queue-dx12.html",
    featured: false,
    author: "Admin"
  },
  {
    id: 4,
    slug: "swapchain-dx12",
    title: "Swap Chain Setup & Frame Synchronization DX12",
    category: "rendering",
    subcategory: "directx",
    tags: ["directx12", "swapchain", "vsync", "present", "frame-buffering"],
    date: "2025-01-25",
    readtime: 9,
    excerpt: "Setup DXGI swap chain, pilih format dan buffer count yang tepat, serta implementasi frame synchronization dengan fence object.",
    cover: "src/images/covers/swapchain-cover.png",
    url: "articles/rendering/directx/technique/swapchain-dx12.html",
    featured: false,
    author: "Admin"
  },
  {
    id: 5,
    slug: "ecs-architecture",
    title: "Entity-Component-System Architecture",
    category: "gameengine",
    subcategory: "",
    tags: ["ecs", "architecture", "game-engine", "data-oriented", "component"],
    date: "2025-01-28",
    readtime: 12,
    excerpt: "Paradigma ECS: pemisahan data dari logic, cache-friendly layout, dan implementasi ECS sederhana dari nol dalam C++.",
    cover: "src/images/covers/ecs-cover.png",
    url: "articles/gameengine/ecs-architecture.html",
    featured: false,
    author: "Admin"
  },
  {
    id: 6,
    slug: "asset-pipeline",
    title: "Designing a Robust Asset Pipeline",
    category: "gameengine",
    subcategory: "",
    tags: ["asset-pipeline", "game-engine", "build-system", "importer", "cook"],
    date: "2025-01-18",
    readtime: 13,
    excerpt: "Arsitektur asset pipeline modern: importer, processor, cooker, dan hot-reload. Dari source asset ke runtime format yang optimal.",
    cover: "src/images/covers/asset-pipeline-cover.png",
    url: "articles/gameengine/asset-pipeline.html",
    featured: false,
    author: "Admin"
  },
  {
    id: 7,
    slug: "data-oriented-design",
    title: "Data-Oriented Design Principles",
    category: "architecture",
    subcategory: "",
    tags: ["dod", "performance", "cache", "memory", "soa", "aos"],
    date: "2025-01-22",
    readtime: 10,
    excerpt: "Mengapa cara mengorganisir data sama pentingnya dengan algoritma. Cache lines, SoA vs AoS, hot/cold data separation.",
    cover: "src/images/covers/dod-cover.png",
    url: "articles/architecture/data-oriented-design.html",
    featured: false,
    author: "Admin"
  },
  {
    id: 8,
    slug: "cache-coherency",
    title: "Cache Coherency & Memory Access Patterns",
    category: "architecture",
    subcategory: "",
    tags: ["cache", "memory", "performance", "cpu", "simd", "prefetch"],
    date: "2025-01-12",
    readtime: 14,
    excerpt: "Memahami L1/L2/L3 cache, cache miss penalty, false sharing, prefetching, dan cara menulis kode yang ramah terhadap hardware.",
    cover: "src/images/covers/cache-cover.png",
    url: "articles/architecture/cache-coherency.html",
    featured: false,
    author: "Admin"
  },
  {
    id: 9,
    slug: "fea-intro",
    title: "Finite Element Analysis — Introduction",
    category: "engineering",
    subcategory: "mechanical",
    tags: ["fea", "finite-element", "mechanical", "simulation", "stress", "meshing"],
    date: "2025-01-14",
    readtime: 18,
    excerpt: "Fondasi matematis hingga workflow simulasi: meshing, kondisi batas, jenis analisis statis dan dinamis, serta interpretasi hasil.",
    cover: "src/images/covers/fea-cover.png",
    url: "articles/engineering/mechanical/fea-intro.html",
    featured: false,
    author: "Admin"
  },
  {
    id: 10,
    slug: "color-science",
    title: "Color Science for Graphics Programmers",
    category: "graphics",
    subcategory: "",
    tags: ["color", "colorspace", "hdr", "gamma", "tone-mapping", "aces"],
    date: "2025-01-08",
    readtime: 14,
    excerpt: "Dari fisika cahaya hingga persepsi warna manusia: color spaces, gamma correction, HDR pipeline, dan tone mapping operators.",
    cover: "src/images/covers/color-science-cover.png",
    url: "articles/graphics/color-science.html",
    featured: false,
    author: "Admin"
  },
  {
    id: 11,
    slug: "ray-tracing-primer",
    title: "Ray Tracing — A First Principles Primer",
    category: "graphics",
    subcategory: "",
    tags: ["ray-tracing", "bvh", "intersection", "dxr", "rtx", "path-tracing"],
    date: "2025-01-02",
    readtime: 16,
    excerpt: "Dari konsep ray casting hingga BVH acceleration structure dan DXR API. Panduan pertama memulai ray tracing di GPU modern.",
    cover: "src/images/covers/ray-tracing-cover.png",
    url: "articles/graphics/ray-tracing-primer.html",
    featured: false,
    author: "Admin"
  }
];

const CATEGORIES = [
  { id: "all",          label: "Semua",        color: null,      count: 0 },
  { id: "rendering",    label: "Rendering",    color: "#e05a47", count: 0 },
  { id: "gameengine",   label: "Game Engine",  color: "#3a9be0", count: 0 },
  { id: "architecture", label: "Architecture", color: "#22c87a", count: 0 },
  { id: "engineering",  label: "Engineering",  color: "#f0a040", count: 0 },
  { id: "graphics",     label: "Graphics",     color: "#a85be8", count: 0 },
];

CATEGORIES.forEach(cat => {
  cat.count = cat.id === "all"
    ? ARTICLES.length
    : ARTICLES.filter(a => a.category === cat.id).length;
});
