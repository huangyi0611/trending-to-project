/* Required Notice: Copyright (c) 2026 假笑黄黄AI版（小红书）
   Code: PolyForm Noncommercial 1.0.0. Notice and license URLs are in index.html.
   No network, no storage, no outbound links. */
(function () {
  var DATA = window.XHS_DATA;
  if (!DATA || !DATA.issues || !DATA.issues.length) return;

  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  var state = { issueId: '04', cardId: '', q: '', scroll: false };
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
  }

  function selectIssue(id) {
    if (id === state.issueId) return;
    state.issueId = id;
    state.cardId = featuredId(currentIssue());
    state.q = '';
    qInput.value = '';
    state.scroll = false;
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
    if (ev.target && ev.target.closest && ev.target.closest('input, button, #term-pop')) return;
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
