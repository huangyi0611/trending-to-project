# -*- coding: utf-8 -*-
"""GitHub 热榜拆解 · 个人项目适配与技术精进（trending-to-project）：把 data/ 里的数据拼成一个单文件 HTML。

公开构建（默认）：只读 data/public/，输出到 examples/issue-XX.html，并更新仓库根目录的 index.html。
    python3 build.py --issue 03

只更新首页（根据 data/public/issue-*/issue.json 生成 index.html）：
    python3 build.py --index

私人构建（可选）：额外读你自己电脑上的私人数据目录（默认 private/，已被 .gitignore 忽略）。
    python3 build.py --issue 03 --private private/ --out private/out/issue-03.html
    私人构建不会改 index.html，也不要把私人产物发到 GitHub Pages。

本脚本不联网、不读环境变量、不读任何密钥。
"""
import argparse, html, json, os, re, sys
from bs4 import BeautifulSoup, NavigableString

ROOT = os.path.dirname(os.path.abspath(__file__))


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def load_json(p, default=None):
    if not os.path.exists(p):
        return default
    with open(p, encoding='utf-8') as f:
        return json.load(f)


def cn_date(s):
    parts = (s or '').split('-')
    if len(parts) == 3 and all(parts):
        return '%s年%d月%d日' % (parts[0], int(parts[1]), int(parts[2]))
    return s or ''


def collect_issues():
    pub = os.path.join(ROOT, 'data', 'public')
    items = []
    for name in sorted(os.listdir(pub)):
        if not name.startswith('issue-'):
            continue
        path = os.path.join(pub, name, 'issue.json')
        if os.path.isfile(path):
            data = load_json(path)
            if data:
                items.append(data)
    items.sort(key=lambda x: int(str(x.get('issue', '0'))), reverse=True)
    return items


def issue_card_html(data, latest=False):
    num = str(data.get('issue', '')).zfill(2)
    n = int(num) if num.isdigit() else num
    href = 'examples/issue-%s.html' % num
    date = cn_date(data.get('date', ''))
    summary = data.get('summary') or ''
    lead = data.get('lead') or ''
    projects = data.get('projects') or []
    n_cards = len(data.get('cards') or {})
    tags = []
    if latest:
        tags.append('<span class="rec-tag">最新</span>')
    tags.append('<span class="date-tag">%s</span>' % html.escape(date))
    if n_cards:
        tags.append('<span class="date-tag">共 %d 项</span>' % n_cards)
    lead_html = ''
    if lead:
        lead_html = '<p class="lead">本期最推荐 <strong>%s</strong></p>' % html.escape(lead)
    proj_html = ''
    if projects:
        proj_html = '<p class="plist">%s</p>' % html.escape(' · '.join(projects))
    sum_html = '<p class="psum">%s</p>' % html.escape(summary) if summary else ''
    return (
        '    <a class="issue-card" href="%s">\n'
        '      <div class="icard-top"><h2>第 %s 期</h2><div class="icard-tags">%s</div></div>\n'
        '      %s\n'
        '      %s\n'
        '      %s\n'
        '      <span class="go">打开这一期</span>\n'
        '    </a>'
    ) % (html.escape(href, quote=True), n, ''.join(tags), lead_html, sum_html, proj_html)


def write_index():
    items = collect_issues()
    if not items:
        sys.exit('没有找到 data/public/issue-*/issue.json，无法生成首页')
    cards = '\n'.join(issue_card_html(it, latest=(i == 0)) for i, it in enumerate(items))
    tpl = read(os.path.join(ROOT, 'template', 'index.html'))
    out = tpl.replace('__ISSUE_CARDS__', cards)
    dest = os.path.join(ROOT, 'index.html')
    with open(dest, 'w', encoding='utf-8') as f:
        f.write(out)
    print('已生成 %s（%d 期）' % (os.path.relpath(dest, os.getcwd()), len(items)))


# ---------------------------------------------------------------- 参数
ap = argparse.ArgumentParser(description='构建一期「GitHub 热榜拆解」HTML，或更新首页 index.html')
ap.add_argument('--issue', default=None, help='期号，比如 03')
ap.add_argument('--index', action='store_true', help='根据 data/public/issue-*/issue.json 生成仓库根目录的 index.html')
ap.add_argument('--private', default=None, help='私人数据目录（可选）。不给就是公开构建')
ap.add_argument('--out', default=None, help='输出文件路径')
args = ap.parse_args()

if args.index and not args.issue:
    write_index()
    raise SystemExit(0)
if not args.issue:
    ap.error('请指定 --issue（比如 03），或使用 --index 只更新首页')

ISSUE = args.issue.zfill(2)
PUB = os.path.join(ROOT, 'data', 'public')
IDIR = os.path.join(PUB, 'issue-' + ISSUE)
PRIV = os.path.abspath(args.private) if args.private else None
PRIVATE = PRIV is not None
if PRIVATE and not os.path.isdir(PRIV):
    sys.exit('找不到私人数据目录：%s' % PRIV)

if args.out:
    OUT = os.path.abspath(args.out)
elif PRIVATE:
    OUT = os.path.join(ROOT, 'private', 'out', 'issue-%s.html' % ISSUE)
else:
    OUT = os.path.join(ROOT, 'examples', 'issue-%s.html' % ISSUE)
if PRIVATE:
    # 私人产物别写进会被提交的目录
    rel = os.path.relpath(OUT, ROOT)
    if not rel.startswith('..') and not (rel.startswith('private' + os.sep) or '.local.' in os.path.basename(OUT)):
        sys.exit('私人构建的输出要放在仓库外、private/ 里，或文件名带 .local.（这些都被 .gitignore 忽略）')

issue = load_json(os.path.join(IDIR, 'issue.json'))
gpub = load_json(os.path.join(PUB, 'glossary.json'))
ppriv = load_json(os.path.join(PRIV, 'issue-' + ISSUE, 'private.json'), {}) if PRIVATE else {}
gpriv = load_json(os.path.join(PRIV, 'glossary.json'), {}) if PRIVATE else {}

# ---------------------------------------------------------------- 词库
G = dict(gpub['entries'])
A = dict(gpub['aliases'])
NOWRAP = list(gpub.get('nowrap', []))
STOP = list(gpub.get('stop', []))
if PRIVATE and gpriv:
    G.update(gpriv.get('entries', {}))
    A.update(gpriv.get('aliases', {}))
    for k in gpriv.get('drop', []):
        G.pop(k, None)
    NOWRAP = gpriv.get('nowrap', []) + NOWRAP
    STOP = gpriv.get('stop', []) + STOP
    if gpriv.get('entry_order'):
        order = gpriv['entry_order'] + [k for k in G if k not in gpriv['entry_order']]
        G = {k: G[k] for k in order if k in G}
    if gpriv.get('alias_order'):
        order = gpriv['alias_order'] + [k for k in A if k not in gpriv['alias_order']]
        A = {k: A[k] for k in order if k in A}

KEYS = {k: k for k in G}
KEYS.update({a: k for a, k in A.items()})


def is_ascii_edge(c):
    return bool(re.match(r'[A-Za-z0-9_]', c))


def pat_for(k):
    e = re.escape(k)
    pre = r'(?<![A-Za-z0-9_@~./\-])' if is_ascii_edge(k[0]) else ''
    post = r'(?![A-Za-z0-9_@/])(?![.\-][A-Za-z0-9])' if is_ascii_edge(k[-1]) else ''
    flags = re.I if re.search(r'[A-Za-z]', k) else 0
    return re.compile(pre + e + post, flags)


ORDER = sorted(list(KEYS) + NOWRAP, key=len, reverse=True)
PATS = [(k, pat_for(k)) for k in ORDER]


def find_spans(text):
    spans = []
    taken = [False] * len(text)
    for k, p in PATS:
        for m in p.finditer(text):
            a, b = m.span()
            if any(taken[a:b]):
                continue
            for j in range(a, b):
                taken[j] = True
            spans.append((a, b, KEYS.get(k)))  # None = 不释义的常见词
    return sorted(spans)


def term_tag(soup, key, label):
    t = soup.new_tag('span')
    t['class'] = 'term'
    t['data-term'] = key
    t.string = label
    return t


SKIP = {'pre', 'a', 'script', 'style', 'code', 'h2', 'h3', 'summary', 'button', 'textarea', 'input', 'label'}
SKIP_CLS = {'rank', 'value', 'toc', 'stars', 'pt', 'avatar', 'hint-line', 'rec-banner', 'k', 'term', 'scene-tag',
            'prompt-terms', 'pill', 'no-term'}


def skipped(node):
    for p in node.parents:
        if p.name in SKIP:
            return True
        if set(p.get('class') or []) & SKIP_CLS:
            return True
    return False


def wrap_block(soup, block, seen):
    for t in list(block.find_all(string=True)):
        if not isinstance(t, NavigableString) or skipped(t):
            continue
        s = str(t)
        spans = [x for x in find_spans(s) if x[2] and x[2] not in seen]
        if not spans:
            continue
        out = []
        pos = 0
        used = set()
        for a, b, key in spans:
            if key in seen or key in used:
                continue
            out.append(s[pos:a])
            out.append(term_tag(soup, key, s[a:b]))
            pos = b
            used.add(key)
        out.append(s[pos:])
        seen.update(used)
        new = [NavigableString(x) if isinstance(x, str) else x for x in out if x != '']
        t.replace_with(*new)


def code_key(txt):
    if txt in KEYS:
        return KEYS[txt]
    for k in ('wt switch -c',):
        if txt.startswith(k) and k in KEYS:
            return KEYS[k]
    return None


# ---------------------------------------------------------------- 卡片末尾「复制给 AI」
LABELS = dict(issue.get('kit_labels', {}))
LABELS.update(ppriv.get('kit_labels', {}))


def prompt_block(kind, title, sub, text):
    return f'''
      <div class="prompt" data-kind="{kind}">
        <div class="prompt-hd"><div class="pt">{title}<small>{sub}</small></div><button type="button" class="copy-btn" data-copy>复制</button></div>
        <!--PTERMS-->
        <pre class="prompt-text">{html.escape(text.strip())}</pre>
        <button type="button" class="expand-btn" data-expand>展开全文</button>
      </div>'''


def connect_prompt_block(pid):
    """公开版：①号提示词位置先放一个占位，用户在页面上填了项目简介后才在内存里生成。"""
    return f'''
      <div class="prompt connect-prompt" data-kind="mine" data-connect-for="{pid}">
        <div class="prompt-hd"><div class="pt">{LABELS.get('mine_title', '① 给你的项目用')}<small>{LABELS.get('mine_sub_public', '连接你的项目后生成')}</small></div><button type="button" class="copy-btn" data-copy hidden>复制</button></div>
        <div class="connect-empty">这一段要结合你自己的项目才写得准，本页不替你猜。到页面上方「<a href="#connect">连接你的项目</a>」填几句项目简介，这里会出现一段专门给你的提示词。只在本页内存里拼，不联网、不保存，刷新就清空。</div>
        <pre class="prompt-text" hidden></pre>
        <button type="button" class="expand-btn" data-expand hidden>展开全文</button>
      </div>'''


def kit(pid, c, mine_prompt):
    s = '★' * c['stars'] + '<span class="off">' + '★' * (5 - c['stars']) + '</span>'
    if mine_prompt:
        first = prompt_block('mine', LABELS.get('mine_title', '① 给你的项目用'), LABELS.get('mine_sub', ''), mine_prompt)
    else:
        first = connect_prompt_block(pid)
    second = prompt_block('generic', LABELS.get('generic_title', '② 通用版'), LABELS.get('generic_sub', '谁都能用'), c['generic'])
    return f'''
    <section class="ai-kit" id="{pid}-kit">
      <h3>复制给 AI 就能用</h3>
      <p class="kit-sub">复制下面的提示词，粘贴到 Claude Code / Codex / Cursor / ChatGPT 等任意 AI 工具里。</p>
      <div class="diff">
        <div><div class="k">上手难度</div><div class="stars" aria-label="{c['stars']} 星（满分 5）">{s}</div></div>
        <div><div class="k">大概耗时</div><div class="v">{html.escape(c['time'])}</div></div>
        <div class="prereq-wrap"><div class="k prereq-k">需要先装什么</div><div class="prereq">{c['prereq']}</div></div>
        <div class="note">{html.escape(c['note'])} {html.escape(issue.get('kit_note_suffix', ''))}</div>
      </div>{first}{second}
    </section>
'''


def scenes_placeholder(pid, tags):
    tag_html = ''.join('<span class="scene-tag">%s</span>' % html.escape(t) for t in tags)
    return f'''
      <details open class="connect-slot">
        <summary>适合场景</summary>
        <div class="inner">
          <div class="tag-row">{tag_html}</div>
          <div class="connect-card">
            <div class="connect-badge">连接你的项目后生成</div>
            <p>上面是这个项目常见的方向。具体能在你的项目里怎么用，要看你的项目是什么，所以这一块留空，等你提供项目信息后再生成。两种做法：</p>
            <ol>
              <li>在自己电脑上：复制 <code>my-project.example.yaml</code> 改名为 <code>my-project.yaml</code> 填好，再让你自己的 AI 工具（Claude Code、Codex、Cursor 等）运行仓库里的 <code>skills/project-fit/SKILL.md</code>。</li>
              <li>在本页：到上方「<a href="#connect">连接你的项目</a>」填几句简介，本卡的「① 给你的项目用」会拼出一段提示词，复制给你的 AI 就能得到这一块。</li>
            </ol>
          </div>
        </div>
      </details>'''


def mine_placeholder(pid):
    return '''
          <p><strong>② 对照你的项目：</strong></p>
          <div class="connect-card mini"><div class="connect-badge">连接你的项目后生成</div><p>具体接到你项目的哪一层、先做哪一步，要结合你的项目来写。做法同上方「适合场景」，生成的提示词在本卡末尾「① 给你的项目用」。</p></div>'''


def card_brief(part_html):
    """从公开卡片里抽出给 AI 的项目简介（名字、仓库、一句话、能做什么）。"""
    s = BeautifulSoup(part_html, 'html.parser')
    name = s.select_one('.pname').get_text(strip=True)
    repo = s.select_one('.prepo a').get_text(strip=True)
    desc = s.select_one('.pdesc').get_text(' ', strip=True)
    can = [li.get_text(' ', strip=True) for li in s.select('.body-grid .panel.soft li')]
    return dict(name=name, repo=repo, desc=re.sub(r'\s+', ' ', desc), can=can)


# ---------------------------------------------------------------- 许可与免责（页脚）
LEGACY_FIND = {'开源版': '公开版'}
LICENSE_FOOTER = '''
    <p class="license-note" style="margin-top:10px">
      <strong>许可与使用范围：</strong>源码公开（source-available），仅限非商业使用。代码按 <a href="https://polyformproject.org/licenses/noncommercial/1.0.0" target="_blank" rel="noopener noreferrer">PolyForm Noncommercial 1.0.0</a>，页面文字、释义和提示词按 <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0</a>。可以用于个人学习、个人知识库、改进你自己的非商业项目；不可以商用、转卖、做付费课程或付费内容、做成 SaaS 或捆绑进商业产品。商业授权请联系作者。
    </p>
    <p class="license-note" style="margin-top:10px">
      <strong>免责声明：</strong>项目数据来自 GitHub 公开信息，按页面里写的读取日期整理，之后可能变化。释义和分析仅供学习参考，不构成专业、法律或安全建议。照着提示词运行代码的后果由使用者自己承担。本页与 GitHub 及收录项目的作者没有隶属关系，「GitHub」只用来说明内容来源。各收录项目以它们自己仓库的许可证为准。完整说明见仓库里的 <a href="../NOTICE.md">NOTICE.md</a>。
    </p>'''

# ---------------------------------------------------------------- 正文
PARTS = os.path.join(IDIR, 'parts')
overrides = ppriv.get('overrides', [])
slots = ppriv.get('cards', {})
bodies = []
briefs = []
for fn in sorted(os.listdir(PARTS)):
    if not fn.endswith('.html'):
        continue
    t = read(os.path.join(PARTS, fn))
    for o in overrides:
        if o['file'] == fn:
            if t.count(o['find']) == 0:
                # 兼容旧版私人数据：公开文案里的「开源版」已改称「公开版」
                for a, z in LEGACY_FIND.items():
                    if a in o['find'] and t.count(o['find'].replace(a, z)) == 1:
                        o = dict(o, find=o['find'].replace(a, z))
                        break
            n = t.count(o['find'])
            if n != 1:
                sys.exit('私人数据里的替换规则对不上（%s 出现 %d 次）：%s' % (fn, n, o['find'][:60]))
            t = t.replace(o['find'], o['replace'])
    m = re.match(r'(\d\d)', fn)
    pid = 'p' + m.group(1) if m else None
    if pid in issue['cards']:
        sc = slots.get(pid, {})
        c = dict(issue['cards'][pid])
        c.update({k: v for k, v in sc.items() if k in ('stars', 'time', 'prereq', 'note', 'generic')})
        briefs.append(dict(id=pid, tags=c.get('scene_tags', []), **card_brief(t)))
        t = re.sub(r'\n[ \t]*<!--SLOT:scenes-->', lambda _: sc.get('scenes_html') or scenes_placeholder(pid, c.get('scene_tags', [])), t)
        t = re.sub(r'\n[ \t]*<!--SLOT:mine-->', lambda _: sc.get('mine_html') or mine_placeholder(pid), t)
        t = t.replace('<!--KIT-->', kit(pid, c, sc.get('mine_prompt')))
    if PRIVATE and ppriv.get('hide_connect_panel'):
        t = re.sub(r'\n[ \t]*<!--SLOT:connect-->', '', t)
    else:
        t = re.sub(r'\n[ \t]*<!--SLOT:connect-->', lambda _: '\n' + read(os.path.join(ROOT, 'template', 'connect-panel.html')).rstrip('\n'), t)
    # 许可与免责只放进公开构建；私人构建可在 private.json 里写 "license_footer": true 打开
    if (not PRIVATE) or ppriv.get('license_footer'):
        t = re.sub(r'\n[ \t]*<!--SLOT:license-->', lambda _: LICENSE_FOOTER, t)
    else:
        t = re.sub(r'\n[ \t]*<!--SLOT:license-->', '', t)
    bodies.append(t)
b = '\n'.join(bodies)


def prompt_terms(text):
    hits = []
    seen = set()
    for a, bb, key in find_spans(text):
        if not key or key in seen:
            continue
        seen.add(key)
        label = text[a:bb]
        dt = label if (label in KEYS) else key
        hits.append((dt, label))
    if not hits:
        return ''
    chips = '、'.join('<span class="term" data-term="%s">%s</span>' % (html.escape(d), html.escape(l)) for d, l in hits)
    return '<div class="prompt-terms"><b>提示词里的生词：</b>' + chips + '</div>'


def fill_pterms(m):
    seg = m.group(0)
    pre = re.search(r'<pre class="prompt-text">(.*?)</pre>', seg, re.S)
    return seg.replace('<!--PTERMS-->', prompt_terms(html.unescape(pre.group(1))))


b = re.sub(r'<!--PTERMS-->\s*<pre class="prompt-text">.*?</pre>', fill_pterms, b, flags=re.S)
b = b.replace('<!--PTERMS-->\n', '').replace('<!--PTERMS-->', '')

soup = BeautifulSoup(b, 'html.parser')
missing_code = []
for c in soup.find_all('code'):
    k = code_key(c.get_text())
    if not k:
        missing_code.append(c.get_text())
        continue
    w = soup.new_tag('span')
    w['class'] = 'term'
    w['data-term'] = k
    c.wrap(w)
blocks = []
blocks += soup.select('header .issue-meta') + soup.select('#map-advice') + soup.select('.steps3')
for art in soup.select('article.project'):
    blocks += art.select('.identity') + art.select('.body-grid') + art.select('.cons-panel') + art.select('details')
    blocks += art.select('.ai-kit .kit-sub') + art.select('.ai-kit .diff') + art.select('.ai-kit .connect-empty')
    if art.get('id') == 'p01':
        blocks += art.select('.metrics')
blocks += soup.select('footer')
for bl in blocks:
    wrap_block(soup, bl, set())
b = str(soup)
b = b.replace('__N__', str(len(G)))

# ---------------------------------------------------------------- 模板
head = read(os.path.join(ROOT, 'template', 'head.html'))
tail = read(os.path.join(ROOT, 'template', 'tail.html'))
title = ppriv.get('title') or issue['title']
head = head.replace('__TITLE__', html.escape(title, quote=False))
if PRIVATE and ppriv.get('hide_connect_panel'):
    head = head.replace('/*__EXTRA_CSS__*/', '')
else:
    head = head.replace('/*__EXTRA_CSS__*/', read(os.path.join(ROOT, 'template', 'connect.css')))

gl = {}
for k, v in G.items():
    gl[k] = v
for a, k in A.items():
    if a not in gl:
        gl[a] = dict(G[k], main=k)
gl_js = 'const GLOSSARY = ' + json.dumps(gl, ensure_ascii=False, indent=1) + ';\nconst GLOSS_STOP = ' + json.dumps(STOP, ensure_ascii=False) + ';\n'
tail = tail.replace('__GLOSSARY_JS__\n', gl_js)
tail = tail.replace('__TOOLMAP_JS__\n', read(os.path.join(IDIR, 'toolmap.js')))
if PRIVATE and ppriv.get('hide_connect_panel'):
    tail = tail.replace('<!--__CONNECT_JS__-->', '')
else:
    tpl = read(os.path.join(ROOT, 'skills', 'project-fit', 'prompt-template.md'))
    tpl = tpl.split('<!-- TEMPLATE START -->', 1)[1].split('<!-- TEMPLATE END -->', 1)[0].strip('\n')
    data = json.dumps({'template': tpl, 'cards': briefs, 'issue': ISSUE}, ensure_ascii=False).replace('</', '<\\/')
    js = read(os.path.join(ROOT, 'template', 'connect.js'))
    tail = tail.replace('<!--__CONNECT_JS__-->', '<script>\nconst CONNECT_DATA = ' + data + ';\n' + js + '</script>\n')

out = head + b + '\n' + tail
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(out)
print('已生成 %s（%s构建，%d 字符，词条 %d 条）' % (os.path.relpath(OUT, os.getcwd()), '私人' if PRIVATE else '公开', len(out), len(G)))
if missing_code:
    print('提示：这些 <code> 还没有释义词条：', missing_code)
if not PRIVATE:
    write_index()
