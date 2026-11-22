"""v1.3.0 – mapa BOISKO (640x320, widok z góry, bez nieba) dla minigry pong na stadionie. Uruchom: python3 gen130_pitch.py"""
from PIL import Image, ImageDraw
import os, random
A = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'maps')
random.seed(130)
W, H = 640, 320
im = Image.new('RGB', (W, H), (47, 122, 58)); d = ImageDraw.Draw(im)
# murawa w pasy + delikatna faktura
for i, x in enumerate(range(0, W, 40)):
    d.rectangle([x, 0, x + 39, H], fill=(47, 122, 58) if i % 2 == 0 else (54, 136, 66))
for _ in range(2600):
    x, y = random.randrange(W), random.randrange(H); c = random.choice(((40, 108, 52), (62, 146, 74), (50, 128, 60)))
    d.point((x, y), fill=c); d.point((x + 1, y), fill=c)
# bandy reklamowe (góra i dół) – boisko wypełnia cały ekran, więc zamiast nieba jest tylko pas trybun
ads = [(200, 50, 50), (240, 200, 60), (60, 110, 200), (240, 240, 240), (60, 170, 90), (170, 70, 190)]
for k, x in enumerate(range(0, W, 64)):
    c = ads[k % len(ads)]
    d.rectangle([x, 0, x + 63, 8], fill=c); d.rectangle([x, 0, x + 63, 1], fill=tuple(min(255, v + 40) for v in c)); d.rectangle([x, 9, x + 63, 9], fill=(20, 20, 28))
    d.rectangle([x, H - 10, x + 63, H - 2], fill=c); d.rectangle([x, H - 10, x + 63, H - 9], fill=tuple(min(255, v + 40) for v in c)); d.rectangle([x, H - 1, x + 63, H - 1], fill=(20, 20, 28))
    for j in range(6):
        d.point((x + 6 + j * 10, 4), fill=(20, 20, 28)); d.point((x + 6 + j * 10, H - 6), fill=(20, 20, 28))
LN = (232, 240, 224)
def line(a, b, w=2): d.line([a, b], fill=LN, width=w)
L, R, T, B = 16, 624, 14, 306
for a, b in (((L, T), (R, T)), ((R, T), (R, B)), ((R, B), (L, B)), ((L, B), (L, T))): line(a, b)
line((W // 2, T), (W // 2, B))
d.ellipse([W // 2 - 40, H // 2 - 40, W // 2 + 40, H // 2 + 40], outline=LN, width=2); d.ellipse([W // 2 - 3, H // 2 - 3, W // 2 + 3, H // 2 + 3], fill=LN)
for sgn, x0 in ((1, L), (-1, R)):
    xp = x0 + sgn * 70; xg = x0 + sgn * 26
    line((x0, 70), (xp, 70)); line((xp, 70), (xp, 250)); line((xp, 250), (x0, 250))             # pole karne
    line((x0, 118), (xg, 118)); line((xg, 118), (xg, 202)); line((xg, 202), (x0, 202))          # pole bramkowe
    d.ellipse([x0 + sgn * 52 - 2, 158, x0 + sgn * 52 + 2, 162], fill=LN)                         # rzut karny
    bb = [xp - 26, 160 - 26, xp + 26, 160 + 26] if sgn == 1 else [xp - 26, 160 - 26, xp + 26, 160 + 26]
    d.arc(bb, -50, 50, fill=LN, width=2) if sgn == 1 else d.arc(bb, 130, 230, fill=LN, width=2)
    # wydeptana murawa przed bramką
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    od.ellipse([x0 - 30 if sgn == 1 else x0 - 30, 118, x0 + 50, 202], fill=(120, 96, 52, 60)) if sgn == 1 else od.ellipse([x0 - 50, 118, x0 + 30, 202], fill=(120, 96, 52, 60))
    im = Image.alpha_composite(im.convert('RGBA'), ov).convert('RGB'); d = ImageDraw.Draw(im)
# chorągiewki
for (x, y) in ((L, T), (R, T), (L, B), (R, B)):
    d.rectangle([x - 1, y - 1, x + 1, y + 1], fill=(235, 235, 235)); d.rectangle([x + (1 if x < W // 2 else -4), y - 1, x + (4 if x < W // 2 else 1), y + 1], fill=(220, 50, 50))
# BRAMKI (siatka za linią końcową) – otwór y 112..208
for sgn, x0, x1 in ((1, 0, L), (-1, R, W - 1)):
    d.rectangle([x0, 112, x1, 208], fill=(30, 40, 34))
    for y in range(112, 209, 6): d.line([(x0, y), (x1, y)], fill=(160, 175, 165), width=1)
    for x in range(x0, x1 + 1, 4): d.line([(x, 112), (x, 208)], fill=(160, 175, 165), width=1)
    pxl = L - 3 if sgn == 1 else R
    d.rectangle([x0 if sgn == 1 else x1 - 2, 110, x1 if sgn == 1 else x1, 113], fill=(250, 250, 250)); d.rectangle([x0 if sgn == 1 else x1 - 2, 207, x1 if sgn == 1 else x1, 210], fill=(250, 250, 250))
    px = L - 1 if sgn == 1 else R - 1
    d.rectangle([px, 110, px + 2, 210], fill=(250, 250, 250))
im.save(os.path.join(A, 'pitch.png')); print('pitch OK')
