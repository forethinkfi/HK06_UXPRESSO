#!/usr/bin/env python3
"""메뉴 이미지 링크 목록(docs/menu-image-links)을 메뉴 데이터(menu-data.json)로 바꿉니다.

- HOT/ICE로 나뉜 같은 이름의 항목은 상품 하나로 합칩니다.
- 카테고리·서브메뉴는 이름으로 나눈 시안용 분류이고, 가격은 시연용 예시입니다. 실제 메가MGC커피 데이터가 아닙니다.
실행: python3 docs/artboard/v2-i/tools/build_menu_data.py
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
SRC = ROOT / 'docs/menu-image-links/mega_menu_image_links.json'
OUT = Path(__file__).resolve().parents[1] / 'menu-data.json'

CAT_NAMES = ['신메뉴', '추천메뉴', '커피', '디카페인', '음료', '티', '푸드', '상품']
# 추천메뉴는 시안용으로 직접 고른 12개입니다(인기·판매 순위가 아닙니다).
RECOMMENDED = ['아메리카노', '카페라떼', '바닐라라떼', '콜드브루오리지널', '레몬에이드', '자몽에이드', '복숭아아이스티',
               '쿠키프라페', '딸기퐁크러쉬', '햄치즈에그 샌드위치', '마카다미아 쿠키', '딸기요거트 마카롱']

def norm(name):
    return re.sub(r'^\((HOT|ICE)\)\s*', '', name).strip()

def has(n, *keys):
    return any(k in n for k in keys)

COFFEE_NUMS = {6, 23, 24, 29, 33, 39, 40, 44, 46, 47} | set(range(100, 127)) | {80, 81}
TEA_NUMS = {3, 4, 10, 21, 32, 37, 38, 42, 43} | set(range(145, 164))

def group(items):
    groups, order = {}, []
    for it in items:
        kind = {'음료': 'd', '푸드': 'f', '상품': 'g'}[it['category']]
        key = (kind, norm(it['name']))
        if key not in groups:
            groups[key] = {'kind': kind, 'name': key[1], 'items': []}
            order.append(key)
        groups[key]['items'].append(it)
    prods = []
    for key in order:
        g = groups[key]
        its = g['items']
        nums = [int(i['number']) for i in its]
        temps = [t for t in ('HOT', 'ICE') if any(i['temp'] == t for i in its)]
        images = {}
        for i in its:
            images.setdefault(i['temp'] if i['temp'] in ('HOT', 'ICE') else 'one', i['file'])
        prods.append({'id': g['kind'] + '%03d' % min(nums), 'kind': g['kind'], 'name': g['name'], 'english_name': its[0]['english_name'],
                      'numbers': nums, 'temps': temps, 'images': images})
    return prods

def classify(p):
    n, k, nums = p['name'], p['kind'], set(p['numbers'])
    cats, tags, badge, coffee = [], [], '', 0
    if k == 'd':
        if has(n, '디카페인'):
            cats.append(3)
        elif nums & COFFEE_NUMS:
            cats.append(2)
        elif nums & TEA_NUMS:
            cats.append(5)
        else:
            cats.append(4)
        c = cats[0]
        if c in (2, 3) and has(n, '아메리카노', '헛개리카노', '라떼', '카푸치노', '모카', '마끼아또', '에스프레소', '콜드브루', '커피', '메가리카노') and not has(n, '오르조'):
            coffee = 1
        if c == 2:
            if nums & {80, 81}: tags.append('c2:에스프레소')
            if has(n, '라떼', '카푸치노', '모카', '마끼아또'): tags.append('c2:라떼')
            if has(n, '콜드브루'): tags.append('c2:콜드브루')
        if c == 4:
            if has(n, '프라페', '스무디', '퐁크러쉬'): tags.append('c4:스무디·프라페')
            elif has(n, '에이드', '주스', '모히또'): tags.append('c4:주스·에이드')
            elif has(n, '라떼', '밀크', '초코', '쉐이크'): tags.append('c4:라떼·밀크')
            else: tags.append('c4:기타 음료')
        if c == 5:
            if has(n, '아이스티'): tags.append('c5:아이스티')
            elif has(n, '유자', '레몬차', '자몽차', '사과유자', '매실'): tags.append('c5:과일차')
            else: tags.append('c5:허브·블렌딩 티')
        if nums & {1, 2, 3, 4, 5, 6}: cats.append(0)   # 신메뉴: 포스터에서 NEW로 확인된 5개와 콜라보 2개
        if nums & {5, 6}: tags.append('c0:콜라보'); badge = '콜라보'
        elif nums & {1, 2, 3, 4}: badge = 'NEW'
    elif k == 'f':
        cats.append(6)
        num = min(p['numbers'])
        if num in (1, 2): cats.append(0); badge = 'NEW'
        if num in (3, 4, 5, 6, 7, 8, 9, 10, 13, 16, 18, 20, 21, 22, 23, 30): tags.append('c6:샌드위치·간식')
        elif num in (11, 12, 14, 15, 31, 32, 33, 36, 37, 38, 39): tags.append('c6:디저트')
        else: tags.append('c6:베이커리')
    else:
        cats.append(7)
        tags.append('c7:굿즈' if min(p['numbers']) in (10, 27, 28, 29, 30, 31, 32, 33, 34) else 'c7:콜라보 상품')
    return cats, tags, badge, coffee

def sample_price(p):
    """시연용 예시 가격(원). 실제 가격이 아닙니다."""
    n, k, t = p['name'], p['kind'], p['temps']
    c = p['categories'][0]
    if k == 'f':
        v = 4500
        for keys, val in (((('쿠키',)), 2800), (('케익',), 5500), (('마카롱',), 3000), (('핫도그',), 4000),
                          (('샌드위치', '치아바타', '토스트', '크로크'), 5000), (('치킨', '떡볶이'), 5900), (('캔디', '칩'), 2000),
                          (('크로플',), 4500), (('볼', '젤라또'), 5500)):
            if has(n, *keys): v = val; break
        return {'one': v}
    if k == 'g':
        v = 10000
        for keys, val in ((('텀블러',), 15000), (('머그',), 9000), (('우산',), 15000), (('키링',), 8000), (('원액',), 12000), (('스테비아',), 5000)):
            if has(n, *keys): v = val; break
        return {'one': v}
    dec = 500 if has(n, '디카페인') else 0
    h, i = 3000, 3500
    table = [(('에스프레소 도피오',), (2000, 2000)), (('에스프레소',), (1500, 1500)), (('메가리카노',), (2500, 2500)),
             (('꿀아메리카노', '바닐라아메리카노', '헤이즐넛아메리카노', '헛개리카노'), (2500, 3000)), (('아메리카노',), (1500, 2000)),
             (('카푸치노', '카페라떼'), (3000, 3500)), (('카페모카', '마끼아또', '바닐라라떼', '헤이즐넛', '연유라떼'), (3500, 4000)),
             (('콜드브루',), (3500, 4000)), (('큐브라떼',), (3500, 3500)), (('왕메가', '왕할메가'), (4300, 4300)),
             (('할메가', '미숫'), (3000, 3500)), (('프라페',), (4500, 4500)), (('스무디', '퐁크러쉬'), (4300, 4300)),
             (('에이드', '모히또', '체리콜라'), (3800, 3800)), (('주스',), (4300, 4300)), (('아이스티',), (3000, 3000))]
    for keys, val in table:
        if has(n, *keys): h, i = val; break
    else:
        if c == 5: h, i = 3000, 3300
        elif has(n, 'ARIH'): h, i = 3000, 3000
        elif has(n, '라떼', '밀크', '초코', '쉐이크', '야쿠르트'): h, i = 3500, 4000
    h += dec; i += dec
    if not t: return {'one': i}
    out = {}
    if 'HOT' in t: out['HOT'] = h
    if 'ICE' in t: out['ICE'] = i
    return out

def main():
    data = json.loads(SRC.read_text(encoding='utf-8'))
    prods = group(data['items'])
    for p in prods:
        p['categories'], p['tags'], p['badge'], p['coffee'] = classify(p)
        p['sample_price'] = sample_price(p)
    names = {p['name'] for p in prods}
    missing = [r for r in RECOMMENDED if r not in names]
    assert not missing, missing
    out = {
        'notice': '비공식 시안용 데이터입니다. 분류는 메뉴 이름으로 나눈 것이고 가격은 시연용 예시입니다. 이미지는 docs/menu-image-links 목록의 파일명을 따릅니다.',
        'categories': CAT_NAMES,
        'recommended': RECOMMENDED,
        'products': prods,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(len(prods), 'products ->', OUT.relative_to(ROOT))

if __name__ == '__main__':
    main()
