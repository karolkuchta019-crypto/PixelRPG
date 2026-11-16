"""v1.2.0 – grafiki: nowi wrogowie (pchła, zmutowany jeż, dmuchawiec, drzewiec, czarny kot, rybik cukrowy, zepsute auto)
i ikony osiągnięć. Uruchom: python3 generate_v120.py  (Pillow). Używa pomocników z generate_v111.py."""
import math
from PIL import Image
from generate_v111 import Pen, finish, frame, sheet, save, fall, C, A
import os

# ============================ PCHŁA (z Yeti) ============================
def flea(P, k, f):
    """pchła: wysoki, spłaszczony bokiem korpus, duża głowa z ssawką, potężne tylne nogi do skoku"""
    crouch = (k == 'i' and f == 0) or (k == 'a' and f == 0)
    leap = k == 'a' and f == 1
    bite = k == 'a' and f == 2
    cx = {'a': (13, 16, 19)}.get(k, (14, 14, 14))[f] if k == 'a' else 14
    cy = 15 if leap else (23 if crouch else 21)
    if k == 'h': cx -= 2
    B, B2, B3 = '7a3a1a', '9a5028', '4a2010'
    # tylna noga: udo + goleń (skulona / wyprostowana w skoku)
    if leap:
        P.l((cx - 2, cy + 3), (cx - 8, cy + 8), B, 3); P.l((cx - 8, cy + 8), (cx - 13, cy + 11), B3, 2)
    else:
        P.l((cx - 2, cy + 2), (cx - 8, cy - 2), B, 3); P.l((cx - 8, cy - 2), (cx - 5, cy + 7 - (1 if crouch else 0)), B3, 2); P.px(cx - 5, cy + 8, '2a1008')
    # korpus (owalny, z prążkami) + jaśniejszy grzbiet
    P.e(cx, cy, 5, 7, B); P.e(cx - 1, cy - 2, 3, 4, B2)
    for yy in (cy - 3, cy, cy + 3): P.l((cx - 4, yy), (cx + 4, yy), B3, 1)
    # głowa i oko, długa ssawka, czułki
    P.e(cx + 6, cy - 6, 3, 3, B2); P.r(cx + 6, cy - 7, cx + 7, cy - 6, 'ff3a2a')
    P.l((cx + 8, cy - 4), (cx + 12 + (3 if bite else 0), cy - 1 + (1 if bite else 0)), '2a1008', 1)
    P.l((cx + 5, cy - 9), (cx + 8, cy - 12), B3, 1); P.l((cx + 7, cy - 9), (cx + 11, cy - 11), B3, 1)
    # nogi środkowe i przednie
    for lx, dxl in ((cx + 1, 3), (cx + 4, 4)): P.l((lx, cy + 4), (lx + dxl, cy + 9), B3, 1)
    if k == 'h': P.px(cx + 6, cy - 7, 'ffffff'); P.px(cx + 7, cy - 6, 'ffffff')

# ============================ ZMUTOWANY JEŻ (tajga) ============================
def hedge(P, k, f):
    s = 1 if (k == 'i' and f == 1) else 0
    lean = (-2, 3, 0)[f] if k == 'a' else (-2 if k == 'h' else 0)
    bx, by = 14 + lean, 21 + s
    R = 13 if k == 'a' and f == 1 else 10
    P.e(bx, by, 10, 8, '5a3a24')
    for i, a in enumerate(range(-172, -8, 13)):
        ra = math.radians(a); rb1, rb2 = math.radians(a - 5), math.radians(a + 5)
        L = 6 + (3 if (k == 'a' and f == 1) else 0) + (i % 2) * 2
        p1 = (bx + 10 * math.cos(rb1), by + 8 * math.sin(rb1)); p2 = (bx + 10 * math.cos(rb2), by + 8 * math.sin(rb2))
        tip = (bx + (10 + L) * math.cos(ra), by + (8 + L) * math.sin(ra))
        P.p([p1, tip, p2], '3a2414' if i % 3 else '5a3a24')
        if i % 3 == 0: P.px(round(tip[0]), round(tip[1]), 'a8ff4a'); P.px(round(tip[0] - 1 * math.cos(ra)), round(tip[1] - 1 * math.sin(ra)), '6acf30')   # zmutowane kolce
    P.e(bx + 2, by + 3, 7, 4, 'c8a070')                                     # brzuch
    P.e(bx + 11, by + 3, 5, 4, 'd0a878'); P.px(bx + 16, by + 3, '1a1014'); P.px(bx + 15, by + 3, '1a1014')   # pysk, nos
    P.r(bx + 10, by + 1, bx + 11, by + 2, 'ff3a2a'); P.r(bx + 7, by - 1, bx + 8, by, 'a8ff4a')               # oko + trzecie, świecące
    if k == 'a' and f == 1:
        P.r(bx + 12, by + 5, bx + 16, by + 6, '5a1a1a')
        for tx in (12, 14, 16): P.px(bx + tx, by + 5, 'ffffff')
    P.r(bx - 5, by + 7, bx - 2, by + 9, 'a07850'); P.r(bx + 3, by + 7, bx + 6, by + 9, 'a07850')
    P.px(bx - 8, by + 10, '9aff5a')                                          # toksyczna kropla

# ============================ DMUCHAWIEC (las) ============================
def dande(P, k, f):
    sw = {'i': (-1, 1)[f] if k == 'i' else 0}.get(k, 0)
    lean = (-1, 3, 1)[f] if k == 'a' else (-2 if k == 'h' else sw)
    hx, hy = 16 + lean, 11
    P.l((16, 30), (hx, hy + 7), '3a8a2a', 3)
    P.p([(16, 26), (7, 22), (9, 26)], '4aaa3a'); P.p([(16, 23), (25, 19), (23, 24)], '4aaa3a')
    for a in range(0, 360, 20):                                              # puch nasion
        ra = math.radians(a); P.l((hx, hy), (hx + 11 * math.cos(ra), hy + 11 * math.sin(ra)), 'f4f4ff', 1)
    P.e(hx, hy, 8, 8, 'e4e4f2'); P.e(hx - 2, hy - 2, 4, 4, 'ffffff')
    for a in range(0, 360, 20):
        ra = math.radians(a); P.px(round(hx + 12 * math.cos(ra)), round(hy + 12 * math.sin(ra)), 'ffffff')
    P.r(hx - 4, hy - 2, hx - 2, hy - 1, '2a1a3a'); P.r(hx + 2, hy - 2, hx + 4, hy - 1, '2a1a3a')   # oczy
    P.l((hx - 5, hy - 4), (hx - 1, hy - 3), '2a1a3a', 1); P.l((hx + 5, hy - 4), (hx + 1, hy - 3), '2a1a3a', 1)   # brwi
    if k == 'a' and f >= 1: P.e(hx, hy + 4, 2, 2, '2a1a3a')                  # dmucha
    else: P.r(hx - 2, hy + 3, hx + 2, hy + 3, '2a1a3a')
    if k == 'a':                                                              # nasiona lecą w stronę bohatera
        for i, (x, y) in enumerate(((24, 9), (27, 13), (22, 15), (29, 8), (30, 17))):
            if f >= 1 or i < 2: P.px(x, y + (0 if f == 1 else 2), 'ffffff'); P.px(x + 1, y + 1, 'd8d8ee')
    if k == 'h': P.px(hx - 3, hy - 2, 'ff4040'); P.px(hx + 3, hy - 2, 'ff4040')

# ============================ DRZEWIEC (tajga) ============================
def treant(P, k, f):
    s = f if k == 'i' else 0
    lean = (-1, 0, 1)[f] if k == 'a' else (-2 if k == 'h' else 0)
    # korzenie
    for x0, x1 in ((7, 3), (11, 10), (21, 22), (25, 29)): P.p([(x0, 27), (x1, 31), (x0 + 3, 31), (x0 + 4, 27)], '4a2e14')
    # pień
    P.p([(9 + lean, 10 + s), (23 + lean, 10 + s), (24 + lean, 28), (8 + lean, 28)], '6a4a2a')
    for x in (12, 16, 20): P.l((x + lean, 12 + s), (x + lean + (1 if x == 16 else -1), 27), '4a3018', 1)
    P.l((10 + lean, 14 + s), (10 + lean, 24), '8a6a3a', 1)
    # twarz: świecące oczy i sęk-usta
    P.r(12 + lean, 15 + s, 14 + lean, 17 + s, '1a1008'); P.r(18 + lean, 15 + s, 20 + lean, 17 + s, '1a1008')
    P.r(13 + lean, 16 + s, 14 + lean, 16 + s, 'e8ff60'); P.r(19 + lean, 16 + s, 20 + lean, 16 + s, 'e8ff60')
    P.l((11 + lean, 14 + s), (14 + lean, 15 + s), '2a1a08', 1); P.l((21 + lean, 14 + s), (18 + lean, 15 + s), '2a1a08', 1)
    P.e(16 + lean, 21 + s, 3, 2, '120a04'); P.px(15 + lean, 20 + s, '6a4a2a')
    # ręce-konary
    if k == 'a':
        arm = [((9, 15), (4, 4), (2, 1)), ((23, 18), (28, 24), (30, 28)), ((23, 18), (27, 20), (29, 21))][f]
        P.l((23 + lean, 15), arm[1], '5a3a1c', 3); P.l(arm[1], arm[2], '4a2e14', 2)
        P.l((9 + lean, 16), (4, 21), '5a3a1c', 3); P.l((4, 21), (2, 24), '4a2e14', 2)
    else:
        P.l((9 + lean, 16 + s), (3, 20 + s), '5a3a1c', 3); P.l((3, 20 + s), (2, 25 + s), '4a2e14', 2)
        P.l((23 + lean, 16 + s), (29, 20 + s), '5a3a1c', 3); P.l((29, 20 + s), (30, 25 + s), '4a2e14', 2)
    # korona z liści
    for cx, cy, rx, ry, c in ((16, 6 + s, 10, 5, '2f7a24'), (10, 8 + s, 6, 4, '3a8a2a'), (22, 8 + s, 6, 4, '3a8a2a'), (15, 4 + s, 6, 3, '4aaa3a')):
        P.e(cx + lean, cy, rx, ry, c)
    for x, y in ((9, 5), (14, 3), (20, 5), (24, 8), (12, 9)): P.px(x + lean, y + s, '7aca4a')

# ============================ CZARNY KOT (bagna) ============================
def cat(P, k, f):
    dx, dy = ((-3, 3), (4, -6), (7, 0))[f] if k == 'a' else ((-2, 0) if k == 'h' else (0, 0))
    tail = ((3, 9), (6, 11))[f] if k == 'i' else (4, 10)
    bx, by = 13 + dx, 22 + dy
    BL, HL = '1c1c28', '34344c'
    P.l((bx - 7, by - 1), (bx - 10, by - 5), BL, 3); P.l((bx - 10, by - 5), (bx - 9 + (tail[0] - 4), by - 11), BL, 3)     # ogon
    P.l((bx - 9 + (tail[0] - 4), by - 11), (bx - 6 + (tail[0] - 4), by - 13), BL, 2)
    P.e(bx, by, 8, 5, BL); P.e(bx - 1, by - 2, 6, 2, HL)
    P.r(bx - 6, by + 3, bx - 4, by + 7, BL); P.r(bx + 3, by + 3, bx + 5, by + 7, BL)                                          # łapy
    if k == 'a' and f >= 1: P.l((bx + 7, by + 1), (bx + 12, by + 3), BL, 2); P.px(bx + 13, by + 3, 'ffffff'); P.px(bx + 13, by + 4, 'ffffff')   # pazury
    P.e(bx + 9, by - 4, 4, 4, BL); P.e(bx + 8, by - 5, 3, 2, HL)
    P.p([(bx + 6, by - 7), (bx + 7, by - 12), (bx + 9, by - 8)], BL); P.p([(bx + 10, by - 8), (bx + 12, by - 12), (bx + 13, by - 6)], BL)
    P.px(bx + 7, by - 9, 'c070a0'); P.px(bx + 12, by - 9, 'c070a0')
    P.r(bx + 8, by - 5, bx + 9, by - 4, 'f4e030'); P.r(bx + 11, by - 5, bx + 12, by - 4, 'f4e030')                           # świecące oczy
    P.px(bx + 8, by - 5, '1a1a1a'); P.px(bx + 12, by - 4, '1a1a1a')
    P.px(bx + 13, by - 2, 'c070a0')
    P.l((bx + 12, by - 3), (bx + 16, by - 4), 'dddddd', 1); P.l((bx + 12, by - 2), (bx + 16, by - 1), 'dddddd', 1)         # wąsy
    if k == 'h': P.l((bx - 4, by - 4), (bx - 3, by - 7), BL, 1); P.l((bx - 1, by - 5), (bx, by - 8), BL, 1); P.l((bx + 2, by - 5), (bx + 3, by - 8), BL, 1)   # zjeżona sierść

# ============================ RYBIK CUKROWY (jaskinia) ============================
def silver(P, k, f):
    lean = (-3, 2, 0)[f] if k == 'a' else (-2 if k == 'h' else 0)
    segs = [(24, 22, 4), (20, 22, 4.6), (16, 22.5, 4.2), (12.5, 23, 3.8), (9.5, 24, 3.3), (7, 25, 2.8), (4.8, 25.5, 2.2)]
    for i, (x, y, r) in enumerate(segs):
        w = math.sin(i * 0.9 + (f if k == 'i' else 0) * 1.6) * 1.2
        c1 = 'c4ccdc' if i % 2 else 'aab4c8'
        P.e(x + lean, y + w, r, r - .4, c1); P.e(x + lean, y + w - 1.5, r - 1.2, 1.2, 'f2f6ff')
    P.e(26 + lean, 21, 3, 3, 'dde4f2'); P.px(27 + lean, 20, '14101f'); P.px(28 + lean, 20, '14101f')               # głowa, oko
    ant = ((29, 14), (31, 15))[f % 2] if k == 'i' else (31, 14)
    P.l((27 + lean, 19), (ant[0], ant[1]), '8a94a8', 1); P.l((26 + lean, 19), (28 + lean, 12), '8a94a8', 1)          # czułki
    if k == 'a' and f == 1: P.l((29 + lean, 22), (31, 24), '2a2a3a', 1); P.l((29 + lean, 23), (31, 21), '2a2a3a', 1)  # żuwaczki
    for bx_, by_ in ((1, 22), (0, 25), (1, 28)): P.l((5 + lean, 25), (bx_, by_), '8a94a8', 1)                       # trzy szczecinki ogonowe
    for lx in range(7, 24, 4): P.l((lx + lean, 26), (lx - 1 + lean, 29 + (f % 2 if k == 'i' else 0)), '5a6478', 1)   # nóżki
    for sx, sy in ((14, 19), (19, 20), (10, 21)): P.px(sx + lean, sy, 'ffffff')                                    # „cukrowe” kryształki
    if k == 'h': P.px(27 + lean, 20, 'ffffff')

# ============================ ZEPSUTE ZMUTOWANE AUTO (elektrownia) ============================
def wreck(P, k, f):
    j = (f % 2) if k == 'i' else 0
    dx = (-3, 3, 0)[f] if k == 'a' else (-2 if k == 'h' else 0)
    R1, R2, R3 = '8a4a2a', '9a5a32', '5a2a18'
    # dym z rury
    for i, (x, y, r) in enumerate(((1, 18 - j * 2, 2), (-1, 13 - j * 3, 3), (2, 8 - j, 3))):
        P.e(x + 2 + dx, y, r, r, '6aa84a' if i != 1 else '8aff6a')
    P.r(2 + dx, 21, 4 + dx, 23, '2a2a30')                                   # rura
    P.r(3 + dx, 16 + j, 29 + dx, 25, R1); P.r(3 + dx, 16 + j, 29 + dx, 17 + j, R2)       # karoseria
    P.r(5 + dx, 21, 12 + dx, 22, R3); P.r(16 + dx, 23, 22 + dx, 24, R3)      # rdza
    P.p([(8 + dx, 16 + j), (11 + dx, 9 + j), (21 + dx, 9 + j), (24 + dx, 16 + j)], '7a3a22')   # kabina
    P.p([(10 + dx, 15 + j), (12 + dx, 10 + j), (16 + dx, 10 + j), (16 + dx, 15 + j)], '4aff70')  # okna – świecą na zielono
    P.p([(17 + dx, 15 + j), (17 + dx, 10 + j), (20 + dx, 10 + j), (22 + dx, 15 + j)], '3acf60')
    P.l((12 + dx, 14 + j), (15 + dx, 11 + j), '14301a', 1); P.l((18 + dx, 11 + j), (20 + dx, 14 + j), '14301a', 1)   # pęknięcia
    # maska-paszcza z zębami (w ataku otwarta)
    open_ = k == 'a' and f == 1
    P.r(24 + dx, 17 + j, 30 + dx, 21 - (0 if open_ else 0), R1)
    if open_: P.p([(24 + dx, 17), (30 + dx, 10), (31 + dx, 14), (28 + dx, 17)], R2)
    P.e(27 + dx, 18 + j, 2, 2, 'c8ff40'); P.px(27 + dx, 18 + j, '14101f')   # reflektor-oko
    P.r(26 + dx, 22, 31 + dx, 25, '1a1014')
    for tx in (26, 28, 30): P.px(tx + dx, 22, 'ffffff'); P.px(tx + 1 + dx, 24, 'ffffff')   # zęby w kratce
    P.l((16 + dx, 9 + j), (14 + dx, 5 + j), '2a6a2a', 1); P.e(14 + dx, 5 + j, 2, 2, 'ff3030'); P.px(14 + dx, 5 + j, '14101f')   # oko na wypustce
    # koła
    for wx in (9, 23): P.e(wx + dx, 26, 4, 4, '14141c'); P.e(wx + dx, 26, 2, 2, 'a0a0a8'); P.px(wx + dx, 26, '5a5a60')
    if k == 'h': P.px(27 + dx, 18 + j, 'ffffff')

# ------------------------------------------------------------------
def build_enemies():
    specs = [('flea', flea, 2, 3, 2.0), ('hedgehog', hedge, 2, 3, 0), ('dandelion', dande, 2, 3, 0), ('treant', treant, 2, 3, 0),
             ('blackcat', cat, 2, 3, 0), ('silverfish', silver, 2, 3, 0), ('wreck', wreck, 2, 3, 0)]
    for name, fn, ni, na, _ in specs:
        idle = [frame(fn, 'i', i) for i in range(ni)]
        save(sheet(idle), 'enemies', name)
        save(sheet([frame(fn, 'a', i) for i in range(na)]), 'enemies', name + '_attack')
        save(sheet([frame(fn, 'h', 0)]), 'enemies', name + '_hurt')
        save(sheet(fall(idle[0], ((25, 16), (65, 15), (100, 15)))), 'enemies', name + '_death')

# ============================ IKONY OSIĄGNIĘĆ (32x32, odznaki) ============================
DIG = {'1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'], '0': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.']}
GOLD, GOLD2, NAVY = 'd8a838', 'f4d868', '24203c'

def badge(P):
    P.e(16, 16, 15, 15, '8a6a20'); P.e(16, 16, 14, 14, GOLD); P.e(16, 16, 12, 12, NAVY); P.e(16, 15, 10, 9, '332e56')

def ach_endless(P):
    badge(P)
    for i, ch in enumerate('10'):
        for y, row in enumerate(DIG[ch]):
            for x, c in enumerate(row):
                if c == '#': P.r(7 + i * 10 + x * 2 - (0 if ch == '0' else 0), 6 + y * 2, 8 + i * 10 + x * 2, 7 + y * 2, GOLD2)
    for cx in (12, 20): P.e(cx, 25, 4, 3, '7ad0ff'); P.e(cx, 25, 2, 1, NAVY)      # ∞ pod liczbą (dwie pętle)
    P.px(16, 25, '7ad0ff')

def ach_slime(P):
    badge(P)
    P.e(16, 19, 8, 6, '5ac84a'); P.e(16, 21, 8, 4, '5ac84a'); P.e(14, 16, 3, 2, '9aff7a')
    P.r(12, 18, 13, 20, '14301a'); P.r(19, 18, 20, 20, '14301a'); P.r(14, 22, 18, 22, '14301a')
    P.p([(10, 14), (11, 8), (14, 12), (16, 7), (18, 12), (21, 8), (22, 14)], GOLD2); P.r(10, 13, 22, 14, GOLD)       # korona
    P.px(16, 10, 'ff4040'); P.px(11, 10, '40a0ff'); P.px(21, 10, '40ff80')

def ach_win(P):
    badge(P)
    P.p([(10, 7), (22, 7), (20, 17), (12, 17)], GOLD2); P.r(10, 7, 22, 8, GOLD)
    P.l((10, 9), (6, 9), GOLD, 1); P.l((6, 9), (9, 14), GOLD, 1); P.l((22, 9), (26, 9), GOLD, 1); P.l((26, 9), (23, 14), GOLD, 1)
    P.r(15, 17, 17, 21, GOLD); P.r(11, 21, 21, 23, GOLD2); P.r(11, 23, 21, 24, '8a6a20')
    P.r(13, 9, 14, 14, 'fff4b0'); P.px(16, 12, 'ff6060')

def ach_witch(P):
    badge(P)
    P.r(14, 6, 18, 11, 'c8a070'); P.r(13, 5, 19, 6, '8a6a40')                                  # korek
    P.p([(13, 11), (19, 11), (24, 23), (8, 23)], 'b050e0'); P.r(8, 23, 24, 24, '6a2a8a')
    P.p([(12, 16), (20, 16), (23, 23), (9, 23)], 'd070ff')
    for x, y in ((14, 19), (18, 20), (16, 17)): P.px(x, y, 'f0c0ff')
    P.px(25, 8, 'ffe070'); P.px(26, 7, 'ffe070'); P.px(24, 7, 'ffe070'); P.px(25, 6, 'ffe070')      # iskierka

def ach_comps(P):
    badge(P)
    for x, hc, bc in ((9, 'a0b0d0', '4a7ae0'), (16, '9a7a50', '3aaa4a'), (23, 'c07070', 'd04a4a')):
        P.e(x, 12, 3, 3, 'f0c8a0'); P.r(x - 3, 8, x + 3, 10, hc); P.r(x - 3, 15, x + 3, 22, bc); P.r(x - 3, 22, x - 1, 24, '3a2a20'); P.r(x + 1, 22, x + 3, 24, '3a2a20')
        P.px(x - 1, 12, '14101f'); P.px(x + 1, 12, '14101f')

def ach_gear(P):
    badge(P)
    P.p([(9, 11), (23, 11), (21, 25), (16, 27), (11, 25)], '5ae0e0'); P.p([(11, 12), (21, 12), (19, 24), (16, 25), (13, 24)], '9afcfc')   # zbroja mithrilowa
    P.r(15, 12, 17, 24, '5ae0e0'); P.r(9, 11, 23, 12, 'd8ffff')
    P.l((8, 23), (24, 5), 'e8ffff', 3); P.l((8, 23), (24, 5), '8af0f0', 1)                                                                 # miecz
    P.r(5, 22, 11, 24, GOLD); P.l((6, 26), (9, 21), GOLD, 2); P.px(24, 5, 'ffffff')

def ach_vamp(P):
    badge(P)
    P.p([(16, 5), (23, 15), (22, 21), (16, 24), (10, 21), (9, 15)], 'd02a3a'); P.e(13, 14, 2, 3, 'ff8a9a')
    P.p([(11, 19), (14, 19), (12.5, 25)], 'ffffff'); P.p([(18, 19), (21, 19), (19.5, 25)], 'ffffff')                                      # kły

def ach_resist(P):
    badge(P)
    P.p([(8, 7), (24, 7), (23, 18), (16, 26), (9, 18)], '8a9ab8'); P.p([(10, 9), (22, 9), (21, 17), (16, 23), (11, 17)], '3a5ab8')
    P.l((16, 9), (16, 23), '5a7ad8', 1); P.l((10, 14), (22, 14), '5a7ad8', 1)
    P.e(16, 14, 3, 3, '7affc0'); P.px(15, 13, 'e8fff4')
    for x in (11, 16, 21): P.r(x - 1, 27, x + 1, 28, '7affc0')                                                                           # 3 punkty = maksimum

def ach_nodeath(P):
    badge(P)
    P.e(16, 16, 5, 4, 'e03a4a'); P.e(12, 15, 3, 3, 'e03a4a'); P.e(20, 15, 3, 3, 'e03a4a'); P.p([(8, 17), (24, 17), (16, 26)], 'e03a4a')
    P.e(13, 14, 1, 1, 'ff9aa8')
    P.e(16, 6, 6, 2, GOLD2); P.e(16, 6, 4, 1, NAVY)                                                                                     # aureola
    P.p([(8, 15), (3, 10), (4, 17)], 'ffffff'); P.p([(24, 15), (29, 10), (28, 17)], 'ffffff')                                           # skrzydełka

def ach_yeti(P):
    badge(P)
    P.e(16, 15, 9, 9, 'f4f8ff'); P.e(16, 17, 6, 6, '9ac8f0')
    P.r(12, 14, 14, 15, '14101f'); P.r(18, 14, 20, 15, '14101f'); P.r(14, 20, 18, 21, '14101f'); P.px(14, 21, 'ffffff'); P.px(18, 21, 'ffffff')
    P.p([(8, 8), (12, 6), (11, 11)], 'dce8ff'); P.p([(24, 8), (20, 6), (21, 11)], 'dce8ff')
    P.e(25, 24, 5, 5, 'e03a3a'); P.e(25, 24, 3, 3, '24203c'); P.l((22, 27), (28, 21), 'e03a3a', 2)                                           # zakaz = brak ulepszeń

ICONS = [('ach_endless10', ach_endless), ('ach_slimeking', ach_slime), ('ach_win', ach_win), ('ach_witch', ach_witch), ('ach_comps', ach_comps),
         ('ach_gear', ach_gear), ('ach_vamp', ach_vamp), ('ach_resist', ach_resist), ('ach_nodeath', ach_nodeath), ('ach_yeti', ach_yeti)]
def build_icons():
    for name, fn in ICONS:
        im = Image.new('RGBA', (32, 32), (0, 0, 0, 0)); fn(Pen(im)); save(finish(im), 'achievements', name)

if __name__ == '__main__':
    build_enemies(); build_icons(); print('enemies + icons OK')
