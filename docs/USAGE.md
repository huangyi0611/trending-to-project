# 使用说明 · GitHub 热榜拆解（trending-to-project）

> 源码公开（source-available），仅限非商业使用：个人学习、个人知识库、改进你自己的非商业项目。详见 [许可与使用范围](../README.md#许可与使用范围) 和 [NOTICE.md](../NOTICE.md)。

按你想做的事，挑一节看就行。

- [1. 只想看现成页面](#1-只想看现成页面)
- [2. 对照我的项目](#2-对照我的项目)
- [3. 自己生成一期](#3-自己生成一期)
- [4. 做新的一期](#4-做新的一期)
- [5. 私人构建：让自己那份页面带上专属内容](#5-私人构建让自己那份页面带上专属内容)
- [6. 发布前自查](#6-发布前自查)

---

## 1. 只想看现成页面

1. 打开 `examples/`，双击 `issue-03.html`。
2. 顶部「工具地图」：做产品的 8 个步骤，黑色是本期项目，点了跳到对应卡片；浅灰是往期项目，点了去 GitHub。
3. 每张卡从上往下：项目信息 → 它能做什么 → 最突出的点 → 缺点与应对 → 技术含金量 → 技术关联 → 上榜原因 → 复制给 AI 就能用。
4. 看不懂的词：点蓝色词，或用鼠标选中，会弹出释义。手机上长按选中也可以。
5. 想动手：在卡片末尾看难度星和耗时，挑一个今天能装上的，点「② 通用版」旁边的「复制」，粘贴给你的 AI。

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

   看到「已生成 examples/issue-03.html（公开构建……）」就好了。

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
3. 改 `issue.json`：标题、每张卡的 `stars`（难度 1–5）、`time`、`prereq`（需要先装什么，可以带 `<code>`）、`note`、`generic`（通用版提示词）、`scene_tags`（方向标签）。
4. 改 `toolmap.js`：在 `TOOLMAP_ISSUES` 里把上一期的 `current: true` 去掉，追加本期一组。
5. 新出现的英文词，往 `data/public/glossary.json` 的 `entries` 里加，四栏：`what`（是什么）、`like`（相当于）、`why`（为什么需要）、`src`（出处 · 谁在用）。别名放 `aliases`。
6. 运行 `python3 build.py --issue 04`。如果提示「这些 `<code>` 还没有释义词条」，按提示补词条。

写作约定：大白话、短句；英文术语第一次出现时跟一句中文说明；GitHub 项目的释义开头写「GitHub 开源项目，主要用于……」（这里说的是被收录的项目本身，以它们自己的许可证为准）；数字要写读取日期；引用别人 README 只摘短句，并写明出处。

## 5. 私人构建：让自己那份页面带上专属内容

适合每期都要对照同一个项目的人。私人内容放在 `private/`（只有 `private/README.md` 会被提交），或者放在仓库外任何地方。

```bash
python3 build.py --issue 03 --private private/ --out private/out/issue-03.html
# 或者私人数据放在仓库外：
python3 build.py --issue 03 --private ~/my-trending-private --out ~/my-trending-private/out/issue-03.html
```

私人数据的格式见 [private/README.md](../private/README.md)。脚本会拒绝把私人构建的结果写进会被提交的位置。

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

最后用浏览器打开 `examples/` 里的页面，F12 → Network（网络）面板 → 刷新，请求数应该是 0。
