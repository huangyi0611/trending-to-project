# 扫描报告 · 小红书小工具阅读页

扫描对象：`xhs-widget/index.html`、`app.css`、`app.js`、`data.js`，以及上传包 `xhs_widget_upload.zip`（仅这四个文件）。

扫描时间：2026-11-18。材料是用户附的两页扫描 PDF（无文字层，已按页渲染后阅读）。

## 从 PDF 读到的规则

第 1 页是「小工具上线」内测说明：PC 创作者服务中心 → Builder Hub → 小工具，上传产物、填配置、审核后在笔记里挂载。这一页是后台操作，不是本阅读页的界面规范。本页没有模仿该后台或小红书 App 的界面。

第 2 页是「小工具容器能力清单」，读到的要点：

- 纯本地 HTML/CSS/JS，不联网；字体、图片、脚本都要在包内。
- 脚本必须外置，用 `<script src="./app.js">` 引入；禁止内联脚本和 `onclick` 这类行内事件，事件用 `addEventListener`。
- 样式可以用 `<style>` 或外置 CSS。本包使用外置 `app.css`。
- 允许的文件类型写的是：一个 `.html`、`.css`、`.js`、图片、`.woff`/`.woff2`、`.json`。
- 禁止：`eval` / `new Function`、WebAssembly、iframe/object、外部字体和外部图片、网络请求（含 fetch、XHR、WebSocket、SSE）、表单提交、下载、`target=_blank` 和外跳、小工具之间互跳。
- 剪贴板、定位、Worker、Service Worker、`window.open` / `window.prompt` 在「不可用能力」表里。
- 清单写明本期不支持任何网络请求，外部 CDN 加载不到。

清单里有「详见下文」「见 §3.2 / §4」以及 FAQ 指向的段落。用户提供的 PDF 到 FAQ 末尾即结束，**没有给出被截断的详细规范链接或更后的条款**。因此下面「待平台验证」不能靠猜测补全。

## 本包已经做到的

| 清单项 | 结果 |
| --- | --- |
| 唯一 HTML 入口 | `index.html` |
| 脚本外置、无内联脚本、无行内事件 | `data.js` 然后 `app.js`，均 `defer` |
| 无 `eval` / `new Function` / WASM / iframe / form | 包内扫描未发现 |
| 无 fetch、XHR、WebSocket、本地存储、cookie、剪贴板、`window.open` | 包内扫描未发现；运行时请求记录为 0 条外站 |
| 无 `<a href>`、无 `target`、无 `download` | 仓库名是普通文字；工具地图往期不可点出站 |
| 无外部字体、图片、CDN | 只用系统字体和字符图案 |
| `file://` 直接打开 | 已测，不依赖 fetch |

`data.js` 里没有 `https://`。许可文本的完整网址只写在 `index.html` 开头的 HTML 注释里，页脚用许可名称说明，不做成链接。若平台扫描器把注释中的网址字符串也算违规，需要按平台全文再改；本次 PDF 没有这条。

## 待平台验证（PDF 没有写死，不能保证）

- 详细规范原文、大小上限、审核字段（名称、简介、图标、类目）不在这两页里。
- 清单允许 `localStorage` / IndexedDB，本页故意不用，避免留下筛选词。
- 清单允许 `<style>` 内联；本页改为外置 CSS，同样在允许范围内。
- 「长按菜单已禁用」是容器行为，页面没有再实现一套手势拦截。
- 未在小红书真机容器里打开过这个 ZIP。手机附件预览曾经失败的上限，PDF 没写，这里也不把本次文件体积（解压约 319KB，首屏只渲染一张卡片）说成平台上限。
- **没有提交审核，没有合规认证。**

## 隐私扫描

数据来源只有 `data/public` 和公开的 `examples/issue-03.html`、`examples/issue-04.html`。

包内未发现：`DoDoNow`、`WINlist`、`书解`、`播客解析`、`my-project.yaml`、`project-fit`、`/Users/`、`/home/`，以及 `sk-`、`ghp_`、`github_pat_`、`AKIA`、`xox*`、私钥块、`nvapi-` 加长密钥这类形状。

公开词库里解释「API key」「密钥」等词的句子仍在，因为第 03/04 期正文里这些词会被点开。没有放入真实密钥，也没有「连接你的项目」和两段提示词。

作者邮箱 `yihuangolivia@gmail.com` 来自仓库已公开的 `LICENSE-CONTENT.md` / `NOTICE.md`，以纯文字写在页脚。

## 浏览器测试（2026-11-18）

Chrome 无头，视口 390×844 与 1280×900。`http://127.0.0.1:8765/xhs-widget/index.html` 与 `file:///workspace/xhs-widget/index.html` 都跑了 `xhs-widget/dev/check.mjs`。

- 默认打开第四期重点推荐 Plannotator；切到第三期后标题为 auto-ontology，再切回第四期。
- 点开第 3 张卡片为 open-code-review；点蓝色词弹出「GitHub」，含「是什么 / 相当于 / 为什么需要 / 出处 · 谁在用」，关闭后弹层隐藏。
- 筛选 `Vincentwei1021` 只剩 video-shotcraft，清除后回到 7 张。
- 「技术含金量」用原生 `<details>` 打开，状态为展开。
- 390 与 1280 下 `documentElement.scrollWidth === clientWidth`，没有元素超出视口。
- 资源请求没有外站、没有 CDN。控制台除浏览器自行请求的 favicon 404（页面未提供图标）外无报错。

## 内容核对

- 第三期 7 张：auto-ontology、astryx、OpenMausBot、worktrunk、agent-browser、skills、pr-agent。采样 2026-11-11。
- 第四期 7 张：Plannotator、modern-web-guidance-src、open-code-review、LoopForge、SkillEvaluator、stitch-skills、video-shotcraft。采样 2026-11-16。
- 重点推荐与公开页一致：第三期 auto-ontology，第四期 Plannotator。
- Star 示例：Plannotator 11,915，本周新增 +1,719，与 `examples/issue-04.html` 一致，页上标明是采样不是实时数。
