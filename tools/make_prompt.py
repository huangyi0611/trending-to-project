# -*- coding: utf-8 -*-
"""在你自己的电脑上，用 my-project.yaml + 本期公开卡片拼出 project-fit 提示词。

    python3 tools/make_prompt.py --issue 03                      # 打印到屏幕
    python3 tools/make_prompt.py --issue 03 --out output/issue-03-prompt.local.md

不联网、不上传。输出文件请放在 output/ 或文件名带 .local.（都被 .gitignore 忽略）。
"""
import argparse, os, re, sys
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def parse_simple_yaml(text):
    """只支持 my-project.yaml 用到的写法：key: 值、key: | 多行、- 列表。装了 PyYAML 就优先用它。"""
    try:
        import yaml  # noqa
        return yaml.safe_load(text) or {}
    except ImportError:
        pass
    data, key, mode = {}, None, None
    for raw in text.splitlines():
        line = raw.split(' #')[0].rstrip() if not raw.lstrip().startswith('#') else ''
        if not line.strip():
            if mode == 'block':
                data[key] += '\n'
            continue
        if not raw.startswith((' ', '\t')):
            m = re.match(r'([A-Za-z_]+):\s*(.*)$', line)
            if not m:
                continue
            key, val = m.group(1), m.group(2).strip()
            if val == '|':
                data[key], mode = '', 'block'
            elif val == '':
                data[key], mode = [], 'list'
            else:
                data[key], mode = val, None
        elif mode == 'block':
            data[key] += line.strip() + '\n'
        elif mode == 'list' and line.strip().startswith('- '):
            data[key].append(line.strip()[2:].strip())
    return data


def as_text(v):
    if isinstance(v, list):
        return '、'.join(str(x) for x in v if str(x).strip())
    return str(v or '').strip()


def card_briefs(issue):
    import json
    idir = os.path.join(ROOT, 'data', 'public', 'issue-' + issue)
    meta = json.load(open(os.path.join(idir, 'issue.json'), encoding='utf-8'))
    out = []
    for fn in sorted(os.listdir(os.path.join(idir, 'parts'))):
        pid = 'p' + fn[:2]
        if pid not in meta['cards']:
            continue
        s = BeautifulSoup(open(os.path.join(idir, 'parts', fn), encoding='utf-8').read(), 'html.parser')
        out.append(dict(
            name=s.select_one('.pname').get_text(strip=True),
            repo=s.select_one('.prepo a').get_text(strip=True),
            desc=re.sub(r'\s+', ' ', s.select_one('.pdesc').get_text(' ', strip=True)),
            can=[re.sub(r'\s+', ' ', li.get_text(' ', strip=True)) for li in s.select('.body-grid .panel.soft li')],
            tags=meta['cards'][pid].get('scene_tags', [])))
    return out


def card_text(c):
    t = '### %s（GitHub：%s）\n- 一句话：%s\n' % (c['name'], c['repo'], c['desc'])
    if c['can']:
        t += '- 它能做什么：\n' + '\n'.join('  - ' + x for x in c['can']) + '\n'
    if c['tags']:
        t += '- 常见方向：' + ' / '.join(c['tags']) + '\n'
    return t


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--issue', required=True)
    ap.add_argument('--project', default=os.path.join(ROOT, 'my-project.yaml'))
    ap.add_argument('--out', default=None)
    a = ap.parse_args()
    issue = a.issue.zfill(2)
    if not os.path.exists(a.project):
        sys.exit('找不到 %s。先复制 my-project.example.yaml 改名为 my-project.yaml 再填写。' % a.project)
    p = parse_simple_yaml(open(a.project, encoding='utf-8').read())
    tpl = open(os.path.join(ROOT, 'skills', 'project-fit', 'prompt-template.md'), encoding='utf-8').read()
    tpl = tpl.split('<!-- TEMPLATE START -->', 1)[1].split('<!-- TEMPLATE END -->', 1)[0].strip('\n')
    text = (tpl.replace('{{PROJECT_NAME}}', as_text(p.get('name')) or '（未填写）')
               .replace('{{PROJECT_SUMMARY}}', as_text(p.get('summary')))
               .replace('{{TECH_STACK}}', as_text(p.get('stack')) or '（未填写，请先问我）')
               .replace('{{GOALS}}', as_text(p.get('goals')) or '（未填写）')
               .replace('{{ISSUE}}', issue)
               .replace('{{CARDS}}', '\n'.join(card_text(c) for c in card_briefs(issue))))
    if not a.out:
        print(text)
        return
    out = os.path.abspath(a.out)
    rel = os.path.relpath(out, ROOT)
    if not rel.startswith('..') and not (rel.startswith('output' + os.sep) or '.local.' in os.path.basename(out)):
        sys.exit('输出请放在 output/ 里，或文件名带 .local.，免得不小心提交到仓库。')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w', encoding='utf-8').write(text + '\n')
    print('已写入', rel)


if __name__ == '__main__':
    main()
