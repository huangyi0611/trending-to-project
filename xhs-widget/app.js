/* Required Notice: Copyright (c) 2026 假笑黄黄AI版（小红书）
   Code: PolyForm Noncommercial 1.0.0. Notice and license URLs are in index.html.
   No network, no storage, no outbound links. */
(function () {
  var DATA = window.XHS_DATA;
  if (!DATA || !DATA.issues || !DATA.issues.length) return;

  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  var state = { issueId: '04', cardId: '', q: '', scroll: false, fitRan: false, fitSwitched: false };
  var pop = document.getElementById('term-pop');
  var popTerm = document.getElementById('pop-term');
  var popBody = document.getElementById('pop-body');
  var popBack = document.getElementById('pop-back');
  var qInput = document.getElementById('q');
  var clearBtn = document.getElementById('filter-clear');
  var keysByLength = Object.keys(DATA.glossary.entries).sort(function (a, b) {
    return b.length - a.length;
  });

  function issueById(id) {
    for (var i = 0; i < DATA.issues.length; i++) {
      if (DATA.issues[i].id === id) return DATA.issues[i];
    }
    return DATA.issues[DATA.issues.length - 1];
  }

  function currentIssue() {
    return issueById(state.issueId);
  }

  function featuredId(iss) {
    for (var i = 0; i < iss.cards.length; i++) {
      if (iss.cards[i].featured) return iss.cards[i].id;
    }
    return iss.cards[0].id;
  }

  function cardById(iss, id) {
    for (var i = 0; i < iss.cards.length; i++) {
      if (iss.cards[i].id === id) return iss.cards[i];
    }
    return null;
  }

  function readHash() {
    var m = /^#(\d\d)(?:-(p\d\d))?$/.exec(location.hash || '');
    if (!m) {
      state.issueId = DATA.issues[DATA.issues.length - 1].id;
      state.cardId = featuredId(currentIssue());
      return;
    }
    if (!issueById(m[1]) || !DATA.issues.some(function (it) { return it.id === m[1]; })) return;
    state.issueId = m[1];
    var iss = currentIssue();
    state.cardId = (m[2] && cardById(iss, m[2])) ? m[2] : featuredId(iss);
  }

  function writeHash() {
    var next = '#' + state.issueId + '-' + state.cardId;
    if (location.hash !== next) history.replaceState(null, '', next);
  }

  function norm(s) {
    return String(s || '').trim().replace(/\s+/g, ' ');
  }

  function isAsciiKey(k) {
    return /[A-Za-z0-9]/.test(k);
  }

  function hasWord(hay, k) {
    var i = hay.toLowerCase().indexOf(k.toLowerCase());
    if (i < 0) return false;
    if (!isAsciiKey(k)) return true;
    var b = hay.charAt(i - 1) || ' ';
    var a = hay.charAt(i + k.length) || ' ';
    return !/[A-Za-z0-9_]/.test(b) && !/[A-Za-z0-9_]/.test(a);
  }

  function lookup(raw) {
    var q = norm(raw);
    if (!q || q.length > 64) return null;
    var entries = DATA.glossary.entries;
    var aliases = DATA.glossary.aliases;
    if (entries[q]) return { key: q, data: entries[q] };
    if (aliases[q] && entries[aliases[q]]) return { key: aliases[q], data: entries[aliases[q]] };
    var lower = q.toLowerCase();
    var name;
    for (name in entries) {
      if (Object.prototype.hasOwnProperty.call(entries, name) && name.toLowerCase() === lower) {
        return { key: name, data: entries[name] };
      }
    }
    for (name in aliases) {
      if (Object.prototype.hasOwnProperty.call(aliases, name) && name.toLowerCase() === lower && entries[aliases[name]]) {
        return { key: aliases[name], data: entries[aliases[name]] };
      }
    }
    var stop = DATA.glossary.stop || [];
    for (var s = 0; s < stop.length; s++) {
      if (String(stop[s]).toLowerCase() === lower) return null;
    }
    for (var i = 0; i < keysByLength.length; i++) {
      var k = keysByLength[i];
      if (k.length >= 2 && hasWord(q, k)) return { key: k, data: entries[k] };
    }
    return null;
  }

  function hidePop() {
    pop.hidden = true;
    popBack.hidden = true;
    pop.classList.remove('open');
  }

  function placePop(x, y) {
    pop.hidden = false;
    popBack.hidden = false;
    pop.classList.add('open');
    if (window.innerWidth < 720) {
      pop.style.left = '';
      pop.style.top = '';
      return;
    }
    pop.style.left = '0px';
    pop.style.top = '0px';
    var rect = pop.getBoundingClientRect();
    var pad = 12;
    var left = x + 8;
    var top = y + 12;
    if (left + rect.width > window.innerWidth - pad) left = Math.max(pad, window.innerWidth - rect.width - pad);
    if (top + rect.height > window.innerHeight - pad) top = Math.max(pad, y - rect.height - 12);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  }

  function addBlk(title, text) {
    if (!text) return;
    var box = document.createElement('div');
    box.className = 'blk';
    var h = document.createElement('h4');
    h.textContent = title;
    var p = document.createElement('p');
    p.textContent = text;
    box.appendChild(h);
    box.appendChild(p);
    popBody.appendChild(box);
  }

  function showTerm(raw, x, y, allowMiss) {
    var hit = lookup(raw);
    clearNode(popBody);
    if (!hit) {
      if (!allowMiss) return;
      popTerm.textContent = norm(raw).slice(0, 40) || '（空）';
      var miss = document.createElement('p');
      miss.className = 'miss';
      miss.textContent = '词库里还没有这条。释义是预置的，本页不会联网查询。';
      popBody.appendChild(miss);
    } else {
      popTerm.textContent = hit.key;
      addBlk('是什么', hit.data.what);
      addBlk('相当于', hit.data.like);
      addBlk('为什么需要', hit.data.why);
      addBlk('出处 · 谁在用', hit.data.src);
    }
    placePop(x, y);
  }

  function starValue(card) {
    var metrics = card.metrics || [];
    for (var i = 0; i < metrics.length; i++) {
      if (/STAR/.test(metrics[i].labelHtml || '')) return metrics[i].value;
    }
    return '';
  }

  function matches(card, q) {
    if (!q) return true;
    var hay = (card.name + ' ' + card.repoText + ' ' + card.blurb + ' ' + (card.pills || []).join(' ') + ' ' + (card.tags || []).join(' ') + ' ' + (card.search || '')).toLowerCase();
    return hay.indexOf(q.toLowerCase()) !== -1;
  }

  function shortSnap(iss) {
    var m = /抓取时间\s*([0-9-]+)\s*（([^）]+)）/.exec(iss.captureText || '');
    if (m) return '星数采样于 ' + m[1] + '（' + m[2] + '），不是实时星数。';
    return '星数采样于 ' + iss.date + '，不是实时星数。';
  }

  function renderSwitch() {
    var box = document.getElementById('issue-switch');
    clearNode(box);
    DATA.issues.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', it.id === state.issueId ? 'true' : 'false');
      b.dataset.issue = it.id;
      var strong = document.createElement('strong');
      strong.textContent = it.label;
      var small = document.createElement('small');
      small.textContent = it.date + ' 采样';
      b.appendChild(strong);
      b.appendChild(small);
      box.appendChild(b);
    });
  }

  function renderChrome() {
    var iss = currentIssue();
    var snap = document.getElementById('snapshot');
    clearNode(snap);
    var mark = document.createElement('strong');
    mark.textContent = '离线快照';
    snap.appendChild(mark);
    snap.appendChild(document.createTextNode(' · ' + shortSnap(iss)));
    var lead = document.getElementById('lead');
    lead.textContent = iss.summary;
    var meta = document.getElementById('meta');
    meta.innerHTML = iss.metaHtml || '';
    document.getElementById('map-sub').textContent = '做产品的 8 步。黑色可以打开本期卡片；浅灰只标出往期项目名，不离开本页。';
    renderMap(iss);
    var advice = document.getElementById('advice');
    advice.innerHTML = iss.adviceHtml || '';
  }

  function renderMap(iss) {
    var flow = document.getElementById('flow');
    clearNode(flow);
    iss.stages.forEach(function (st, idx) {
      var col = document.createElement('div');
      col.className = 'stage';
      var hd = document.createElement('div');
      hd.className = 'stage-hd';
      var no = document.createElement('span');
      no.className = 'stage-no';
      no.textContent = String(idx + 1);
      var name = document.createElement('span');
      name.className = 'stage-name';
      name.textContent = st.name;
      hd.appendChild(no);
      hd.appendChild(name);
      var chips = document.createElement('div');
      chips.className = 'chips';
      iss.currentMap.forEach(function (it) {
        if (it.stage !== st.key) return;
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip cur' + (it.rec ? ' rec' : '');
        b.dataset.card = it.id;
        var nm = document.createElement('span');
        nm.className = 'c-name';
        nm.textContent = it.name + ' ';
        var star = document.createElement('span');
        star.className = 'c-star';
        star.textContent = new Array(it.stars + 1).join('★');
        nm.appendChild(star);
        var what = document.createElement('span');
        what.className = 'c-what';
        what.textContent = it.what;
        b.appendChild(nm);
        b.appendChild(what);
        chips.appendChild(b);
      });
      iss.pastMap.forEach(function (it) {
        if (it.stage !== st.key) return;
        var s = document.createElement('span');
        s.className = 'chip past';
        var tag = document.createElement('span');
        tag.className = 'c-iss';
        tag.textContent = '第' + it.issue + '期';
        s.appendChild(tag);
        s.appendChild(document.createTextNode(it.label));
        chips.appendChild(s);
      });
      if (!chips.childNodes.length) {
        var empty = document.createElement('span');
        empty.className = 'chip past';
        empty.textContent = '这一步本期没有项目';
        chips.appendChild(empty);
      }
      col.appendChild(hd);
      col.appendChild(chips);
      flow.appendChild(col);
    });
  }

  function renderList() {
    var iss = currentIssue();
    var list = document.getElementById('list');
    var count = document.getElementById('search-count');
    clearNode(list);
    var shown = 0;
    iss.cards.forEach(function (card) {
      if (!matches(card, state.q)) return;
      shown += 1;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'card-btn' + (card.id === state.cardId ? ' is-on' : '') + (card.featured ? ' is-rec' : '');
      b.dataset.card = card.id;
      b.setAttribute('aria-pressed', card.id === state.cardId ? 'true' : 'false');
      var rank = document.createElement('span');
      rank.className = 'card-rank';
      rank.textContent = card.rank;
      var main = document.createElement('span');
      main.className = 'card-main';
      var nm = document.createElement('span');
      nm.className = 'card-name';
      nm.textContent = card.name;
      var blurb = document.createElement('span');
      blurb.className = 'card-blurb';
      blurb.textContent = card.blurb || '';
      var repo = document.createElement('span');
      repo.className = 'card-repo';
      repo.textContent = card.repoText;
      main.appendChild(nm);
      main.appendChild(blurb);
      main.appendChild(repo);
      var side = document.createElement('span');
      side.className = 'card-side';
      if (card.featured) {
        var rec = document.createElement('span');
        rec.className = 'rec-tag';
        rec.textContent = '最推荐';
        side.appendChild(rec);
      }
      var diff = document.createElement('span');
      diff.className = 'diff-stars';
      diff.textContent = '难度 ' + new Array(card.kit.stars + 1).join('★');
      diff.setAttribute('aria-label', '上手难度 ' + card.kit.stars + ' 星，满分 5');
      var snap = document.createElement('span');
      snap.className = 'snap-stars';
      var stars = starValue(card);
      snap.textContent = stars ? '★ ' + stars : '';
      side.appendChild(diff);
      if (stars) side.appendChild(snap);
      b.appendChild(rank);
      b.appendChild(main);
      b.appendChild(side);
      list.appendChild(b);
    });
    if (!shown) {
      var empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = '这一期里没有匹配的卡片。清除筛选后可以看全部 7 项。';
      list.appendChild(empty);
    }
    document.getElementById('list-title').textContent = iss.label + ' · 7 项';
    count.textContent = state.q ? ('筛出 ' + shown + ' / 7') : '点一张卡片阅读。难度星是估计，旁边的数字是采样时的 Star。';
    clearBtn.hidden = !state.q;
  }

  function section(title, html, root) {
    var det = document.createElement('details');
    var sum = document.createElement('summary');
    sum.textContent = title;
    var inner = document.createElement('div');
    inner.className = 'inner';
    inner.innerHTML = html;
    det.appendChild(sum);
    det.appendChild(inner);
    root.appendChild(det);
  }

  function renderDetail() {
    var iss = currentIssue();
    var card = cardById(iss, state.cardId) || iss.cards[0];
    state.cardId = card.id;
    var root = document.getElementById('detail');
    root.className = 'detail' + (card.featured ? ' is-featured' : '');
    clearNode(root);
    if (card.featured) {
      var banner = document.createElement('div');
      banner.className = 'rec-banner';
      banner.textContent = '★ 本期最推荐';
      root.appendChild(banner);
    }
    var id = document.createElement('section');
    id.className = 'identity';
    if (card.pills && card.pills.length) {
      var tags = document.createElement('div');
      tags.className = 'tags';
      card.pills.forEach(function (pill) {
        var s = document.createElement('span');
        s.className = 'pill';
        s.textContent = pill;
        tags.appendChild(s);
      });
      id.appendChild(tags);
    }
    var row = document.createElement('div');
    row.className = 'identity-row';
    var avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = card.avatar || '•';
    var copy = document.createElement('div');
    copy.className = 'id-copy';
    var h = document.createElement('h2');
    h.className = 'pname';
    h.textContent = card.name;
    var desc = document.createElement('div');
    desc.className = 'pdesc';
    desc.innerHTML = card.descHtml;
    var repo = document.createElement('p');
    repo.className = 'repo-line';
    repo.textContent = card.repoText;
    copy.appendChild(h);
    copy.appendChild(desc);
    copy.appendChild(repo);
    if (card.licenseHtml) {
      var lic = document.createElement('div');
      lic.className = 'license';
      lic.innerHTML = card.licenseHtml;
      copy.appendChild(lic);
    }
    row.appendChild(avatar);
    row.appendChild(copy);
    id.appendChild(row);
    root.appendChild(id);

    var metrics = document.createElement('div');
    metrics.className = 'metrics';
    (card.metrics || []).forEach(function (m) {
      var box = document.createElement('div');
      box.className = 'metric';
      var label = document.createElement('div');
      label.className = 'label';
      label.innerHTML = m.labelHtml;
      var value = document.createElement('div');
      value.className = 'value' + (m.small ? ' sm' : '');
      value.textContent = m.value;
      box.appendChild(label);
      box.appendChild(value);
      if (m.hint) {
        var hint = document.createElement('div');
        hint.className = 'hint';
        hint.textContent = m.hint;
        box.appendChild(hint);
      }
      metrics.appendChild(box);
    });
    root.appendChild(metrics);
    var note = document.createElement('p');
    note.className = 'snap-note';
    note.textContent = '上表 Star、新增和 Forks 来自 ' + iss.date + ' 的采样，之后会变。';
    root.appendChild(note);

    if (card.tags && card.tags.length) {
      var rowTags = document.createElement('div');
      rowTags.className = 'tag-row';
      card.tags.forEach(function (tag) {
        var s = document.createElement('span');
        s.className = 'scene-tag';
        s.textContent = tag;
        rowTags.appendChild(s);
      });
      root.appendChild(rowTags);
    }

    if (card.canHtml) {
      var can = document.createElement('section');
      can.className = 'panel';
      var h3 = document.createElement('h3');
      h3.textContent = '它能做什么';
      can.appendChild(h3);
      var list = document.createElement('div');
      list.innerHTML = card.canHtml;
      can.appendChild(list);
      root.appendChild(can);
    }
    if (card.highlightHtml) {
      var hi = document.createElement('section');
      hi.className = 'panel dark';
      var hh = document.createElement('h3');
      hh.textContent = '最突出的点';
      var ht = document.createElement('div');
      ht.className = 'hl-title';
      ht.textContent = card.highlightTitle;
      var hp = document.createElement('div');
      hp.innerHTML = card.highlightHtml;
      hi.appendChild(hh);
      hi.appendChild(ht);
      hi.appendChild(hp);
      root.appendChild(hi);
    }
    if (card.audienceHtml) {
      var who = document.createElement('section');
      who.className = 'panel';
      var wh = document.createElement('h3');
      wh.textContent = '适合谁用';
      var wp = document.createElement('div');
      wp.innerHTML = card.audienceHtml;
      who.appendChild(wh);
      who.appendChild(wp);
      root.appendChild(who);
    }
    if (card.consHtml) {
      var cons = document.createElement('section');
      cons.className = 'cons-panel';
      var ch = document.createElement('h3');
      ch.textContent = '缺点与应对';
      var co = document.createElement('div');
      co.innerHTML = card.consHtml;
      cons.appendChild(ch);
      cons.appendChild(co);
      root.appendChild(cons);
    }
    if (card.sections && card.sections.length) {
      var ext = document.createElement('div');
      ext.className = 'extend';
      card.sections.forEach(function (sec) {
        section(sec.title, sec.html, ext);
      });
      root.appendChild(ext);
    }
    if (card.kit) {
      var kit = document.createElement('section');
      kit.className = 'ai-kit';
      var kh = document.createElement('h3');
      kh.textContent = '上手参考';
      var grid = document.createElement('div');
      grid.className = 'kit-grid';
      var d1 = document.createElement('div');
      d1.className = 'kit-box';
      var k1 = document.createElement('div');
      k1.className = 'k';
      k1.textContent = '上手难度（估计）';
      var v1 = document.createElement('div');
      v1.className = 'stars-lg';
      v1.textContent = new Array(card.kit.stars + 1).join('★');
      var off = document.createElement('span');
      off.className = 'off';
      off.textContent = new Array(6 - card.kit.stars).join('★');
      v1.appendChild(off);
      d1.appendChild(k1);
      d1.appendChild(v1);
      var d2 = document.createElement('div');
      d2.className = 'kit-box';
      var k2 = document.createElement('div');
      k2.className = 'k';
      k2.textContent = '大概耗时（估计）';
      var v2 = document.createElement('div');
      v2.className = 'v';
      v2.textContent = card.kit.time;
      d2.appendChild(k2);
      d2.appendChild(v2);
      grid.appendChild(d1);
      grid.appendChild(d2);
      kit.appendChild(kh);
      kit.appendChild(grid);
      if (card.kit.prereqHtml) {
        var pre = document.createElement('div');
        pre.className = 'prereq';
        var pk = document.createElement('div');
        pk.className = 'k';
        pk.textContent = '需要先装什么';
        var pb = document.createElement('div');
        pb.innerHTML = card.kit.prereqHtml;
        pre.appendChild(pk);
        pre.appendChild(pb);
        kit.appendChild(pre);
      }
      if (card.kit.noteHtml) {
        var kn = document.createElement('div');
        kn.className = 'kit-note';
        kn.innerHTML = card.kit.noteHtml;
        kit.appendChild(kn);
      }
      root.appendChild(kit);
    }
    if (state.scroll) {
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
      state.scroll = false;
    }
  }

  function renderFoot() {
    var iss = currentIssue();
    var foot = document.getElementById('foot');
    clearNode(foot);
    var h = document.createElement('h2');
    h.textContent = '来源、许可与边界';
    foot.appendChild(h);
    var bits = [
      iss.captureText,
      iss.kitNote,
      '作者：假笑黄黄AI版。此页是作者把已公开内容做成的离线阅读工具，不是小红书官方界面，也没有通过平台审核认证。',
      '代码按 PolyForm Noncommercial 1.0.0，仅限非商业使用。卡片、释义等文字按 CC BY-NC-SA 4.0：署名、非商业、相同方式共享。正式文本网址写在本页底部，不做成可点击链接。',
      '公开仓库已写明的联系邮箱：yihuangolivia@gmail.com。与 GitHub 以及各个收录项目没有隶属、合作或背书。各项目以其自己仓库的许可证为准。',
      '本页只放入第03期和第04期的公开正文。没有项目输入、没有提示词生成、没有第一期和第二期的正文。工具地图上的往期名字来自这两期公开地图，点不开外站。',
      '筛选词只留在这一页的内存里，不写入存储，也不发送。页面不加载外部字体、图片或脚本。'
    ];
    bits.forEach(function (text) {
      var p = document.createElement('p');
      p.textContent = text;
      foot.appendChild(p);
    });
  }

  var foldsReady = false;
  function render() {
    renderSwitch();
    renderChrome();
    renderList();
    renderDetail();
    renderFoot();
    writeHash();
    if (!foldsReady) {
      foldsReady = true;
      var map = document.getElementById('map-fold');
      if (map && window.innerWidth >= 720) map.open = true;
    }
    var startup = document.getElementById('startup-status');
    if (startup) startup.hidden = true;
    renderFit();
  }

  var FIT_SIGNALS = [
    { words: ['计划', '批注', '动手前', '理解错', '方向跑偏'], accept: ['批改计划', '计划'] },
    { words: ['审查', '挑错', '代码审查', 'review'], accept: ['挑错', '审一遍'] },
    { words: ['合并', 'pr', 'pull request'], accept: ['合并', 'PR', '挑错', '审一遍'] },
    { words: ['术语', '口径', '查数', '表格', '数据库', '指标', '业务词典'], accept: ['术语', '查数'] },
    { words: ['界面', '设计稿', '好看', '配色', 'ui', '组件'], accept: ['界面零件', '设计稿', '界面'] },
    { words: ['网页', '网站', 'html', 'css'], accept: ['网页'] },
    { words: ['验收', '截图', '走查', '点网页'], accept: ['截图', '点网页'] },
    { words: ['并行', '同时改', '打架', 'worktree'], accept: ['并行', '不打架'] },
    { words: ['分头', '多个助手', '多bot', '几个助手', 'bot'], accept: ['分头', 'bot'] },
    { words: ['说不清', '追问', '需求'], accept: ['追问', '需求'] },
    { words: ['打分', '评估skill', 'skill好不好'], accept: ['打分'] },
    { words: ['流程', '审批', 'sop', '交付'], accept: ['固定流程', '批准'] },
    { words: ['宣传片', '短视频', '视频', '剪辑', '分镜'], accept: ['宣传片', '镜头'] }
  ];
  var FIT_STACK = [
    { word: 'react', accept: 'React' },
    { word: 'docker', accept: 'Docker' },
    { word: 'python', accept: 'Python' },
    { word: 'node', accept: 'Node' }
  ];
  var FIT_PLACE = {
    idea: '建议接在「想法」：先看它怎么分工，不必先装整套。',
    spec: '建议接在「写需求」：动手改文件之前。',
    code: '建议接在「写代码」：有人同时改同一份项目的时候。',
    memory: '建议接在「记忆和上下文」：让 AI 写网页或记资料之前。',
    data: '建议接在「数据和知识」：让 AI 查数或回答业务问题之前。',
    ui: '建议接在「界面」：先出零件或设计稿，再写页面。',
    qa: '建议接在「测试、审查和安全」：合并或上线之前。',
    ship: '建议接在「发布和内容」：要对外展示的时候。'
  };

  function plainHtml(html) {
    var box = document.createElement('div');
    box.innerHTML = html || '';
    return norm(box.textContent || '');
  }

  function clip(text, n) {
    var s = norm(text);
    if (s.length <= n) return s;
    return s.slice(0, n) + '…';
  }

  function fitInputs() {
    function val(id) {
      var el = document.getElementById(id);
      return el ? norm(el.value) : '';
    }
    var stack = val('fit-stack');
    if (/^(不懂|不知道|不会|没有|无|空|不了解)$/.test(stack)) stack = '';
    return {
      purpose: val('fit-purpose'),
      stack: stack,
      pain: val('fit-pain'),
      goal: val('fit-goal')
    };
  }

  function fitBlob(input) {
    var parts = [input.purpose, input.stack, input.pain, input.goal];
    var out = [];
    for (var i = 0; i < parts.length; i++) if (parts[i]) out.push(parts[i]);
    return out.join(' ');
  }

  function hasText(hay, needle) {
    return hay.toLowerCase().indexOf(String(needle).toLowerCase()) >= 0;
  }

  function stageOf(iss, card) {
    var map = iss.currentMap || [];
    for (var i = 0; i < map.length; i++) {
      if (map[i].id === card.id) return map[i];
    }
    return null;
  }

  function matchFit(iss, input) {
    var blob = fitBlob(input);
    if (blob.length < 2) return { kind: 'empty', items: [] };
    var items = [];
    var cards = iss.cards || [];
    for (var c = 0; c < cards.length; c++) {
      var card = cards[c];
      var stage = stageOf(iss, card);
      var brief = card.name + ' ' + (card.blurb || '') + ' ' + (stage && stage.what ? stage.what : '');
      var prereq = plainHtml(card.kit && card.kit.prereqHtml);
      var hits = [];
      var score = 0;
      for (var s = 0; s < FIT_SIGNALS.length; s++) {
        var sig = FIT_SIGNALS[s];
        var said = '';
        for (var w = 0; w < sig.words.length; w++) {
          if (hasText(blob, sig.words[w])) { said = sig.words[w]; break; }
        }
        if (!said) continue;
        var found = '';
        for (var a = 0; a < sig.accept.length; a++) {
          if (hasText(brief, sig.accept[a])) { found = sig.accept[a]; break; }
        }
        if (!found) continue;
        score += 3;
        hits.push({ said: said, found: found, via: '公开一句话' });
      }
      if (input.stack) {
        for (var k = 0; k < FIT_STACK.length; k++) {
          if (hasText(input.stack, FIT_STACK[k].word) && hasText(prereq, FIT_STACK[k].accept)) {
            score += 3;
            hits.push({ said: input.stack, found: FIT_STACK[k].accept, via: '需要先装什么' });
            break;
          }
        }
      }
      if (score >= 3 && hits.length) items.push({ card: card, stage: stage, score: score, hits: hits, prereq: prereq });
    }
    items.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      if (a.card.featured !== b.card.featured) return a.card.featured ? -1 : 1;
      return a.card.id < b.card.id ? -1 : 1;
    });
    if (!items.length) return { kind: 'weak', items: [] };
    return { kind: 'ok', items: items.slice(0, 3) };
  }

  function addP(parent, text) {
    var p = document.createElement('p');
    p.textContent = text;
    parent.appendChild(p);
    return p;
  }

  function renderFit() {
    var out = document.getElementById('fit-out');
    if (!out) return;
    clearNode(out);
    if (!state.fitRan) {
      addP(out, '填写后点「看相关项目」。换期不会把这些字发出去，也不会偷偷清掉。').className = 'fit-status';
      return;
    }
    var iss = currentIssue();
    var input = fitInputs();
    var matched = matchFit(iss, input);
    var head = document.createElement('p');
    head.className = 'fit-status';
    var switched = state.fitSwitched ? '你刚换了期，填写还在，没有发送。' : '';
    head.textContent = '当前对照' + iss.label + '的公开卡片。这是规则匹配，不是 AI 读代码，也不是实时热榜。' + switched;
    out.appendChild(head);
    var echo = document.createElement('p');
    echo.className = 'fit-status';
    echo.textContent = '你填写的用途：' + clip(input.purpose, 80);
    out.appendChild(echo);
    if (matched.kind === 'empty') {
      addP(out, '信息不够，所以先不推荐。至少用一句话写清项目用途、难点或想做的功能。');
      return;
    }
    if (matched.kind === 'weak') {
      addP(out, '和这一期的公开一句话都对不上，匹配不足，不强推本期最推荐。可以换一种说法，例如「合并前审查」「做网页界面」或「让 AI 查数」。');
      return;
    }
    for (var i = 0; i < matched.items.length; i++) {
      var item = matched.items[i];
      var card = item.card;
      var box = document.createElement('article');
      box.className = 'fit-hit';
      var h = document.createElement('h3');
      h.textContent = card.name;
      box.appendChild(h);
      var why = [];
      for (var n = 0; n < item.hits.length; n++) {
        why.push('你写了「' + item.hits[n].said + '」，对上这张卡' + item.hits[n].via + '里的「' + item.hits[n].found + '」');
      }
      addP(box, why.join('。') + '。公开一句话：' + (card.blurb || '（这张卡没有单独的一句话）') + '。');
      var place = item.stage && FIT_PLACE[item.stage.stage] ? FIT_PLACE[item.stage.stage] : '先只读这张卡，确认它是不是你现在这一步。';
      addP(box, place);
      addP(box, '最小尝试：先看公开的「需要先装什么」：' + (clip(item.prereq, 90) || '这张卡没有单独列出前置条件') + '。难度是估计的 ' + ((card.kit && card.kit.stars) || '?') + ' 星，不是实测。');
      addP(box, '风险：' + (clip(plainHtml(card.consHtml), 100) || '展开这张卡看「缺点与应对」。'));
      var open = document.createElement('button');
      open.type = 'button';
      open.className = 'fit-open';
      open.setAttribute('data-card', card.id);
      open.textContent = '打开这张卡';
      box.appendChild(open);
      out.appendChild(box);
    }
  }

  function runFit() {
    state.fitRan = true;
    state.fitSwitched = false;
    renderFit();
  }

  function clearFit() {
    var ids = ['fit-purpose', 'fit-stack', 'fit-pain', 'fit-goal'];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el) el.value = '';
    }
    state.fitRan = false;
    state.fitSwitched = false;
    renderFit();
  }

  function selectIssue(id) {
    if (id === state.issueId) return;
    state.issueId = id;
    state.cardId = featuredId(currentIssue());
    state.q = '';
    qInput.value = '';
    state.scroll = false;
    if (state.fitRan) state.fitSwitched = true;
    hidePop();
    render();
  }

  function selectCard(id, scroll) {
    var iss = currentIssue();
    if (!cardById(iss, id)) return;
    state.cardId = id;
    state.scroll = !!scroll;
    hidePop();
    renderList();
    renderDetail();
    writeHash();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('#pop-close, #pop-back')) return;
    var issueBtn = e.target.closest('#issue-switch [data-issue]');
    if (issueBtn) {
      selectIssue(issueBtn.dataset.issue);
      return;
    }
    var jump = e.target.closest('[data-open]');
    if (jump && jump.dataset.open) {
      selectCard(jump.dataset.open, true);
      return;
    }
    var cardBtn = e.target.closest('[data-card]');
    if (cardBtn && cardBtn.dataset.card) {
      selectCard(cardBtn.dataset.card, true);
      return;
    }
    var term = e.target.closest('span.term');
    if (term) {
      e.preventDefault();
      showTerm(term.getAttribute('data-term') || term.textContent, e.clientX, e.clientY, true);
      return;
    }
    if (!pop.hidden && !pop.contains(e.target)) hidePop();
  });

  document.getElementById('pop-close').addEventListener('click', hidePop);
  popBack.addEventListener('click', hidePop);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hidePop();
  });

  document.getElementById('fit-run').addEventListener('click', runFit);
  document.getElementById('fit-clear').addEventListener('click', clearFit);

  qInput.addEventListener('input', function () {
    state.q = qInput.value;
    renderList();
  });
  clearBtn.addEventListener('click', function () {
    state.q = '';
    qInput.value = '';
    renderList();
  });

  var selectTimer = null;
  document.addEventListener('mouseup', queueSelection);
  document.addEventListener('touchend', queueSelection);

  function queueSelection(ev) {
    if (ev.target && ev.target.closest && ev.target.closest('input, textarea, button, #term-pop')) return;
    clearTimeout(selectTimer);
    selectTimer = setTimeout(function () {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      var text = norm(sel.toString());
      if (!text || text.length < 2 || text.length > 48) return;
      var x = 16;
      var y = 80;
      try {
        var r = sel.getRangeAt(0).getBoundingClientRect();
        if (r && (r.width || r.height)) {
          x = r.left + r.width / 2;
          y = r.bottom;
        }
      } catch (err) {}
      showTerm(text, x, y, false);
    }, 280);
  }

  readHash();
  render();
})();
