"""v1.1.1 – generuje grafiki: KIBIC (kij baseballowy + raca), ZMUTOWANY KOMAR (bagna) i NOWE STOISKO WIEDŹMY.
Uruchom: python3 generate_v111.py  (wymaga Pillow). Zapisuje do ../assets/enemies i ../assets/items."""
from PIL import Image, ImageDraw
import os
A = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')
H = lambda h: tuple(int(h[i:i+2], 16) for i in (1, 3, 5))
C = lambda h: H('#' + h.lstrip('#')) + (255,)

class Pen:
    def __init__(s, im, dx=0, dy=0): s.d = ImageDraw.Draw(im); s.dx = dx; s.dy = dy
    def r(s, x0, y0, x1, y1, c): s.d.rectangle([x0+s.dx, y0+s.dy, x1+s.dx, y1+s.dy], fill=C(c))
    def e(s, x, y, rx, ry, c): s.d.ellipse([x-rx+s.dx, y-ry+s.dy, x+rx+s.dx, y+ry+s.dy], fill=C(c))
    def p(s, pts, c): s.d.polygon([(x+s.dx, y+s.dy) for x, y in pts], fill=C(c))
    def l(s, a, b, c, w=2): s.d.line([(a[0]+s.dx, a[1]+s.dy), (b[0]+s.dx, b[1]+s.dy)], fill=C(c), width=w)
    def px(s, x, y, c): s.d.point((x+s.dx, y+s.dy), fill=C(c))

def finish(im):
    """kontur + światło od góry + cień od dołu (jak w pozostałych sprite'ach gry)"""
    w, h = im.size; p = im.load(); q = im.copy(); qp = q.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = p[x, y]
            if not a: continue
            up = p[x, y-1][3] if y else 0; dn = p[x, y+1][3] if y < h-1 else 0
            if not up: qp[x, y] = tuple(min(255, int(c*1.25+14)) for c in (r, g, b)) + (255,)
            elif not dn: qp[x, y] = tuple(int(c*.72) for c in (r, g, b)) + (255,)
    for y in range(h):
        for x in range(w):
            if not p[x, y][3]:
                nb = [p[x+i, y+j] for i, j in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= x+i < w and 0 <= y+j < h and p[x+i, y+j][3]]
                if nb: n = nb[0]; qp[x, y] = (int(n[0]*.22)+10, int(n[1]*.18)+6, int(n[2]*.28)+16, 255)
    return q

def frame(fn, k, f, S=32):
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); fn(Pen(im), k, f); return finish(im)
def sheet(fr):
    o = Image.new('RGBA', (sum(i.width for i in fr), fr[0].height), (0, 0, 0, 0)); x = 0
    for i in fr: o.paste(i, (x, 0)); x += i.width
    return o
def save(im, d, n):
    os.makedirs(os.path.join(A, d), exist_ok=True); im.save(os.path.join(A, d, n + '.png'))
def fall(idle, steps=((22, 16), (62, 15), (90, 15))):
    """klatki śmierci: obrót postaci do tyłu (pivot = stopy), ostatnia leży płasko"""
    out = []
    for ang, cx in steps:
        r = idle.rotate(ang, resample=Image.NEAREST, expand=True)
        bb = r.getbbox(); r = r.crop(bb)
        f = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
        f.alpha_composite(r, (max(0, min(32 - r.width, cx - r.width // 2)), 31 - r.height))
        out.append(f)
    return out

# ============================ KIBIC ============================
SK, JK, JK2, RED, WH, JEANS, WOOD, WOOD2 = 'f0c8a0', '2a2a3a', '3e3e56', 'd63a3a', 'f2f2f2', '3a4a78', 'c89a5a', '8a6030'

def bat(P, a, b):
    P.l(a, b, WOOD2, 2)
    # grubszy koniec kija (przy czubku)
    t = .55; m = (a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t)
    P.l(m, b, WOOD, 3)
    P.e(round(b[0]), round(b[1]), 1, 1, WOOD)

def flare(P, x, y, up=True, lit=True):
    """raca: czerwony patyk z białym paskiem i iskrzącym czubkiem"""
    dy = -1 if up else 1
    P.r(x, y, x+1, y+5, 'e03020'); P.r(x, y+2, x+1, y+2, WH)
    if lit:
        P.r(x, y-2, x+1, y-1, 'ffe070'); P.px(x-1, y-3, 'ffb040'); P.px(x+2, y-3, 'fff0a0'); P.px(x, y-4, 'ff7a20')

def fan(P, k, f):
    s = f if k == 'i' else 0
    dx = {'a': (-2, 0, 2), 't': (-1, 0, 1)}.get(k, (0, 0, 0))[f] if k in ('a', 't') else (-2 if k == 'h' else 0)
    # nogi
    P.r(11, 22, 14, 28, JEANS); P.r(16, 22, 19, 28, JEANS); P.r(10, 28, 14, 30, WH); P.r(16, 28, 20, 30, WH)
    P.r(11, 22, 11, 27, '2a3a60')
    # tylna ręka (lewa strona sprite'a) – trzyma racę
    if k == 't':
        yarm = (9, 6, 11)[f]
        P.r(6, yarm, 9, yarm + 8, JK); P.r(5, yarm - 1, 8, yarm + 1, SK)
        if f == 0: flare(P, 5, yarm - 8)
        if f == 1: flare(P, 8, yarm - 9)
    else:
        P.r(7, 16 + s, 10, 21 + s, JK)
        P.r(6, 20 + s, 9, 22 + s, SK)
        flare(P, 6, 14 + s, lit=(k != 'h'))
    # korpus
    P.r(10 + dx, 14 + s, 20 + dx, 23 + s, JK); P.r(10 + dx, 14 + s, 12 + dx, 23 + s, JK2)
    P.r(15 + dx, 16 + s, 15 + dx, 23 + s, RED)
    # szalik w barwach klubu
    for i, x in enumerate(range(10, 21)):
        P.r(x + dx, 13 + s, x + dx, 15 + s, RED if (i // 2) % 2 == 0 else WH)
    P.r(18 + dx, 15 + s, 20 + dx, 19 + s, RED); P.r(18 + dx, 17 + s, 20 + dx, 17 + s, WH)
    # głowa i czapka
    P.e(15 + dx, 9 + s, 4, 4, SK)
    P.r(11 + dx, 3 + s, 19 + dx, 6 + s, RED); P.r(10 + dx, 6 + s, 20 + dx, 7 + s, WH); P.e(15 + dx, 2 + s, 2, 2, WH)
    if k == 'h':
        for ex in (13, 17): P.px(ex + dx, 9 + s, '14101f'); P.px(ex + dx + 1, 10 + s, '14101f'); P.px(ex + dx - 1, 10 + s, '14101f')
        P.r(14 + dx, 12 + s, 16 + dx, 13 + s, '5a1a1a')
    else:
        P.r(12 + dx, 9 + s, 14 + dx, 9 + s, '14101f'); P.r(16 + dx, 9 + s, 18 + dx, 9 + s, '14101f')   # zmarszczone brwi
        P.r(13 + dx, 10 + s, 13 + dx, 10 + s, 'ffffff'); P.r(17 + dx, 10 + s, 17 + dx, 10 + s, 'ffffff')
        P.r(14 + dx, 12 + s, 16 + dx, 13 + s, '5a1a1a')                                               # wrzeszczy
    # przednia ręka z kijem
    if k == 'a':
        hand = [(21, 12), (22, 15), (22, 17)][f]; tip = [(18, 1), (31, 12), (29, 24)][f]
        P.r(19 + dx, 15, 22 + dx, 19, JK); P.e(hand[0] + dx, hand[1], 2, 2, SK)
        bat(P, (hand[0] + dx, hand[1]), tip)
    elif k == 't':
        P.r(19 + dx, 16, 22 + dx, 20, JK); P.e(22 + dx, 20, 2, 2, SK)
        bat(P, (22 + dx, 20), (24 + dx, 29))
    elif k == 'h':
        P.r(19 + dx, 15, 22 + dx, 19, JK); P.e(22 + dx, 16, 2, 2, SK); bat(P, (22 + dx, 16), (25 + dx, 6))
    else:
        P.r(19, 15 + s, 22, 19 + s, JK); P.e(22, 15 + s, 2, 2, SK); bat(P, (22, 15 + s), (26, 4 + s))
    # iskry z racy przy rzucie
    if k == 't' and f == 2:
        for (x, y, c) in ((26, 7, 'ffe070'), (28, 5, 'ff7a20'), (27, 10, 'fff0a0'), (30, 8, 'ffb040')): P.px(x, y, c)

# ========================= ZMUTOWANY KOMAR =========================
def mosq(P, k, f):
    """smukły komar-mutant: długi nabrzmiały odwłok z guzami, świecące oczy, kolczaste nogi i bardzo długa trąbka"""
    s = (f % 2) if k == 'i' else 0
    lean = (-3, 2, 0)[f] if k == 'a' else (-2 if k == 'h' else 0)         # atak: odchylenie -> pchnięcie -> powrót
    up = (k == 'i' and f == 0) or (k == 'a' and f == 0)                   # skrzydła w górze / opuszczone
    # skrzydła: dwie długie, wąskie błony (jedna z przodu, jedna z tyłu) z żyłką
    if up:
        P.p([(15 + lean, 11 + s), (4 + lean, 1 + s), (7 + lean, 0 + s), (17 + lean, 9 + s)], 'cfeaff'); P.l((15 + lean, 10 + s), (6 + lean, 2 + s), '7aa8d8', 1)
        P.p([(13 + lean, 11 + s), (1 + lean, 6 + s), (2 + lean, 3 + s), (14 + lean, 9 + s)], 'b4d8f4')
    else:
        P.p([(15 + lean, 11 + s), (3 + lean, 9 + s), (3 + lean, 6 + s), (17 + lean, 9 + s)], 'cfeaff'); P.l((15 + lean, 10 + s), (5 + lean, 8 + s), '7aa8d8', 1)
        P.p([(13 + lean, 12 + s), (1 + lean, 14 + s), (2 + lean, 11 + s), (14 + lean, 10 + s)], 'b4d8f4')
    # nogi – 6 cienkich, długich, z kolcami (rysowane pod ciałem)
    for lx, tx, ty in ((12, 8, 29), (15, 14, 30), (18, 20, 29)):
        mid = (lx + (tx - lx) // 2 + (2 if lx < 15 else -2) * 0, 22 + s)
        P.l((lx + lean, 15 + s), (tx + lean - 2, 22 + s), '1e2a1e', 1); P.l((tx + lean - 2, 22 + s), (tx + lean, ty), '1e2a1e', 1)
    # odwłok: łańcuch segmentów, zielone, toksyczne, z jasnymi guzami i prążkami
    for (cx, cy, r, c1, c2) in ((11, 14, 3, '4a7a30', '8fd04a'), (8, 16, 3, '5f9a3a', 'a8ff60'), (5, 18, 3, '6aa84a', 'd8ff70')):
        P.e(cx + lean, cy + s, r, r, c1); P.px(cx + lean - 1, cy + s - 1, c2); P.px(cx + lean, cy + s - 1, c2)
    for cx, cy in ((9, 13), (6, 16), (3, 18)): P.l((cx + lean, cy + s), (cx + 1 + lean, cy + 4 + s), '2e5a22', 1)
    P.e(4 + lean, 20 + s, 1, 1, 'e8ff90')                                  # świecący guz
    # tułów + głowa
    P.e(16 + lean, 13 + s, 4, 3, '3a4a3a'); P.e(15 + lean, 12 + s, 1, 1, '8fd04a'); P.px(18 + lean, 14 + s, 'a8ff60')
    P.e(21 + lean, 12 + s, 3, 3, '4a5a3a')
    P.e(22 + lean, 11 + s, 2, 2, 'ff3a2a'); P.px(22 + lean, 10 + s, 'ffe0a0'); P.e(20 + lean, 13 + s, 1, 1, 'ffd24a')   # dwie pary oczu
    if k == 'h':
        P.e(22 + lean, 11 + s, 2, 2, '2a1a1a'); P.l((21 + lean, 10 + s), (23 + lean, 12 + s), 'ffffff', 1); P.l((23 + lean, 10 + s), (21 + lean, 12 + s), 'ffffff', 1)
    # trąbka (żądło): bardzo długa, czerwona krwią na czubku
    tip = (31, 18) if k != 'a' else ((26, 15), (31, 19), (29, 17))[f]
    tip = (min(31, tip[0]), tip[1])
    P.l((24 + lean, 13 + s), (tip[0], tip[1] + s), 'e4e4f0', 1)
    P.px(tip[0], tip[1] + s, 'e03030'); P.px(tip[0] - 1, tip[1] + s - 1, 'e4e4f0')
    P.l((23 + lean, 14 + s), (25 + lean, 16 + s), '2a2a2a', 1)             # żuwaczka
    if k == 'a' and f == 2: P.px(28, 21, 'a82020'); P.px(28, 23, 'a82020')   # kapie krew
    if k in ('i', 'a'): P.px(6 + lean, 23 + s + (f % 2) * 2, '9aff5a')       # toksyczna ślina


# ========================= STOISKO WIEDŹMY (64x48) =========================
def witchstall():
    im = Image.new('RGBA', (64, 48), (0, 0, 0, 0)); P = Pen(im)
    WD, WD2, WD3 = '6a4424', '8a5a30', '4a2c14'
    # słupki + belka z suszonymi ziołami, kościami i lampionem
    for x in (2, 58):
        P.r(x, 3, x + 3, 47, WD); P.r(x, 3, x, 47, WD2); P.r(x + 3, 3, x + 3, 47, WD3)
    P.r(2, 3, 61, 6, WD); P.r(2, 3, 61, 3, WD2)
    for (x, c1, c2) in ((9, '4a8a3a', '8fd04a'), (15, 'a87a2a', 'd8b050'), (46, '4a8a3a', '8fd04a'), (52, '7a3a8a', 'b868d8')):
        P.l((x, 7), (x, 14), '5a4a30', 1); P.e(x, 16, 2, 3, c1); P.px(x, 15, c2); P.px(x - 1, 17, c2)
    P.l((24, 7), (24, 12), '5a4a30', 1); P.e(24, 14, 2, 2, 'e8e0c8'); P.px(23, 14, '2a2a2a'); P.px(25, 14, '2a2a2a'); P.px(24, 16, '2a2a2a')   # czaszka
    P.l((38, 7), (38, 11), '5a4a30', 1); P.r(36, 11, 40, 17, '3a2a4a'); P.r(37, 12, 39, 16, 'c070ff'); P.r(38, 13, 38, 15, 'f0d0ff')              # lampion
    # blat + fioletowa serweta z wykończeniem
    P.r(0, 30, 63, 34, WD2); P.r(0, 30, 63, 30, 'a87040')
    P.r(2, 31, 61, 38, '5a2a7a'); P.r(2, 31, 61, 32, '7a3a9a')
    for x in range(2, 62, 4): P.p([(x, 38), (x + 3, 38), (x + 1, 42)], '5a2a7a'); P.px(x + 1, 41, 'e8c050')
    P.r(2, 36, 61, 36, 'e8c050')
    for sx in (14, 30, 46): P.px(sx, 34, 'e8c050'); P.px(sx, 33, 'e8c050')
    P.r(2, 43, 61, 47, WD); P.r(2, 43, 61, 43, WD2)
    # towar: butelki (lewa), księga i czaszka ze świecą (środek-lewo), kocioł (prawa)
    for (x, c, c2, h) in ((8, 'b050e0', 'e8b0ff', 7), (13, '4acf5a', 'b8ffb8', 9), (18, 'e04a4a', 'ffb0b0', 6)):
        P.r(x, 29 - h, x + 3, 29, c); P.r(x + 1, 29 - h - 2, x + 2, 29 - h, 'c8a070'); P.px(x + 1, 29 - h + 1, c2); P.r(x, 29 - 1, x + 3, 29, '2a1a3a')
    P.r(23, 24, 30, 29, '3a1a5a'); P.r(24, 25, 29, 28, 'e8d8b0'); P.px(26, 26, '8a2a2a'); P.px(27, 27, '8a2a2a')   # księga
    P.e(34, 26, 2, 2, 'e8e0c8'); P.r(33, 28, 35, 29, 'e8e0c8'); P.px(33, 26, '2a2a2a'); P.px(35, 26, '2a2a2a')        # czaszka
    P.r(34, 19, 34, 23, 'e8e0c8'); P.px(34, 18, 'ffe070'); P.px(34, 17, 'ff9a30')                                      # świeca
    # KOCIOŁ
    P.e(48, 25, 10, 6, '23232e'); P.r(39, 18, 57, 20, '3a3a4c')
    P.e(48, 19, 9, 2, '3a3a4c'); P.e(48, 19, 8, 1, '6aff6a'); P.r(41, 19, 45, 19, 'b8ffb8')
    P.r(40, 29, 42, 31, '14101f'); P.r(54, 29, 56, 31, '14101f')
    return finish(im)

if __name__ == '__main__':
    fan_sets = {k: [frame(fan, k, f) for f in range(n)] for k, n in (('i', 2), ('a', 3), ('t', 3), ('h', 1))}
    save(sheet(fan_sets['i']), 'enemies', 'fan')
    save(sheet(fan_sets['a']), 'enemies', 'fan_attack')
    save(sheet(fan_sets['t']), 'enemies', 'fan_throw')
    save(sheet(fan_sets['h']), 'enemies', 'fan_hurt')
    save(sheet(fall(fan_sets['i'][0])), 'enemies', 'fan_death')
    m = {k: [frame(mosq, k, f) for f in range(n)] for k, n in (('i', 2), ('a', 3), ('h', 1))}
    save(sheet(m['i']), 'enemies', 'mutmosq')
    save(sheet(m['a']), 'enemies', 'mutmosq_attack')
    save(sheet(m['h']), 'enemies', 'mutmosq_hurt')
    save(sheet(fall(m['i'][0], ((30, 16), (120, 15), (180, 15)))), 'enemies', 'mutmosq_death')
    save(witchstall(), 'items', 'witchstall')
    print('OK')
