"""Generuje grafiki etapu PUSTYNIA: skorpion, mumia, sfinks (boss) + tło pustyni + efekt piasku.
Osobny skrypt. Uruchom: python3 generate_desert.py  (wymaga Pillow)"""
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

def finish(im):
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

# ---------- Skorpion (32x32) ----------
def scorpion(P, k, f):
    a = k == 'a'; s = f if k == 'i' else 0
    # ciało
    P.e(14, 18+s, 8, 5, '8a5a1a')
    P.e(14, 17+s, 7, 4, 'a87a2a')
    # odnóża
    for dx, dy in ((-6, 2), (-4, 4), (4, 4), (6, 2), (-2, 5), (2, 5)):
        P.l((14, 18+s), (14+dx, 22+s+dy//2), '6a3a10', 1)
    # ogon z żądłem
    if a:
        P.l((20, 16), (26, 8), '7a4a12', 2)
        P.l((26, 8), (28, 4), '5a2a08', 2)
        P.e(29, 3, 2, 2, 'c03030')  # żądło
    else:
        P.l((20, 16+s), (24, 12+s), '7a4a12', 2)
        P.l((24, 12+s), (26, 8+s), '5a2a08', 2)
        P.e(27, 7+s, 2, 2, 'c03030')
    # szczypce
    P.l((8, 16+s), (2, 12+s), '8a5a1a', 2)
    P.l((2, 12+s), (0, 10+s), '6a3a10', 1); P.l((2, 12+s), (1, 14+s), '6a3a10', 1)
    P.l((10, 15+s), (4, 18+s), '8a5a1a', 2)
    # oczy
    P.r(10, 15+s, 11, 16+s, '101020'); P.r(16, 15+s, 17, 16+s, '101020')

# ---------- Mumia (32x32) ----------
def mummy(P, k, f):
    a = k == 'a'; s = f if k == 'i' else 0
    # bandaże
    P.r(11, 12+s, 21, 28, 'd8d0b0')
    for y in range(13, 27, 3):
        P.r(11, y+s, 21, y+s, 'c0b898')
    # nogi
    P.r(12, 26+s, 15, 31, 'c8c0a0'); P.r(17, 26+s, 20, 31, 'c8c0a0')
    # głowa
    P.e(16, 9+s, 5, 5, 'e0d8c0')
    P.r(13, 8+s, 19, 10+s, 'c8c0a0')  # bandaż na głowie
    P.r(13, 9+s, 14, 10+s, '2a1a10'); P.r(18, 9+s, 19, 10+s, '2a1a10')  # oczy
    # ręce
    if a:
        P.r(21, 14, 28, 17, 'd0c8a8')
        P.r(26, 13, 29, 15, 'b8b090')
    else:
        P.r(21, 16+s, 24, 22+s, 'd0c8a8')
        P.r(8, 16+s, 11, 22+s, 'd0c8a8')
    # strzępy
    P.r(10, 20+s, 11, 24+s, 'b8b090'); P.r(21, 18+s, 22, 23+s, 'b8b090')

# ---------- Sfinks – boss (48x48) ----------
def sphinx(P, k, f):
    a = k == 'a'; sand = (k == 'a' and f == 1); s = f if k == 'i' else 0
    # ciało lwa
    P.e(22, 30+s, 14, 10, 'c8a050')
    P.e(22, 28+s, 13, 9, 'e0b860')
    # łapy
    P.r(10, 34+s, 16, 42, 'b89040'); P.r(28, 34+s, 34, 42, 'b89040')
    P.r(8, 40+s, 17, 43, 'a07830'); P.r(27, 40+s, 36, 43, 'a07830')
    # ogon
    P.l((34, 28+s), (42, 22+s), 'c8a050', 3)
    P.e(43, 20+s, 3, 3, 'a07830')
    # skrzydła
    if sand:
        P.p([(8, 20), (0, 8), (4, 18), (2, 24)], 'd0b870')
        P.p([(36, 20), (46, 6), (44, 16), (42, 24)], 'd0b870')
        # chmura piasku
        for i in range(8):
            px = 10 + i*4; py = 12 + (i%3)*3
            P.e(px, py, 2+i%2, 1+i%2, 'e8d090')
    else:
        P.p([(10, 22), (2, 14), (6, 20), (4, 26)], 'c8a860')
        P.p([(34, 22), (44, 12), (40, 18), (38, 26)], 'c8a860')
    # głowa ludzka + nemes
    P.e(22, 14+s, 7, 7, 'e8c8a0')
    # nemes (chusta)
    P.p([(14, 8+s), (30, 8+s), (32, 18+s), (12, 18+s)], '2a4a8a')
    P.p([(14, 8+s), (30, 8+s), (28, 4+s), (16, 4+s)], '1a3a6a')
    P.r(20, 4+s, 24, 6+s, 'd4a020')  # uraeus / złoty pasek
    # twarz
    P.r(19, 13+s, 20, 14+s, '1a1020'); P.r(24, 13+s, 25, 14+s, '1a1020')
    P.r(20, 17+s, 24, 18+s, 'a06040')
    if a and not sand:
        # pazur / uderzenie
        P.r(34, 24, 44, 28, 'b89040')
        P.r(42, 22, 46, 26, '8a6020')

# generuj sprite'y
for n, fn, S in (('scorpion', scorpion, 32), ('mummy', mummy, 32), ('sphinx', sphinx, 48)):
    idle = [frame(fn, S, 'i', 0), frame(fn, S, 'i', 1, dy=1)]
    save(sheet(idle), 'enemies', n)
    if n == 'sphinx':
        save(sheet([frame(fn, S, 'a', 0, dx=2), frame(fn, S, 'a', 1, dx=1)]), 'enemies', n + '_attack')
    else:
        save(sheet([frame(fn, S, 'a', 0, dx=2), frame(fn, S, 'a', 1, dx=4)]), 'enemies', n + '_attack')
    save(tint(frame(fn, S, 'i', 0, dx=-2)), 'enemies', n + '_hurt')
    dead = []
    for k, al in ((.75, 230), (.45, 170), (.15, 100)):
        im = idle[0].resize((S, max(1, int(S*k))), Image.NEAREST)
        c = Image.new('RGBA', (S, S), (0, 0, 0, 0)); c.paste(im, (0, S - im.height))
        c.putalpha(c.getchannel('A').point(lambda v, al=al: v and al)); dead.append(c)
    save(sheet(dead), 'enemies', n + '_death')

# efekt piasku (32x32 pasek 4 klatek)
sand_frames = []
for fi in range(4):
    im = Image.new('RGBA', (32, 32), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    random.seed(100 + fi)
    for i in range(18):
        x = random.randint(4, 28); y = random.randint(6, 26)
        r = random.randint(1, 3)
        col = random.choice(['#e8d090', '#d0b870', '#c8a860', '#f0e0a8'])
        d.ellipse([x-r, y-r, x+r, y+r], fill=C(col))
    sand_frames.append(finish(im))
save(sheet(sand_frames), 'effects', 'sand')

# ---------- Tło: PUSTYNIA 640x320 ----------
def desert(d, hz):
    random.seed('desert')
    # niebo – upał
    for y in range(hz):
        d.line([(0, y), (160, y)], fill=lerp(H('#f0c878'), H('#f8e8b0'), y/hz))
    # piramidy w oddali
    d.polygon([(20, hz), (40, hz-22), (60, hz)], fill=H('#c8a060'))
    d.polygon([(90, hz), (115, hz-28), (140, hz)], fill=H('#b89050'))
    d.polygon([(100, hz), (115, hz-18), (130, hz)], fill=H('#d0a870'))
    # wydmy
    for pts, col in [([(0, hz+5), (30, hz-4), (60, hz+2), (90, hz-6), (120, hz), (160, hz+3), (160, 80), (0, 80)], '#e0c878'),
                     ([(0, hz+12), (40, hz+4), (80, hz+10), (120, hz+2), (160, hz+8), (160, 80), (0, 80)], '#d0b060')]:
        d.polygon(pts, fill=H(col))
    # piasek – tekstura
    for i in range(200):
        x = random.randint(0, 159); y = random.randint(hz, 79)
        d.point((x, y), fill=H(random.choice(['#e8d080', '#c8a850', '#f0e0a0', '#d8b868'])))
    # kaktusy
    def cactus(x, base, h):
        d.rectangle([x-2, base-h, x+2, base], fill=H('#3a7a3a'))
        d.rectangle([x-6, base-h+4, x-2, base-h+10], fill=H('#3a7a3a'))
        d.rectangle([x+2, base-h+6, x+6, base-h+12], fill=H('#3a7a3a'))
        for yy in range(base-h, base, 3):
            d.point((x, yy), fill=H('#2a5a2a'))
    for x in (18, 55, 105, 145):
        cactus(x, hz+8+random.randint(0, 4), random.randint(10, 16))
    # kości / kamienie
    for cx, cy in ((35, 65), (88, 72), (125, 60)):
        d.ellipse([cx-4, cy-2, cx+4, cy+2], fill=H('#a09070'))

bg = Image.new('RGB', (160, 80)); dd = ImageDraw.Draw(bg)
desert(dd, 42)
save(bg.resize((640, 320), Image.NEAREST), 'maps', 'desert')
print('Desert OK')
