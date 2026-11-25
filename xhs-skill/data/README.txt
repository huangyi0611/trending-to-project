GitHub 热榜拆解 · 公开快照数据说明

本目录是 Skill 回答问题时要读的静态数据，不需要安装依赖，也不要联网补数据。

issues.json
  name                 固定为 trending-to-project
  issuesAvailable      只有 "03" 和 "04"
  issues[].id          期号
  issues[].label       第三期 / 第四期
  issues[].summary     这一期的一句话主线
  issues[].sampling    采样日期、采样时刻和页脚原文。starsAreSnapshot 为 true
  issues[].howChosen   这一期怎么选的
  issues[].advice      给非程序员的阅读顺序，项目名是文字，不是链接
  issues[].stages      工具地图的 8 步：key 与中文 name
  issues[].map         本期项目落在哪一步。id 对应 cards[].id，stars 是上手难度不是 GitHub 星数
  issues[].pastNamesOnly
                       地图上的更早项目，只有名称和期号，本包没有它们的正文
  issues[].cards[]     一张项目卡
    featured           true 表示该期最推荐
    repo               仓库的文字名，不是可点击地址
    starSnapshot       采样时的 Star。空字符串表示这张卡没有单独的 Star 数字
    metrics            采样指标。label 里带 STAR 的 value 与 starSnapshot 相同
    canDo              它能做什么
    highlight          最突出的点
    audience           适合谁用
    drawbacks          problem 是缺点，response 是应对
    sections           技术含金量、技术关联、上榜原因与许可证风险
    difficulty.stars   上手难度，1 到 5，是估计
    searchText         供关键词检索的纯文本

glossary.json
  entries              词条。字段 what / like / why / src 对应「是什么 / 相当于 / 为什么需要 / 出处」
  aliases              别名到词条名。先查 entries，没有再查 aliases

数字和日期以这两个文件为准。不要把它们改成「当前」星数。
