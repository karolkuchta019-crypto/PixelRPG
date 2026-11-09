"""Generuje grafiki etapu MOCZARY: utopiec z trójzębem, chmara komarów, wiedźma na miotle + tło moczarów.
Osobny skrypt (nie rusza reszty assetów). Uruchom: python3 generate_swamp.py  (wymaga Pillow)
Możesz edytować funkcje rysujące albo po prostu nadpisać pliki własnymi grafikami."""
from PIL import Image, ImageDraw
import math, random, os
A = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')
H = lambda h: tuple(int(h[i:i+2], 16) for i in (1, 3, 5))
C = lambda h: H('#' + h.lstrip('#')) + (255,)
lerp = lambda a, b, t: tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

class Pen:
    def __init__(s, im, dx=0, dy=0): s.d = ImageDraw.Draw(im); s.dx = dx; s.dy = dy
    def r(s, x0, y0, x1, y1, c): s.d.rectangle([x0+s.dx, y0+s.dy, x1+s.dx, y1+s.dy], fill=C(c))
    def e(s, x, y, rx, ry, c): s.d.ellipse([x-rx+s.dx, y-ry+s.dy, x+rx+s.dx, y+ry+s.dy], fill=C(c))
    def p(s, pts, c): s.d.polygon([(x+s.dx, y+s.dy) for x, y in pts], fill=C(c))
    def l(s, a, b, c, w=2): s.d.line([(a[0]+s.dx, a[1]+s.dy), (b[0]+s.dx, b[1]+s.dy)], fill=C(c), width=w)

def finish(im):  # światło/cień + kontur (jak w generate_assets.py)
    w, h = im.size; p = im.load(); q = im.copy(); qp = q.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = p[x, y]
            if not a: continue
            up = p[x, y-1][3] if y else 0; dn = p[x, y+1][3] if y < h-1 else 0
            if not up: qp[x, y] = tuple(min(255, int(c*1.3+18)) for c in (r, g, b)) + (255,)
            elif not dn: qp[x, y] = tuple(int(c*.72) for c in (r, g, b)) + (255,)
    for y in range(h):
        for x in range(w):
            if not p[x, y][3]:
                nb = [p[x+i, y+j] for i, j in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= x+i < w and 0 <= y+j < h and p[x+i, y+j][3]]
                if nb: n = nb[0]; qp[x, y] = (int(n[0]*.22)+10, int(n[1]*.18)+6, int(n[2]*.28)+16, 255)
    return q

# ---------- Utopiec z trójzębem (32x32, patrzy w prawo) ----------
def drowned(P, k, f):
    a = k == 'a'; s = f if k == 'i' else 0
    SK = '7aa090'; SD = '5a8070'; CL = '3a4a38'; CD = '2a3828'; WD = '2f6a3a'
    P.r(12, 24, 14, 30, SD); P.r(18, 24, 20, 30, SD); P.r(11, 29, 14, 30, '3a3a30'); P.r(18, 29, 21, 30, '3a3a30')
    P.r(10, 15, 22, 25, CL); P.p([(10, 25), (12, 28), (14, 25), (16, 29), (18, 25), (20, 28), (22, 25)], CL); P.r(10, 22, 22, 23, CD)
    P.r(9, 14, 12, 15, WD); P.r(8, 15, 9, 19, WD); P.r(21, 14, 23, 15, WD); P.r(7, 16, 10, 23, SK)
    P.e(16, 10+s, 5, 5, SK)
    P.r(11, 4+s, 21, 6+s, WD); P.r(10, 6+s, 11, 13+s, WD); P.r(21, 6+s, 22, 12+s, WD); P.r(12, 3+s, 14, 4+s, '3a8a4a')
    P.r(13, 10+s, 14, 11+s, 'e8ffa0'); P.r(18, 10+s, 19, 11+s, 'e8ffa0')
    P.r(14, 13+s, 18, 14+s, '101020'); P.r(15, 14+s, 17, 14+s, '8a2a2a'); P.r(9, 17, 9, 19, '8ad0e8'); P.r(11, 26, 11, 27, '8ad0e8')
    if a:   # pchnięcie trójzębem
        P.r(21, 17, 24, 19, SK); P.r(10, 18, 24, 19, '7a5a3a')
        P.r(24, 14, 25, 23, 'cfd6e0'); P.r(25, 14, 26, 15, 'cfd6e0'); P.r(25, 18, 26, 19, 'cfd6e0'); P.r(25, 22, 26, 23, 'cfd6e0')
    else:   # trójząb pionowo
        P.r(22, 17, 25, 21, SK); P.r(24, 5, 25, 29, '7a5a3a'); P.r(21, 5, 28, 6, 'cfd6e0')
        P.r(21, 1, 22, 5, 'cfd6e0'); P.r(24, 0, 25, 4, 'cfd6e0'); P.r(27, 1, 28, 5, 'cfd6e0')

# ---------- Chmara komarów (32x32) ----------
def mosquito(P, x, y, flap):
    P.r(x-4, y, x-1, y+1, '4a3a3a'); P.r(x-3, y, x-3, y+1, '9a9a9a')        # odwłok
    P.r(x, y-1, x+2, y+1, '3a3a44'); P.r(x+3, y, x+4, y+1, '2a2a34')         # tułów, głowa
    P.r(x+3, y, x+3, y, 'ff3030'); P.r(x+5, y+1, x+7, y+1, 'd8d8d8')          # oko, długi kłujący aparat
    if flap: P.l((x, y-1), (x-2, y-5), 'e0f4ff', 1); P.l((x+1, y-1), (x+3, y-4), 'e0f4ff', 1)
    else:    P.l((x, y-1), (x-3, y-3), 'e0f4ff', 1); P.l((x+1, y-1), (x+4, y-2), 'e0f4ff', 1)
    P.l((x-1, y+2), (x-2, y+4), '2a2a30', 1); P.l((x+1, y+2), (x+1, y+4), '2a2a30', 1)
def mosquitos(P, k, f):
    pts = [(8, 8), (17, 5), (12, 14), (19, 17), (6, 21), (14, 24), (20, 10), (9, 28)]
    for i, (x, y) in enumerate(pts):
        mosquito(P, x, y + (1 if (i + f) % 2 else 0), (i + f) % 2 == 0)
    for x, y in ((4, 14), (16, 20), (22, 24), (11, 4)): P.r(x, y, x, y, 'a02020')   # krople krwi

# ---------- Wiedźma na miotle (48x48, boss) ----------
def witch(P, k, f):
    a = k == 'a'; s = f if k == 'i' else 0
    P.r(3, 33, 41, 35, '8a5a2a'); P.r(3, 33, 41, 33, 'a87a3a'); P.r(41, 33, 43, 35, '6a4a1a')   # miotła
    P.p([(7, 32), (0, 28), (0, 41), (7, 36)], 'c8a050'); P.l((7, 34), (0, 31), '8a6a30', 1); P.l((7, 34), (0, 35), '8a6a30', 1); P.l((7, 35), (0, 39), '8a6a30', 1)
    P.r(7, 32, 8, 36, '5a3a1a')
    P.p([(17, 19), (8, 30), (6, 25), (14, 17)], '3a1a5a')                                          # powiewająca peleryna
    P.r(21, 36+s, 23, 43+s, '2a1a3a'); P.r(20, 43+s, 25, 44+s, '1a1a22'); P.r(27, 36+s, 29, 42+s, '2a1a3a'); P.r(26, 42+s, 31, 43+s, '1a1a22')   # nogi
    P.p([(15, 30), (30, 30), (32, 37), (13, 37)], '4a2268')                                        # spódnica
    P.r(17, 17, 28, 31, '5a2a7a'); P.r(17, 26, 28, 27, 'f2c14e')                                   # tułów, pas
    if a:   # ręka w górze z buteleczką trucizny
        P.l((27, 21), (36, 14), '5a2a7a', 3); P.e(37, 13, 2, 2, '8ac07a'); P.r(36, 6, 39, 12, '3a9a5a'); P.r(37, 4, 38, 6, '8ae0a0'); P.r(36, 8, 39, 9, 'a0ff90')
        P.l((17, 21), (11, 33), '5a2a7a', 3)
    else:
        P.l((27, 21), (36, 32), '5a2a7a', 3); P.e(37, 33, 2, 2, '8ac07a'); P.l((18, 21), (14, 32), '5a2a7a', 3)
    P.r(17, 9+s, 19, 22+s, '9a9aa8'); P.r(16, 14+s, 17, 24+s, '9a9aa8')                               # siwe włosy
    P.e(24, 12+s, 6, 6, '8ac07a'); P.p([(29, 12+s), (35, 16+s), (29, 16+s)], '7ab06a'); P.r(33, 15+s, 33, 15+s, '4a7a3a')
    P.r(26, 11+s, 27, 12+s, 'ffe030'); P.r(24, 16+s, 29, 16+s, '401018'); P.r(26, 17+s, 26, 17+s, 'ffffff')
    P.p([(12, 9+s), (38, 9+s), (36, 11+s), (14, 11+s)], '1a1228')                                   # rondo kapelusza
    P.p([(19, 9+s), (29, 9+s), (33, 1+s), (27, 0+s), (24, 4+s)], '241838'); P.r(20, 7+s, 28, 8+s, 'c03050'); P.r(23, 7+s, 25, 8+s, 'f2c14e')

def frame(fn, S, k, f, dx=0, dy=0):
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); fn(Pen(im, dx, dy), k, f); return finish(im)
def tint(im, t=.6):
    q = im.copy(); p = q.load()
    for y in range(q.height):
        for x in range(q.width):
            r, g, b, a = p[x, y]
            if a: p[x, y] = (int(r+(255-r)*t), int(g+(255-g)*t), int(b+(255-b)*t), a)
    return q
def sheet(fr):
    o = Image.new('RGBA', (sum(i.width for i in fr), fr[0].height), (0, 0, 0, 0)); x = 0
    for i in fr: o.paste(i, (x, 0)); x += i.width
    return o
def save(im, d, n): os.makedirs(os.path.join(A, d), exist_ok=True); im.save(os.path.join(A, d, n + '.png'))

for n, fn, S in (('drowned', drowned, 32), ('mosquitos', mosquitos, 32), ('witch', witch, 48)):
    idle = [frame(fn, S, 'i', 0), frame(fn, S, 'i', 1, dy=(n != 'mosquitos') * 1)]
    save(sheet(idle), 'enemies', n)
    save(sheet([frame(fn, S, 'a', 0, dx=2), frame(fn, S, 'a', 1, dx=5)]), 'enemies', n + '_attack')
    save(tint(frame(fn, S, 'i', 0, dx=-3)), 'enemies', n + '_hurt')
    dead = []
    for k, al in ((.75, 230), (.45, 170), (.15, 100)):
        im = idle[0].resize((S, max(1, int(S*k))), Image.NEAREST); c = Image.new('RGBA', (S, S), (0, 0, 0, 0)); c.paste(im, (0, S - im.height))
        c.putalpha(c.getchannel('A').point(lambda v, al=al: v and al)); dead.append(c)
    save(sheet(dead), 'enemies', n + '_death')

# ---------- Tło: MOCZARY 640x320 (rysowane 160x80 i powiększane x4) ----------
def swamp(d, hz):
    random.seed('swamp')
    # mgła/zmierzch: jaśniejszy pas nad horyzontem
    for y in range(hz-12, hz): d.line([(0, y), (160, y)], fill=lerp(H('#9ab8a0'), H('#c4d4b0'), (y-hz+12)/12))
    # drzewa namorzynowe – dalszy plan (zamglone) i bliższy (ciemniejszy)
    def mangrove(x, base, h, trunk, leaf, root):
        d.line([(x, base-4), (x, base-h)], fill=H(trunk), width=2)
        for i, off in enumerate((-9, -5, 5, 9)):          # łukowate korzenie podporowe
            top = base - h*.55 + i % 2*3
            d.line([(x, top), (x+off*.6, base-h*.2)], fill=H(root)); d.line([(x+off*.6, base-h*.2), (x+off, base)], fill=H(root))
        for dx, dy, r in ((0, -h, 9), (-8, -h+4, 6), (8, -h+3, 7), (3, -h-5, 6)):
            d.ellipse([x+dx-r, base+dy-r*.7, x+dx+r, base+dy+r*.7], fill=H(leaf))
        d.ellipse([x-6, base-h-3, x+1, base-h], fill=lerp(H(leaf), (255, 255, 200), .18))
    for x in range(-4, 170, 17): mangrove(x+random.randint(-3, 3), hz+1, random.randint(14, 19), '#4a6a5a', '#5a8068', '#4a6a5a')
    for x in (6, 33, 74, 141, 156): mangrove(x, hz+3, random.randint(19, 25), '#2a2218', '#2a4a32', '#3a2e20')
    # woda przy horyzoncie + ląd
    d.rectangle([0, hz, 160, 80], fill=H('#46583a'))
    for y in range(hz, hz+8): d.line([(0, y), (160, y)], fill=lerp(H('#5a8a78'), H('#3e6a5c'), (y-hz)/8))
    for i in range(14): x = random.randint(0, 150); y = random.randint(hz+1, hz+6); d.line([(x, y), (x+random.randint(4, 9), y)], fill=H('#9ac4b4'))
    for i in range(90):
        x = random.randint(0, 159); y = random.randint(hz+8, 79)
        d.point((x, y), fill=H(random.choice(['#3a4a2e', '#5a6a42', '#2e3a26', '#6a7a4a', '#4e5a38'])))
    # kałuże z odbiciem, grzęzawiska
    for cx, cy, rx, ry in ((22, 58, 14, 4), (60, 70, 17, 4), (96, 54, 9, 3), (132, 66, 15, 4), (150, 50, 7, 2)):
        d.ellipse([cx-rx-1, cy-ry-1, cx+rx+1, cy+ry+1], fill=H('#2e3a26')); d.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill=H('#4a7a6a'))
        d.line([(cx-rx*.6, cy-ry*.4), (cx+rx*.2, cy-ry*.4)], fill=H('#8ab8a8')); d.point((cx+rx*.4, cy+ry*.3), fill=H('#8ab8a8'))
        for j in range(2): lx = cx-rx*.5+j*rx*.7; d.ellipse([lx-2, cy-1, lx+2, cy+1], fill=H('#5aa04a')); d.point((lx, cy), fill=H('#a8e070'))
    # chatka wiedźmy na kurzej stopie
    cx = 118; top = hz-24; bot = hz-10
    for sx, flip in ((cx-8, -1), (cx+7, 1)):              # kurze nogi (gruba łuska + pazury)
        d.line([(sx, bot), (sx+flip*3, bot+7)], fill=H('#d9a82a'), width=3)
        d.line([(sx+flip*3, bot+7), (sx-flip*1, hz+2)], fill=H('#d9a82a'), width=2)
        for t in (-4, 0, 4): d.line([(sx-flip*1, hz+2), (sx-flip*1+t, hz+5)], fill=H('#8a5a1a'), width=1)
        d.point((sx+flip*3, bot+7), fill=H('#8a5a1a'))
    d.rectangle([cx-13, top, cx+13, bot], fill=H('#6a4a2a')); d.rectangle([cx-13, top, cx+13, top+1], fill=H('#8a6a3a'))
    for y in range(top+3, bot, 4): d.line([(cx-13, y), (cx+13, y)], fill=H('#4a321c'))
    d.polygon([(cx-17, top+1), (cx+17, top+1), (cx+4, top-11), (cx-4, top-11)], fill=H('#3a2a4a'))      # dach
    d.polygon([(cx-17, top+1), (cx+17, top+1), (cx+14, top-2), (cx-14, top-2)], fill=H('#52386a'))
    d.rectangle([cx+6, top-13, cx+9, top-5], fill=H('#2a2a30')); d.rectangle([cx+5, top-14, cx+10, top-13], fill=H('#3a3a44'))   # komin
    for i, (px, py, r) in enumerate(((cx+12, top-15, 2), (cx+18, top-17, 3), (cx+25, top-16, 3))): d.ellipse([px-r, py-r, px+r, py+r], fill=H('#a8b0a8'))   # dym
    d.rectangle([cx-9, top+5, cx-3, top+11], fill=H('#ffd060')); d.rectangle([cx-9, top+5, cx-3, top+5], fill=H('#fff0a0'))
    d.line([(cx-6, top+5), (cx-6, top+11)], fill=H('#6a3a1a')); d.line([(cx-9, top+8), (cx-3, top+8)], fill=H('#6a3a1a'))   # okno
    d.rectangle([cx+3, top+6, cx+9, bot], fill=H('#2a1a10')); d.point((cx+8, top+12), fill=H('#f2c14e'))                 # drzwi
    d.rectangle([cx-3, bot, cx+10, bot+1], fill=H('#5a3a1a'))                                                              # schodek
    d.line([(cx-17, top+2), (cx-17, top+8)], fill=H('#2a2a2a')); d.ellipse([cx-19, top+8, cx-15, top+12], fill=H('#7aff5a'))  # zielona latarnia
    for hx in (cx-12, cx-9, cx-6): d.line([(hx, top+13), (hx, top+15)], fill=H('#7a9a4a'))                                 # suszone zioła
    # trzciny / pałki przy brzegu
    for x in (3, 11, 40, 52, 86, 104, 140, 152, 157):
        y = random.randint(66, 78); hgt = random.randint(7, 12)
        for j in (-1, 0, 1): d.line([(x+j, y), (x+j*2, y-hgt)], fill=H('#6a7a3a'))
        d.rectangle([x-1, y-hgt-3, x, y-hgt+1], fill=H('#5a3a22'))
    # świetliki i opary
    for i in range(10): d.point((random.randint(4, 156), random.randint(hz+4, 70)), fill=H('#d8ff70'))
bg = Image.new('RGB', (160, 80)); dd = ImageDraw.Draw(bg)
for y in range(42): dd.line([(0, y), (160, y)], fill=lerp(H('#6e8e80'), H('#b6ccb0'), (y//4*4)/42))
swamp(dd, 42)
# delikatna mgła przy horyzoncie (mieszanie kolorów)
px = bg.load()
for y in range(36, 50):
    k = max(0, 1 - abs(y - 43) / 7) * .35
    for x in range(160): px[x, y] = tuple(int(px[x, y][i]*(1-k) + (200, 214, 196)[i]*k) for i in range(3))
save(bg.resize((640, 320), Image.NEAREST), 'maps', 'swamp')
print('OK')
