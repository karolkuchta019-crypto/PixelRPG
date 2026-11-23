// Test generatorów minigier: node tools/test_minigames.js
const {Lava,Maze}=require('../minigames.js');
let bad=0;
for(let i=0;i<300;i++){
  const st=Lava.gen();
  if(Lava.solved(st)){bad++;console.log('lava: rozwiązana na starcie');}
  // rozwiąż: dla komórek ścieżki znajdź obrót, który je łączy (sprawdź istnienie rozwiązania)
  for(const [q,r] of st.path){const c=st.grid[r][q];}
  // próba: ustaw obroty tak, by maska = oryginalna maska ścieżki (rot=0) -> musi działać
  for(const row of st.grid)for(const c of row)c.rot=0;
  if(!Lava.solved(st)){bad++;console.log('lava: brak rozwiązania przy rot=0');}
}
for(let i=0;i<300;i++){
  const M=Maze.gen();
  if(!M.path||M.path.length<10){bad++;console.log('maze: za krótka ścieżka');}
  if(!M.treasure){bad++;console.log('maze: brak skarbu');continue;}
  const onPath=M.path.some(p=>p[0]===M.treasure[0]&&p[1]===M.treasure[1]);
  if(onPath){bad++;console.log('maze: skarb na ścieżce');}
  if(M.g[2*M.sy+1][0]!==0||M.g[2*M.ey+1][M.W-1]!==0){bad++;console.log('maze: brak wejścia/wyjścia');}
}
const a=[...Array(100)].map(()=>Lava.gen().path.length);console.log('lava avg path',(a.reduce((x,y)=>x+y)/a.length).toFixed(1));
const m=[...Array(100)].map(()=>Maze.gen().path.length);console.log('maze avg path',(m.reduce((x,y)=>x+y)/m.length).toFixed(1));
console.log(bad?('BŁĘDY: '+bad):'OK – generatory poprawne');
