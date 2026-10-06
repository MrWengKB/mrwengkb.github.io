// ==========================================
// 1. 将此处修改为您自己的 GitHub 用户名
// ==========================================
const GITHUB_USERNAME = "MrWengKB";

// 是否隐藏主页仓库本身 (username.github.io)
const EXCLUDE_HOME_REPO = true;

const container = document.getElementById("pages-container");
const countText = document.getElementById("repo-count");
const pageTitle = document.getElementById("page-title");

if (pageTitle) {
  pageTitle.textContent = `${GITHUB_USERNAME} 的 GitHub Pages`;
}

async function fetchPagesRepos() {
  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`
    );

    if (!res.ok) {
      throw new Error(`API 访问失败: HTTP ${res.status}`);
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
      return true;
    });

    renderList(pagesRepos);
  } catch (err) {
    container.innerHTML = `<div class="state-message" style="color: #f85149;">加载失败: ${err.message}</div>`;
    countText.textContent = "获取失败";
  }
}

function renderList(repos) {
  if (repos.length === 0) {
    container.innerHTML = `<div class="state-message">未发现开启了 Pages 的其他公开仓库。</div>`;
    countText.textContent = "共 0 个站点";
    return;
  }

  countText.textContent = `共找到 ${repos.length} 个站点`;
  container.innerHTML = "";

  repos.forEach((repo) => {
    const pageUrl = `https://${GITHUB_USERNAME}.github.io/${repo.name}/`;
    const updatedDate = new Date(repo.updated_at).toLocaleDateString("zh-CN");

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div>
        <div class="card-title">${escapeHTML(repo.name)}</div>
        <div class="card-desc">${escapeHTML(repo.description || "暂无描述信息")}</div>
      </div>
      <div>
        <div class="card-meta">
          ${repo.language ? `<span class="pill">${escapeHTML(repo.language)}</span>` : ""}
          <span>更新于: ${updatedDate}</span>
          ${repo.stargazers_count > 0 ? `<span>★ ${repo.stargazers_count}</span>` : ""}
        </div>
        <div class="card-links">
          <a href="${pageUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">访问站点</a>
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">源码仓库</a>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

fetchPagesRepos();
