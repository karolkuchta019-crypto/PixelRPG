"""v1.3.0 – nowa KSIĘŻNICZKA (brązowe długie włosy z jasnymi pasmami, złota korona z błękitnym kamieniem, gwiazdka we włosach,
niebieska suknia ze złotymi lamówkami i różowym przodem) – na podstawie dostarczonego obrazka. Uruchom: python3 gen130_princess.py"""
from PIL import Image
from generate_v111 import Pen, finish, sheet, save, fall

HAIR, HAIR2, HAIR3 = '5a3420', '7a4a2c', '3e2214'      # ciemny brąz, jaśniejszy brąz, cień
BLOND, BLOND2 = 'd8b080', 'f0d4a4'                      # jasne pasma
SKIN, SKIN2, BLUSH = 'f2bc94', 'dca078', 'e8908a'
GOLD, GOLD2, GEM = 'e8b830', 'f8dc70', '5aa8f0'
BLUE, BLUE2, BLUE3 = '3a6cc0', '5a94e4', '28488c'      # suknia
PINK, PINK2, PINK3 = 'd8709a', 'f4a0bc', 'b04c72'
STAR = 'fbe8a0'
EYE = '1e1226'

def princess(P, k, f):
    """k: 'i' idle(2) | 'w' walk(4) | 'a' attack(2) | 'h' hurt(1)"""
    bob = (0, 1)[f % 2] if k == 'i' else ((0, 1, 0, 1)[f] if k == 'w' else 0)
    sway = (0, 1, 0, -1)[f] if k == 'w' else ((0, 1)[f % 2] if k == 'i' else 0)
    lean = -1 if k == 'h' else 0
    s = bob
    # ---------- tylne włosy (długie, opadają po obu stronach do pasa) ----------
    P.p([(9+lean, 5+s), (23+lean, 5+s), (26+lean, 12+s), (27+lean+sway, 22+s), (24+lean+sway, 26+s), (22+lean, 15+s), (10+lean, 15+s), (7+lean-sway, 27+s), (4+lean-sway, 23+s), (5+lean, 12+s)], HAIR)
    P.p([(7+lean, 14+s), (9+lean, 15+s), (7+lean-sway, 26+s), (5+lean-sway, 22+s)], HAIR2)           # jaśniejszy kosmyk z lewej
    P.p([(24+lean, 14+s), (25+lean, 20+s), (24+lean+sway, 24+s), (22+lean, 16+s)], HAIR2)
    P.px(6+lean-sway, 19+s, HAIR3); P.px(5+lean-sway, 22+s, HAIR3); P.px(26+lean+sway, 21+s, HAIR3)
    # kok / kosmyk z gwiazdką (lewa strona)
    P.e(10+lean, 4+s, 3, 2, HAIR2); P.e(21+lean, 4+s, 2, 2, HAIR2)
    # ---------- suknia ----------
    # spódnica (dzwon)
    P.p([(11, 19+s), (21, 19+s), (28, 31), (4, 31)], BLUE)
    P.p([(4, 31), (11, 19+s), (13, 19+s), (9, 31)], BLUE3)                                         # cień po lewej
    P.p([(21, 19+s), (19, 19+s), (23, 31), (28, 31)], BLUE2)                                       # światło po prawej
    # różowy przód (stomacher)
    P.p([(14, 18+s), (18, 18+s), (21, 31), (11, 31)], PINK)
    P.p([(14, 18+s), (15, 18+s), (13, 31), (11, 31)], PINK3)
    P.p([(17, 18+s), (18, 18+s), (21, 31), (19, 31)], PINK2)
    # złote lamówki wzdłuż przodu i rąbka
    P.l((14, 19+s), (11, 31), GOLD, 1); P.l((18, 19+s), (21, 31), GOLD, 1)
    P.r(5, 29, 10, 29, GOLD); P.r(22, 29, 27, 29, GOLD)
    P.r(15, 21+s, 17, 21+s, GOLD2); P.r(15, 25, 17, 25, GOLD2)                                      # guziczki / wstążki na przodzie
    # gorset
    P.r(11, 16+s, 21, 19+s, BLUE); P.r(11, 16+s, 12, 19+s, BLUE3); P.r(20, 16+s, 21, 19+s, BLUE2)
    P.r(13, 16+s, 19, 16+s, GOLD)                                                                    # dekolt – złota lamówka
    P.px(13, 17+s, GOLD2); P.px(19, 17+s, GOLD2); P.px(16, 17+s, GEM)                                # naszyjnik z kamykiem
    # ---------- rękawy (bufiaste, niebieskie z różowymi mankietami) ----------
    def arm(x, front):
        P.e(x, 18+s, 3, 2, BLUE); P.px(x-1, 17+s, BLUE2); P.px(x+1, 19+s, BLUE3)                    # bufka
        P.r(x-2, 21+s, x+1, 22+s, PINK); P.px(x-2, 21+s, PINK2); P.r(x-2, 22+s, x+1, 22+s, PINK3)    # mankiet
        P.r(x-1, 23+s, x, 24+s, SKIN)                                                                # dłoń
    if k == 'a':
        P.e(8, 18+s, 3, 2, BLUE); P.r(6, 21+s, 9, 22+s, PINK); P.r(7, 23+s, 8, 24+s, SKIN)
        P.e(24, 17+s, 3, 2, BLUE); P.r(24, 12+s, 27, 14+s, PINK); P.r(25, 9+s, 26, 11+s, SKIN)       # ręka w górze
        for (x, y) in ((27, 5), (29, 8), (25, 6)): P.px(x, y+s, STAR)                                # błysk magii
    else:
        arm(8, 0); arm(24, 1)
    # ---------- buty (wystają spod sukni przy chodzie) ----------
    if k == 'w':
        a = (0, 2, 0, -2)[f]
        P.r(12+a, 31, 14+a, 31, PINK3); P.r(18-a, 31, 20-a, 31, PINK3)
    # ---------- głowa ----------
    P.e(16+lean, 10+s, 6, 6, SKIN)
    P.r(11+lean, 13+s, 21+lean, 14+s, SKIN)                                                           # policzki
    P.px(11+lean, 15+s, SKIN2); P.px(21+lean, 15+s, SKIN2); P.r(14+lean, 16+s, 18+lean, 16+s, SKIN2)  # szyja / cień pod brodą
    # grzywka – ciemna czapa + jasne pasma po bokach
    P.r(10+lean, 3+s, 22+lean, 6+s, HAIR)
    P.p([(10+lean, 6+s), (13+lean, 6+s), (12+lean, 9+s), (10+lean, 11+s)], HAIR)
    P.p([(22+lean, 6+s), (19+lean, 6+s), (20+lean, 8+s), (22+lean, 10+s)], HAIR)
    P.l((11+lean, 6+s), (11+lean, 13+s), BLOND, 2)                                                    # jasne pasmo z lewej
    P.l((21+lean, 7+s), (21+lean, 13+s), BLOND, 1)
    P.px(12+lean, 5+s, BLOND2); P.px(14+lean, 6+s, HAIR2); P.px(18+lean, 6+s, HAIR2)
    P.px(16+lean, 7+s, HAIR)                                                                          # przedziałek
    # twarz: oczy, rumieńce, buzia
    if k == 'h':
        for ex in (13, 18):
            P.l((ex+lean, 9+s), (ex+2+lean, 11+s), EYE, 1); P.l((ex+2+lean, 9+s), (ex+lean, 11+s), EYE, 1)
        P.r(15+lean, 13+s, 17+lean, 14+s, '7a2a3a')
    else:
        blink = (k == 'i' and f == 1)
        for ex in (13, 18):
            if blink: P.r(ex+lean, 10+s, ex+1+lean, 10+s, EYE)
            else:
                P.r(ex+lean, 9+s, ex+1+lean, 11+s, EYE); P.px(ex+lean, 9+s, 'ffffff')
        P.px(12+lean, 12+s, BLUSH); P.px(20+lean, 12+s, BLUSH)
        P.r(15+lean, 13+s, 17+lean, 13+s, 'c0505a'); P.px(16+lean, 14+s, SKIN2) if k != 'a' else P.r(15+lean, 13+s, 17+lean, 14+s, '8a2a3a')
    # ---------- korona ----------
    P.r(12+lean, 3+s, 20+lean, 4+s, GOLD); P.p([(12+lean, 3+s), (13+lean, 1+s), (15+lean, 3+s)], GOLD); P.p([(15+lean, 3+s), (16+lean, 1+s), (17+lean, 3+s)], GOLD2); P.p([(17+lean, 3+s), (19+lean, 1+s), (20+lean, 3+s)], GOLD)
    P.px(16+lean, 3+s, GEM); P.px(16+lean, 4+s, GEM); P.px(13+lean, 3+s, GOLD2); P.px(19+lean, 3+s, GOLD2)
    # ---------- gwiazdka we włosach ----------
    P.px(9+lean, 6+s, STAR); P.r(8+lean, 7+s, 10+lean, 7+s, STAR); P.px(9+lean, 8+s, STAR); P.px(9+lean, 5+s, STAR)

def build():
    i = [finish_frame(princess, 'i', f) for f in range(2)]
    w = [finish_frame(princess, 'w', f) for f in range(4)]
    a = [finish_frame(princess, 'a', f) for f in range(2)]
    h = [finish_frame(princess, 'h', 0)]
    d = fall(i[0], ((40, 16), (90, 15)))
    return i, w, a, h, d

def finish_frame(fn, k, f):
    im = Image.new('RGBA', (32, 32), (0, 0, 0, 0)); fn(Pen(im), k, f); return finish(im)

if __name__ == '__main__':
    i, w, a, h, d = build()
    for n, fr in (('princess', i), ('princess_walk', w), ('princess_attack', a), ('princess_hurt', h), ('princess_death', d)):
        save(sheet(fr), 'player', n)
    print('princess OK')
