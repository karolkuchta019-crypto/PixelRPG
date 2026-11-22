"""v1.3.0 – księżniczka z DOSTARCZONEGO obrazka (sprite_ksiezniczki / obraz.png): zmniejszenie oryginalnych sprite'ów do klatek gry + drobna korekta twarzy.
Uruchom: python3 gen130_princess_from_photo.py <obraz.png>"""
import sys, numpy as np
from PIL import Image
from generate_v111 import finish, sheet, save, fall

BOXES = [(439,621,101,394),(654,830,101,394),(865,1042,101,394),(1074,1251,101,394),(438,619,448,747),(648,830,448,748),(859,1042,448,747),(1069,1251,448,747)]

def fit(c):
    """dopasowuje siatkę „dużych pikseli” (okres ~9.8 px) minimalizując wariancję kolorów wewnątrz bloków"""
    best = None
    for p in np.arange(9.4, 10.3, 0.1):
        for ox in np.arange(0, p, 0.7):
            for oy in np.arange(0, p, 0.7):
                v = 0; cnt = 0
                for j in range(0, int((c.shape[0] - oy) // p)):
                    for i in range(0, int((c.shape[1] - ox) // p)):
                        blk = c[int(oy + j * p) + 2:int(oy + (j + 1) * p) - 1, int(ox + i * p) + 2:int(ox + (i + 1) * p) - 1]
                        if blk.size: v += blk.reshape(-1, 3).var(0).sum(); cnt += 1
                sc = v / max(cnt, 1)
                if best is None or sc < best[0]: best = (sc, p, ox, oy)
    return best[1:]

def cut(src, box):
    x0, x1, y0, y1 = box
    c = np.array(src.crop((x0 - 6, y0 - 6, x1 + 6, y1 + 6))).astype(float)
    p, ox, oy = fit(c)
    ny, nx = int((c.shape[0] - oy) // p), int((c.shape[1] - ox) // p)
    out = np.zeros((ny, nx, 4), np.uint8)
    for j in range(ny):
        for i in range(nx):
            blk = c[int(oy + j * p) + 2:int(oy + (j + 1) * p) - 1, int(ox + i * p) + 2:int(ox + (i + 1) * p) - 1].reshape(-1, 3)
            m = np.median(blk, 0)
            out[j, i] = (*m.astype(np.uint8), 255 if m.sum() > 70 else 0)
    im = Image.fromarray(out, 'RGBA'); return im.crop(im.getchannel('A').getbbox())

def frame(sp, dx=0, dy=0):
    f = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    f.paste(sp, ((32 - sp.width) // 2 + dx, 31 - sp.height + dy), sp); return f

def palette(sps, k=16):
    """redukcja do małej palety (usuwa „błoto” z rozmytego źródła)"""
    px = np.vstack([np.array(s).reshape(-1, 4)[np.array(s).reshape(-1, 4)[:, 3] > 0][:, :3] for s in sps]).astype(float)
    rng = np.random.RandomState(1); cen = px[rng.choice(len(px), k, replace=False)]
    for _ in range(25):
        d = ((px[:, None] - cen[None]) ** 2).sum(2); lab = d.argmin(1)
        for j in range(k):
            if (lab == j).any(): cen[j] = px[lab == j].mean(0)
    return cen

def quant(sp, cen):
    a = np.array(sp).copy(); m = a[..., 3] > 0
    d = ((a[..., :3][m][:, None].astype(float) - cen[None]) ** 2).sum(2); a[..., :3][m] = cen[d.argmin(1)].astype(np.uint8)
    return Image.fromarray(a, 'RGBA')

def face(sp, blink=False):
    """oczy (w źródle twarz jest pusta): skóra -> dwa ciemne oczka z odbiciem, buzia"""
    a = np.array(sp).copy(); h, w = a.shape[:2]
    sk = (a[..., 3] > 0) & (a[..., 0] > 205) & (a[..., 1] > 150) & (a[..., 1] < 205) & (a[..., 2] > 110) & (a[..., 2] < 170)
    ys, xs = np.where(sk[:h * 2 // 3]); 
    top = ys.min(); fx0, fx1 = np.percentile(xs, 8), np.percentile(xs, 92)
    ey = top + 4; cx = (fx0 + fx1) / 2
    ex = [int(round(cx - 2.5)), int(round(cx + 1.5))]
    for x in ex:
        if blink: a[ey + 1, x:x + 2] = (40, 24, 40, 255)
        else:
            a[ey:ey + 2, x] = (40, 24, 40, 255); a[ey:ey + 2, x + 1] = (40, 24, 40, 255); a[ey, x] = (255, 255, 255, 255)
    a[ey + 4, int(cx) - 1:int(cx) + 1] = (200, 80, 90, 255)           # buzia
    return Image.fromarray(a, 'RGBA')

def hires(src, box, h=46, ncol=22, cen=None):
    """sprite z obrazka -> klatka o wysokości h px (rozmiar „dużych pikseli” bliski oryginałowi), przezroczyste tło, mała paleta"""
    x0, x1, y0, y1 = box
    c = src.crop((x0 - 6, y0 - 6, x1 + 6, y1 + 6)); a = np.array(c).astype(float)
    al = np.clip((a.sum(2) - 50) / 40, 0, 1); im = Image.fromarray(np.dstack([a, al * 255]).astype(np.uint8), 'RGBA')
    im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 100 else 0).getbbox())
    w = round(im.width * h / im.height)
    pm = np.array(im).astype(float); pm[..., :3] *= pm[..., 3:4] / 255.
    r = np.array(Image.fromarray(pm.astype(np.uint8)).resize((w, h), Image.LANCZOS)).astype(float)
    ra = np.array(im.getchannel('A').resize((w, h), Image.LANCZOS)).astype(float)
    rgb = (r[..., :3] / np.maximum(ra[..., None] / 255., .08)).clip(0, 255)
    out = np.dstack([rgb, np.where(ra > 120, 255, 0)]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

FW, FH = 32, 48
def eyes(sp, kind='open'):
    """w źródle twarz jest pusta – dorysowujemy tylko oczka (+ rumieńce); reszta sprite'a bez zmian"""
    a = np.array(sp).copy(); h, w = a.shape[:2]
    from scipy import ndimage
    sk = (a[..., 3] > 0) & (a[..., 0] > 215) & (a[..., 1] > 165) & (a[..., 1] < 215) & (a[..., 2] > 120) & (a[..., 2] < 185)
    sk[int(h * .5):] = False
    lab, n = ndimage.label(sk); best = None                                      # składowa skóry najbliżej środka twarzy (18,16)
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        if len(ys) < 12: continue
        d = abs(xs.mean() - 19) + abs(ys.mean() - 16)
        if best is None or d < best[0]: best = (d, xs, ys)
    _, xs, ys = best; top = int(ys.min()); cx = (xs.min() + xs.max()) / 2.0; D = (38, 22, 40, 255); SK = (244, 190, 146, 255)
    cxi = int(round(cx))
    # wyczyść twarz: ciemne paski z oryginału (jego „oczy”) zlewały się z oczami -> efekt cyklopa; wypełniamy skórą pole twarzy
    for y in range(top + 1, top + 10):
        for x in range(cxi - 5, cxi + 5):
            r, g, b, al = a[y, x]
            if al and (int(r) + int(g) + int(b)) < 330: a[y, x] = SK
    ey = top + 3
    ex = (cxi - 3, cxi + 1)
    for x in ex:
        if kind == 'closed': a[ey + 1, x:x + 2] = D
        elif kind == 'hurt': a[ey, x] = a[ey + 1, x + 1] = a[ey + 2, x] = a[ey, x + 1] = a[ey + 2, x + 1] = D
        else: a[ey:ey + 3, x:x + 2] = D; a[ey, x] = (255, 255, 255, 255)
    a[ey + 4, cxi - 4] = a[ey + 4, cxi + 3] = (236, 150, 140, 255)                    # rumieńce
    a[ey + 7, cxi - 1:cxi + 1] = (190, 76, 88, 255) if kind != 'hurt' else (120, 40, 50, 255)   # buzia
    return Image.fromarray(a, 'RGBA')

def frm(sp, dx=0, dy=0, shear=0):
    f = Image.new('RGBA', (FW, FH), (0, 0, 0, 0)); x = (FW - sp.width) // 2 + dx
    if shear:                                                   # lekkie pochylenie (chód/uderzenie): górne wiersze przesunięte
        for y in range(sp.height):
            row = sp.crop((0, y, sp.width, y + 1)); off = round(shear * (1 - y / sp.height) ** 1.5)
            f.paste(row, (x + off, FH - 1 - sp.height + y + dy), row)
    else: f.paste(sp, (x, FH - sp.height + dy), sp)
    return f

def fallf(idle, steps=((25, 16), (65, 15), (90, 15))):
    out = []
    for ang, cx in steps:
        r = idle.rotate(ang, resample=Image.NEAREST, expand=True); r = r.crop(r.getbbox())
        f = Image.new('RGBA', (FW, FH), (0, 0, 0, 0)); f.alpha_composite(r, (max(0, min(FW - r.width, cx - r.width // 2)), FH - 1 - r.height)); out.append(f)
    return out

def strip(frames):
    im = Image.new('RGBA', (FW * len(frames), FH), (0, 0, 0, 0))
    for i, f in enumerate(frames): im.paste(f, (i * FW, 0))
    return im

if __name__ == '__main__':
    src = Image.open(sys.argv[1]).convert('RGB')
    sp = [hires(src, b) for b in BOXES]; cen = palette(sp, 24); sp = [quant(s, cen) for s in sp]
    A, B, C = eyes(sp[1]), eyes(sp[2]), eyes(sp[3]); blink = eyes(sp[5], 'closed'); W1, W2 = eyes(sp[4]), eyes(sp[6]); hurt = eyes(sp[7], 'hurt')
    F = lambda f: finish(f)
    idle = [F(frm(A)), F(frm(B))]
    walk = [F(frm(A, dy=0)), F(frm(W1, dy=-1, shear=1)), F(frm(B, dy=0)), F(frm(W2, dy=-1, shear=-1))]
    attack = [F(frm(C, dx=-1, shear=-2)), F(frm(A, dx=2, dy=-1, shear=3))]
    hurtf = [F(frm(hurt, dx=-2, shear=-3))]
    death = [F(f) for f in fallf(frm(A))]
    for n, fr in (('princess', idle), ('princess_walk', walk), ('princess_attack', attack), ('princess_hurt', hurtf), ('princess_death', death)):
        save(strip(fr), 'player', n)
    strip(idle + walk + attack + hurtf + death).resize((FW * 13 * 10, FH * 10), Image.NEAREST).save('/tmp/pr_all.png'); print('OK')
