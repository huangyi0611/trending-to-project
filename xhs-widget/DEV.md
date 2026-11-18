# 小红书小工具版 · 开发说明

这是「GitHub 热榜拆解」的离线阅读页，放在独立目录 `xhs-widget/`。它不改仓库根目录的 `index.html`、`template/`、`examples/` 和定期推送，也不部署 GitHub Pages，也不代替向小红书提交审核。

作者署名按公开仓库：假笑黄黄AI版。页面自己写明：这不是小红书官方界面。

## 本地怎么打开

同目录四个文件就是预览入口，也是上传候选包：

- `index.html`：唯一 HTML 入口，没有内联脚本、没有事件属性
- `app.css`
- `app.js`
- `data.js`：公开第 03、04 期的数据和词库，脚本直接带上，避免 `file://` 再去 `fetch` JSON

用浏览器打开 `index.html` 即可。已在本机用 `file://` 和本地 HTTP 各跑过一遍：往期切换、卡片、释义开关、筛选都可用，且没有外部请求。

不要把它和「单文件、脚本写在 HTML 里」的预览混在一起。那种写法会违反容器对内联脚本的限制，所以这里没有做。

## 上传候选包

只打包这四个允许的文件，ZIP 根目录就是它们，不含本说明、扫描报告或 `dev/`：

```bash
cd xhs-widget
zip -X xhs-widget-upload.zip index.html app.css app.js data.js
```

本次候选包副本：`/opt/cursor/artifacts/xhs_widget_upload.zip`。

## 数据从哪来，怎么重做

只读：

- `data/public/issue-03/`、`data/public/issue-04/`（`issue.json`、`toolmap.js`、页脚里的采样时间）
- `data/public/glossary.json`
- 已生成的公开页 `examples/issue-03.html`、`examples/issue-04.html`（用它保留蓝色词条的切分）

不读 `private/`、`skills/`、本机路径或任何密钥。生成时丢掉「连接你的项目」、两段提示词，以及 `my-project.yaml`、`skills/project-fit/SKILL.md` 这两类词条。仓库名保留成普通文字，不保留 `https://` 链接。

```bash
python3 xhs-widget/dev/build_reader.py
```

需要本机已有的 `beautifulsoup4` 和 `node`（只用来把 `toolmap.js` 解析成数据，阅读页本身不会执行这段）。

浏览器回归（可选，需本机 Chrome 和 puppeteer-core）：

```bash
npm install --prefix /tmp/ppt puppeteer-core
node xhs-widget/dev/check.mjs
```

脚本默认使用 `/usr/local/bin/google-chrome`，以及 `/tmp/ppt/node_modules/puppeteer-core`。

## 这版有什么，没有什么

有：第三期、第四期切换；重点推荐和其余卡片；工具地图（往期只显示名称）；关键词筛选；点蓝色词或选中短词看预置释义；采样时间；许可和作者说明。

没有：项目简介输入、提示词生成、复制按钮、第一期和第二期正文、实时星数、外链、联网、本地存储。

星数、Forks、新增都是公开页上的采样：第三期 2026-11-11（约上午 10:25），第四期 2026-11-16（约上午 10:35）。没有新编榜单。

## 许可

- 本目录里新写的代码（`app.js`、`app.css`、`index.html` 的结构、`dev/build_reader.py`）沿用仓库代码许可：PolyForm Noncommercial 1.0.0。`index.html` 开头注释里有 Required Notice 和许可文本网址。页面上不把网址做成链接。
- 嵌进去的卡片、释义等文字仍是 CC BY-NC-SA 4.0，没有改原许可。

## 不能当成审核通过

附件 PDF 是两页扫描图。容器能力清单读过了，但文中指向的详细规范链接在材料里没有给出全文。本包只是按读到的清单做成的离线候选，没有提交小红书，也不能保证审核通过。差异和未覆盖项见 `SCAN-REPORT.md`。
