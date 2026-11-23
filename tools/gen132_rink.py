"""v1.3.2 – mapa LODOWISKO (640x320, widok z góry) dla minigry hokej-z-piłką. Uruchom: python3 gen132_rink.py"""
from PIL import Image, ImageDraw, ImageFilter
import os, random, math
A = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'maps')
random.seed(132)
W, H = 640, 320
L, R, T, B, RC = 16, 624, 28, 296, 44                 # tafla lodu (linie końcowe i boczne), promień rogów
im = Image.new('RGB', (W, H), (14, 18, 38)); d = ImageDraw.Draw(im)
# trybuny: ciemne tło + kolorowi kibice
for y in range(H):
    d.line([(0, y), (W, y)], fill=(14 + y // 40, 18 + y // 50, 38 + y // 30))
cols = [(200, 60, 60), (240, 200, 80), (80, 140, 220), (230, 230, 240), (90, 190, 120), (190, 90, 200), (240, 140, 60)]
for _ in range(900):
    x, y = random.randrange(W), random.randrange(H)
    if T - 6 < y < B + 6 and L - 6 < x < R + 6: continue
    c = random.choice(cols); dim = random.uniform(.35, .75)
    d.rectangle([x, y, x + 2, y + 3], fill=tuple(int(v * dim) for v in c))
# bandy: ciemna obwódka + jasny pas, zaokrąglone rogi
def rr(box, r, fill=None, outline=None, width=1):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)
rr([L - 10, T - 10, R + 10, B + 10], RC + 10, fill=(24, 38, 72))
rr([L - 6, T - 6, R + 6, B + 6], RC + 6, fill=(224, 238, 248))
rr([L - 3, T - 3, R + 3, B + 3], RC + 3, fill=(40, 60, 100))
# lód z delikatnym gradientem
ice = Image.new('RGB', (W, H)); idr = ImageDraw.Draw(ice)
for y in range(H):
    t = (y - T) / (B - T); c = (int(222 - 20 * t), int(238 - 14 * t), int(250 - 6 * t)); idr.line([(0, y), (W, y)], fill=c)
mask = Image.new('L', (W, H), 0); ImageDraw.Draw(mask).rounded_rectangle([L, T, R, B], radius=RC, fill=255)
im.paste(ice, (0, 0), mask); d = ImageDraw.Draw(im)
# rysy po łyżwach
sc = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(sc)
for _ in range(220):
    x0, y0 = random.randrange(L, R), random.randrange(T, B); a = random.uniform(0, math.tau); ln = random.randint(30, 120)
    x1, y1 = x0 + math.cos(a) * ln, y0 + math.sin(a) * ln * .4
    sd.line([(x0, y0), (x1, y1)], fill=random.choice(((255, 255, 255, 60), (150, 190, 220, 50))), width=1)
sc.putalpha(Image.composite(sc.getchannel('A'), Image.new('L', (W, H), 0), mask)); im = Image.alpha_composite(im.convert('RGBA'), sc).convert('RGB'); d = ImageDraw.Draw(im)
RED, BLUE = (214, 60, 70), (60, 110, 200)
# linie: czerwona środkowa (kreskowana), niebieskie, bramkowe
d.rectangle([W // 2 - 3, T, W // 2 + 3, B], fill=RED)
for y in range(T, B, 14): d.rectangle([W // 2 - 1, y, W // 2 + 1, y + 6], fill=(240, 240, 250))
for x in (214, 426): d.rectangle([x - 3, T, x + 3, B], fill=BLUE)
for x in (L + 26, R - 26): d.line([(x, T + 8), (x, B - 8)], fill=RED, width=2)
d.ellipse([W // 2 - 42, H // 2 - 42, W // 2 + 42, H // 2 + 42], outline=BLUE, width=3); d.ellipse([W // 2 - 5, H // 2 - 5, W // 2 + 5, H // 2 + 5], fill=BLUE)
for x, y in ((120, 96), (120, 224), (520, 96), (520, 224)):
    d.ellipse([x - 24, y - 24, x + 24, y + 24], outline=RED, width=2); d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=RED)
# przybramkowe pola (jasnoniebieskie półkola)
for sgn, x0 in ((1, L), (-1, R)):
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    od.pieslice([x0 - 52 if sgn == 1 else x0 - 52, H // 2 - 52, x0 + 52, H // 2 + 52], -90 if sgn == 1 else 90, 90 if sgn == 1 else 270, fill=(120, 170, 235, 110), outline=RED, width=2)
    im = Image.alpha_composite(im.convert('RGBA'), ov).convert('RGB'); d = ImageDraw.Draw(im)
# szyby: odbicie światła wzdłuż band
gl = Image.new('RGBA', (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(gl)
gd.rounded_rectangle([L - 6, T - 6, R + 6, B + 6], radius=RC + 6, outline=(255, 255, 255, 70), width=2)
gd.arc([L + 4, T + 4, L + 2 * RC, T + 2 * RC], 190, 260, fill=(255, 255, 255, 120), width=3)
im = Image.alpha_composite(im.convert('RGBA'), gl).convert('RGB'); d = ImageDraw.Draw(im)
# BRAMKI: wycięcie w bandzie + siatka za linią końcową (otwór y 112..208)
for sgn, x0, x1 in ((1, 0, L), (-1, R, W - 1)):
    d.rectangle([x0, 112, x1, 208], fill=(24, 30, 44))
    for y in range(112, 209, 6): d.line([(x0, y), (x1, y)], fill=(170, 185, 205), width=1)
    for x in range(x0, x1 + 1, 4): d.line([(x, 112), (x, 208)], fill=(170, 185, 205), width=1)
    px = L - 3 if sgn == 1 else R - 1
    d.rectangle([px, 108, px + 4, 212], fill=(230, 60, 70)); d.rectangle([x0 if sgn == 1 else x1 - 12, 108, x1 if sgn == 1 else x1, 113], fill=(230, 60, 70)); d.rectangle([x0 if sgn == 1 else x1 - 12, 207, x1 if sgn == 1 else x1, 212], fill=(230, 60, 70))
im.save(os.path.join(A, 'rink.png')); print('rink OK')
