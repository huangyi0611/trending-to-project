#!/usr/bin/env python3
"""Build xhs-widget/data.js from public issue 03/04 pages.

Reads only data/public and examples (already-generated public HTML, so term
spans match the published pages). Does not read private/, skills/, or local
project files. Drops the connect-your-project panel, prompt blocks, and
outbound links.
"""
import json
import os
import re
import sys

from bs4 import BeautifulSoup, NavigableString, Tag

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PUB = os.path.join(ROOT, 'data', 'public')

DROP_GLOSSARY = {
    'my-project.yaml',
    'my-project.example.yaml',
    'skills/project-fit/SKILL.md',
}

ALLOWED_TAGS = {'span', 'code', 'strong', 'em', 'b', 'i', 'br', 'p', 'ul', 'ol', 'li', 'div', 'button'}
DROP_TAGS = {'script', 'iframe', 'object', 'embed', 'form', 'link', 'meta', 'img', 'video',
             'audio', 'source', 'style', 'input', 'textarea', 'svg', 'canvas'}


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def load_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def parse_toolmap(issue):
    """toolmap.js is data, but its outer keys are unquoted. Node only evaluates that file."""
    import subprocess
    path = os.path.join(PUB, 'issue-%s' % issue, 'toolmap.js')
    script = r'''
const fs = require("fs");
const vm = require("vm");
const code = fs.readFileSync(process.argv[1], "utf8") + "\n;globalThis.__out={stages:TOOLMAP_STAGES,issues:TOOLMAP_ISSUES};";
const sandbox = {};
vm.runInNewContext(code, sandbox);
process.stdout.write(JSON.stringify(sandbox.__out));
'''
    proc = subprocess.run(['node', '-e', script, path], check=True, capture_output=True, text=True)
    payload = json.loads(proc.stdout)
    return payload['stages'], payload['issues']


def capture_paragraph(issue):
    soup = BeautifulSoup(read(os.path.join(PUB, 'issue-%s' % issue, 'parts', '99_footer.html')), 'html.parser')
    p = soup.find('p')
    text = p.get_text('', strip=True) if p else ''
    text = re.sub(r'\s+', ' ', text).replace(' （', '（').strip()
    return re.sub(r'([\u4e00-\u9fff])(\d{4}-\d{2}-\d{2})', r'\1 \2', text)


def sanitize(node):
    """Return safe inner HTML. Anchors become text, except in-page #pNN jumps."""
    if node is None:
        return ''
    box = BeautifulSoup('<div></div>', 'html.parser')
    holder = box.div
    frag = BeautifulSoup(str(node), 'html.parser')
    source = frag.body if frag.body else frag
    for child in list(source.contents):
        holder.append(child)
    root = holder
    for bad in list(root.find_all(DROP_TAGS)):
        bad.decompose()
    for a in list(root.find_all('a')):
        href = a.get('href') or ''
        if re.fullmatch(r'#p\d\d', href):
            label = a.get_text('', strip=False)
            btn = box.new_tag('button')
            btn['type'] = 'button'
            btn['class'] = 'jump'
            btn['data-open'] = href[1:]
            btn.string = label.strip() if label else href
            a.replace_with(btn)
        else:
            a.unwrap()
    for tag in list(root.find_all(True)):
        if tag.name == 'button':
            if 'jump' in (tag.get('class') or []) and re.fullmatch(r'p\d\d', tag.get('data-open') or ''):
                tag.attrs = {'type': 'button', 'class': 'jump', 'data-open': tag['data-open']}
            else:
                tag.unwrap()
            continue
        if tag.name not in ALLOWED_TAGS:
            tag.unwrap()
            continue
        cls = tag.get('class') or []
        if isinstance(cls, str):
            cls = cls.split()
        keep = {}
        if tag.name == 'span' and 'term' in cls:
            keep['class'] = 'term'
            term = tag.get('data-term') or ''
            if term:
                keep['data-term'] = term
        elif tag.name == 'span' and 'fix' in cls:
            keep['class'] = 'fix'
        elif tag.name == 'span' and 'off' in cls:
            keep['class'] = 'off'
        elif tag.name == 'div' and 'risk' in cls:
            keep['class'] = 'risk'
        tag.attrs = keep
    html = holder.decode_contents()
    html = re.sub(r'\s+\n', '\n', html)
    html = re.sub(r'\n{3,}', '\n\n', html).strip()
    return html


def text_of(node):
    if node is None:
        return ''
    return re.sub(r'\s+', ' ', node.get_text(' ', strip=True))


def inner_html(node):
    if node is None:
        return ''
    return sanitize(node)


def panel_by_heading(art, heading):
    for panel in art.select('.panel'):
        h = panel.find('h3')
        if h and heading in h.get_text():
            return panel
    return None


def build_card(art, meta, blurb):
    pid = art.get('id')
    card_meta = meta['cards'][pid]
    pills = [text_of(p) for p in art.select('.tags .pill')]
    prepo = art.select_one('.prepo')
    repo_bits = [text_of(a) for a in prepo.find_all('a')] if prepo else []
    if not repo_bits and prepo:
        repo_bits = [text_of(prepo)]
    metrics = []
    for m in art.select('.metrics .metric'):
        label = m.select_one('.label')
        value = m.select_one('.value')
        hint = m.select_one('.hint')
        metrics.append({
            'labelHtml': inner_html(label),
            'value': text_of(value),
            'small': 'sm' in (value.get('class') or []) if value else False,
            'hint': text_of(hint),
        })
    can = panel_by_heading(art, '它能做什么')
    hi = panel_by_heading(art, '最突出的点')
    who = panel_by_heading(art, '适合谁用')
    cons = art.select_one('.cons-panel ol')
    for det in list(art.select('details.connect-slot')):
        det.decompose()
    sections = []
    for det in art.select('.extend details'):
        if 'connect-slot' in (det.get('class') or []):
            continue
        title = text_of(det.find('summary'))
        inner = det.select_one('.inner')
        if inner:
            for bad in inner.select('.connect-card'):
                bad.decompose()
            for p in list(inner.find_all('p')):
                if '对照你的项目' in p.get_text():
                    p.decompose()
        body = inner_html(inner)
        if title and body:
            sections.append({'title': title, 'html': body})
    diff = art.select_one('.ai-kit .diff')
    prereq = diff.select_one('.prereq') if diff else None
    note = diff.select_one('.note') if diff else None
    star_n = int(card_meta['stars'])
    return {
        'id': pid,
        'featured': 'featured' in (art.get('class') or []),
        'rank': text_of(art.select_one('.rank')) or pid,
        'name': text_of(art.select_one('.pname')),
        'blurb': blurb,
        'avatar': text_of(art.select_one('.avatar')),
        'repoText': ' · '.join(b for b in repo_bits if b),
        'pills': pills,
        'tags': list(card_meta.get('scene_tags') or []),
        'descHtml': inner_html(art.select_one('.pdesc')),
        'licenseHtml': inner_html(art.select_one('.license')),
        'metrics': metrics,
        'canHtml': inner_html(can.find('ul') if can else None),
        'highlightTitle': text_of(hi.select_one('.hl-title') if hi else None),
        'highlightHtml': inner_html(hi.find('p') if hi else None),
        'audienceHtml': inner_html(who.find('p') if who else None),
        'consHtml': inner_html(cons),
        'sections': sections,
        'kit': {
            'stars': star_n,
            'time': card_meta.get('time') or '',
            'prereqHtml': inner_html(prereq),
            'noteHtml': inner_html(note),
        },
        'search': text_of(art),
    }


def build_issue(num):
    issue_id = '%02d' % num
    meta = load_json(os.path.join(PUB, 'issue-%s' % issue_id, 'issue.json'))
    stages, groups = parse_toolmap(issue_id)
    current = next(g for g in groups if g.get('current'))
    blurbs = {it.get('id'): it.get('what') or '' for it in current.get('items', []) if it.get('id')}
    soup = BeautifulSoup(read(os.path.join(ROOT, 'examples', 'issue-%s.html' % issue_id)), 'html.parser')
    # Drop the whole connect panel before walking articles.
    for node in soup.select('#connect, .connect'):
        node.decompose()
    advice = soup.select_one('#map-advice')
    meta_p = soup.select_one('header .issue-meta')
    cards = []
    for art in soup.select('article.project'):
        # Remove prompts before sanitize so their text cannot leak.
        for prompt in art.select('.prompt, .connect-empty, .prompt-terms, .ai-kit > h3, .ai-kit .kit-sub'):
            prompt.decompose()
        pid = art.get('id')
        cards.append(build_card(art, meta, blurbs.get(pid, '')))
    if len(cards) != 7:
        sys.exit('issue %s expected 7 cards, got %d' % (issue_id, len(cards)))
    names = [c['name'] for c in cards]
    # issue.json project labels are sometimes longer than the published card title.
    featured = [c for c in cards if c['featured']]
    if len(featured) != 1:
        sys.exit('issue %s featured count %d' % (issue_id, len(featured)))
    past = []
    for g in groups:
        if g.get('current'):
            continue
        for it in g.get('items', []):
            repo = it.get('repo') or ''
            short = repo.split('/')[-1] if repo else ''
            past.append({
                'issue': int(g.get('issue') or it.get('issue') or 0),
                'stage': it.get('stage') or '',
                'label': short,
            })
    current_items = []
    for it in current.get('items', []):
        current_items.append({
            'id': it.get('id'),
            'name': it.get('name') or '',
            'stage': it.get('stage') or '',
            'what': it.get('what') or '',
            'stars': int(it.get('stars') or 0),
            'rec': bool(it.get('rec')),
        })
    return {
        'id': issue_id,
        'label': '第%s期' % {'03': '三', '04': '四'}.get(issue_id, issue_id),
        'title': meta.get('title') or '',
        'date': meta.get('date') or '',
        'summary': meta.get('summary') or '',
        'lead': meta.get('lead') or '',
        'metaHtml': inner_html(meta_p),
        'adviceHtml': inner_html(advice),
        'captureText': capture_paragraph(issue_id),
        'kitNote': meta.get('kit_note_suffix') or '',
        'stages': stages,
        'currentMap': current_items,
        'pastMap': past,
        'cards': cards,
        'cardNames': names,
    }


def glossary():
    g = load_json(os.path.join(PUB, 'glossary.json'))
    entries = {}
    for key, val in g.get('entries', {}).items():
        if key in DROP_GLOSSARY:
            continue
        entries[key] = {
            'what': val.get('what') or '',
            'like': val.get('like') or '',
            'why': val.get('why') or '',
            'src': val.get('src') or '',
        }
    aliases = {}
    for alias, target in g.get('aliases', {}).items():
        if alias in DROP_GLOSSARY or target in DROP_GLOSSARY:
            continue
        if target not in entries:
            continue
        aliases[alias] = target
    return {
        'entries': entries,
        'aliases': aliases,
        'stop': [s for s in g.get('stop', []) if s not in DROP_GLOSSARY],
    }


def scan_text(label, text):
    problems = []
    patterns = [
        (r'<script', 'script tag'),
        (r'\son[a-zA-Z]+\s*=', 'inline event'),
        (r'\beval\s*\(', 'eval'),
        (r'new\s+Function', 'Function'),
        (r'WebAssembly', 'wasm'),
        (r'<iframe', 'iframe'),
        (r'<object', 'object'),
        (r'<embed', 'embed'),
        (r'<form', 'form'),
        (r'\bfetch\s*\(', 'fetch'),
        (r'XMLHttpRequest', 'xhr'),
        (r'WebSocket', 'websocket'),
        (r'sendBeacon', 'beacon'),
        (r'localStorage', 'localStorage'),
        (r'sessionStorage', 'sessionStorage'),
        (r'indexedDB', 'indexedDB'),
        (r'document\.cookie', 'cookie'),
        (r'window\.open', 'window.open'),
        (r'navigator\.clipboard', 'clipboard'),
        (r'execCommand', 'execCommand'),
        (r'geolocation', 'geolocation'),
        (r'\bWorker\b', 'worker'),
        (r'target\s*=', 'target'),
        (r'href\s*=', 'href'),
        (r'\bsrc\s*=', 'src attribute'),
        (r'javascript:', 'javascript url'),
        (r'\bdownload\s*=', 'download'),
        (r'@import', 'css import'),
        (r'url\(\s*[\'"]?https?:', 'css external url'),
        (r'https?://', 'http url'),
        (r'mailto:', 'mailto'),
        (r'DoDoNow', 'private name'),
        (r'WINlist', 'private name'),
        (r'书解', 'private name'),
        (r'播客解析', 'private name'),
        (r'/Users/', 'local path'),
        (r'/home/', 'local path'),
        (r'my-project\.yaml', 'user project file'),
        (r'project-fit', 'project-fit skill'),
        (r'sk-[A-Za-z0-9]{20,}', 'secret shape'),
        (r'ghp_[A-Za-z0-9]{20,}', 'secret shape'),
        (r'github_pat_', 'secret shape'),
        (r'AKIA[0-9A-Z]{16}', 'secret shape'),
        (r'xox[baprs]-', 'secret shape'),
        (r'BEGIN [A-Z ]*PRIVATE KEY', 'private key'),
        (r'nvapi-[A-Za-z0-9]{8,}', 'nvidia key'),
    ]
    for pat, name in patterns:
        if re.search(pat, text):
            problems.append('%s: %s' % (label, name))
    return problems


def main():
    data = {
        'snapshotLabel': '离线快照，不是实时星数',
        'sourceNote': '内容取自本仓库已公开的第03期、第04期，未新编榜单。',
        'glossary': glossary(),
        'issues': [build_issue(3), build_issue(4)],
    }
    raw = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    raw = raw.replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    # http(s) must not appear. License URLs live in app.js as plain text comments only.
    problems = scan_text('data.js', raw)
    # src= false positive: JSON may contain the letters inside words? Our pattern is \bsrc\s*=
    # "sourceNote" doesn't match. Good.
    if problems:
        sys.exit('scan failed:\n' + '\n'.join(problems))
    header = (
        '/* Required Notice: Copyright (c) 2026 假笑黄黄AI版（小红书）\n'
        '   Code: PolyForm Noncommercial 1.0.0\n'
        '   https://polyformproject.org/licenses/noncommercial/1.0.0\n'
        '   Embedded public writing: CC BY-NC-SA 4.0\n'
        '   Generated from data/public and examples. Do not edit by hand. */\n'
    )
    # The comment above contains https:// which the package scanner will flag.
    # Keep URLs out of data.js; the required URL is in index.html and app.js comments,
    # and the visible footer spells the license names. data.js stays free of URLs.
    header = (
        '/* Required Notice: Copyright (c) 2026 假笑黄黄AI版（小红书）\n'
        '   Code license: PolyForm Noncommercial 1.0.0 (see index.html notice).\n'
        '   Embedded public writing: CC BY-NC-SA 4.0.\n'
        '   Generated from data/public and examples. Do not edit by hand. */\n'
    )
    out = os.path.join(OUT_DIR, 'data.js')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(header)
        f.write('window.XHS_DATA = ')
        f.write(raw)
        f.write(';\n')
    print('wrote', out, 'bytes', os.path.getsize(out))
    for issue in data['issues']:
        print(issue['id'], issue['date'], [c['name'] for c in issue['cards']], 'featured',
              [c['name'] for c in issue['cards'] if c['featured']][0])


if __name__ == '__main__':
    main()
