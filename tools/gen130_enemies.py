"""v1.3.0 – nowi przeciwnicy: RUDOLF (lodowe góry), UPIÓR (lawowa otchłań), SKARABEUSZ (pustynia), MECHANICZNA RĘKA (stara elektrownia),
BRAMKARZ (stadion) oraz kompan BARD. Uruchom: python3 gen130_enemies.py  (Pillow). Zapisuje do ../assets/enemies i ../assets/player."""
from PIL import Image
from generate_v111 import Pen, finish, sheet, save, fall

def fr(fn, k, f):
    im = Image.new('RGBA', (32, 32), (0, 0, 0, 0)); fn(Pen(im), k, f); return finish(im)

# ============================ RUDOLF (renifer z czerwonym nosem) ============================
FUR, FUR2, FUR3, BELLY, ANT, ANT2 = 'a8743c', '8a5a2c', '6a4220', 'ead2a8', 'dcc690', 'b8a070'
def rudolf(P, k, f):
    s = (f % 2) if k == 'i' else 0
    lunge = {'a': (-3, 4, 1)[f] if k == 'a' else 0}['a'] if k == 'a' else (-2 if k == 'h' else 0)
    hy = {'i': 0, 'a': (-2, 5, 3)[f] if k == 'a' else 0, 'h': 2}.get(k, 0) if k != 'a' else (-2, 5, 3)[f]
    # nogi
    for lx, off in ((7, 0), (10, 1), (18, 1), (21, 0)):
        o = (s if off else -s) if k == 'i' else (lunge // 2 if lx > 14 else -lunge // 2 + 1) * (1 if k == 'a' else 0)
        P.r(lx + lunge//2, 23, lx + 1 + lunge//2, 30, FUR2 if off else FUR); P.r(lx + lunge//2 + o, 29, lx + 2 + lunge//2 + o, 31, '2a1a14')
    # ogon
    P.e(4 + lunge//2, 17 + s, 2, 2, 'f4f4f0')
    # tułów
    P.e(13 + lunge//2, 19 + s, 10, 5, FUR); P.e(13 + lunge//2, 22 + s, 8, 2, BELLY); P.r(8 + lunge//2, 16 + s, 16 + lunge//2, 16 + s, FUR3)
    # uprząż z dzwonkiem
    P.r(18 + lunge//2, 15 + s, 19 + lunge//2, 24 + s, 'd63a3a'); P.e(19 + lunge//2, 24 + s, 2, 2, 'f2c14e'); P.px(19 + lunge//2, 23 + s, 'fff0a0')
    P.r(9 + lunge//2, 15 + s, 17 + lunge//2, 15 + s, 'd63a3a')
    # szyja i głowa
    hx = 24 + lunge
    P.p([(18 + lunge//2, 14 + s), (22 + lunge//2, 13 + s), (hx + 1, 11 + s + hy), (hx - 3, 16 + s + hy)], FUR)
    P.e(hx + 1, 11 + s + hy, 4, 3, FUR); P.r(hx + 3, 12 + s + hy, hx + 6, 14 + s + hy, FUR2)
    P.px(hx, 10 + s + hy, '14101f'); P.px(hx + 1, 10 + s + hy, 'ffffff') if k != 'h' else None
    if k == 'h': P.l((hx - 1, 9 + s + hy), (hx + 1, 11 + s + hy), '14101f', 1); P.l((hx + 1, 9 + s + hy), (hx - 1, 11 + s + hy), '14101f', 1)
    # czerwony świecący nos
    nx, ny = hx + 6, 12 + s + hy
    P.e(nx, ny, 3, 3, 'ff2a1a'); P.e(nx, ny, 2, 2, 'ff6a4a'); P.px(nx - 1, ny - 1, 'ffe0d0')
    # uszy i poroże
    P.e(hx - 2, 8 + s + hy, 2, 1, FUR2)
    ax = hx - 1; ay = 8 + s + hy
    if k == 'a' and f >= 1:                           # szarża – poroże do przodu
        P.l((ax, ay), (ax + 6, ay - 3), ANT, 2); P.l((ax + 3, ay - 2), (ax + 6, ay - 6), ANT, 1); P.l((ax + 1, ay), (ax + 2, ay - 6), ANT2, 1); P.px(ax + 7, ay - 3, ANT)
    else:
        P.l((ax, ay), (ax - 3, ay - 5), ANT, 2); P.l((ax - 2, ay - 3), (ax + 1, ay - 6), ANT, 1); P.l((ax - 3, ay - 5), (ax - 6, ay - 7), ANT, 1); P.l((ax - 3, ay - 5), (ax - 3, ay - 7), ANT2, 1)
        P.l((ax + 1, ay), (ax + 3, ay - 5), ANT2, 1); P.l((ax + 3, ay - 5), (ax + 5, ay - 7), ANT2, 1)
    # światło od nosa przy ataku
    if k == 'a' and f == 1:
        for (x, y) in ((nx + 2, ny - 2), (nx + 3, ny + 1), (nx + 1, ny - 4)): P.px(min(31, x), y, 'ff8a6a')

# ============================ UPIÓR ============================
def wraith(P, k, f):
    s = (f % 2) if k == 'i' else 0
    lean = {'a': (-2, 3, 1)[f] if k == 'a' else 0}['a'] if k == 'a' else (-2 if k == 'h' else 0)
    CL, CL2, CL3, GH = '4a3a78', '6a58a8', '2a2048', '9a88d8'
    # postrzępiona peleryna z falującym dołem
    P.p([(10 + lean, 12 + s), (22 + lean, 12 + s), (25 + lean, 22 + s), (23 + lean, 27 + s), (16 + lean, 25 + s), (9 + lean, 28 + s), (7 + lean, 22 + s)], CL)
    for i, x in enumerate(range(8, 25, 3)):
        yy = 28 + ((i + f) % 2) * 2
        P.p([(x + lean, 25 + s), (x + 3 + lean, 25 + s), (x + 1 + lean, min(31, yy + s))], CL if i % 2 else CL2)
    P.p([(10 + lean, 12 + s), (13 + lean, 12 + s), (9 + lean, 26 + s), (7 + lean, 22 + s)], CL3)
    P.p([(21 + lean, 14 + s), (22 + lean, 12 + s), (25 + lean, 22 + s), (23 + lean, 24 + s)], CL2)
    # kaptur z pustą twarzą
    P.e(16 + lean, 9 + s, 6, 7, CL); P.e(16 + lean, 10 + s, 4, 5, '120c20')
    P.p([(10 + lean, 6 + s), (13 + lean, 2 + s), (16 + lean, 1 + s), (19 + lean, 2 + s), (22 + lean, 6 + s)], CL2); P.px(16 + lean, 2 + s, GH)
    ey = 9 + s
    if k == 'h':
        for ex in (13, 18): P.l((ex + lean, ey - 1), (ex + 2 + lean, ey + 1), 'ff4a2a', 1); P.l((ex + 2 + lean, ey - 1), (ex + lean, ey + 1), 'ff4a2a', 1)
    else:
        for ex in (13, 18): P.r(ex + lean, ey, ex + 1 + lean, ey + 1, 'ff9a2a'); P.px(ex + lean, ey, 'fff0a0')
        P.r(14 + lean, 13 + s, 18 + lean, 13 + s, '3a2a58')
    # kościste dłonie sięgające do przodu
    if k == 'a':
        hx = (21, 29, 26)[f]; hy = (17, 17, 19)[f]
        P.l((20 + lean, 16 + s), (hx, hy), CL2, 2)
        for d in (-2, 0, 2): P.l((hx, hy), (min(31, hx + 3), hy + d), 'e8e4f8', 1)
        P.l((11 + lean, 16 + s), (8 + lean, 20 + s), CL2, 2)
    else:
        P.l((21 + lean, 16 + s), (25 + lean, 20 + s), CL2, 2)
        for d in (-1, 0, 1): P.px(26 + lean, 20 + d + s, 'e8e4f8')
        P.l((11 + lean, 16 + s), (7 + lean, 20 + s), CL2, 2)
        for d in (-1, 0, 1): P.px(6 + lean, 20 + d + s, 'e8e4f8')
    # żarzące się iskry (lawa)
    if k in ('i', 'a'): P.px(5 + f * 3, 12 + s, 'ff8a30'); P.px(27 - f * 2, 6 + s, 'ffd070')

# ============================ SKARABEUSZ ============================
def scarab(P, k, f):
    s = (f % 2) if k == 'i' else 0
    up = {'a': (0, 5, 3)[f] if k == 'a' else 0}['a'] if k == 'a' else 0
    lean = (-1, 2, 1)[f] if k == 'a' else (-2 if k == 'h' else 0)
    SH, SH2, SH3, GD = '2a7ab0', '4aa0d8', '1c4a78', 'f2c14e'
    # nogi (3 pary)
    for lx, ty in ((9, 30), (14, 31), (19, 30)):
        m = (1 if (f + lx) % 2 else -1) * (1 if k == 'i' else 0)
        P.l((lx + lean, 25), (lx - 3 + lean + m, 29 + 0), '2a1a10', 1); P.l((lx - 3 + lean + m, 29), (lx - 4 + lean + m, ty), '2a1a10', 1)
        P.l((lx + 2 + lean, 25), (lx + 5 + lean, 29), '3a2a18', 1); P.l((lx + 5 + lean, 29), (lx + 6 + lean, ty), '3a2a18', 1)
    # skrzydła (przy ataku rozwarte)
    if k == 'a' and f >= 1:
        P.p([(10 + lean, 17), (3 + lean, 8 - up // 2), (8 + lean, 6 - up // 2), (16 + lean, 16)], 'cfeeff'); P.l((10 + lean, 16), (5 + lean, 8), '8ab8d8', 1)
        P.p([(14 + lean, 16), (10 + lean, 5 - up // 2), (16 + lean, 4 - up // 2), (20 + lean, 15)], 'b0d8f0')
    # pancerz – wypukła kopuła ze złotym szwem i plamami
    P.e(14 + lean, 21 + s, 11, 7, SH); P.e(12 + lean, 18 + s, 7, 3, SH2); P.r(3 + lean, 25 + s, 25 + lean, 26 + s, SH3)
    P.l((14 + lean, 14 + s), (14 + lean, 26 + s), GD, 1)
    for (x, y) in ((9, 19), (19, 19), (8, 23), (20, 23)): P.px(x + lean, y + s, GD)
    P.px(10 + lean, 17 + s, 'e8f8ff'); P.px(11 + lean, 17 + s, 'e8f8ff')
    # głowa z rogiem i żuwaczkami
    hx = 26 + lean
    P.e(hx, 22 + s, 4, 3, '1a2a3a'); P.p([(hx + 2, 20 + s), (hx + 6, 17 + s - (1 if k == 'a' and f else 0)), (hx + 4, 21 + s)], '2a3a4a')
    P.px(hx + 1, 21 + s, 'ff3a2a' if k != 'h' else 'ffffff'); P.px(hx + 1, 20 + s, 'ffd0a0')
    mand = (0, 3, 2)[f] if k == 'a' else 0
    P.l((hx + 3, 23 + s), (min(31, hx + 6 + mand // 2), 25 + s + (mand // 2)), 'e8e0c8', 1); P.l((hx + 3, 24 + s), (min(31, hx + 6 + mand // 2), 22 + s - (mand // 2)), 'e8e0c8', 1)
    if k == 'h': P.l((hx - 1, 20 + s), (hx + 1, 22 + s), 'ffffff', 1)

# ============================ MECHANICZNA RĘKA ============================
M1, M2, M3, M4 = 'a4acbc', 'c8d0e0', '6a7284', '3a4054'
def mechhand(P, k, f):
    """metalowa dłoń chodząca na palcach: kwadratowa dłoń z knykciami, 4 palce + kciuk, nadgarstek z kablami, czerwone oko"""
    s = (f % 2) if k == 'i' else 0
    cl = (0, 1, 2)[f] if k == 'a' else 0                                          # 0 otwarta, 1 domyka się, 2 zaciśnięta
    lean = (-2, 2, 1)[f] if k == 'a' else (-2 if k == 'h' else 0)
    # palce: dwa człony z przegubem, grube (3 px), lekko rozchylone; przy ataku zaciskają się do środka
    base = [(11, 8), (14, 12), (18, 18), (21, 23)]                                # (x przy dłoni, x końcówki)
    for i, (bx, tx) in enumerate(base):
        wig = ((f % 2) * (1 if i % 2 else -1)) if k == 'i' else 0
        tip = tx + wig + ((13 - tx) // 3 if cl else 0)
        midx = (bx + tip) // 2
        P.l((bx + lean, 19 + s), (midx + lean, 25), M3, 3); P.l((midx + lean, 25), (tip + lean, 30), M1, 3)
        P.e(midx + lean, 25, 1, 1, 'f2c14e'); P.r(tip - 1 + lean, 30, tip + 1 + lean, 31, 'e8e8f0')                     # przegub i pazur
    # kciuk (z boku dłoni)
    th = (29, 20) if not cl else (28, 15)
    if k == 'a' and f == 1: th = (31, 14)
    P.l((22 + lean, 14 + s), ((th[0] + 22) // 2, th[1] - 3 + s), M3, 3); P.l(((th[0] + 22) // 2, th[1] - 3 + s), (th[0], th[1] + s), M1, 3)
    P.e((th[0] + 22) // 2, th[1] - 3 + s, 1, 1, 'f2c14e'); P.px(min(31, th[0] + 1), th[1] + s + 1, 'f4f4f8')
    # nadgarstek: mankiet + wystające kable z iskrami
    P.r(5 + lean, 7 + s, 11 + lean, 16 + s, M4); P.r(5 + lean, 7 + s, 11 + lean, 8 + s, M3); P.r(5 + lean, 12 + s, 11 + lean, 12 + s, M3)
    P.l((7 + lean, 7 + s), (4 + lean, 2 + s), 'd63a3a', 1); P.l((9 + lean, 7 + s), (10 + lean, 1 + s), 'f2c14e', 1); P.l((8 + lean, 7 + s), (7 + lean, 3 + s), '3a9ad8', 1)
    if f % 2 == 0 or k != 'i': P.px(4 + lean, 1 + s, 'fff070'); P.px(11 + lean, 0 + s, '9af0ff')
    # dłoń + knykcie
    P.r(10 + lean, 9 + s, 23 + lean, 19 + s, M1); P.r(10 + lean, 9 + s, 23 + lean, 11 + s, M2); P.r(10 + lean, 18 + s, 23 + lean, 19 + s, M3)
    for x in (11, 15, 19, 22): P.e(x + lean, 19 + s, 1, 1, M2)                                               # knykcie
    for (x, y) in ((11, 10), (22, 10), (11, 17), (22, 17)): P.px(x + lean, y + s, M4)                        # nity
    P.l((14 + lean, 13 + s), (14 + lean, 17 + s), M3, 1); P.l((19 + lean, 13 + s), (19 + lean, 17 + s), M3, 1)
    # czerwone oko-sensor
    P.e(16 + lean, 14 + s, 3, 2, '2a0a0a'); P.e(16 + lean, 14 + s, 2, 1, 'ff3a2a' if k != 'h' else '5a1a1a'); P.px(15 + lean, 14 + s, 'ffd0c0')
    if k == 'h': P.l((15 + lean, 13 + s), (17 + lean, 15 + s), 'ffffff', 1); P.l((17 + lean, 13 + s), (15 + lean, 15 + s), 'ffffff', 1)

# ============================ BRAMKARZ ============================
JERSEY, JERSEY2, SHORTS, SK, GLOVE, GLOVE2, HAIRK = 'e8e030', 'b8b020', '2a2a3a', 'f0c8a0', 'ff7a20', 'ffb060', '2a1a10'
def keeper(P, k, f):
    s = (f % 2) if k == 'i' else 0
    dx = {'a': (-2, 2, 1)[f] if k == 'a' else 0}['a'] if k == 'a' else ((-2, 0, 3)[f] if k == 'k' else (-2 if k == 'h' else 0))
    # nogi
    if k == 'k':
        swing = (-4, 3, 7)[f]
        P.r(11, 23, 14, 30, SHORTS); P.r(10, 29, 15, 31, '14101f')
        P.l((17, 23), (17 + swing, 29 - (f == 1) * 2), SHORTS, 3); P.e(17 + swing + 1, 30 - (f == 1) * 2, 2, 1, '14101f')
    else:
        P.r(11, 23, 14, 28, SHORTS); P.r(17, 23, 20, 28, SHORTS); P.r(11, 28, 14, 31, 'e8e8f0'); P.r(17, 28, 20, 31, 'e8e8f0'); P.r(10, 30, 14, 31, '14101f'); P.r(17, 30, 21, 31, '14101f')
    # tułów
    P.r(10 + dx, 13 + s, 21 + dx, 23 + s, JERSEY); P.r(10 + dx, 13 + s, 12 + dx, 23 + s, JERSEY2); P.r(10 + dx, 22 + s, 21 + dx, 23 + s, SHORTS)
    P.r(14 + dx, 16 + s, 17 + dx, 18 + s, '2a2a3a'); P.px(15 + dx, 17 + s, JERSEY)                    # numer 1
    # głowa
    P.e(16 + dx, 8 + s, 4, 4, SK); P.r(12 + dx, 3 + s, 20 + dx, 6 + s, HAIRK); P.r(19 + dx, 6 + s, 20 + dx, 8 + s, HAIRK)
    if k == 'h':
        for ex in (14, 17): P.l((ex + dx, 7 + s), (ex + 1 + dx, 8 + s), '14101f', 1)
        P.r(15 + dx, 11 + s, 17 + dx, 11 + s, '5a1a1a')
    else:
        P.px(14 + dx, 8 + s, '14101f'); P.px(18 + dx, 8 + s, '14101f'); P.px(14 + dx, 7 + s, 'ffffff'); P.px(18 + dx, 7 + s, 'ffffff'); P.r(15 + dx, 11 + s, 17 + dx, 11 + s, '8a3a2a')
    # ręce w wielkich rękawicach
    if k == 'a':
        P.r(20 + dx, 14, 26 + dx, 17, JERSEY); P.e(min(29, 28 + dx), 16, 3, 3, GLOVE); P.px(min(29, 28 + dx), 15, GLOVE2)
        P.r(8 + dx, 15, 10 + dx, 19, JERSEY); P.e(8 + dx, 20, 2, 2, GLOVE)
    elif k == 'k':
        P.r(8, 15, 10, 19, JERSEY); P.e(8, 20, 2, 2, GLOVE); P.r(21, 14, 24, 17, JERSEY); P.e(25, 16, 2, 2, GLOVE)
    else:
        a = 3 if s else 0                                                                            # pozycja gotowości – ręce szeroko, rękawice w górze
        P.l((10, 15 + s), (5, 11 + s - a), JERSEY, 3); P.e(4, 10 + s - a, 3, 3, GLOVE); P.px(4, 9 + s - a, GLOVE2)
        P.l((21, 15 + s), (26, 11 + s - a), JERSEY, 3); P.e(27, 10 + s - a, 3, 3, GLOVE); P.px(27, 9 + s - a, GLOVE2)

# ============================ BARD (kompan) ============================
HAT, HAT2, TUN, TUN2, LUTE, LUTE2 = 'c83a52', 'e86a7a', '3a8a7a', '2a6a5c', '9a5a2a', 'c88a4a'
def bard(P, k, f):
    s = (f % 2) if k == 'i' else ((0, 1, 0, 1)[f] if k == 'w' else 0)
    lean = -1 if k == 'h' else 0
    a = (0, 1, 0, -1)[f] if k == 'w' else 0
    # nogi
    P.r(12, 24, 15, 30, '4a3a6a'); P.r(17, 24, 20, 30, '4a3a6a'); P.r(11 + a, 30, 15 + a, 31, '6a3a20'); P.r(17 - a, 30, 21 - a, 31, '6a3a20')
    # tunika z pasem
    P.r(10 + lean, 14 + s, 21 + lean, 25 + s, TUN); P.r(10 + lean, 14 + s, 12 + lean, 25 + s, TUN2); P.r(10 + lean, 20 + s, 21 + lean, 21 + s, 'f2c14e')
    P.r(11 + lean, 25 + s, 21 + lean, 26 + s, HAT2) ; P.px(15 + lean, 15 + s, 'f2c14e')
    # lutnia
    if k == 'a':
        lx, ly = (22, 15)[f % 2] if False else (22 + (f % 2) * 1, 18 - (f % 2) * 2)
        P.l((lx, ly), (lx + 6, ly - 8 - f), LUTE, 2)
        P.e(lx - 1, ly + 3, 5, 4, LUTE); P.e(lx - 1, ly + 3, 2, 2, '3a1a10'); P.px(lx - 3, ly + 1, LUTE2)
        for sx in (lx - 2, lx): P.px(sx, ly + 3, 'f4f4e8')
    else:
        P.l((23 + lean, 22 + s), (28 + lean, 12 + s), LUTE, 2)
        P.e(22 + lean, 23 + s, 5, 4, LUTE); P.e(22 + lean, 23 + s, 2, 2, '3a1a10'); P.px(19 + lean, 21 + s, LUTE2); P.px(21 + lean, 23 + s, 'f4f4e8'); P.px(23 + lean, 23 + s, 'f4f4e8')
    # ręce
    P.r(8 + lean, 16 + s, 10 + lean, 22 + s, TUN2); P.e(9 + lean, 23 + s, 2, 2, SK) if False else P.r(8 + lean, 22 + s, 10 + lean, 23 + s, 'f0c8a0')
    P.r(20 + lean, 17 + s, 24 + lean, 19 + s, TUN); P.r(23 + lean, 19 + s, 25 + lean, 21 + s, 'f0c8a0')
    # głowa
    P.e(16 + lean, 9 + s, 5, 5, 'f0c8a0'); P.px(12 + lean, 11 + s, 'e8908a'); P.px(20 + lean, 11 + s, 'e8908a')
    P.r(11 + lean, 6 + s, 21 + lean, 7 + s, '5a3a20')                                                 # grzywka
    if k == 'h':
        for ex in (13, 18): P.l((ex + lean, 8 + s), (ex + 1 + lean, 9 + s), '14101f', 1); P.l((ex + 1 + lean, 8 + s), (ex + lean, 9 + s), '14101f', 1)
        P.r(15 + lean, 12 + s, 17 + lean, 12 + s, '5a1a1a')
    else:
        for ex in (13, 18): P.r(ex + lean, 8 + s, ex + lean, 9 + s, '14101f')
        if k == 'a': P.r(15 + lean, 12 + s, 17 + lean, 13 + s, '8a2a3a')                              # śpiewa
        else: P.r(15 + lean, 12 + s, 17 + lean, 12 + s, 'a03a4a')
    # kapelusz z piórem
    P.r(9 + lean, 5 + s, 23 + lean, 6 + s, HAT); P.e(16 + lean, 3 + s, 5, 3, HAT); P.px(14 + lean, 2 + s, HAT2); P.r(9 + lean, 5 + s, 23 + lean, 5 + s, HAT2)
    P.l((20 + lean, 3 + s), (26 + lean, -1 + s + 1), 'f4f4f0', 1); P.l((21 + lean, 3 + s), (27 + lean, 1 + s), 'd8e8f0', 1)

def sprites():
    out = {}
    def mk(name, fn, idle=2, atk=3, hurt=1, extra=None, walk=0, death=((22, 16), (62, 15), (90, 15))):
        i = [fr(fn, 'i', x) for x in range(idle)]
        out[name] = sheet(i)
        out[name + '_attack'] = sheet([fr(fn, 'a', x) for x in range(atk)])
        out[name + '_hurt'] = sheet([fr(fn, 'h', x) for x in range(hurt)])
        out[name + '_death'] = sheet(fall(i[0], death))
        if walk: out[name + '_walk'] = sheet([fr(fn, 'w', x) for x in range(walk)])
        if extra: out[name + '_' + extra[0]] = sheet([fr(fn, extra[1], x) for x in range(3)])
    mk('rudolf', rudolf); mk('wraith', wraith, death=((30, 16), (120, 15), (180, 15))); mk('scarab', scarab); mk('mechhand', mechhand)
    mk('keeper', keeper, extra=('kick', 'k'))
    return out

if __name__ == '__main__':
    for n, im in sprites().items(): save(im, 'enemies', n)
    # bard (kompan) – katalog player
    i = [fr(bard, 'i', x) for x in range(2)]
    save(sheet(i), 'player', 'comp_bard'); save(sheet([fr(bard, 'w', x) for x in range(4)]), 'player', 'comp_bard_walk')
    save(sheet([fr(bard, 'a', x) for x in range(2)]), 'player', 'comp_bard_attack'); save(sheet([fr(bard, 'h', 0)]), 'player', 'comp_bard_hurt')
    save(sheet(fall(i[0], ((22, 16), (62, 15), (90, 15)))), 'player', 'comp_bard_death')
    print('enemies OK')
