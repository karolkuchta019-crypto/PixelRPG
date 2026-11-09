"""Generuje pixel-artowe PNG do ../assets (postacie, bossowie, tła, efekty). Uruchom: python3 generate_assets.py
Możesz edytować funkcje rysujące albo po prostu nadpisać pliki własnymi grafikami."""
from PIL import Image, ImageDraw
import math, random, os
A=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','assets')
DARK=(26,16,32,255)
H=lambda h:tuple(int(h[i:i+2],16) for i in(1,3,5))
C=lambda h:H('#'+h.lstrip('#'))+(255,)
lerp=lambda a,b,t:tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))
class Pen:
 def __init__(s,im,dx=0,dy=0):s.d=ImageDraw.Draw(im);s.dx=dx;s.dy=dy
 def r(s,x0,y0,x1,y1,c):s.d.rectangle([x0+s.dx,y0+s.dy,x1+s.dx,y1+s.dy],fill=C(c))
 def e(s,x,y,rx,ry,c):s.d.ellipse([x-rx+s.dx,y-ry+s.dy,x+rx+s.dx,y+ry+s.dy],fill=C(c))
 def p(s,pts,c):s.d.polygon([(x+s.dx,y+s.dy) for x,y in pts],fill=C(c))
 def l(s,a,b,c,w=2):s.d.line([(a[0]+s.dx,a[1]+s.dy),(b[0]+s.dx,b[1]+s.dy)],fill=C(c),width=w)
 def m(s,pts,c):s.p([(96-x,y) for x,y in pts],c) if False else None
def finish(im):  # światło/cień + kontur
 w,h=im.size;p=im.load();q=im.copy();qp=q.load()
 for y in range(h):
  for x in range(w):
   r,g,b,a=p[x,y]
   if not a:continue
   up=p[x,y-1][3] if y else 0;dn=p[x,y+1][3] if y<h-1 else 0
   if not up:qp[x,y]=tuple(min(255,int(c*1.3+18)) for c in(r,g,b))+(255,)
   elif not dn:qp[x,y]=tuple(int(c*.72) for c in(r,g,b))+(255,)
 for y in range(h):
  for x in range(w):
   if not p[x,y][3]:
    nb=[p[x+i,y+j] for i,j in((1,0),(-1,0),(0,1),(0,-1)) if 0<=x+i<w and 0<=y+j<h and p[x+i,y+j][3]]
    if nb:n=nb[0];qp[x,y]=(int(n[0]*.22)+10,int(n[1]*.18)+6,int(n[2]*.28)+16,255)
 return q
# ---------- postacie (zwrócone w prawo) ----------
def hero(P,k,f):
 w=k=='w';a=k=='a'
 P.r(11,24,14,30-(f and w),'3a4a8a');P.r(17,24,20,30-((not f) and w),'3a4a8a');P.r(10,29,14,30,'5a3a2a');P.r(17,29,21,30,'5a3a2a')
 P.r(10,15,21,25,'4a7bd8');P.r(10,22,21,23,'8a5a2a');P.r(8,15,11,19,'9aa8c8');P.r(20,15,23,19,'9aa8c8')
 P.e(16,10,5,5,'f0c8a0');P.r(11,4,21,8,'9aa8c8');P.r(15,2,17,4,'d64545');P.r(18,10,19,11,'101020');P.r(13,10,14,11,'101020')
 P.e(8,21,3,4,'c9a227')
 if a:P.r(22,13,31,15,'dfe6f0');P.r(21,12,22,16,'c9a227')
 else:P.r(23,5,24,18,'dfe6f0');P.r(22,18,25,19,'c9a227')
def slime(P,k,f):
 s=f if k=='i' else 0
 P.e(16,26+s,11,8-s,'4fd05a');P.e(11,22,3,2,'b0f5a8');P.r(13,23,15,26,'ffffff');P.r(19,23,21,26,'ffffff');P.r(14,24,15,26,'101020');P.r(20,24,21,26,'101020')
 P.r(12,22,16,22,'101020');P.r(18,22,22,22,'101020');P.r(14,29,19,29,'1a3a1a')
 if k=='a':P.r(13,28,20,30,'401020');P.r(14,28,15,28,'ffffff');P.r(18,28,19,28,'ffffff')
def goblin(P,k,f):
 P.p([(10,9),(2,7),(10,14)],'7fbf3f');P.p([(22,9),(30,7),(22,14)],'7fbf3f')
 P.r(12,24,14,30,'7fbf3f');P.r(18,24,20,30,'7fbf3f');P.r(10,15,22,25,'6b4a2a');P.r(10,22,22,25,'4a3220');P.e(16,11,6,5,'7fbf3f')
 P.r(12,10,14,11,'ff3030');P.r(18,10,20,11,'ff3030');P.r(14,14,18,14,'ffffff');P.r(7,16,10,21,'7fbf3f')
 if k=='a':P.r(22,16,31,17,'dfe6f0');P.r(21,15,22,18,'8a5a2a')
 else:P.r(23,13,24,21,'dfe6f0');P.r(22,21,25,22,'8a5a2a')
def skeleton(P,k,f):
 B='e8e4d0';P.e(16,9,6,6,B);P.r(12,12,20,15,B);P.r(12,8,14,10,'101020');P.r(18,8,20,10,'101020');P.r(13,9,13,9,'ff3030');P.r(19,9,19,9,'ff3030')
 P.r(15,15,17,25,B)
 for y in(16,18,20):P.r(11,y,21,y,B)
 P.r(11,25,21,26,B);P.r(12,26,13,30,B);P.r(19,26,20,30,B);P.r(8,16,10,24,B)
 if k=='a':P.r(22,14,31,15,'8a9aa8');P.r(21,13,22,16,'6a4a2a')
 else:P.r(23,6,24,20,'8a9aa8');P.r(22,20,25,21,'6a4a2a')
def shroom(P,k,f):  # grzybek-stworek
 s=f if k=='i' else 0;j=3 if k=='a' else 0
 P.r(11,18-j,21,28,'f0e0c0');P.r(12,28,14,30,'c8b090');P.r(18,28,20,30,'c8b090');P.r(8,20-j,10,24,'f0e0c0');P.r(22,20-j,24,24,'f0e0c0')
 P.e(16,13-j+s,12,8,'d04a4a');P.r(4,15-j+s,28,17-j+s,'d04a4a');P.e(9,11-j+s,2,2,'ffffff');P.e(17,8-j+s,2,2,'ffffff');P.e(23,12-j+s,2,2,'ffffff')
 P.r(12,20-j,14,22-j,'101020');P.r(18,20-j,20,22-j,'101020');P.r(11,18-j,14,18-j,'401018');P.r(18,18-j,21,18-j,'401018');P.r(14,25-j,18,25-j,'8a3a2a')
def elf(P,k,f):  # leśny elf z szablą
 P.p([(10,14),(22,14),(26,28),(6,28)],'2a5a3a');P.r(12,24,14,30,'5a4a3a');P.r(18,24,20,30,'5a4a3a');P.r(11,15,21,25,'3a7a4a');P.r(11,22,21,23,'8a5a2a')
 P.p([(10,9),(1,5),(10,13)],'e8c8a8');P.p([(22,9),(31,5),(22,13)],'e8c8a8');P.e(16,10,5,5,'e8c8a8');P.r(10,3,22,8,'e8e8f0');P.r(9,5,11,16,'e8e8f0')
 P.r(13,10,14,11,'30d0e0');P.r(18,10,19,11,'30d0e0')
 if k=='a':P.r(22,15,31,16,'dfe6f0');P.r(21,14,22,17,'c9a227')
 else:P.r(23,6,24,20,'dfe6f0');P.r(22,20,25,21,'c9a227')
def lavagolem(P,k,f):  # golem z lawowymi pęknięciami
 R='3a2a2a';L='ff7a20';a=k=='a'
 P.r(9,24,14,30,R);P.r(18,24,23,30,R);P.r(7,10,25,26,R);P.e(16,8,5,5,'4a3434');P.e(5,15,3,5,R)
 P.r(25,12,29,20,R) if not a else P.r(25,15,31,19,R)
 for pts in([(11,12),(13,16),(11,20)],[(20,13),(18,17),(21,22)],[(14,24),(16,28)]):
  for (x0,y0),(x1,y1) in zip(pts,pts[1:]):P.d.line([(x0+P.dx,y0+P.dy),(x1+P.dx,y1+P.dy)],fill=C(L),width=1)
 P.r(14,7,15,8,'ffe030');P.r(17,7,18,8,'ffe030');P.r(15,11,17,11,L)
def imp(P,k,f):
 P.p([(10,22),(3,24),(2,17),(8,20)],'d04a3a')  # ogon
 P.e(16,20,6,7,'d04a3a');P.r(12,26,14,30,'a03020');P.r(18,26,20,30,'a03020');P.e(16,11,5,5,'d04a3a')
 P.p([(12,8),(9,1),(15,6)],'f0e0a0');P.p([(20,8),(23,1),(17,6)],'f0e0a0');P.r(13,10,14,11,'ffe030');P.r(18,10,19,11,'ffe030');P.r(14,14,18,14,'101020')
 P.p([(22,16),(29,12),(26,19)],'a03020')
 P.r(24,5,25,28,'8a6a3a') if k!='a' else P.r(22,17,31,18,'8a6a3a')
 if k!='a':P.r(22,4,27,5,'cfd6e0');P.r(22,2,22,4,'cfd6e0');P.r(27,2,27,4,'cfd6e0')
# ---------- bossowie 48x48 ----------
def slimeking(P,k,f):
 s=f if k=='i' else 0
 P.p([(8,30),(12,12),(18,26)],'c03030');P.p([(30,26),(36,12),(40,30)],'c03030');P.p([(18,24),(24,10),(30,24)],'c03030')
 P.e(24,40+s,20,15-s,'4fb04a');P.e(14,32,4,3,'a8f0a0')
 P.p([(14,22),(16,12),(20,18),(24,10),(28,18),(32,12),(34,22)],'f2c14e');P.r(14,21,34,24,'d9a320')
 P.r(14,28,21,33,'ffffff');P.r(27,28,34,33,'ffffff');P.r(18,29,21,33,'e01010');P.r(30,29,33,33,'e01010')
 P.p([(12,25),(22,29),(22,27),(12,22)],'101020');P.p([(36,25),(26,29),(26,27),(36,22)],'101020')
 P.r(14,38,34,43+(k=='a')*3,'401020')
 for x in(16,20,24,28,31):P.p([(x,38),(x+2,38),(x+1,41)],'ffffff')
def orc(P,k,f):
 G='5a8a4a';P.r(14,38,20,46,'4a6a3a');P.r(27,38,33,46,'4a6a3a');P.r(13,45,21,47,'2a2a30');P.r(26,45,34,47,'2a2a30')
 P.r(11,20,36,38,G);P.r(11,32,36,36,'6a4a2a');P.r(6,22,11,36,G);P.e(10,22,6,5,'8a8a9a')
 for x in(5,9,13):P.p([(x,19),(x+2,12),(x+4,19)],'cfd6e0')
 P.e(24,13,8,8,G);P.r(15,5,33,9,'7a7a8a');P.p([(15,8),(7,0),(17,3)],'e8e0c0');P.p([(33,8),(41,0),(31,3)],'e8e0c0')
 P.r(18,11,21,13,'ff2020');P.r(27,11,30,13,'ff2020');P.p([(19,17),(17,23),(22,18)],'ffffff');P.p([(29,17),(31,23),(26,18)],'ffffff')
 if k=='a':P.r(30,20,46,21,'6a4a2a');P.p([(44,12),(47,14),(47,28),(44,30)],'cfd6e0');P.r(44,15,46,26,'c03030')
 else:P.r(38,6,39,42,'6a4a2a');P.p([(39,6),(47,10),(47,22),(39,24)],'cfd6e0');P.r(40,10,46,20,'c03030')
def demon(P,k,f):
 P.p([(14,24),(0,4),(5,22),(0,32),(10,32)],'601018');P.p([(34,24),(48,4),(43,22),(48,32),(38,32)],'601018')
 P.r(15,38,21,46,'801818');P.r(27,38,33,46,'801818');P.r(14,45,22,47,'1a1a20');P.r(26,45,34,47,'1a1a20')
 P.r(14,20,34,38,'a02828');P.r(14,32,34,35,'401018');P.e(24,28,3,3,'ffe030');P.r(8,22,14,34,'a02828');P.p([(8,34),(6,40),(11,34)],'f0e0b0')
 P.e(24,13,8,8,'b03030');P.p([(16,10),(6,0),(14,15)],'f0e0b0');P.p([(32,10),(42,0),(34,15)],'f0e0b0')
 P.r(18,12,22,14,'ffe030');P.r(26,12,30,14,'ffe030');P.r(19,18,29,19,'101020')
 for x in(20,24,28):P.p([(x,19),(x+2,19),(x+1,22)],'ffffff')
 if k=='a':P.r(30,22,47,24,'ff8a30');P.r(32,23,46,23,'ffe070');P.r(29,19,31,27,'c9a227')
 else:P.r(39,2,41,36,'ff8a30');P.r(40,4,40,34,'ffe070');P.r(36,36,44,37,'c9a227')
def merchant(P,k,f):  # wędrowny kupiec (styl wieśniaka)
 P.r(9,14,23,30,'6a4a2a');P.r(14,14,18,30,'8a6a3a');P.r(6,19,26,23,'5a3a1a');P.r(10,20,22,22,'7a5a3a')
 P.e(16,9,6,7,'e0b890');P.r(15,10,17,15,'c89870');P.r(11,6,21,7,'3a2a1a');P.r(12,8,13,9,'2a8a3a');P.r(19,8,20,9,'2a8a3a')
def wolf(P,k,f):
 G='9aa0b0';D='7a8090'
 P.p([(3,16),(11,17),(9,23)],G)
 for x in(8,12,19,23):P.r(x,24,x+2,30,D)
 P.e(14,21,9,5,G);P.r(8,23,20,24,'d0d8e8');P.e(24,16,5,4,G);P.p([(22,13),(22,8),(26,12)],G);P.r(27,16,31,19,G);P.r(30,16,31,17,'101020')
 P.r(24,14,25,15,'ffd030');P.r(27,19,28,20,'ffffff');P.r(30,19,31,20,'ffffff')
 if k=='a':P.r(27,19,31,21,'401018')
def spider(P,k,f):
 s=f if k=='i' else 0;B='4a2a6a';L='2a1a40'
 for a,b,c in(((14,20),(7,12+s),(4,28)),((17,21),(14,10+s),(10,28)),((22,20),(27,11+s),(30,28)),((20,21),(23,10+s),(27,28))):P.l(a,(b[0],b[1]),L);P.l((b[0],b[1]),c,L)
 P.e(10,20,7,6,B);P.e(21,19,5,5,B);P.r(8,17,12,18,'9a40d0');P.r(22,17,23,18,'ff2030');P.r(24,19,25,20,'ff2030');P.r(23,24,23,27,'ffffff')
def drone(P,k,f):
 P.dy-=2+(f if k=='i' else 0)
 P.r(6,4,26,5,'aab0c0');P.r(15,5,17,8,'6a7080');P.e(16,15,9,7,'8a96a8');P.r(7,15,25,16,'5a6070');P.e(19,14,4,4,'101820');P.e(19,14,2,2,'ff3030')
 P.r(24,17,31,19,'4a5060');P.r(10,22,11,26,'5a6070');P.r(21,22,22,26,'5a6070');P.r(11,12,12,12,'30ff60')
 if k=='a':P.r(30,16,31,20,'ffe030')
def robot(P,k,f):
 R='9a6a4a';M='7a7a88'
 P.r(10,23,14,30,M);P.r(18,23,22,30,M);P.r(9,29,15,31,'3a3a44');P.r(17,29,23,31,'3a3a44');P.r(9,12,23,24,M);P.r(11,14,21,18,R);P.r(14,18,18,21,'ff8a30')
 P.r(11,4,21,11,M);P.r(13,6,19,8,'30e0ff');P.r(15,1,16,4,M);P.r(14,0,17,1,'ff3030');P.r(6,13,8,22,M);P.r(10,22,11,23,R)
 if k=='a':P.r(23,14,31,16,'cfd6e0');P.r(28,12,31,13,'ffe030');P.r(29,17,31,18,'ffe030')
 else:P.r(24,10,25,22,'cfd6e0');P.r(23,8,26,9,'ffe030')
def yeti(P,k,f):
 W='e8f0ff';S='b8d0f0'
 P.r(13,36,20,46,S);P.r(27,36,34,46,S);P.r(12,44,21,47,'8aa0c0');P.r(26,44,35,47,'8aa0c0')
 P.e(24,28,15,13,W);P.e(7,30,5,10,W);P.e(24,14,9,8,W);P.e(24,16,6,5,'a8c8f0')
 P.p([(8,20),(5,8),(13,18)],'80e0ff');P.p([(40,20),(43,8),(35,18)],'80e0ff');P.p([(18,8),(20,1),(22,8)],'80e0ff');P.p([(26,8),(28,1),(30,8)],'80e0ff')
 P.r(19,13,22,14,'30e0ff');P.r(27,13,30,14,'30e0ff');P.p([(18,10),(23,13),(23,11)],'3a4a6a');P.p([(30,10),(25,13),(25,11)],'3a4a6a')
 P.r(20,18,28,20,'401828')
 for x in(21,24,27):P.p([(x,18),(x+1,18),(x,22)],'ffffff')
 if k=='a':P.r(30,24,46,27,'8a5a2a');P.e(45,25,6,6,'80e0ff')
 else:P.e(40,28,5,9,W);P.r(41,10,44,40,'8a5a2a');P.e(42,10,5,6,'80e0ff')
def spiderqueen(P,k,f):
 s=f if k=='i' else 0;B='4a2a6a';L='2a1a40'
 for a,b,c in(((24,30),(8,12+s),(2,42)),((26,32),(14,14+s),(8,46)),((28,32),(24,8+s),(22,46)),((30,30),(34,6+s),(40,45)),
   ((32,30),(44,12+s),(47,36))):P.l(a,b,L,3);P.l(b,c,L,3)
 P.e(14,30,12,11,B);P.p([(10,22),(18,22),(14,29),(18,37),(10,37),(14,29)],'e02030');P.p([(7,20),(9,10),(13,19)],'8a40c0');P.p([(15,19),(18,10),(21,20)],'8a40c0')
 P.e(32,28,9,8,B)
 for x,y in((29,24),(33,24),(36,27),(30,28),(34,29),(37,31)):P.r(x,y,x+1,y+1,'ff2030')
 P.p([(31,34),(30,45),(34,35)],'a0ff40');P.p([(37,35),(39,45),(40,34)],'a0ff40')
def mech(P,k,f):
 M='6a6a78';D='3a3a44'
 P.r(12,36,19,46,D);P.r(29,36,36,46,D);P.r(10,44,21,47,'2a2a30');P.r(27,44,38,47,'2a2a30')
 P.r(11,14,37,36,M);P.r(14,17,34,23,'8a7a6a');P.r(11,32,37,34,'e0c020');P.e(24,28,5,5,'ff8a30');P.e(24,28,2,2,'ffe070')
 P.r(18,5,30,13,D);P.r(20,8,28,10,'ff3030');P.r(14,6,17,14,'5a4a40');P.r(31,6,34,14,'5a4a40');P.e(15,3,3,2,'8a8a90');P.e(33,2,3,2,'8a8a90')
 P.r(3,14,11,22,D);P.r(0,16,4,20,'1a1a20')
 if k=='a':P.r(37,20,44,24,M);P.e(45,22,5,5,'cfd6e0');P.r(44,17,46,27,'cfd6e0')
 else:P.r(37,18,41,32,M);P.e(42,34,6,6,'cfd6e0');P.r(41,28,43,40,'cfd6e0')
def coach(P,k,f):  # Mroczny Trener (fikcyjny, oryginalny projekt) 64x64: garnitur, ciemne okulary, blizna, shotgun, butelka, gwizdek
 a=k=='a';s=f if k=='i' else 0;SK='e0b890';SD='c89870';J='2a2a38';JL='3a3a4c'
 P.r(21,42,29,60,'23232e');P.r(35,42,43,60,'23232e');P.r(19,59,30,63,'0e0e14');P.r(34,59,45,63,'0e0e14');P.r(21,42,22,60,'33333f');P.r(35,42,36,60,'33333f')
 P.p([(17,22),(47,22),(52,27),(49,46),(15,46),(12,27)],J);P.p([(24,22),(32,40),(40,22),(36,22),(32,30),(28,22)],'e8e8f0')
 P.p([(26,22),(32,43),(22,46),(18,24)],JL);P.p([(38,22),(32,43),(42,46),(46,24)],JL);P.p([(30,25),(34,25),(35,40),(32,43),(29,40)],'b02030')
 P.r(10,26,17,46,J);P.r(8,44,16,50,SK);P.r(4,36,9,48,'3a9a5a');P.r(5,31,8,36,'3a9a5a');P.r(6,28,7,31,'1a5a30');P.r(5,38,6,46,'8ae0a0')
 P.r(47,26,54,42,J);P.r(50,41,56,47,SK)
 if a:P.r(46,38,63,40,'3a3a44');P.r(44,40,52,46,'6a4a2a');P.r(62,36,63,42,'ffe070')
 else:P.l((50,44),(61,26),'3a3a44',3);P.r(47,43,54,49,'6a4a2a')
 P.r(29,17,35,23,SD);P.e(32,11+s,8,10,SK);P.e(32,17+s,6,4,'d0a07a')
 P.e(32,3+s,9,5,'1a1a22');P.r(23,5+s,25,12+s,'1a1a22');P.r(39,5+s,41,12+s,'1a1a22');P.r(22,10+s,23,14+s,SD);P.r(41,10+s,42,14+s,SD)
 P.r(25,9+s,31,12+s,'0a0a12');P.r(33,9+s,39,12+s,'0a0a12');P.r(31,10+s,33,10+s,'0a0a12');P.r(26,9+s,27,9+s,'4a4a60')
 P.r(31,12+s,33,15+s,SD);P.r(29,18+s,35,18+s,'6a3a2a');P.r(37,12+s,38,17+s,'b06050')
 P.l((29,22),(33,29),'f2c14e',1);P.r(32,29,36,31,'f2c14e')
def kicker(P,k,f):  # mały piłkarzyk
 s=f if k=='i' else 0
 P.e(16,12+s,4,4,'e0b890');P.r(12,8+s,20,9+s,'3a2a1a');P.r(11,16,21,24,'d64545');P.r(11,19,21,20,'f3e9d2');P.r(11,24,21,27,'f3e9d2')
 P.r(12,27,14,30,'e0b890');P.r(18,27,20,30,'e0b890');P.r(12,29,14,31,'d64545');P.r(18,29,20,31,'d64545');P.r(13,11+s,14,11+s,'101020');P.r(18,11+s,19,11+s,'101020')
 bx=29 if k=='a' else 24
 P.e(bx,27,3,3,'f3f3f3');P.r(bx,26,bx+1,27,'101020')
def princess(P,k,f):
 P.r(9,6,23,24,'e0a020');P.e(16,10,5,5,'f0c8a0');P.r(12,3,20,5,'f2c14e');P.r(12,2,13,3,'f2c14e');P.r(15,1,17,3,'f2c14e');P.r(19,2,20,3,'f2c14e')
 P.p([(11,17),(21,17),(26,30),(6,30)],'e060a0');P.r(11,15,21,19,'f080c0');P.r(13,10,13,11,'101020');P.r(18,10,18,11,'101020');P.r(15,13,17,13,'c04060')
 P.r(8,17,10,23,'f0c8a0');P.r(22,17,24,23,'f0c8a0')
def comp_squire(P,k,f):
 P.r(12,24,14,30,'5a3a2a');P.r(18,24,20,30,'5a3a2a');P.r(11,15,21,25,'4a7bd8');P.r(11,22,21,23,'8a5a2a');P.e(16,10,5,5,'f0c8a0');P.r(11,4,21,8,'9aa8c8');P.r(15,2,17,4,'d64545')
 P.r(13,10,14,11,'101020');P.r(18,10,19,11,'101020');P.e(8,20,3,4,'a0a0b0')
 if k=='a':P.r(22,14,31,15,'cfd6e0');P.r(21,13,22,16,'6a4a2a')
 else:P.r(23,6,24,19,'cfd6e0');P.r(22,19,25,20,'6a4a2a')
def comp_archer(P,k,f):
 P.r(12,24,14,30,'4a3a2a');P.r(18,24,20,30,'4a3a2a');P.r(11,15,21,25,'2a7a4a');P.r(10,12,22,16,'2a7a4a');P.e(16,10,5,5,'f0c8a0');P.r(10,4,22,8,'2a7a4a');P.r(9,6,11,14,'2a7a4a')
 P.r(14,10,14,11,'101020');P.r(19,10,19,11,'101020')
 bx=26 if k=='a' else 25
 P.l((bx-2,6),(bx+2,16),'8a5a2a');P.l((bx+2,16),(bx-2,26),'8a5a2a');P.l((bx-2,6),(bx-2,26),'dfe6f0',1)
def stall():  # stragan kupca 64x48 (środek przezroczysty - kupiec stoi za ladą)
 im=Image.new('RGBA',(64,48),(0,0,0,0));d=ImageDraw.Draw(im)
 d.rectangle([4,10,6,47],fill=C('#6a4a2a'));d.rectangle([57,10,59,47],fill=C('#6a4a2a'))
 for i in range(8):
  c='#d64545' if i%2==0 else '#f3e9d2';d.polygon([(1+i*8,2),(9+i*8,2),(9+i*8,11),(1+i*8,11)],fill=C(c));d.ellipse([1+i*8,8,9+i*8,14],fill=C(c))
 d.rectangle([2,32,61,47],fill=C('#8a5a2a'));d.rectangle([2,30,61,33],fill=C('#b07a3a'))
 for x,c in((10,'#d64545'),(15,'#4a7bd8'),(20,'#4fd05a'),(44,'#f2c14e'),(49,'#d060ff')):d.rectangle([x,24,x+3,29],fill=C(c));d.rectangle([x+1,22,x+2,24],fill=C('#c8c8d0'))
 d.rectangle([28,26,36,29],fill=C('#e8d8a8'))
 return finish(im)
CH={'hero':(hero,32),'slime':(slime,32),'goblin':(goblin,32),'skeleton':(skeleton,32),'shroom':(shroom,32),'coach':(coach,64),'kicker':(kicker,32),'princess':(princess,32),'comp_squire':(comp_squire,32),'comp_archer':(comp_archer,32),'wolf':(wolf,32),'spider':(spider,32),'drone':(drone,32),'robot':(robot,32),'yeti':(yeti,48),'spiderqueen':(spiderqueen,48),'mech':(mech,48),'elf':(elf,32),'lavagolem':(lavagolem,32),'imp':(imp,32),
 'slimeking':(slimeking,48),'orc':(orc,48),'demon':(demon,48)}
def frame(fn,S,k,f,dx=0,dy=0):
 im=Image.new('RGBA',(S,S),(0,0,0,0));fn(Pen(im,dx,dy),k,f);return finish(im)
def tint(im,t=.6):
 q=im.copy();p=q.load()
 for y in range(q.height):
  for x in range(q.width):
   r,g,b,a=p[x,y]
   if a:p[x,y]=(int(r+(255-r)*t),int(g+(255-g)*t),int(b+(255-b)*t),a)
 return q
def sheet(fr):
 o=Image.new('RGBA',(sum(i.width for i in fr),fr[0].height),(0,0,0,0));x=0
 for i in fr:o.paste(i,(x,0));x+=i.width
 return o
def save(im,d,n):os.makedirs(os.path.join(A,d),exist_ok=True);im.save(os.path.join(A,d,n+'.png'))
for n,(fn,S) in CH.items():
 d='player' if n in('hero','princess','comp_squire','comp_archer') else 'enemies';idle=[frame(fn,S,'i',0),frame(fn,S,'i',1,dy=(n!='slime')*1)]
 save(sheet(idle),d,n)
 if n=='hero':save(sheet([frame(fn,S,'w',0),frame(fn,S,'w',1,dy=1)]),d,n+'_walk')
 save(sheet([frame(fn,S,'a',0,dx=2),frame(fn,S,'a',1,dx=5)]),d,n+'_attack')
 save(tint(frame(fn,S,'i',0,dx=-3)),d,n+'_hurt')
 dead=[]
 for k,al in((.75,230),(.45,170),(.15,100)):
  im=idle[0].resize((S,max(1,int(S*k))),Image.NEAREST);c=Image.new('RGBA',(S,S),(0,0,0,0));c.paste(im,(0,S-im.height))
  c.putalpha(c.getchannel('A').point(lambda v,al=al:v and al));dead.append(c)
 save(sheet(dead),d,n+'_death')
save(frame(merchant,32,'i',0),'ui','merchant');save(stall(),'items','stall')
# ---------- efekty ----------
def burst(n,pts,cols,R):
 fr=[]
 for i in range(n):
  im=Image.new('RGBA',(32,32),(0,0,0,0));d=ImageDraw.Draw(im);r=R*(i+1)/n
  d.polygon([(16+(r if j%2==0 else r*.45)*math.cos(math.pi*j/pts),16+(r if j%2==0 else r*.45)*math.sin(math.pi*j/pts)) for j in range(pts*2)],fill=H(cols[0])+(255-i*45,))
  d.polygon([(16+(r*.6 if j%2==0 else r*.25)*math.cos(math.pi*j/pts),16+(r*.6 if j%2==0 else r*.25)*math.sin(math.pi*j/pts)) for j in range(pts*2)],fill=H(cols[1])+(255-i*45,));fr.append(im)
 return sheet(fr)
ic=Image.new('RGBA',(16,16),(0,0,0,0));ImageDraw.Draw(ic).polygon([(8,1),(13,9),(13,12),(8,15),(3,12),(3,9)],fill=C('#5ad060'));ImageDraw.Draw(ic).rectangle([6,8,7,10],fill=C('#b8ffb0'))
save(finish(ic),'effects','poison')
ic=Image.new('RGBA',(16,16),(0,0,0,0));q=ImageDraw.Draw(ic);q.polygon([(8,1),(12,6),(13,11),(10,15),(6,15),(3,11),(4,6),(7,8)],fill=C('#ff7a20'));q.polygon([(8,7),(10,11),(9,14),(7,14),(6,11)],fill=C('#ffe070'));save(finish(ic),'effects','burn')
ic=Image.new('RGBA',(16,16),(0,0,0,0));q=ImageDraw.Draw(ic)
for ang in(0,60,120):q.line([(8-7*math.cos(math.radians(ang)),8-7*math.sin(math.radians(ang))),(8+7*math.cos(math.radians(ang)),8+7*math.sin(math.radians(ang)))],fill=C('#8ae0ff'),width=2)
save(finish(ic),'effects','freeze')
ic=Image.new('RGBA',(36,36),(0,0,0,0));q=ImageDraw.Draw(ic)   # alternatywne słońce (klik w słońce): uśmiechnięte, w okularach
for ang in range(0,360,30):q.line([(18,18),(18+17*math.cos(math.radians(ang)),18+17*math.sin(math.radians(ang)))],fill=C('#ffb020'),width=3)
q.ellipse([4,4,32,32],fill=C('#ffd23a'));q.ellipse([6,6,30,30],fill=C('#ffe566'))
q.rectangle([8,13,16,19],fill=C('#101020'));q.rectangle([20,13,28,19],fill=C('#101020'));q.rectangle([16,14,20,15],fill=C('#101020'));q.rectangle([9,14,11,15],fill=C('#5a5a80'));q.rectangle([21,14,23,15],fill=C('#5a5a80'))
q.arc([10,18,26,29],20,160,fill=C('#a02020'),width=2)
save(finish(ic),'effects','sun_alt')
save(burst(4,6,('#ffffff','#ffe070'),15),'effects','hit');save(burst(5,8,('#ff8a30','#ffe070'),16),'effects','crit')
# ---------- tła 640x320 (rysowane 160x80 i powiększane x4) ----------
def bg(name,top,bot,hz,scene):
 random.seed(name);im=Image.new('RGB',(160,80));d=ImageDraw.Draw(im)
 for y in range(hz):d.line([(0,y),(160,y)],fill=lerp(H(top),H(bot),(y//4*4)/hz))
 scene(d,hz);save(im.resize((640,320),Image.NEAREST),'maps',name)
def ground(d,hz,c,dots):
 d.rectangle([0,hz,160,80],fill=H(c))
 for i in range(60):x=random.randint(0,159);y=random.randint(hz+1,79);d.point((x,y),fill=H(random.choice(dots)))
def forest(d,hz):
 d.ellipse([120,5,134,19],fill=H('#fff3b0'))
 for x in range(160):d.line([(x,hz-int(8+4*math.sin(x/17)+3*math.sin(x/7))),(x,hz)],fill=H('#4a9a6a'))
 ground(d,hz,'#4a9a3a',['#6ac050','#3a7a2a','#f0e060','#e06060'])
 for x in range(-4,170,13):
  y=hz+random.randint(0,3);h=random.randint(16,24);d.rectangle([x-1,y-3,x,y],fill=H('#5a3a20'))
  for i in range(3):w=h//2-i*2;t=y-3-i*h//4;d.polygon([(x-w,t),(x+w,t),(x,t-h//2)],fill=H('#1f5a3a' if i%2 else '#2d7a46'))
def village(d,hz):
 for x in range(160):d.line([(x,hz-int(7+3*math.sin(x/13))),(x,hz)],fill=H('#7a5a4a'))
 for x in(8,48,92,132):
  w=24;h=random.randint(14,22);d.rectangle([x,hz-h,x+w,hz],fill=H('#8a6a50'));d.polygon([(x-2,hz-h),(x+w+2,hz-h),(x+w//2+4,hz-h-9),(x+w//2-6,hz-h-5)],fill=H('#4a2a20'))
  d.rectangle([x+4,hz-h+4,x+8,hz-h+9],fill=H('#ffb040'));d.rectangle([x+15,hz-9,x+19,hz],fill=H('#2a1a10'))
  d.ellipse([x+w//2,hz-h-16,x+w//2+7,hz-h-9],fill=H('#6a5a58'))
 ground(d,hz,'#8a7a50',['#6a5a38','#a89a68','#5a4a30'])
 for x in range(4,160,10):d.rectangle([x,70,x+1,77],fill=H('#5a4028'));d.line([(x,72),(x+10,72)],fill=H('#5a4028'))
def ruins(d,hz):
 for i in range(40):d.point((random.randint(0,159),random.randint(0,30)),fill=H('#f0f0d0'))
 d.ellipse([20,6,36,22],fill=H('#f0f0d0'))
 for x in(15,45,85,120,150):
  h=random.randint(16,32);d.polygon([(x-4,hz),(x-4,hz-h),(x-1,hz-h+3),(x+1,hz-h-2),(x+4,hz-h+2),(x+4,hz)],fill=H('#3a3050'))
 d.arc([60,hz-30,110,hz+10],180,360,fill=H('#3a3050'),width=3)
 ground(d,hz,'#4a4560',['#3a3550','#5a5578'])
 for y in range(hz+8,80,10):d.line([(0,y),(160,y)],fill=H('#3a3550'))
 for x in range(0,160,16):d.line([(x,hz),(x-6,80)],fill=H('#3a3550'))
 for y in range(hz,hz+4):d.line([(0,y),(160,y)],fill=lerp(H('#6a4a8a'),H('#4a4560'),(y-hz)/4))
def cave(d,hz):
 for x in range(-4,165,9):
  h=random.randint(6,24);d.polygon([(x,0),(x+9,0),(x+4,h)],fill=H('#2a2438'));d.line([(x+4,2),(x+4,h)],fill=H('#3e3654'))
 ground(d,hz,'#3a3448',['#2a2438','#4a4460','#5a5478'])
 for x in(14,52,100,140):
  for j,c in enumerate(random.sample(['#5ab0ff','#d060ff','#60ffd0'],1)*3):
   h=random.randint(7,14);cx=x+j*4;d.polygon([(cx-2,hz+3),(cx,hz+3-h),(cx+2,hz+3)],fill=H(c));d.point((cx,hz+3-h//2),fill=H('#ffffff'))
def volcano(d,hz):
 d.polygon([(30,hz),(78,12),(102,12),(150,hz)],fill=H('#2a1210'));d.rectangle([78,10,102,13],fill=H('#ff7a20'))
 for x in(84,90,97):d.line([(x,13),(x-4+random.randint(0,8),hz)],fill=H('#ff5a10'))
 for i in range(6):x=random.randint(60,120);y=random.randint(0,12);d.ellipse([x,y,x+12,y+6],fill=H('#4a2a2a'))
 ground(d,hz,'#3a2020',['#2a1414','#5a2a20','#ff8a30'])
 for k in(1,2):
  pts=[(x,hz+8*k+int(3*math.sin(x/9+k))) for x in range(0,161,4)];d.line(pts,fill=H('#ff6a20'),width=3);d.line(pts,fill=H('#ffd060'),width=1)
def lava(d,hz):
 for y in range(hz-14,hz):d.line([(0,y),(160,y)],fill=lerp(H('#6a1a08'),H('#ff5a10'),(y-hz+14)/14))
 for x in range(160):d.line([(x,hz-int(10+9*abs(math.sin(x/11))+4*math.sin(x/4))),(x,hz)],fill=H('#140808'))
 for i in range(7):x=random.randint(0,150);y=random.randint(2,26);d.ellipse([x,y,x+random.randint(14,30),y+6],fill=H('#2a1010'))
 for x in(10,70,150):d.polygon([(x-6,hz),(x-2,hz-26),(x,hz-22),(x+3,hz-30),(x+6,hz)],fill=H('#0e0505'))
 ground(d,hz,'#241010',['#140808','#3a1a14','#ff8a30'])
 for k,(y0,amp) in enumerate(((hz+10,3),(hz+24,4))):
  pts=[(x,y0+int(amp*math.sin(x/8+k*2))) for x in range(0,161,3)];d.line(pts,fill=H('#c83a10'),width=5);d.line(pts,fill=H('#ff7a20'),width=3);d.line(pts,fill=H('#ffe070'),width=1)
 for i in range(45):d.point((random.randint(0,159),random.randint(10,79)),fill=H(random.choice(['#ff8a30','#ffd060','#ff5a20'])))
 for x in(30,95,140):d.polygon([(x-5,80),(x-3,66),(x,60),(x+3,67),(x+5,80)],fill=H('#0e0505'))
def ice(d,hz):
 d.ellipse([20,6,34,20],fill=H('#fffbe0'))
 for x0,h,c in((10,26,'#9ab8e0'),(62,32,'#8aa8d8'),(118,28,'#9ab8e0')):
  d.polygon([(x0-28,hz),(x0,hz-h),(x0+28,hz)],fill=H(c));d.polygon([(x0-8,hz-h+8),(x0,hz-h),(x0+8,hz-h+8),(x0+3,hz-h+11),(x0-3,hz-h+9)],fill=H('#f4f8ff'))
 ground(d,hz,'#e8f0ff',['#c8dcf4','#ffffff','#a8c8f0'])
 for x in range(6,160,17):
  y=hz+random.randint(0,3);d.polygon([(x-5,y),(x+5,y),(x,y-14)],fill=H('#2a5a5a'));d.polygon([(x-3,y-6),(x+3,y-6),(x,y-14)],fill=H('#ffffff'))
 for i in range(4):x=random.randint(5,140);y=random.randint(hz+8,74);d.ellipse([x,y,x+16,y+4],fill=H('#a8d0f0'))
def passm(d,hz):  # ścieżka: trawa po lewej, śnieg po prawej
 for x0,h in((20,24),(78,30),(134,26)):d.polygon([(x0-28,hz),(x0,hz-h),(x0+28,hz)],fill=H('#7a98c0'));d.polygon([(x0-8,hz-h+8),(x0,hz-h),(x0+8,hz-h+8)],fill=H('#f4f8ff'))
 for x in range(160):d.line([(x,hz),(x,80)],fill=lerp(H('#4a9a3a'),H('#e8f0ff'),min(1,max(0,(x/160-.3)/.5))))
 for i in range(60):x=random.randint(0,159);y=random.randint(hz+1,79);d.point((x,y),fill=H('#6ac050' if x<80 else '#c8dcf4'))
 for x in range(6,160,15):
  y=hz+random.randint(0,3);snow=x>70;d.polygon([(x-5,y),(x+5,y),(x,y-14)],fill=H('#2d7a46' if not snow else '#2a5a5a'));d.polygon([(x-3,y-6),(x+3,y-6),(x,y-14)],fill=H('#2d7a46' if not snow else '#ffffff'))
def cavemouth(d,hz):
 d.polygon([(0,hz),(0,6),(160,6),(160,hz)],fill=H('#6a7488'))
 for i in range(30):x=random.randint(0,159);y=random.randint(8,hz-2);d.point((x,y),fill=H(random.choice(['#5a6478','#7a8498'])))
 d.polygon([(58,hz),(64,18),(80,9),(96,18),(102,hz)],fill=H('#07050c'));d.polygon([(66,hz),(70,24),(80,17),(90,24),(94,hz)],fill=H('#150f1e'))
 for x in range(62,100,5):d.polygon([(x,15),(x+3,15),(x+1,15+random.randint(5,10))],fill=H('#d8ecff'))
 d.rectangle([0,6,160,9],fill=H('#f0f6ff'))
 ground(d,hz,'#9aa4b8',['#e8f0ff','#7a8498','#ffffff'])
 d.ellipse([54,hz-2,106,hz+12],fill=H('#3a3444'))
def tunnel(d,hz):
 for x in range(0,160,30):d.rectangle([x,0,x+2,hz],fill=H('#4a3a2a'));d.rectangle([x-2,8,x+6,10],fill=H('#4a3a2a'))
 for x in range(15,160,30):d.line([(x,0),(x,6)],fill=H('#2a2a2a'));d.ellipse([x-8,2,x+8,16],fill=H('#2a2a30'));d.ellipse([x-3,6,x+3,12],fill=H('#ffd060'))
 ground(d,hz,'#3a3a44',['#2a2a34','#4a4a58','#5a5a68'])
 for x in range(0,160,8):d.rectangle([x,hz+12,x+3,hz+22],fill=H('#4a3a2a'))
 d.line([(0,hz+14),(160,hz+14)],fill=H('#8a7a6a'));d.line([(0,hz+20),(160,hz+20)],fill=H('#8a7a6a'))
def plant(d,hz):
 for x,w,h in((14,12,30),(42,10,22),(124,12,34)):
  d.rectangle([x,hz-h,x+w,hz],fill=H('#2a2a32'));d.rectangle([x-1,hz-h-2,x+w+1,hz-h],fill=H('#4a3a3a'));d.ellipse([x-2,hz-h-12,x+w+4,hz-h-2],fill=H('#3a3438'))
 d.polygon([(70,hz),(76,hz-26),(104,hz-26),(110,hz)],fill=H('#34343e'));d.rectangle([74,hz-30,106,hz-26],fill=H('#3a3438'))
 for x in(56,142):
  d.line([(x-6,hz),(x,hz-24)],fill=H('#0e0e14'));d.line([(x+6,hz),(x,hz-24)],fill=H('#0e0e14'));d.line([(x-4,hz-8),(x+4,hz-8)],fill=H('#0e0e14'))
 d.line([(56,hz-24),(142,hz-24)],fill=H('#0e0e14'))
 for i in range(8):d.rectangle([random.randint(14,130),hz-random.randint(3,18),0,0],fill=H('#ffd060')) if False else d.point((random.randint(12,150),hz-random.randint(3,18)),fill=H('#ffd060'))
 ground(d,hz,'#3a3a40',['#2a2a30','#4a4a52','#5a5a62'])
 for x in range(0,160,6):d.polygon([(x,hz+14),(x+3,hz+14),(x+1,hz+18),(x-2,hz+18)],fill=H('#e0c020'))
 for i in range(25):d.point((random.randint(40,60) if i%2 else random.randint(130,150),random.randint(hz-24,hz+4)),fill=H('#60e0ff'))
def hotshaft(d,hz):
 for x in range(0,160,26):d.rectangle([x,0,x+3,hz],fill=H('#3a2420'))
 d.rectangle([0,12,160,16],fill=H('#4a2a20'));d.rectangle([0,13,160,14],fill=H('#ff7a20'))
 for i in range(10):x=random.randint(0,159);d.line([(x,16),(x,16+random.randint(4,14))],fill=H('#ff8a30'))
 ground(d,hz,'#3a1c1a',['#2a1210','#5a2a20','#ff8a30'])
 for k in range(3):
  y=hz+8+k*10;pts=[(x,y+random.randint(-2,2)) for x in range(0,161,10)];d.line(pts,fill=H('#ff6a20'))
 for y in range(hz-6,hz):d.line([(0,y),(160,y)],fill=lerp(H('#2a1010'),H('#8a2a10'),(y-hz+6)/6))
def castle(d,hz):
 for i in range(30):d.point((random.randint(0,159),random.randint(0,22)),fill=H('#f8f0d0'))
 for x in range(160):d.line([(x,hz-int(6+4*math.sin(x/15))),(x,hz)],fill=H('#3a3058'))
 ground(d,hz,'#4a6a4a',['#3a5a3a','#5a7a5a'])
 d.rectangle([0,58,160,80],fill=H('#6a6070'))
 for x in range(0,160,10):d.line([(x,58),(x-4,80)],fill=H('#5a5060'))
 d.rectangle([56,14,160,58],fill=H('#7a6a8a'))
 for x in range(56,160,6):d.rectangle([x,10,x+3,14],fill=H('#7a6a8a'))
 for y in range(18,58,6):d.line([(56,y),(160,y)],fill=H('#6a5a7a'))
 for x,w,h in((50,16,50),(100,14,44),(142,18,52)):
  d.rectangle([x,58-h,x+w,58],fill=H('#8a7a9a'));d.polygon([(x-2,58-h),(x+w+2,58-h),(x+w//2,58-h-13)],fill=H('#c04050'));d.rectangle([x+w//2-1,58-h+8,x+w//2+1,58-h+14],fill=H('#ffd060'))
 d.rectangle([128,36,148,58],fill=H('#0a0810'));d.ellipse([128,28,148,44],fill=H('#0a0810'))
 for x in(122,152):d.rectangle([x,40,x+1,44],fill=H('#ffb040'));d.point((x,38),fill=H('#ffe070'))
def stadium(d,hz):
 for y in range(4,hz):d.line([(0,y),(160,y)],fill=lerp(H('#1a0e18'),H('#3a1a24'),y/hz))
 for row in range(5):
  for x in range(0,160,3):d.rectangle([x,12+row*5,x+1,14+row*5],fill=H(random.choice(['#6a2a2a','#2a2a6a','#8a8a8a','#4a1a1a','#e0e0e0'])))
 for x in(12,70,128):d.rectangle([x,0,x+1,hz],fill=H('#2a2a30'));d.rectangle([x-6,2,x+8,8],fill=H('#fff0c0'))
 ground(d,hz,'#1f4a2a',['#1a3a22','#2a5a34'])
 d.line([(0,hz+8),(160,hz+8)],fill=H('#cfd6c0'));d.ellipse([60,hz+10,100,hz+38],outline=H('#cfd6c0'));d.rectangle([140,hz+4,158,hz+22],outline=H('#e8e8e8'))
for n,t,b,s in(('forest','#6ec6f0','#d0f0e0',forest),('village','#c86a4a','#f5d090',village),('ruins','#1a1230','#6a4a8a',ruins),('cave','#0e0b16','#2e2840',cave),('volcano','#2a0808','#e0602a',volcano),('lava','#0a0303','#3a0c06',lava),('ice','#a8d8f0','#e8f4ff',ice),('pass','#9ad0f0','#d8ecf8',passm),('cavemouth','#6a7488','#aab8c8',cavemouth),('tunnel','#14141c','#2e2e3a',tunnel),('plant','#16161e','#5a4a40',plant),('hotshaft','#1a0808','#4a1408',hotshaft),('castle','#2a2050','#f0a060',castle),('stadium','#120a18','#3a1a24',stadium)):bg(n,t,b,42,s)
print('OK')
