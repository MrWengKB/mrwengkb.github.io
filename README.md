自动生成并随时更新我的GitHub网页列表。

## 分类

页面顶部的分类按钮依据仓库的 Topics（主题标签）：在仓库主页右侧 About 的齿轮里添加 `game` 或 `tool` 即可归入“游戏”或“工具”。新增分类时，在 `script.js` 的 `CATEGORIES` 里加一行，例如：

```js
{ topic: "demo", label: { zh: "演示", en: "Demos" } },
```
