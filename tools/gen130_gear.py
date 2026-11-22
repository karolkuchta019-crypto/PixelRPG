"""v1.3.0 – SMOCZY EKWIPUNEK (zbroja, miecz, tarcza) – przekolorowanie wersji mithrilowych na karmazyn + złoto, rogi na hełmie, złoty środek tarczy.
Uruchom: python3 gen130_gear.py  (Pillow). Zapisuje do ../assets/player i ../assets/items."""
import colorsys, os
from PIL import Image
A = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')

def recolor(im, blade=False):
    im = im.convert('RGBA'); p = im.load(); w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = p[x, y]
            if not a: continue
            hh, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if 0.38 <= hh <= 0.58 and s > 0.10:
                if v > 0.88 and s < 0.45:                       # jasny grzebień / ostrze -> złoto-ogień
                    nh, ns, nv = 0.10 if not blade else 0.075, 0.62 if not blade else 0.78, 1.0
                else:                                           # reszta metalu -> karmazyn
                    nh, ns, nv = 0.995 + (v - 0.5) * 0.05, min(1, s * 0.9 + 0.18), v * (0.92 if not blade else 1.0)
                r2, g2, b2 = colorsys.hsv_to_rgb(nh % 1, ns, nv)
                p[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    return im

def horns(fr):
    """dorysowuje dwa kościane rogi po bokach hełmu (z ciemnym konturem)"""
    p = fr.load(); w, h = fr.size
    top = next((y for y in range(h) for x in range(w) if p[x, y][3]), None)
    if top is None: return fr
    y0 = top + 3
    xs = [x for x in range(w) if p[x, y0][3]]
    if not xs: return fr
    xl, xr = min(xs), max(xs)
    BONE, BONE2, OUT = (238, 228, 200, 255), (200, 186, 150, 255), (42, 20, 24, 255)
    pix = []
    for sgn, x0 in ((-1, xl), (1, xr)):
        pix += [(x0 + sgn * 1, y0 + 1, BONE2), (x0 + sgn * 2, y0 + 1, BONE2), (x0 + sgn * 2, y0, BONE), (x0 + sgn * 3, y0 - 1, BONE), (x0 + sgn * 3, y0 - 2, BONE2), (x0 + sgn * 2, y0 - 2, BONE)]
    q = fr.copy(); qp = q.load()
    for x, y, c in pix:
        if 0 <= x < w and 0 <= y < h: qp[x, y] = c
    pts = {(x, y) for x, y, _ in pix}
    for x, y in list(pts):
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in pts and not p[nx, ny][3]: qp[nx, ny] = OUT
    return q

def with_horns(sheet, nfr, skip=()):
    out = Image.new('RGBA', sheet.size, (0, 0, 0, 0))
    for i in range(nfr):
        f = sheet.crop((i * 32, 0, i * 32 + 32, 32))
        out.paste(horns(f) if i not in skip else f, (i * 32, 0))
    return out

def build():
    pl = os.path.join(A, 'player'); it = os.path.join(A, 'items')
    for suf, n in (('', 2), ('_walk', 4), ('_attack', 3), ('_hurt', 1), ('_death', 2)):
        sh = recolor(Image.open(os.path.join(pl, f'hero_mythril{suf}.png')))
        if suf != '_death': sh = with_horns(sh, sh.width // 32)
        sh.save(os.path.join(pl, f'hero_dragon{suf}.png'))
    for n in ('sword_myth', 'sword_myth_attack'):
        im = recolor(Image.open(os.path.join(it, n + '.png')), blade=True)
        im.save(os.path.join(it, n.replace('myth', 'dragon') + '.png'))
    sh = recolor(Image.open(os.path.join(it, 'shield_myth.png')))
    p = sh.load(); cx = cy = None
    # złoty środek tarczy z ciemnym pierścieniem
    xs = [x for x in range(32) for y in range(32) if p[x, y][3]]; ys = [y for x in range(32) for y in range(32) if p[x, y][3]]
    cx, cy = (min(xs) + max(xs)) // 2, (min(ys) + max(ys)) // 2
    for y in range(32):
        for x in range(32):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** .5
            if p[x, y][3]:
                if d < 3.2: p[x, y] = (242, 193, 78, 255)
                elif d < 4.4: p[x, y] = (110, 24, 30, 255)
    # grzebień: kilka złotych kolców na obrzeżu
    for k in range(8):
        import math
        ang = k * math.pi / 4; r = ((max(xs) - min(xs)) // 2) - 1
        x, y = int(round(cx + math.cos(ang) * r)), int(round(cy + math.sin(ang) * r))
        if 0 <= x < 32 and 0 <= y < 32 and p[x, y][3]: p[x, y] = (248, 220, 112, 255)
    sh.save(os.path.join(it, 'shield_dragon.png'))
    print('dragon gear OK')

if __name__ == '__main__':
    build()
