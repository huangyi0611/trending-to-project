#!/usr/bin/env python3
"""Validate the Skill zip: root SKILL.md, YAML, file references, sizes, a sample read."""
import json
import os
import re
import zipfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ZIP_PATH = os.environ.get('SKILL_ZIP', os.path.join(ROOT, 'xhs_skill_upload.zip'))

PACK_FILES = [
    'SKILL.md',
    'LICENSE',
    'LICENSE.txt',
    'LICENSE-CONTENT.md',
    'NOTICE.md',
    'data/README.txt',
    'data/issues.json',
    'data/glossary.json',
    'reader/index.html',
    'reader/app.css',
    'reader/app.js',
    'reader/data.js',
]

PRIVATE = re.compile(
    r'DoDoNow|WINlist|书解|播客解析|/Users/|/home/|my-project\.yaml|'
    r'sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_|AKIA[0-9A-Z]{16}|'
    r'BEGIN [A-Z ]*PRIVATE KEY|nvapi-[A-Za-z0-9]{8,}'
)


def fail(msg):
    raise SystemExit('FAIL ' + msg)


def sample_answer(issues):
    issue = next(item for item in issues['issues'] if item['id'] == '04')
    card = next(item for item in issue['cards'] if item['featured'])
    risk = card['drawbacks'][0]
    text = (
        '第四期最推荐是{name}，仓库文字名是{repo}。'
        '采样星数 {stars}，采样时间 {when}，这不是现在的实时星数。'
        '白话：{blurb}。风险：{problem}应对：{response}'
    ).format(
        name=card['name'],
        repo=card['repo'],
        stars=card['starSnapshot'],
        when=issue['sampling']['when'],
        blurb=card['blurb'],
        problem=risk['problem'],
        response=risk['response'],
    )
    qa = [item['name'] for item in issue['cards'] if item['stageKey'] == 'qa']
    return text, qa


def main():
    missing = [name for name in PACK_FILES if not os.path.isfile(os.path.join(ROOT, name))]
    if missing:
        fail('missing source files ' + ', '.join(missing))
    with zipfile.ZipFile(ZIP_PATH, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for name in PACK_FILES:
            archive.write(os.path.join(ROOT, name), name)
    with zipfile.ZipFile(ZIP_PATH) as archive:
        names = archive.namelist()
        if 'SKILL.md' not in names:
            fail('SKILL.md not at zip root: ' + ', '.join(names[:8]))
        if any(name.startswith('xhs-skill/') or name.startswith('dev/') for name in names):
            fail('zip nested or contains dev/')
        if names != PACK_FILES and set(names) != set(PACK_FILES):
            fail('unexpected zip entries ' + ', '.join(names))
        total = 0
        for info in archive.infolist():
            if info.file_size > 10 * 1024 * 1024:
                fail(info.filename + ' over 10MB')
            total += info.file_size
        if total > 30 * 1024 * 1024:
            fail('zip uncompressed total over 30MB')
        skill = archive.read('SKILL.md').decode('utf-8')
        if skill.startswith('\ufeff'):
            fail('SKILL.md has BOM')
        if not skill.startswith('---\n'):
            fail('SKILL.md missing frontmatter')
        end = skill.find('\n---\n', 4)
        if end < 0:
            fail('frontmatter not closed')
        try:
            import yaml
            meta = yaml.safe_load(skill[4:end])
        except Exception as exc:
            fail('YAML ' + str(exc))
        if not isinstance(meta, dict):
            fail('frontmatter not a mapping')
        if meta.get('name') != 'trending-to-project':
            fail('name ' + str(meta.get('name')))
        description = meta.get('description') or ''
        if '03' not in description or '04' not in description:
            fail('description does not name both issues')
        if '实时' not in description:
            fail('description missing live-data boundary')
        for ref in re.findall(r'`([^`]+)`', skill):
            if not re.search(r'\.(?:md|txt|json|html|css|js)$', ref):
                continue
            if ref not in names:
                fail('referenced file missing: ' + ref)
        issues = json.loads(archive.read('data/issues.json').decode('utf-8'))
        glossary = json.loads(archive.read('data/glossary.json').decode('utf-8'))
        if issues['issuesAvailable'] != ['03', '04']:
            fail('issuesAvailable')
        text, qa = sample_answer(issues)
        if 'Plannotator' not in text or '11,915' not in text or '2026-11-16' not in text:
            fail('sample answer drifted: ' + text[:180])
        if 'open-code-review' not in qa or 'SkillEvaluator' not in qa:
            fail('qa stage ' + str(qa))
        if 'GitHub' not in glossary['entries']:
            fail('glossary missing GitHub')
        blob = skill + archive.read('data/issues.json').decode('utf-8') + archive.read('data/glossary.json').decode('utf-8')
        blob += archive.read('data/README.txt').decode('utf-8')
        found = PRIVATE.search(blob)
        if found:
            fail('private marker ' + found.group(0))
        if 'https://' in archive.read('data/issues.json').decode('utf-8'):
            fail('issues.json contains a URL')
        print('PASS', ZIP_PATH)
        print('files', len(names), 'uncompressed', total)
        print('SAMPLE', text)
        print('QA', ', '.join(qa))


if __name__ == '__main__':
    main()
