# private/：你自己的私人数据（不会被提交）

这个文件夹里除了本说明，其他东西都被 `.gitignore` 忽略，不会进 Git，也不会被推到 GitHub。

## 用途

公开版页面里，「适合场景」「② 对照你的项目」「① 给你的项目用」三块是占位卡片。如果你想让自己看的那份页面直接带上这三块（比如每期都对照你自己的项目），可以把写好的内容放在这里，用私人构建拼进去：

```bash
python3 build.py --issue 03 --private private/ --out private/out/issue-03.html
```

私人构建的输出只允许放在仓库外、`private/` 里，或文件名带 `.local.`，脚本会检查。

## 文件格式

```
private/
├── glossary.json          # 可选：你自己的额外释义词条
└── issue-03/
    └── private.json       # 这一期的私人内容
```

`private.json` 示例（字段都可选）：

```json
{
  "title": "页面标题（可选）",
  "hide_connect_panel": true,
  "kit_labels": { "mine_title": "① 给我的项目用", "mine_sub": "我的项目名", "generic_sub": "谁都能用" },
  "cards": {
    "p01": {
      "scenes_html": "\n      <details open>…你写好的「适合场景」…</details>",
      "mine_html": "\n          <p><strong>② 对照我的项目：</strong></p>…",
      "mine_prompt": "给我的项目用的提示词正文"
    }
  },
  "overrides": [
    { "file": "01.html", "find": "公开版里的一段原文", "replace": "换成你自己的写法" }
  ]
}
```

`glossary.json` 示例：

```json
{ "entries": { "某个词": { "what": "是什么", "like": "相当于", "why": "为什么需要", "src": "出处" } },
  "aliases": {}, "nowrap": [], "stop": [] }
```

这些内容可以用 `skills/project-fit/SKILL.md` 让你自己的 AI 工具生成，再粘进来。

## 提醒

- 别在这里放密钥、密码、内部网址。私人数据虽然不进 Git，也可能被你复制、备份到别处。
- 想确认没被 Git 跟踪：`git status --ignored private/`，或 `git check-ignore -v private/issue-03/private.json`。
- 不要把私人构建的 HTML 发布到 GitHub Pages，也不要复制到 `examples/` 或仓库根目录再提交。手机上看私人版，请在电脑或 AI 应用的内置浏览器里打开，或用「文件」App 预览。
