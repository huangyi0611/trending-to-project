#!/usr/bin/env python3
"""Build the self-contained Skill pack from the public reader snapshot.

Reads only xhs-widget/data.js (itself built from public issues 03/04) and the
repository license files. Does not read private/, skills/, or local project files.
"""
import json
import os
import re
import shutil

from bs4 import BeautifulSoup

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PACK = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
WIDGET = os.path.join(ROOT, 'xhs-widget')


def plain(html):
    if not html:
        return ''
    soup = BeautifulSoup(html, 'html.parser')
    text = soup.get_text(' ', strip=True)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\s+([，。；、：）])', r'\1', text)
    text = re.sub(r'（\s+', '（', text)
    return text.strip()


def list_items(html):
    if not html:
        return []
    soup = BeautifulSoup(html, 'html.parser')
    items = [plain(str(li)) for li in soup.find_all('li')]
    if items:
        return [it for it in items if it]
    text = plain(html)
    return [text] if text else []


def drawbacks(html):
    if not html:
        return []
    soup = BeautifulSoup(html, 'html.parser')
    rows = []
    for li in soup.find_all('li'):
        fix = li.find('span', class_='fix')
        response = ''
        if fix:
            response = plain(str(fix))
            response = re.sub(r'^应对[:：]\s*', '', response)
            fix.decompose()
        problem = plain(str(li))
        if problem or response:
            rows.append({'problem': problem, 'response': response})
    return rows


def load_widget_data():
    text = open(os.path.join(WIDGET, 'data.js'), encoding='utf-8').read()
    raw = text.split('window.XHS_DATA = ', 1)[1]
    if raw.endswith(';\n'):
        raw = raw[:-2]
    elif raw.endswith(';'):
        raw = raw[:-1]
    return json.loads(raw)


def card_record(card, stage_by_id):
    metrics = []
    star = ''
    for metric in card.get('metrics') or []:
        label = plain(metric.get('labelHtml'))
        row = {'label': label, 'value': metric.get('value') or '', 'hint': metric.get('hint') or ''}
        metrics.append(row)
        if 'STAR' in label.upper() and not star:
            star = row['value']
    stage = stage_by_id.get(card['id'], {})
    sections = [{'title': sec.get('title') or '', 'text': plain(sec.get('html'))} for sec in card.get('sections') or []]
    record = {
        'id': card['id'],
        'rank': card.get('rank') or '',
        'name': card.get('name') or '',
        'featured': bool(card.get('featured')),
        'blurb': card.get('blurb') or '',
        'repo': card.get('repoText') or '',
        'pills': card.get('pills') or [],
        'tags': card.get('tags') or [],
        'stageKey': stage.get('stage') or '',
        'stageName': stage.get('stageName') or '',
        'description': plain(card.get('descHtml')),
        'license': plain(card.get('licenseHtml')),
        'metrics': metrics,
        'starSnapshot': star,
        'canDo': list_items(card.get('canHtml')),
        'highlightTitle': card.get('highlightTitle') or '',
        'highlight': plain(card.get('highlightHtml')),
        'audience': plain(card.get('audienceHtml')),
        'drawbacks': drawbacks(card.get('consHtml')),
        'sections': sections,
        'difficulty': {
            'stars': (card.get('kit') or {}).get('stars'),
            'outOf': 5,
            'timeEstimate': (card.get('kit') or {}).get('time') or '',
            'prerequisites': plain((card.get('kit') or {}).get('prereqHtml')),
            'note': plain((card.get('kit') or {}).get('noteHtml')),
        },
    }
    bits = [
        record['name'], record['repo'], record['blurb'], record['description'],
        record['license'], record['highlightTitle'], record['highlight'], record['audience'],
        ' '.join(record['pills']), ' '.join(record['tags']), record['stageName'],
        ' '.join(record['canDo']),
    ]
    for row in record['drawbacks']:
        bits.append(row['problem'] + ' ' + row['response'])
    for sec in sections:
        bits.append(sec['title'] + ' ' + sec['text'])
    record['searchText'] = re.sub(r'\s+', ' ', ' '.join(b for b in bits if b)).strip()
    return record


def issue_record(issue):
    stage_names = {st['key']: st['name'] for st in issue.get('stages') or []}
    stage_by_id = {}
    for item in issue.get('currentMap') or []:
        stage_by_id[item['id']] = {
            'stage': item.get('stage') or '',
            'stageName': stage_names.get(item.get('stage') or '', ''),
        }
    captured = issue.get('captureText') or ''
    when = ''
    match = re.search(r'抓取时间\s*([0-9]{4}-[0-9]{2}-[0-9]{2})（([^）]+)）', captured)
    if match:
        when = match.group(1) + '（' + match.group(2) + '）'
    return {
        'id': issue['id'],
        'label': issue['label'],
        'title': issue.get('title') or '',
        'date': issue.get('date') or '',
        'summary': issue.get('summary') or '',
        'lead': issue.get('lead') or '',
        'sampling': {
            'date': issue.get('date') or '',
            'when': when,
            'statement': captured,
            'starsAreSnapshot': True,
        },
        'howChosen': plain(issue.get('metaHtml')),
        'advice': plain(issue.get('adviceHtml')),
        'kitNote': issue.get('kitNote') or '',
        'stages': issue.get('stages') or [],
        'map': issue.get('currentMap') or [],
        'pastNamesOnly': issue.get('pastMap') or [],
        'cards': [card_record(card, stage_by_id) for card in issue.get('cards') or []],
    }


def main():
    data = load_widget_data()
    issues = [issue_record(issue) for issue in data['issues']]
    payload = {
        'name': 'trending-to-project',
        'title': 'GitHub 热榜拆解',
        'author': '假笑黄黄AI版',
        'kind': 'public-snapshot',
        'issuesAvailable': [issue['id'] for issue in issues],
        'notLiveTrending': True,
        'note': '只有第03期和第04期的公开采样。星数、Forks、新增都是采样值，不是实时热榜。本文件不含第01期和第02期正文。',
        'issues': issues,
    }
    data_dir = os.path.join(PACK, 'data')
    os.makedirs(data_dir, exist_ok=True)
    with open(os.path.join(data_dir, 'issues.json'), 'w', encoding='utf-8') as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write('\n')
    glossary = {
        'note': '预置释义，来自已公开词库，去掉了项目输入文件名相关词条。没有联网查询。',
        'entries': data['glossary']['entries'],
        'aliases': data['glossary']['aliases'],
    }
    with open(os.path.join(data_dir, 'glossary.json'), 'w', encoding='utf-8') as handle:
        json.dump(glossary, handle, ensure_ascii=False, indent=2)
        handle.write('\n')

    reader = os.path.join(PACK, 'reader')
    os.makedirs(reader, exist_ok=True)
    for name in ('index.html', 'app.css', 'app.js'):
        shutil.copyfile(os.path.join(WIDGET, name), os.path.join(reader, name))
    js = open(os.path.join(WIDGET, 'data.js'), encoding='utf-8').read()
    js = js.replace(
        '   Generated from data/public and examples. Do not edit by hand. */',
        '   Public snapshot embedded in this Skill pack. Read data/issues.json to answer. */',
    )
    with open(os.path.join(reader, 'data.js'), 'w', encoding='utf-8') as handle:
        handle.write(js)

    for src, dest in (
        ('LICENSE', 'LICENSE'),
        ('LICENSE', 'LICENSE.txt'),
        ('LICENSE-CONTENT.md', 'LICENSE-CONTENT.md'),
        ('NOTICE.md', 'NOTICE.md'),
    ):
        shutil.copyfile(os.path.join(ROOT, src), os.path.join(PACK, dest))

    print('issues', [(it['id'], [c['name'] for c in it['cards']]) for it in issues])
    print('bytes', os.path.getsize(os.path.join(data_dir, 'issues.json')), os.path.getsize(os.path.join(data_dir, 'glossary.json')))


if __name__ == '__main__':
    main()
