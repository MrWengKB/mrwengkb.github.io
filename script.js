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

const container = document.getElementById("pages-container");
const countText = document.getElementById("repo-count");
const pageTitle = document.getElementById("page-title");
const langToggle = document.getElementById("lang-toggle");
const avatar = document.getElementById("avatar");
const categoryBar = document.getElementById("category-bar");

function applyStaticText() {
  document.documentElement.lang = t.htmlLang;
  document.title = t.docTitle;
  if (pageTitle) pageTitle.textContent = t.pageTitle(GITHUB_USERNAME);
  if (avatar) avatar.alt = t.avatarAlt(GITHUB_USERNAME);
  if (langToggle) {
    langToggle.textContent = t.toggleLabel;
    langToggle.setAttribute("aria-label", t.toggleAria);
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

function setCategory(category) {
  currentCategory = category;
  const hash = category === ALL ? "" : `#${category}`;
  history.replaceState(null, "", location.pathname + location.search + hash);
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
      const n = state.repos.filter((repo) => repoInCategory(repo, key)).length;
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

  const repos = allRepos.filter((repo) => repoInCategory(repo, currentCategory));
  if (repos.length === 0) {
    container.innerHTML = `<div class="state-message">${t.emptyCategory}</div>`;
    countText.textContent = t.count(0);
    return;
  }

  countText.textContent = t.count(repos.length);
  container.innerHTML = "";

  repos.forEach((repo) => {
    const pageUrl = `https://${GITHUB_USERNAME}.github.io/${repo.name}/`;
    const updatedDate = new Date(repo.updated_at).toLocaleDateString(t.dateLocale);

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div>
        <div class="card-title"><img class="card-icon" alt="" width="24" height="24"><span>${escapeHTML(repo.name)}</span></div>
        <div class="card-desc">${escapeHTML(repo.description || t.noDesc)}</div>
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
