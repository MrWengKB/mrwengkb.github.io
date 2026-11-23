// 生成 repos.json：仓库列表 + 每个没开 Pages 的仓库的最新 Release。
// 由 .github/workflows/update-repos.yml 运行；用 GITHUB_TOKEN 调 API（每小时 5000 次）。
// 字段格式与 script.js 里的 slimRepo / fetchLatestRelease 保持一致。
import { readFile, writeFile } from "node:fs/promises";

const USER = process.env.GITHUB_USERNAME || "MrWengKB";
const OUT = "repos.json";
const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

async function api(path) {
  const res = await fetch(`https://api.github.com/${path}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${path}: HTTP ${res.status}`);
  return res.json();
}

const all = [];
for (let page = 1; ; page++) {
  const batch = await api(`users/${USER}/repos?sort=updated&per_page=100&page=${page}`);
  all.push(...batch);
  if (batch.length < 100) break;
}

const repos = all
  .filter((r) => !r.private)
  .map((r) => ({
    name: r.name,
    full_name: r.full_name,
    description: r.description,
    topics: r.topics || [],
    language: r.language,
    updated_at: r.updated_at,
    stargazers_count: r.stargazers_count,
    html_url: r.html_url,
    has_pages: r.has_pages,
    default_branch: r.default_branch,
  }));

for (const repo of repos) {
  if (repo.has_pages) continue;
  const r = await api(`repos/${repo.full_name}/releases/latest`);
  repo.release = r
    ? {
        tag: r.tag_name,
        url: r.html_url,
        assets: (r.assets || []).map((a) => ({ name: a.name, url: a.browser_download_url })),
      }
    : null;
}

const json = JSON.stringify({ repos }, null, 2) + "\n";
const old = await readFile(OUT, "utf8").catch(() => "");
if (old === json) {
  console.log("repos.json unchanged");
} else {
  await writeFile(OUT, json);
  console.log(`repos.json updated: ${repos.length} repos`);
}
