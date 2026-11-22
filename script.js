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
    empty: "未发现开启了 Pages 的其他公开仓库。",
    count: (n) => `共找到 ${n} 个站点`,
    noDesc: "暂无描述信息",
    updated: (d) => `更新于: ${d}`,
    visit: "访问站点",
    source: "源码仓库",
    toggleLabel: "EN",
    toggleAria: "Switch to English",
    all: "全部",
    filterAria: "按分类筛选",
    emptyCategory: "这个分类下暂时没有站点。",
    searchPlaceholder: "搜索名称、描述、标签…",
    searchAria: "搜索项目",
    noMatch: (q) => `没有找到与“${q}”相关的站点。`,
    matchCount: (n) => `找到 ${n} 个匹配的站点`,
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
    empty: "No other public repositories with Pages enabled.",
    count: (n) => `${n} site${n === 1 ? "" : "s"} found`,
    noDesc: "No description",
    updated: (d) => `Updated ${d}`,
    visit: "Visit site",
    source: "Source code",
    toggleLabel: "中文",
    toggleAria: "切换到中文",
    all: "All",
    filterAria: "Filter by category",
    emptyCategory: "No sites in this category yet.",
    searchPlaceholder: "Search name, description, topics…",
    searchAria: "Search projects",
    noMatch: (q) => `No sites match “${q}”.`,
    matchCount: (n) => `${n} matching site${n === 1 ? "" : "s"}`,
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

async function fetchPagesRepos() {
  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`
    );

    if (!res.ok) {
      const err = new Error();
      err.httpStatus = res.status;
      throw err;
    }

    const repos = await res.json();

    // 筛选开启了 GitHub Pages 的公开仓库
    const pagesRepos = repos.filter((repo) => {
      if (!repo.has_pages) return false;
      if (
        EXCLUDE_HOME_REPO &&
        repo.name.toLowerCase() === `${GITHUB_USERNAME.toLowerCase()}.github.io`
      ) {
        return false;
      }
      if (EXCLUDE_REPOS.some((name) => name.toLowerCase() === repo.name.toLowerCase())) {
        return false;
      }
      return true;
    });

    state = { status: "done", repos: pagesRepos, error: null };
  } catch (err) {
    state = { status: "error", repos: [], error: err };
  }
  render();
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
    const pageUrl = `https://${GITHUB_USERNAME}.github.io/${repo.name}/`;
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
          <span>${t.updated(updatedDate)}</span>
          ${repo.stargazers_count > 0 ? `<span>★ ${repo.stargazers_count}</span>` : ""}
        </div>
        <div class="card-links">
          <a href="${pageUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">${t.visit}</a>
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">${t.source}</a>
        </div>
      </div>
    `;
    loadFavicon(card.querySelector(".card-icon"), pageUrl);
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

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

render();
fetchPagesRepos();
