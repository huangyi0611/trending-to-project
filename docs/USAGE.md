# 使用说明 · GitHub 热榜拆解（trending-to-project）

> 源码公开（source-available），仅限非商业使用：个人学习、个人知识库、改进你自己的非商业项目。详见 [许可与使用范围](../README.md#许可与使用范围) 和 [NOTICE.md](../NOTICE.md)。

按你想做的事，挑一节看就行。

- [1. 只想看现成页面](#1-只想看现成页面)
- [手机上怎么看](#手机上怎么看)
- [2. 对照我的项目](#2-对照我的项目)
- [3. 自己生成一期](#3-自己生成一期)
- [4. 做新的一期](#4-做新的一期)
- [5. 私人构建：让自己那份页面带上专属内容](#5-私人构建让自己那份页面带上专属内容)
- [6. 发布前自查](#6-发布前自查)

---

## 1. 只想看现成页面

电脑上：

1. 打开 `examples/`，双击 `issue-03.html`。
2. 顶部「工具地图」：做产品的 8 个步骤，黑色是本期项目，点了跳到对应卡片；浅灰是往期项目，点了去 GitHub。
3. 每张卡从上往下：项目信息 → 它能做什么 → 最突出的点 → 缺点与应对 → 技术含金量 → 技术关联 → 上榜原因 → 复制给 AI 就能用。
4. 看不懂的词：点蓝色词，或用鼠标选中，会弹出释义。
5. 想动手：在卡片末尾看难度星和耗时，挑一个今天能装上的，点「② 通用版」旁边的「复制」，粘贴给你的 AI。

手机上请看下一节。也可以直接打开已经发布的网页：<https://huangyi0611.github.io/trending-to-project/>。

## 手机上怎么看

手机从分享菜单里打不开本地 HTML 文件，菜单里通常没有 Safari 或 Chrome。用下面几种办法。

**直接打开作者发布的网页（最快）**

- 首页：<https://huangyi0611.github.io/trending-to-project/>
- 第三期：<https://huangyi0611.github.io/trending-to-project/examples/issue-03.html>
- 第四期：<https://huangyi0611.github.io/trending-to-project/examples/issue-04.html>
- 第五期：<https://huangyi0611.github.io/trending-to-project/examples/issue-05.html>

用 Safari 点开即可，词条弹窗和复制按钮都能用。这个链接可以发到小红书或其他地方。

**给自己做一个同样能在手机上打开的网址**

你可以把本仓库复制到自己的 GitHub 账号，再用 GitHub Pages（GitHub 提供的免费网页托管）生成一个网址：

1. 打开仓库页面，点右上角 Fork，把仓库复制到你的账号下。仓库需要是公开的（免费账号才能用 GitHub Pages）。
2. 打开你账号下的这个仓库，进入 Settings（设置）→ Pages。
3. 在 Build and deployment（构建和部署）里，Source（来源）选 Deploy from a branch（从分支部署）；Branch（分支）选 `main`，文件夹选 `/ (root)`，点 Save（保存）。
4. 等一两分钟。Settings → Pages 页顶会出现网址：`https://<你的GitHub账号>.github.io/<仓库名>/`。某一期在：`https://<你的GitHub账号>.github.io/<仓库名>/examples/issue-03.html`（把 `03` 换成期号）。

作者这边已经按上面的方式打开了，所以你不用再设置，也能直接看上面的链接。

**这样放上网安不安全？**

公开版页面打开时不发任何网络请求，也不在手机或电脑上存数据。你把它发布到 GitHub Pages，不会泄露读者的项目信息。读者如果在页面上填写了「连接你的项目」，那些字只留在读者自己的浏览器内存里，刷新就消失，作者和 GitHub 都看不到。

有一类文件不能上网：用私人构建生成的、已经写进你自己项目内容的页面。这类文件默认在 `private/out/` 或 `output/`（都已被忽略，不会被提交）。不要把它们复制到 `examples/` 或仓库根目录，也不要发布到 GitHub Pages。私人版请在自己电脑上打开，或发到手机「文件」App 里预览，或在 AI 应用自带的浏览器里打开。

**其他办法**

- 把 HTML 存到 iPhone「文件」App 再点开：能看到排版，词条弹窗和复制按钮可能不能用。
- 在带内置浏览器的 AI 应用里打开这个文件或链接，交互功能通常可用。
- 在电脑上用 Chrome 或 Safari 打开，功能是完整的。

## 2. 对照我的项目

「适合场景」「② 对照你的项目」「① 给你的项目用」三块，要你提供项目信息后才会生成。

### 做法 A：在页面上（不用装任何东西）

1. 打开 HTML，在目录下方找到「连接你的项目」。
2. 填写：
   - 项目名称
   - 一两句话介绍（必填）
   - 用了哪些技术（不知道可以空着）
   - 最近想解决的问题（可选）
3. 点「生成提示词」。
4. 两个位置会出现提示词：
   - 「连接你的项目」下方的「整期一次生成」：一次分析本期全部项目；
   - 每张卡末尾的「① 给你的项目用」：只分析这一个项目。
5. 点「复制」，粘贴给你自己的 AI 工具。
6. 用完点「清空」，或者直接关掉页面。

注意：别填密钥、密码、内部网址和用户数据。写到「别人看了能懂你在做什么」就够。

### 做法 B：在自己电脑上（每期都用会更省事）

1. 准备项目文件：

   ```bash
   cp my-project.example.yaml my-project.yaml
   ```

   用任意文本编辑器打开 `my-project.yaml`，把示例换成你的项目。格式：

   ```yaml
   name: 项目名称
   summary: |
     一两句话说清项目做什么、给谁用。
   stack:
     - 用到的技术（可选）
   goals: |
     最近想解决的问题（可选）
   ```

2. 确认它不会被提交：

   ```bash
   git check-ignore -v my-project.yaml
   ```

   能看到 `.gitignore` 里的对应规则，就说明它被忽略了。

3. 二选一：
   - **交给 AI 工具运行 skill**：在仓库目录打开 Claude Code、Codex 或 Cursor，说「按 `skills/project-fit/SKILL.md`，用我的 `my-project.yaml` 分析第 03 期，结果存到 `output/issue-03.local.md`」。
   - **只拼提示词**：

     ```bash
     python3 tools/make_prompt.py --issue 03                                  # 打印到屏幕
     python3 tools/make_prompt.py --issue 03 --out output/issue-03-prompt.local.md
     ```

     再把内容复制给任意 AI。

4. 结果放在 `output/` 或带 `.local.` 的文件里，都不会被提交。

## 3. 自己生成一期

1. 装 Python 3.9 或更新版本。
2. 安装依赖：

   ```bash
   pip install -r requirements.txt
   ```

3. 生成：

   ```bash
   python3 build.py --issue 03
   ```

   看到「已生成 examples/issue-03.html（公开构建……）」就好了。公开构建还会同时更新仓库根目录的 `index.html`（GitHub Pages 的首页）。

## 4. 做新的一期

1. 复制上一期的数据：

   ```bash
   cp -r data/public/issue-03 data/public/issue-04
   ```

2. 改 `data/public/issue-04/parts/`：
   - `00_header.html`：标题、日期、怎么选的、工具地图建议、目录。保留 `<!--SLOT:connect-->` 这一行，「连接你的项目」会出现在这里。
   - `01.html` … `07.html`：每张卡一个文件，`01` 是本期最推荐。保留三个占位标记：
     - `<!--SLOT:scenes-->`：「适合场景」占位卡片的位置；
     - `<!--SLOT:mine-->`：「② 对照你的项目」占位的位置；
     - `<!--KIT-->`：「复制给 AI 就能用」整块的位置。
   - `99_footer.html`：数据来源和读取日期。
3. 改 `issue.json`：标题、`date`、首页用的 `summary`（一两句本期摘要）、`lead`（最推荐的项目名）、`projects`（各卡简称，按目录顺序）、每张卡的 `stars`（难度 1–5）、`time`、`prereq`（需要先装什么，可以带 `<code>`）、`note`、`generic`（通用版提示词）、`scene_tags`（方向标签）。
4. 改 `toolmap.js`：在 `TOOLMAP_ISSUES` 里把上一期的 `current: true` 去掉，追加本期一组。
5. 新出现的英文词，往 `data/public/glossary.json` 的 `entries` 里加，四栏：`what`（是什么）、`like`（相当于）、`why`（为什么需要）、`src`（出处 · 谁在用）。别名放 `aliases`。
6. 运行 `python3 build.py --issue 04`。如果提示「这些 `<code>` 还没有释义词条」，按提示补词条。脚本会同时根据 `data/public/issue-*/issue.json` 重新生成仓库根目录的 `index.html`，首页会自动出现新一期，不要手改 `index.html`。也可以单独运行 `python3 build.py --index` 只更新首页。

写作约定：大白话、短句；英文术语第一次出现时跟一句中文说明；GitHub 项目的释义开头写「GitHub 开源项目，主要用于……」（这里说的是被收录的项目本身，以它们自己的许可证为准）；数字要写读取日期；引用别人 README 只摘短句，并写明出处。

## 5. 私人构建：让自己那份页面带上专属内容

适合每期都要对照同一个项目的人。私人内容放在 `private/`（只有 `private/README.md` 会被提交），或者放在仓库外任何地方。

```bash
python3 build.py --issue 03 --private private/ --out private/out/issue-03.html
# 或者私人数据放在仓库外：
python3 build.py --issue 03 --private ~/my-trending-private --out ~/my-trending-private/out/issue-03.html
```

私人数据的格式见 [private/README.md](../private/README.md)。脚本会拒绝把私人构建的结果写进会被提交的位置。私人构建不会改 `index.html`。不要把私人构建的文件复制到 `examples/` 或仓库根目录，也不要发布到 GitHub Pages。

## 6. 发布前自查

在仓库目录运行：

```bash
# 1) 页面有没有网络请求、浏览器存储、外部脚本（应该没有输出）
grep -nE "fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|document\.cookie|indexedDB|<script[^>]+src=|<link[^>]+href=\"http|@import" examples/*.html template/*

# 2) 有没有长得像密钥的字符串（应该没有输出）
grep -rnE "sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|github_pat_|AKIA[0-9A-Z]{16}|xox[baprs]-|-----BEGIN [A-Z ]*PRIVATE KEY" .

# 3) 你自己的项目名、邮箱、电脑路径有没有混进来（把引号里换成你自己的词，应该没有输出）
grep -rniE "你的项目名|你的邮箱|/Users/你的用户名" --exclude-dir=.git .

# 4) 私人文件是不是都被忽略了
git status --ignored
```

最后用浏览器打开 `examples/` 里的页面和根目录的 `index.html`，F12 → Network（网络）面板 → 刷新，请求数应该是 0（只有页面文件自己）。确认即将提交的文件里没有私人构建的 HTML。
