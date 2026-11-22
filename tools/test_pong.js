// Test headless: bot gra w ponga z bramkarzem. node tools/test_pong.js
const Pong=require('../pong.js');
function match(skill){
  Pong.S=null;Pong.fresh(false);Pong.S.last='ai';let f=0,kd=false;
  while(f++<60*240){
    const S=Pong.S;
    if(S.phase==='goal'&&S.timer<=1&&(S.me>=5||S.ai>=5)){break;}
    const b=S.ball,h=S.hero;
    const aimY=160+Math.sin(f/50)*70*skill;
    let gx=Pong.GR+20-b.x,gy=aimY-b.y,gl=Math.hypot(gx,gy)||1;gx/=gl;gy/=gl;
    const tx=b.x-gx*(Pong.CR+Pong.BR+6),ty=b.y+22-gy*(Pong.CR+Pong.BR+6);
    let dx=tx-h.x,dy=ty-h.y;
    // jeśli piłka za plecami bota (na lewo) i leci do jego bramki – podejdź bezpośrednio
    const inp={dx:Math.abs(dx)>3?Math.sign(dx):0,dy:Math.abs(dy)>3?Math.sign(dy):0,sprint:true,kick:false};
    const d=Math.hypot(b.x-h.x,b.y-(h.y-22));
    if(d<Pong.CR+Pong.BR+16&&b.x>h.x-10&&Math.random()<skill*.5){inp.kick=!kd;}
    kd=inp.kick;
    Pong.step(inp);if(S.kicked>0)S.kicked--;
    if(S.phase==='goal'&&--S.timer<=0)Pong.afterGoal();
    if(S.phase==='end')break;
  }
  return {me:Pong.S.me,ai:Pong.S.ai,frames:f};
}
for(const sk of [.3,.6,1]){let w=0,tot=0,fr=0;for(let i=0;i<60;i++){const r=match(sk);if(r.me>=5)w++;tot++;fr+=r.frames;}
 console.log('skill',sk,'win%',(100*w/tot).toFixed(0),'avg sec',(fr/tot/60).toFixed(0));}
