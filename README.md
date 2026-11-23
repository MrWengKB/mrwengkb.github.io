自动生成并随时更新我的GitHub项目列表。

## 网页与应用

- 开启了 GitHub Pages 的仓库：按钮是“访问站点”，图标用站点根目录的 `favicon.svg`。
- 没开 Pages 的仓库（应用）：按钮是“下载安装”，直接下载最新 Release 里的安装包（优先 `.apk`，其次 `.exe`、`.dmg` 等）；还没有 Release 时显示“暂无安装包”。图标依次尝试仓库里的 `mipmap-xxxhdpi/ic_launcher.png`、`icons/icon-512.png`、Android 自适应图标 `mipmap-anydpi-v26/ic_launcher.xml`（在浏览器里转成 SVG）和 `favicon.svg`。

## 分类

页面顶部的分类按钮依据仓库的 Topics（主题标签）：在仓库主页右侧 About 的齿轮里添加 `game` 或 `tool` 即可归入“游戏”或“工具”。新增分类时，在 `script.js` 的 `CATEGORIES` 里加一行，例如：

```js
{ topic: "demo", label: { zh: "演示", en: "Demos" } },
```

## 搜索

分类按钮上方的搜索框可按仓库名称、描述、Topics、语言和分类名筛选，多个关键词用空格分隔（需全部命中），并会和当前分类叠加生效。按 `/` 可快速聚焦搜索框，`Esc` 清空。搜索词会写进网址（如 `?q=贪吃蛇#game`），可直接分享。

> 修改 `style.css` 或 `script.js` 后，把 `index.html` 里引用它们的 `?v=` 数字加 1，避免浏览器缓存的旧文件和新页面混用。
