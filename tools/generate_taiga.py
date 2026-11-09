"""Generuje grafiki etapu TAJGA: niedźwiedź brunatny, bóbr, leszy (boss z czaszką jelenia) + tło tajgi.
Osobny skrypt. Uruchom: python3 generate_taiga.py  (wymaga Pillow)"""
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

# ---------- Niedźwiedź brunatny (32x32) ----------
def bear(P, k, f):
    a = k == 'a'; s = f if k == 'i' else 0
    # ciało
    P.e(16, 20+s, 11, 9, '6a3a1a'); P.e(16, 18+s, 10, 8, '8a5a2a')
    # łapy
    P.r(8, 24+s, 12, 30, '5a2a12'); P.r(20, 24+s, 24, 30, '5a2a12')
    P.r(7, 28+s, 13, 30, '3a1a0a'); P.r(19, 28+s, 25, 30, '3a1a0a')
    # głowa
    P.e(16, 10+s, 7, 6, '7a4a22')
    P.e(10, 8+s, 3, 3, '6a3a1a'); P.e(22, 8+s, 3, 3, '6a3a1a')  # uszy
    P.r(13, 9+s, 14, 10+s, '101020'); P.r(18, 9+s, 19, 10+s, '101020')  # oczy
    P.e(16, 13+s, 2, 1, '2a1a0a')  # nos
    if a:  # drapnięcie – łapa wyciągnięta
        P.r(24, 14, 31, 18, '6a3a1a')
        P.r(29, 12, 31, 14, '3a1a0a'); P.r(29, 16, 31, 19, '3a1a0a'); P.r(30, 14, 31, 16, '3a1a0a')
    else:
        P.r(24, 16+s, 27, 22+s, '6a3a1a')

# ---------- Bóbr (32x32) ----------
def beaver(P, k, f):
    a = k == 'a'; s = f if k == 'i' else 0
    # ciało
    P.e(15, 20+s, 9, 7, '6a4a2a'); P.e(15, 18+s, 8, 6, '8a6a3a')
    # ogon
    P.p([(4, 22+s), (0, 24+s), (1, 28+s), (6, 26+s)], '4a2a12')
    # nogi
    P.r(10, 25+s, 13, 30, '5a3a1a'); P.r(17, 25+s, 20, 30, '5a3a1a')
    # głowa
    P.e(20, 12+s, 6, 5, '7a5a2a')
    P.r(22, 11+s, 23, 12+s, '101020'); P.r(18, 11+s, 19, 12+s, '101020')
    P.r(24, 14+s, 27, 16+s, 'f0e0c0')  # zęby
    P.r(25, 13+s, 26, 14+s, 'e8d0a0')
    if a:  # gryzienie / uderzenie ogonem
        P.p([(2, 18), (-2, 20), (-1, 26), (5, 24)], '3a1a0a')
        P.r(24, 10, 28, 14, '8a6a3a')
    else:
        P.r(24, 12+s, 26, 15+s, '8a6a3a')

# ---------- Leszy – boss z czaszką jelenia (48x48) ----------
def leshy(P, k, f):
    a = k == 'a'; roar = (k == 'a' and f == 1); s = f if k == 'i' else 0
    # korpus – mech, drewno, korzenie
    P.p([(14, 22), (10, 38), (16, 44), (32, 44), (38, 38), (34, 22)], '3a5a2a')
    P.r(16, 20+s, 32, 40, '4a6a32')
    P.r(18, 28, 30, 30, '2a4a1a')  # pas z mchu
    # nogi korzeniowe
    P.l((18, 40), (12, 47), '2a3a18', 3); P.l((30, 40), (36, 47), '2a3a18', 3)
    P.r(10, 45, 15, 47, '1a2a10'); P.r(33, 45, 38, 47, '1a2a10')
    # ramiona
    if roar:
        # ryk – ręce w górze, usta otwarte
        P.l((16, 24), (6, 10), '3a5a2a', 4); P.l((32, 24), (42, 10), '3a5a2a', 4)
        P.e(6, 8, 3, 3, '2a3a18'); P.e(42, 8, 3, 3, '2a3a18')
        # fale dźwięku
        for i, r in enumerate((8, 12, 16)):
            P.d.arc([24-r+P.dx, 8-r+P.dy, 24+r+P.dx, 8+r+P.dy], 200, 340, fill=C('8ac07a'))
    elif a:
        # drapnięcie pazurami – ręka wyciągnięta
        P.l((32, 24), (44, 20), '3a5a2a', 4)
        P.r(42, 16, 47, 18, '1a2a10'); P.r(43, 18, 47, 22, '1a2a10'); P.r(44, 22, 47, 25, '1a2a10')
        P.l((16, 26), (10, 34), '3a5a2a', 3)
    else:
        P.l((16, 26), (8, 34), '3a5a2a', 3); P.l((32, 26), (40, 34), '3a5a2a', 3)
        P.e(6, 34, 3, 3, '2a3a18'); P.e(42, 34, 3, 3, '2a3a18')
    # głowa – czaszka jelenia
    P.e(24, 14+s, 8, 7, 'e8e0c8')
    # rogi
    P.l((18, 10+s), (10, 0+s), 'c8b890', 2); P.l((10, 0+s), (6, 4+s), 'c8b890', 2)
    P.l((30, 10+s), (38, 0+s), 'c8b890', 2); P.l((38, 0+s), (42, 4+s), 'c8b890', 2)
    P.l((16, 8+s), (12, 2+s), 'a89870', 1); P.l((32, 8+s), (36, 2+s), 'a89870', 1)
    # oczodoły
    P.e(20, 13+s, 2, 2, '1a1020'); P.e(28, 13+s, 2, 2, '1a1020')
    if roar:
        P.e(20, 13+s, 2, 2, 'ff4040'); P.e(28, 13+s, 2, 2, 'ff4040')
        P.r(21, 17+s, 27, 20+s, '2a1a10')  # otwarte usta
    else:
        P.r(22, 17+s, 26, 18+s, '2a1a10')
    # mech na czaszce
    P.r(19, 8+s, 22, 10+s, '3a6a2a'); P.r(26, 7+s, 29, 9+s, '3a6a2a')

# generuj sprite'y
for n, fn, S in (('bear', bear, 32), ('beaver', beaver, 32), ('leshy', leshy, 48)):
    idle = [frame(fn, S, 'i', 0), frame(fn, S, 'i', 1, dy=1)]
    save(sheet(idle), 'enemies', n)
    if n == 'leshy':
        # dwa ataki: drapnięcie (f=0) i ryk (f=1)
        save(sheet([frame(fn, S, 'a', 0, dx=3), frame(fn, S, 'a', 1, dx=1)]), 'enemies', n + '_attack')
    else:
        save(sheet([frame(fn, S, 'a', 0, dx=2), frame(fn, S, 'a', 1, dx=4)]), 'enemies', n + '_attack')
    save(tint(frame(fn, S, 'i', 0, dx=-2)), 'enemies', n + '_hurt')
    dead = []
    for k, al in ((.75, 230), (.45, 170), (.15, 100)):
        im = idle[0].resize((S, max(1, int(S*k))), Image.NEAREST)
        c = Image.new('RGBA', (S, S), (0, 0, 0, 0)); c.paste(im, (0, S - im.height))
        c.putalpha(c.getchannel('A').point(lambda v, al=al: v and al)); dead.append(c)
    save(sheet(dead), 'enemies', n + '_death')

# ---------- Tło: TAJGA 640x320 ----------
def taiga(d, hz):
    random.seed('taiga')
    # niebo
    for y in range(hz):
        d.line([(0, y), (160, y)], fill=lerp(H('#6a9ac0'), H('#a8c8e0'), y/hz))
    # góry w tle
    for pts, col in [([(0, hz), (20, hz-18), (45, hz-10), (70, hz-22), (100, hz-8), (130, hz-20), (160, hz)], '#4a6a5a'),
                     ([(0, hz), (30, hz-12), (60, hz-6), (90, hz-16), (120, hz-5), (160, hz)], '#3a5a48')]:
        d.polygon(pts, fill=H(col))
    # świerki
    def spruce(x, base, h, trunk='#3a2a18', leaf='#2a5a2a'):
        d.line([(x, base), (x, base-h//3)], fill=H(trunk), width=2)
        for i, (dy, w) in enumerate(((0, h*.55), (h*.25, h*.42), (h*.45, h*.28))):
            top = base - h + dy
            d.polygon([(x, top-4), (x-w, top+h*.2), (x+w, top+h*.2)], fill=H(leaf if i else '#1a4a1a'))
    for x in range(4, 160, 14):
        spruce(x + random.randint(-3, 3), hz+2, random.randint(18, 28), '#2a1a10', random.choice(['#2a5a2a', '#1a4a22', '#3a6a32']))
    for x in (12, 48, 95, 140):
        spruce(x, hz+4, random.randint(26, 34), '#1a1208', '#1a3a18')
    # ziemia
    d.rectangle([0, hz, 160, 80], fill=H('#3a4a2a'))
    for i in range(120):
        x = random.randint(0, 159); y = random.randint(hz, 79)
        d.point((x, y), fill=H(random.choice(['#4a5a32', '#2a3a1a', '#5a6a3a', '#3a4a28'])))
    # mech / paprocie
    for i in range(25):
        x = random.randint(2, 155); y = random.randint(hz+4, 76)
        d.ellipse([x-3, y-1, x+3, y+2], fill=H('#2a6a2a'))
    # kamienie
    for cx, cy, rx in ((25, 62, 5), (78, 70, 4), (130, 58, 6)):
        d.ellipse([cx-rx, cy-rx//2, cx+rx, cy+rx//2], fill=H('#5a5a4a'))
        d.ellipse([cx-rx+1, cy-rx//2, cx+rx-1, cy], fill=H('#7a7a6a'))

bg = Image.new('RGB', (160, 80)); dd = ImageDraw.Draw(bg)
taiga(dd, 44)
save(bg.resize((640, 320), Image.NEAREST), 'maps', 'taiga')
print('Taiga OK')
