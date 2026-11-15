---
name: project-fit
description: "Match trending GitHub repos to your own project, locally and privately. 读取用户本地的 my-project.yaml 和「GitHub 热榜拆解」某一期的公开卡片，在本地生成每个项目的「适合场景」「对照你的项目」和「给你的项目用」提示词。用户说「把这期热榜对照我的项目」「生成适合场景」时使用。"
---

# project-fit：把热榜项目对照到你自己的项目

> Match trending GitHub repos to your own project, locally and privately.
>
> 属于「GitHub 热榜拆解 · 个人项目适配与技术精进」（`trending-to-project`）。仅限非商业使用，见仓库根目录的 LICENSE 和 NOTICE.md。

热榜拆解的公开页面只放谁都适用的内容。「适合场景」「② 对照你的项目」「① 给你的项目用」这三块要结合你的项目才写得准，所以由这个 skill 在**你自己的电脑或你自己的 AI 工具里**生成。本仓库和作者都拿不到你的项目信息。

## 输入

1. `my-project.yaml`（仓库根目录，你自己填写；已被 `.gitignore` 忽略，不会被提交）。格式见 `my-project.example.yaml`：

   ```yaml
   name: 项目名称
   summary: |
     一两句话说清项目做什么、给谁用。
   stack:            # 可选，不知道可以空着
     - 用到的技术
   goals: |          # 可选
     最近想解决的问题
   ```

   如果文件不存在，先请用户复制 `my-project.example.yaml` 改名为 `my-project.yaml` 并填写，或者直接在对话里告诉你这几项。

2. 期号，例如 `03`。公开卡片在 `data/public/issue-03/parts/`（每张卡一个 HTML 片段），也可以直接读 `examples/issue-03.html`。

## 步骤

1. 读 `my-project.yaml`。只用里面这几项；如果发现里面有密钥、密码、内部网址或用户数据，提醒用户删掉，并且不要在输出里重复这些内容。
2. 读本期公开卡片：每张卡的项目名、GitHub 地址、一句话简介、「它能做什么」、常见方向标签。
3. 用 `prompt-template.md` 里两条分隔线之间的模板，把占位符换成上面两步的内容（也可以运行 `python3 tools/make_prompt.py --issue 03` 直接拼好）。
4. 按模板要求，逐个项目输出三块：适合场景、对照我的项目、给我的项目用的提示词。
5. 结果只写到本地，建议保存为 `output/issue-03.local.md`（`output/` 和 `*.local.*` 都被 `.gitignore` 忽略）。

## 规矩

- 不联网上传用户的项目信息，不调用任何第三方接口；只在当前对话和用户本地项目里使用。
- 信息不够就问用户，别猜。
- 生成的提示词必须带安全规矩：不把密钥、密码、验证码、用户数据写进代码、文档、提交记录或日志；只开新分支和 PR，合并和上线生产由人确认。
- 大白话，句子短，英文术语第一次出现时用括号给中文解释。
