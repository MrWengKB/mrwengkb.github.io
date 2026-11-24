// ==========================================
// 1. 将此处修改为您自己的 GitHub 用户名
// ==========================================
const GITHUB_USERNAME = "MrWengKB";

// 是否隐藏主页仓库本身 (username.github.io)
const EXCLUDE_HOME_REPO = true;

// 不在导航页显示的仓库（填仓库名，不分大小写）
const EXCLUDE_REPOS = ["blog"];

// 分类：按仓库的 Topics（主题标签）归类，按顺序显示为顶部的切换按钮。
// 新增分类只需在这里加一行，并给对应仓库打上同名 topic。
// 一个仓库有多个匹配的 topic 时，会同时出现在多个分类下。
const CATEGORIES = [
  { topic: "game", label: { zh: "游戏", en: "Games" } },
  { topic: "tool", label: { zh: "工具", en: "Tools" } },
  { topic: "assessment", label: { zh: "评估", en: "Assessments" } },
  { topic: "chinese", label: { zh: "中文", en: "Chinese" } },
  { topic: "english", label: { zh: "英文", en: "English" } },
  { topic: "multilingual", label: { zh: "多语", en: "Multilingual" } },
];

// ==========================================
// 2. 中英文文案
// ==========================================
const I18N = {
  zh: {
    htmlLang: "zh-CN",
    docTitle: "我的项目",
    pageTitle: () => "我的项目",
    querying: "正在查询仓库...",
    loading: "正在从 GitHub 获取项目列表...",
    loadFailed: (msg) => `加载失败: ${msg}`,
    apiFailed: (status) => `API 访问失败: HTTP ${status}`,
    fetchFailed: "获取失败",
    empty: "未发现其他公开仓库。",
    count: (n) => `共找到 ${n} 个项目`,
    noDesc: "暂无描述信息",
    updated: (d) => `更新于: ${d}`,
    visit: "访问站点",
    download: "下载安装",
    noRelease: "暂无安装包",
    downloadTitle: (name) => `下载 ${name}`,
    source: "源码仓库",
    toggleLabel: "EN",
    toggleAria: "Switch to English",
    all: "全部",
    filterAria: "按分类筛选",
    emptyCategory: "这个分类下暂时没有项目。",
    searchPlaceholder: "搜索名称、描述、标签…",
    searchAria: "搜索项目",
    noMatch: (q) => `没有找到与“${q}”相关的项目。`,
    matchCount: (n) => `找到 ${n} 个匹配的项目`,
    avatarAlt: (u) => `${u} 的 GitHub 头像`,
    dateLocale: "zh-CN",
  },
  en: {
    htmlLang: "en",
    docTitle: "My Projects",
    pageTitle: () => "My Projects",
    querying: "Checking repositories...",
    loading: "Loading projects from GitHub...",
    loadFailed: (msg) => `Couldn't load projects: ${msg}`,
    apiFailed: (status) => `GitHub API request failed: HTTP ${status}`,
    fetchFailed: "Load failed",
    empty: "No other public repositories.",
    count: (n) => `${n} project${n === 1 ? "" : "s"} found`,
    noDesc: "No description",
    updated: (d) => `Updated ${d}`,
    visit: "Visit site",
    download: "Download",
    noRelease: "No release yet",
    downloadTitle: (name) => `Download ${name}`,
    source: "Source code",
    toggleLabel: "中文",
    toggleAria: "切换到中文",
    all: "All",
    filterAria: "Filter by category",
    emptyCategory: "No projects in this category yet.",
    searchPlaceholder: "Search name, description, topics…",
    searchAria: "Search projects",
    noMatch: (q) => `No projects match “${q}”.`,
    matchCount: (n) => `${n} matching project${n === 1 ? "" : "s"}`,
    avatarAlt: (u) => `${u}'s GitHub avatar`,
    dateLocale: "en-US",
  },
};

const LANG_KEY = "pages-nav-lang";

function detectLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && I18N[saved]) return saved;
  } catch (e) {}
  return (navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en";
}

let currentLang = detectLang();
let t = I18N[currentLang];

// 页面状态：loading | error | done
let state = { status: "loading", repos: [], error: null };

// 当前分类："all" 或某个分类的 topic，同步到网址的 #hash，方便直接分享某个分类
const ALL = "all";
function categoryFromHash() {
  const h = decodeURIComponent(location.hash.slice(1)).toLowerCase();
  return CATEGORIES.some((c) => c.topic === h) ? h : ALL;
}
let currentCategory = categoryFromHash();

// 搜索词：同步到网址的 ?q=，方便分享搜索结果
function queryFromURL() {
  return new URLSearchParams(location.search).get("q") || "";
}
let currentQuery = queryFromURL();

const container = document.getElementById("pages-container");
const countText = document.getElementById("repo-count");
const pageTitle = document.getElementById("page-title");
const langToggle = document.getElementById("lang-toggle");
const avatar = document.getElementById("avatar");
const categoryBar = document.getElementById("category-bar");
const searchInput = document.getElementById("search-input");
if (searchInput) searchInput.value = currentQuery;

function applyStaticText() {
  document.documentElement.lang = t.htmlLang;
  document.title = t.docTitle;
  if (pageTitle) pageTitle.textContent = t.pageTitle(GITHUB_USERNAME);
  if (avatar) avatar.alt = t.avatarAlt(GITHUB_USERNAME);
  if (langToggle) {
    langToggle.textContent = t.toggleLabel;
    langToggle.setAttribute("aria-label", t.toggleAria);
  }
  const privacyLink = document.getElementById("privacy-link");
  if (privacyLink) privacyLink.textContent = t.htmlLang === "en" ? "Privacy Policy" : "隐私政策";
  if (searchInput) {
    searchInput.placeholder = t.searchPlaceholder;
    searchInput.setAttribute("aria-label", t.searchAria);
  }
}

function render() {
  applyStaticText();
  renderCategoryBar();
  if (state.status === "loading") {
    countText.textContent = t.querying;
    container.innerHTML = `<div class="state-message">${t.loading}</div>`;
  } else if (state.status === "error") {
    countText.textContent = t.fetchFailed;
    container.innerHTML = `<div class="state-message" style="color: #f85149;">${escapeHTML(t.loadFailed(errorText(state.error)))}</div>`;
  } else {
    renderList(state.repos);
  }
}

// 错误信息按当前语言生成，切换语言后也会更新
function errorText(err) {
  return err && err.httpStatus ? t.apiFailed(err.httpStatus) : String(err && err.message);
}

function setLang(lang) {
  if (!I18N[lang]) return;
  currentLang = lang;
  t = I18N[lang];
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  render();
}

if (langToggle) {
  langToggle.addEventListener("click", () => {
    setLang(currentLang === "zh" ? "en" : "zh");
  });
}

function repoInCategory(repo, category) {
  if (category === ALL) return true;
  return (repo.topics || []).some((topic) => topic.toLowerCase() === category);
}

// ---------- 搜索 ----------
// 把搜索词拆成多个关键词（空格分隔），全部命中才算匹配；不分大小写
function searchTerms(query) {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

// 每个仓库可被搜索的文本：名称（连字符也当空格）、描述、topics、语言，以及所属分类的中英文名
function searchText(repo) {
  if (repo._searchText) return repo._searchText;
  const topics = (repo.topics || []).map((x) => x.toLowerCase());
  const labels = CATEGORIES.filter((c) => topics.includes(c.topic)).flatMap((c) => Object.values(c.label));
  repo._searchText = [
    repo.name,
    repo.name.replace(/[-_.]+/g, " "),
    repo.description || "",
    ...topics,
    repo.language || "",
    ...labels,
  ].join("\n").toLowerCase();
  return repo._searchText;
}

function repoMatchesQuery(repo, terms) {
  if (terms.length === 0) return true;
  const text = searchText(repo);
  return terms.every((term) => text.includes(term));
}

// 转义后再用 <mark> 标出命中的关键词
function highlight(str, terms) {
  const text = String(str);
  if (terms.length === 0) return escapeHTML(text);
  const lower = text.toLowerCase();
  const marks = new Array(text.length).fill(false);
  terms.forEach((term) => {
    let i = lower.indexOf(term);
    while (i !== -1) {
      for (let k = i; k < i + term.length; k++) marks[k] = true;
      i = lower.indexOf(term, i + term.length);
    }
  });
  let html = "";
  let i = 0;
  while (i < text.length) {
    let j = i;
    while (j < text.length && marks[j] === marks[i]) j++;
    const part = escapeHTML(text.slice(i, j));
    html += marks[i] ? `<mark>${part}</mark>` : part;
    i = j;
  }
  return html;
}

function updateURL() {
  const params = new URLSearchParams(location.search);
  if (currentQuery) params.set("q", currentQuery);
  else params.delete("q");
  const search = params.toString() ? `?${params}` : "";
  const hash = currentCategory === ALL ? "" : `#${currentCategory}`;
  history.replaceState(null, "", location.pathname + search + hash);
}

function setQuery(query) {
  if (query === currentQuery) return;
  currentQuery = query;
  updateURL();
  render();
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    // 拼音等输入法组字过程中先不过滤，选好字再搜
    if (e.isComposing) return;
    setQuery(searchInput.value.trim());
  });
  searchInput.addEventListener("compositionend", () => setQuery(searchInput.value.trim()));
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (searchInput.value) {
        searchInput.value = "";
        setQuery("");
      } else {
        searchInput.blur();
      }
    }
  });
}

// 按 / 快速聚焦搜索框（正在输入时不拦截）
document.addEventListener("keydown", (e) => {
  if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || !searchInput) return;
  const el = document.activeElement;
  if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
  e.preventDefault();
  searchInput.focus();
  searchInput.select();
});

function setCategory(category) {
  currentCategory = category;
  updateURL();
  render();
}

window.addEventListener("hashchange", () => {
  currentCategory = categoryFromHash();
  render();
});

function renderCategoryBar() {
  if (!categoryBar) return;
  categoryBar.setAttribute("aria-label", t.filterAria);
  const done = state.status === "done";
  const options = [
    { key: ALL, label: t.all },
    ...CATEGORIES.map((c) => ({ key: c.topic, label: c.label[currentLang] || c.topic })),
  ];

  categoryBar.innerHTML = "";
  options.forEach(({ key, label }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "category-btn";
    const active = key === currentCategory;
    if (active) btn.classList.add("active");
    btn.setAttribute("aria-pressed", String(active));
    btn.textContent = label;
    if (done) {
      const terms = searchTerms(currentQuery);
      const n = state.repos.filter((repo) => repoInCategory(repo, key) && repoMatchesQuery(repo, terms)).length;
      const count = document.createElement("span");
      count.className = "category-count";
      count.textContent = n;
      btn.appendChild(count);
    }
    btn.addEventListener("click", () => setCategory(key));
    categoryBar.appendChild(btn);
  });
}

// 数据来源：
// 1. repos.json：由 GitHub Actions（.github/workflows/update-repos.yml）定时生成，先用它立即显示；
// 2. 再调 1 次 GitHub API 拿最新仓库列表，补上 repos.json 里还没有的新仓库；
//    只有新出现或有新推送的应用才额外查它的 Release。结果在浏览器里缓存 API_CACHE_MINUTES 分钟，
//    API 失败（如超出未登录每小时 60 次的限额）时继续用 repos.json。
const REPOS_JSON = "repos.json";
const API_CACHE_KEY = "pages-nav-api-cache-v2";
const API_CACHE_MINUTES = 10;

async function fetchRepos() {
  const snapshot = await loadReposJSON();
  if (snapshot) {
    state = { status: "done", repos: snapshot.filter(isListed), error: null };
    render();
  }
  try {
    const live = await loadReposLive(snapshot || []);
    state = { status: "done", repos: live.filter(isListed), error: null };
  } catch (err) {
    if (!snapshot) state = { status: "error", repos: [], error: err };
  }
  render();
}

function isListed(repo) {
  if (
    EXCLUDE_HOME_REPO &&
    repo.name.toLowerCase() === `${GITHUB_USERNAME.toLowerCase()}.github.io`
  ) {
    return false;
  }
  return !EXCLUDE_REPOS.some((name) => name.toLowerCase() === repo.name.toLowerCase());
}

async function loadReposJSON() {
  try {
    const res = await fetch(REPOS_JSON, { cache: "no-cache" });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.repos) && data.repos.length ? data.repos : null;
  } catch (e) {
    return null;
  }
}

async function loadReposLive(snapshot) {
  try {
    const cached = JSON.parse(localStorage.getItem(API_CACHE_KEY) || "null");
    if (cached && Date.now() - cached.time < API_CACHE_MINUTES * 60 * 1000) return cached.repos;
  } catch (e) {}

  const res = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`
  );
  if (!res.ok) {
    const err = new Error();
    err.httpStatus = res.status;
    throw err;
  }
  const known = new Map(snapshot.map((r) => [r.full_name, r]));
  const repos = (await res.json()).filter(isListed).map(slimRepo);

  // 应用（没开 Pages）的 Release：repos.json 里有、且之后没有新推送的，直接沿用
  await Promise.all(
    repos.filter((repo) => !repo.has_pages).map(async (repo) => {
      const old = known.get(repo.full_name);
      if (old && "release" in old && old.pushed_at && old.pushed_at === repo.pushed_at) {
        repo.release = old.release;
      } else {
        repo.release = await fetchLatestRelease(repo.full_name);
      }
    })
  );

  try {
    localStorage.setItem(API_CACHE_KEY, JSON.stringify({ time: Date.now(), repos }));
  } catch (e) {}
  return repos;
}

// 只保留页面用到的字段（repos.json 的格式与此相同）
function slimRepo(r) {
  return {
    name: r.name,
    full_name: r.full_name,
    description: r.description,
    topics: r.topics || [],
    language: r.language,
    updated_at: r.updated_at,
    pushed_at: r.pushed_at,
    stargazers_count: r.stargazers_count,
    html_url: r.html_url,
    has_pages: r.has_pages,
    default_branch: r.default_branch,
  };
}

async function fetchLatestRelease(fullName) {
  try {
    const res = await fetch(`https://api.github.com/repos/${fullName}/releases/latest`);
    if (!res.ok) return null;
    const r = await res.json();
    return {
      tag: r.tag_name,
      url: r.html_url,
      assets: (r.assets || []).map((a) => ({ name: a.name, url: a.browser_download_url })),
    };
  } catch (e) {
    return null;
  }
}

// 安装包优先级：越靠前越优先
const INSTALLER_EXTS = [".apk", ".aab", ".exe", ".msi", ".dmg", ".pkg", ".appimage", ".deb", ".rpm", ".ipa", ".zip"];

function pickInstaller(release) {
  if (!release || !release.assets) return null;
  const rank = (a) => {
    const name = a.name.toLowerCase();
    const i = INSTALLER_EXTS.findIndex((ext) => name.endsWith(ext));
    return i === -1 ? INSTALLER_EXTS.length : i;
  };
  return release.assets.slice().sort((x, y) => rank(x) - rank(y))[0] || null;
}

function renderList(allRepos) {
  if (allRepos.length === 0) {
    container.innerHTML = `<div class="state-message">${t.empty}</div>`;
    countText.textContent = t.count(0);
    return;
  }

  const terms = searchTerms(currentQuery);
  const repos = allRepos.filter(
    (repo) => repoInCategory(repo, currentCategory) && repoMatchesQuery(repo, terms)
  );
  if (repos.length === 0) {
    const msg = terms.length ? t.noMatch(currentQuery) : t.emptyCategory;
    container.innerHTML = `<div class="state-message">${escapeHTML(msg)}</div>`;
    countText.textContent = t.count(0);
    return;
  }

  countText.textContent = terms.length ? t.matchCount(repos.length) : t.count(repos.length);
  container.innerHTML = "";

  repos.forEach((repo) => {
    const isApp = !repo.has_pages;
    const pageUrl = `https://${GITHUB_USERNAME}.github.io/${repo.name}/`;
    const release = repo.release;
    const asset = pickInstaller(release);
    let primary;
    if (!isApp) {
      primary = `<a href="${pageUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">${t.visit}</a>`;
    } else if (asset) {
      primary = `<a href="${escapeHTML(asset.url)}" class="btn btn-primary" download title="${escapeHTML(t.downloadTitle(asset.name))}">${t.download}</a>`;
    } else {
      primary = `<span class="btn btn-disabled" aria-disabled="true">${t.noRelease}</span>`;
    }
    const updatedDate = new Date(repo.updated_at).toLocaleDateString(t.dateLocale);

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div>
        <div class="card-title"><img class="card-icon" alt="" width="24" height="24"><span>${highlight(repo.name, terms)}</span></div>
        <div class="card-desc">${repo.description ? highlight(repo.description, terms) : escapeHTML(t.noDesc)}</div>
      </div>
      <div>
        <div class="card-meta">
          ${repo.language ? `<span class="pill">${escapeHTML(repo.language)}</span>` : ""}
          ${release && release.tag ? `<a class="pill pill-link" href="${escapeHTML(release.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(release.tag)}</a>` : ""}
          <span>${t.updated(updatedDate)}</span>
          ${repo.stargazers_count > 0 ? `<span>★ ${repo.stargazers_count}</span>` : ""}
        </div>
        <div class="card-links">
          ${primary}
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">${t.source}</a>
        </div>
      </div>
    `;
    const icon = card.querySelector(".card-icon");
    if (isApp) loadAppIcon(icon, repo);
    else loadFavicon(icon, pageUrl);
    container.appendChild(card);
  });
}

// 卡片图标：用各站点根目录的 favicon.svg，没有就用主页自己的图标
const DEFAULT_FAVICON = "favicon.svg";
function loadFavicon(img, pageUrl) {
  img.onerror = () => {
    img.onerror = () => img.remove();
    img.src = DEFAULT_FAVICON;
  };
  img.src = pageUrl + "favicon.svg";
}

// ---------- 应用图标 ----------
// 从仓库里找应用图标：先找 PNG/WebP 启动图标，再把 Android 自适应图标（XML 矢量）转成 SVG，
// 最后退回仓库里的 favicon.svg 或主页自己的图标。结果按仓库缓存，切换语言/分类时不重复请求。
const ANDROID_RES_DIRS = ["app/src/main/res", "android/app/src/main/res"];
const appIconCache = new Map();

function rawUrl(repo, path) {
  return `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/${path}`;
}

async function fetchRaw(repo, path, asText) {
  try {
    const res = await fetch(rawUrl(repo, path));
    if (!res.ok) return null;
    return asText ? await res.text() : await res.blob();
  } catch (e) {
    return null;
  }
}

function loadAppIcon(img, repo) {
  if (!appIconCache.has(repo.full_name)) appIconCache.set(repo.full_name, resolveAppIcon(repo));
  img.onerror = () => img.remove();
  appIconCache.get(repo.full_name).then((src) => {
    img.src = src;
  });
}

async function resolveAppIcon(repo) {
  // 1. 位图启动图标
  const bitmaps = [];
  for (const res of ANDROID_RES_DIRS) {
    for (const name of ["ic_launcher", "ic_launcher_round"]) {
      for (const ext of ["png", "webp"]) bitmaps.push(`${res}/mipmap-xxxhdpi/${name}.${ext}`);
    }
  }
  bitmaps.push("icons/icon-512.png", "icon.png", "logo.png");
  for (const path of bitmaps) {
    const blob = await fetchRaw(repo, path);
    if (blob && blob.size > 0) return URL.createObjectURL(blob);
  }
  // 2. Android 自适应图标（XML）
  for (const res of ANDROID_RES_DIRS) {
    for (const dir of ["mipmap-anydpi-v26", "mipmap-anydpi"]) {
      const xml = await fetchRaw(repo, `${res}/${dir}/ic_launcher.xml`, true);
      if (!xml) continue;
      const svg = await adaptiveIconToSVG(repo, res, xml).catch(() => null);
      if (svg) return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    }
  }
  // 3. 仓库根目录的 favicon.svg，再不行用主页图标
  const fav = await fetchRaw(repo, "favicon.svg");
  if (fav && fav.size > 0) return URL.createObjectURL(fav);
  return DEFAULT_FAVICON;
}

const ANDROID_NS = "http://schemas.android.com/apk/res/android";
const aAttr = (el, name) => el.getAttributeNS(ANDROID_NS, name) ?? el.getAttribute("android:" + name);

function parseXML(text) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  return doc.querySelector("parsererror") ? null : doc.documentElement;
}

// #RGB / #ARGB / #RRGGBB / #AARRGGBB → { color, opacity }
function androidColor(value) {
  if (!value || value[0] !== "#") return null;
  let hex = value.slice(1);
  if (hex.length === 3 || hex.length === 4) hex = hex.split("").map((c) => c + c).join("");
  let alpha = 1;
  if (hex.length === 8) {
    alpha = parseInt(hex.slice(0, 2), 16) / 255;
    hex = hex.slice(2);
  }
  if (hex.length !== 6) return null;
  return { color: "#" + hex, opacity: alpha };
}

// 把 @color/xxx 解析成颜色值（在 values/*.xml 里找）
async function makeColorResolver(repo, res) {
  let colors = null;
  return async (value) => {
    if (!value || !value.startsWith("@color/")) return androidColor(value);
    if (!colors) {
      colors = {};
      for (const file of ["ic_launcher_background.xml", "colors.xml"]) {
        const text = await fetchRaw(repo, `${res}/values/${file}`, true);
        const root = text && parseXML(text);
        if (!root) continue;
        root.querySelectorAll("color").forEach((c) => {
          colors[c.getAttribute("name")] = c.textContent.trim();
        });
      }
    }
    const v = colors[value.slice(7)];
    return v ? androidColor(v.startsWith("@color/") ? colors[v.slice(7)] : v) : null;
  };
}

async function fetchDrawableXML(repo, res, name) {
  for (const dir of ["drawable", "drawable-v24", "drawable-anydpi", "drawable-anydpi-v26", "mipmap-anydpi-v26"]) {
    const text = await fetchRaw(repo, `${res}/${dir}/${name}.xml`, true);
    const root = text && parseXML(text);
    if (root) return root;
  }
  return null;
}

const svgNum = (v, d) => (v == null || v === "" ? d : parseFloat(v));

// Android <vector> → SVG 片段（嵌套 <svg>，铺满 x,y,size 的方块）
async function vectorToSVG(vector, resolveColor, x, y, size) {
  const vw = svgNum(aAttr(vector, "viewportWidth"), 24);
  const vh = svgNum(aAttr(vector, "viewportHeight"), 24);

  async function paint(colorAttr, alphaAttr) {
    const c = await resolveColor(colorAttr);
    if (!c) return null;
    return { color: c.color, opacity: c.opacity * svgNum(alphaAttr, 1) };
  }

  async function children(el) {
    let out = "";
    const nodes = Array.from(el.children);
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const tag = node.localName;
      if (tag === "path") {
        const d = aAttr(node, "pathData");
        if (!d) continue;
        const fill = await paint(aAttr(node, "fillColor"), aAttr(node, "fillAlpha"));
        const stroke = await paint(aAttr(node, "strokeColor"), aAttr(node, "strokeAlpha"));
        let attrs = `d="${escapeHTML(d)}"`;
        attrs += fill ? ` fill="${fill.color}" fill-opacity="${fill.opacity}"` : ` fill="none"`;
        if (aAttr(node, "fillType") === "evenOdd") attrs += ` fill-rule="evenodd"`;
        if (stroke) {
          attrs += ` stroke="${stroke.color}" stroke-opacity="${stroke.opacity}" stroke-width="${svgNum(aAttr(node, "strokeWidth"), 0)}"`;
          const cap = aAttr(node, "strokeLineCap");
          const join = aAttr(node, "strokeLineJoin");
          if (cap) attrs += ` stroke-linecap="${cap}"`;
          if (join) attrs += ` stroke-linejoin="${join}"`;
        }
        out += `<path ${attrs}/>`;
      } else if (tag === "group") {
        const px = svgNum(aAttr(node, "pivotX"), 0);
        const py = svgNum(aAttr(node, "pivotY"), 0);
        const tx = svgNum(aAttr(node, "translateX"), 0);
        const ty = svgNum(aAttr(node, "translateY"), 0);
        const sx = svgNum(aAttr(node, "scaleX"), 1);
        const sy = svgNum(aAttr(node, "scaleY"), 1);
        const r = svgNum(aAttr(node, "rotation"), 0);
        const transform = `translate(${px + tx} ${py + ty}) rotate(${r}) scale(${sx} ${sy}) translate(${-px} ${-py})`;
        out += `<g transform="${transform}">${await children(node)}</g>`;
      } else if (tag === "clip-path") {
        // clip-path 作用于同一组里它后面的兄弟节点
        const id = "c" + Math.random().toString(36).slice(2);
        const rest = document.createElement("g");
        nodes.slice(i + 1).forEach((n) => rest.appendChild(n.cloneNode(true)));
        out += `<clipPath id="${id}"><path d="${escapeHTML(aAttr(node, "pathData") || "")}"/></clipPath>`;
        out += `<g clip-path="url(#${id})">${await children(rest)}</g>`;
        break;
      }
    }
    return out;
  }

  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 ${vw} ${vh}" preserveAspectRatio="none">${await children(vector)}</svg>`;
}

// 自适应图标：背景 + 前景各 108dp，可见区域是中间的 72dp
async function adaptiveIconToSVG(repo, res, xml) {
  const root = parseXML(xml);
  if (!root || root.localName !== "adaptive-icon") return null;
  const resolveColor = await makeColorResolver(repo, res);

  async function layer(tag) {
    const el = root.querySelector(tag);
    if (!el) return "";
    let ref = aAttr(el, "drawable");
    let inline = null;
    if (!ref) inline = el.querySelector("vector, inset");
    if (ref) {
      const color = await resolveColor(ref);
      if (color) return `<rect width="108" height="108" fill="${color.color}" fill-opacity="${color.opacity}"/>`;
      const m = ref.match(/^@(drawable|mipmap)\/(.+)$/);
      if (!m) return "";
      inline = await fetchDrawableXML(repo, res, m[2]);
      if (!inline) return "";
    }
    if (inline && inline.localName === "inset") {
      // <inset android:inset="16%"> 包着 drawable：按比例缩小居中
      const insetAttr = aAttr(inline, "inset") || "0";
      const ratio = insetAttr.endsWith("%") ? parseFloat(insetAttr) / 100 : 0;
      const innerRef = aAttr(inline, "drawable");
      const m = innerRef && innerRef.match(/^@(drawable|mipmap)\/(.+)$/);
      const inner = m ? await fetchDrawableXML(repo, res, m[2]) : inline.querySelector("vector");
      if (!inner || inner.localName !== "vector") return "";
      const pad = 108 * ratio;
      return vectorToSVG(inner, resolveColor, pad, pad, 108 - 2 * pad);
    }
    if (inline && inline.localName === "vector") return vectorToSVG(inline, resolveColor, 0, 0, 108);
    return "";
  }

  const bg = await layer("background");
  const fg = await layer("foreground");
  if (!bg && !fg) return null;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="18 18 72 72" width="72" height="72">${bg}${fg}</svg>`;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

render();
fetchRepos();
