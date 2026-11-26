#!/usr/bin/env python3
"""메뉴 이미지(docs/menu-image-links 목록)를 내려받아 흰 배경을 지우고, 8×8 스프라이트 시트로 묶습니다.

결과는 docs/prototype/v2-i/build/ 에 만들어지며 저장소에는 올리지 않습니다(.gitignore).
이미지는 메가MGC커피 홈페이지 자료로, 이 프로젝트의 시안 작업에만 씁니다. 다른 곳에 공개하거나 다시 올리지 않습니다.
필요: Pillow, numpy.   실행: python3 docs/prototype/v2-i/tools/build_sprites.py
"""
import json, subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[4]
SRC = ROOT / 'docs/menu-image-links/mega_menu_image_links.json'
BUILD = Path(__file__).resolve().parents[1] / 'build'
COLS = ROWS = 8
CELL = 320
LEAKY = {'drink_078.webp', 'drink_121.webp'}   # 우유색 컵: 배경 제거가 안쪽까지 번지는 이미지 → 가로줄 안쪽을 채워 보정

def download(item):
    f = BUILD / 'orig' / item['file']
    if not f.exists() or f.stat().st_size < 500:
        subprocess.run(['curl', '-sS', '-m', '40', '-o', str(f), item['url']], check=True)
    return f

def cutout(path, name):
    im = Image.open(path).convert('RGBA')
    if im.getpixel((0, 0))[3] <= 200:      # 이미 투명 배경
        return im
    rgb = im.convert('RGB'); w, h = rgb.size
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2),
             (w // 4, 0), (3 * w // 4, 0), (w // 4, h - 1), (3 * w // 4, h - 1)]
    for p in seeds:
        if sum(rgb.getpixel(p)) > 735:
            ImageDraw.floodfill(rgb, p, (255, 0, 255), thresh=14)
    r, g, b = rgb.split()
    bg = ImageChops.multiply(ImageChops.multiply(r.point(lambda v: 255 if v == 255 else 0), g.point(lambda v: 255 if v == 0 else 0)),
                             b.point(lambda v: 255 if v == 255 else 0))
    alpha = ImageChops.invert(bg)
    if name in LEAKY:
        a = np.array(alpha)
        for y, row in enumerate(a > 128):
            idx = np.where(row)[0]
            if len(idx) > 2:
                a[y, idx[0]:idx[-1] + 1] = 255
        alpha = Image.fromarray(a)
    im.putalpha(alpha.filter(ImageFilter.GaussianBlur(0.7)))
    return im

def main():
    items = json.loads(SRC.read_text(encoding='utf-8'))['items']
    (BUILD / 'orig').mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(8) as ex:
        files = list(ex.map(download, items))
    per = COLS * ROWS
    index = {it['file']: i for i, it in enumerate(items)}   # 시트 번호 = i // 64, 칸 = i % 64
    for s in range((len(items) + per - 1) // per):
        sheet = Image.new('RGBA', (COLS * CELL, ROWS * CELL), (0, 0, 0, 0))
        for k in range(per):
            i = s * per + k
            if i >= len(items): break
            im = cutout(files[i], items[i]['file']).resize((CELL, CELL), Image.LANCZOS)
            sheet.paste(im, ((k % COLS) * CELL, (k // COLS) * CELL))
        sheet.save(BUILD / f'sheet{s}.webp', quality=86, method=5)
        print('sheet', s)
    (BUILD / 'index.json').write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding='utf-8')

if __name__ == '__main__':
    main()
