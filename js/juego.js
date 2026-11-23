/* NOVA ARCADIA 2087 — juego completo, 5 niveles, 3 dificultades, Firebase opcional */
let ctx;const $=id=>document.getElementById(id),canvas=$('game');ctx=canvas.getContext('2d');const mainCtx=ctx;
const FIREBASE={apiKey:'AIzaSyBtX2Z8EdnX6ssSESdLgZkU8Ihn_BgFcd8',authDomain:'morfeo2087-892de.firebaseapp.com',databaseURL:'https://morfeo2087-892de-default-rtdb.firebaseio.com',projectId:'morfeo2087-892de',storageBucket:'morfeo2087-892de.firebasestorage.app',messagingSenderId:'192089548489',appId:'1:192089548489:web:6b814c9e040cde9803cf18',measurementId:'G-6BN06T243B'};
const SETTINGS={easy:{label:'FÁCIL',time:1200,lives:5,drones:1,speed:850},normal:{label:'MEDIO',time:840,lives:3,drones:2,speed:560},hard:{label:'DIFÍCIL',time:600,lives:2,drones:3,speed:350}};
const SECTORS=[{name:'Instituto Central',subtitle:'Los archivos del sueño',theme:0,story:'VERA: Las primeras señales de Morfeo aparecieron en el Instituto Central. Recuperá el acceso.'},{name:'Laboratorio Secreto',subtitle:'La fórmula olvidada',theme:1,story:'VERA: Encontramos registros del experimento. Los núcleos activan la salida.'},{name:'Fábrica de Drones',subtitle:'Patrullas de Morfeo',theme:2,story:'VERA: Los drones vigilan cada corredor. Evitá su campo de contacto.'},{name:'Túneles Subterráneos',subtitle:'El camino oculto',theme:3,story:'VERA: La señal se debilita. Seguís cerca del centro de control.'},{name:'Torre Central',subtitle:'Despertar Nova Arcadia',theme:4,story:'VERA: Este es el núcleo de Morfeo. Activá el terminal y escapá.'}];
const W=20,H=13,T=48,dirs=[[1,0],[-1,0],[0,1],[0,-1]],key=(x,y)=>`${x},${y}`;
let authApi=null,dbApi=null,db=null,uid=null,room=null,host=false,unsub=null,roomData=null,mode='solo',nick='',difficulty='normal',ready=false,game=null,raf=0,lastFrame=0,lastNetwork=0,transition=false,overlayCallback=null,connected=false,serverOffset=0;
const state=()=>game;
const message=(id,t)=>{$(id).textContent=t};
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const shuffle=(a,r)=>{for(let i=a.length-1;i>0;i--){let j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function makeMap(level,seed){const random=rng(seed+level*1299709),grid=Array.from({length:H},()=>Array(W).fill('#'));
// Randomized depth-first maze, with extra connections to keep routes interesting.
const stack=[[1,1]];grid[1][1]='.';while(stack.length){const [x,y]=stack.at(-1);const options=shuffle([[2,0],[-2,0],[0,2],[0,-2]],random).filter(([dx,dy])=>x+dx>0&&x+dx<W-1&&y+dy>0&&y+dy<H-1&&grid[y+dy][x+dx]==='#');if(!options.length){stack.pop();continue}const [dx,dy]=options[0];grid[y+dy/2][x+dx/2]='.';grid[y+dy][x+dx]='.';stack.push([x+dx,y+dy])}
for(let i=0;i<20+level*5;i++){let x=2+Math.floor(random()*(W-4)),y=2+Math.floor(random()*(H-4));if(grid[y][x]==='#'&&((grid[y][x-1]==='.'&&grid[y][x+1]==='.')||(grid[y-1][x]==='.'&&grid[y+1][x]==='.')))grid[y][x]='.'}
const dist=Array.from({length:H},()=>Array(W).fill(-1)),q=[[1,1]];dist[1][1]=0;for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy] of dirs){const nx=x+dx,ny=y+dy;if(grid[ny]?.[nx]==='.'&&dist[ny][nx]<0){dist[ny][nx]=dist[y][x]+1;q.push([nx,ny])}}}
const far=q.filter(([x,y])=>dist[y][x]>=8).sort((a,b)=>dist[b[1]][b[0]]-dist[a[1]][a[0]]);const used=new Set([key(1,1)]);function pick(list){for(const p of list){if(!used.has(key(...p))){used.add(key(...p));return {x:p[0],y:p[1]}}}return{x:1,y:1}}
const exit=pick(far),card=pick(far.slice(Math.floor(far.length*.25)).reverse()),terminal=pick(far.slice(Math.floor(far.length*.4))),cells=shuffle(q.filter(([x,y])=>dist[y][x]>3&&!used.has(key(x,y))),random),cores=[];for(let i=0;i<2+Math.min(2,Math.floor(level/2));i++)cores.push(pick(cells));const patrol=shuffle(q.filter(([x,y])=>dist[y][x]>5&&!used.has(key(x,y))),random).slice(0,5).map(([x,y])=>({x,y}));return {grid,exit,card,terminal,cores,patrol,seed};}
function config(){return SETTINGS[difficulty]}
function newGame(){const seed=roomData?.seed??Math.floor(Math.random()*900000000);game={level:0,seed,levelData:null,player:{x:1,y:1,card:false,terminal:false,cores:[],lives:config().lives,invuln:0},drones:[],startAt:roomData?.startedAt?roomData.startedAt-serverOffset:Date.now(),elapsedOffset:0,finished:false,failed:false,completedLevels:0,hitCount:0,remote:{},lastMove:0,lastDrone:0};loadLevel(0,true)}
function loadLevel(level,initial=false){if(!game)return;game.level=level;game.levelStart=Date.now();game.vx=1;game.vy=1;game.seen=new Set();game.layer=null;parts=[];game.levelData=makeMap(level,game.seed);game.player.x=1;game.player.y=1;game.player.card=false;game.player.terminal=false;game.player.cores=[];game.player.invuln=Date.now()+1100;game.drones=game.levelData.patrol.slice(0,config().drones).map((p,i)=>({...p,step:i}));game.lastDrone=Date.now();transition=false;$('sectorTitle').textContent=SECTORS[level].name;$('levelLabel').textContent=`NIVEL ${level+1}/5 · ${SECTORS[level].name.toUpperCase()}`;$('progress').textContent=`${level}/5`;say(SECTORS[level].story);updateHud();if(!initial)sendProgress(true)}
function say(s){$('vera').textContent=s}
function remaining(){const total=config().time*1000;if(!game)return total;return Math.max(0,Math.min(total,total-(Date.now()-game.startAt)))}
const started=()=>!!game&&Date.now()>=game.startAt;
function mmss(ms){const sec=Math.ceil(Math.max(0,ms)/1000);return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
function updateHud(){if(!game)return;const p=game.player,d=game.levelData;$('lives').textContent='♥ '.repeat(p.lives).trim()||'—';$('inventory').textContent=`${p.card?'🟦':'⬜'} Tarjeta · ${p.cores.length}/${d.cores.length} núcleos · ${p.terminal?'⚡ Activado':'⚡ Inactivo'}`;$('objectives').innerHTML=[['Recoger la tarjeta',p.card],['Reunir núcleos de energía',p.cores.length===d.cores.length],['Activar terminal (E)',p.terminal],['Alcanzar la salida verde',false]].map(([t,ok])=>`<div class="objective ${ok?'done':''}">${ok?'✓':'◇'} ${t}</div>`).join('')}
function walkable(x,y){return game?.levelData?.grid[y]?.[x]==='.'}
function move(dx,dy){if(!game||transition||game.finished||game.failed||!started())return;const now=Date.now();if(now-game.lastMove<90)return;game.lastMove=now;const p=game.player,x=p.x+dx,y=p.y+dy;if(!walkable(x,y)){say('VERA: Ese corredor está bloqueado. Buscá otro camino.');return}p.x=x;p.y=y;const d=game.levelData;if(x===d.card.x&&y===d.card.y&&!p.card){p.card=true;say('VERA: Tarjeta de acceso recuperada. ¡Bien!');AU.sfx('card');burst(x,y,'#55ddec')}
d.cores.forEach((c,i)=>{if(c.x===x&&c.y===y&&!p.cores.includes(i)){p.cores.push(i);say(`VERA: Núcleo recuperado (${p.cores.length}/${d.cores.length}).`);AU.sfx('core');burst(x,y,'#ffca5a')}});
if(x===d.exit.x&&y===d.exit.y){if(!p.card||!p.terminal||p.cores.length<d.cores.length)say('VERA: La salida sigue sellada. Completá los objetivos.');else completeLevel()}
checkHit();updateHud();sendProgress()}
function interact(){if(!game||transition||game.finished||game.failed||!started())return;const p=game.player,t=game.levelData.terminal;if(Math.abs(p.x-t.x)+Math.abs(p.y-t.y)<=1){if(!p.card){say('VERA: La terminal requiere la tarjeta de acceso.');return}if(p.cores.length<game.levelData.cores.length){say('VERA: Necesitás todos los núcleos antes de activar la terminal.');return}askRiddle(()=>{p.terminal=true;say('VERA: Terminal activada. ¡La salida está desbloqueada!');AU.sfx('term');burst(t.x,t.y,'#54edb4',30);updateHud();sendProgress(true)})}else say('VERA: Acercate a la terminal violeta y pulsá E.')}
function checkHit(){if(!game||game.finished||game.failed||transition)return;const p=game.player;if(Date.now()<p.invuln)return;if(game.drones.some(d=>d.x===p.x&&d.y===p.y)){p.lives--;p.invuln=Date.now()+2200;game.hitCount++;AU.sfx('hit');game.shake=Date.now()+350;burst(p.x,p.y,'#e94f7b',24);say(`VERA: ¡Un dron te detectó! Te quedan ${p.lives} vidas.`);if(p.lives<=0){endGame(false,'Los drones de Morfeo te alcanzaron.');return}p.x=1;p.y=1;updateHud();sendProgress(true)}}
function moveDrones(now){if(!game||transition||game.finished||game.failed||!started()||now-game.lastDrone<config().speed)return;game.lastDrone=now;const r=rng((game.seed+game.level*41+Math.floor((now-game.startAt)/config().speed))*11);for(const d of game.drones){const possible=shuffle(dirs.slice(),r).filter(([dx,dy])=>walkable(d.x+dx,d.y+dy));if(possible.length){const [dx,dy]=possible[0];d.x+=dx;d.y+=dy}}checkHit()}
function completeLevel(){if(transition)return;transition=true;game.completedLevels=game.level+1;$('progress').textContent=`${game.completedLevels}/5`;sendProgress(true);if(game.level===4){endGame(true,'¡Desactivaste el Protocolo Morfeo y despertaste Nova Arcadia!');return}showOverlay('SECTOR LIBERADO',`Nivel ${game.level+1} completado`,`⏱ ${mmss(Date.now()-game.levelStart)} · ♥ ${game.player.lives} — ¡Bien hecho! Escapaste de ${SECTORS[game.level].name}. Próximo destino: ${SECTORS[game.level+1].name}.`,'SIGUIENTE NIVEL',()=>{hideOverlay();loadLevel(game.level+1)})}
function showOverlay(eyebrow,title,body,button,callback){const cup=eyebrow==='SECTOR LIBERADO'||eyebrow==='MISIÓN CUMPLIDA',big=eyebrow==='MISIÓN CUMPLIDA';$('cup').classList.toggle('hidden',!cup);$('cup').classList.toggle('big',big);if(cup){startConfetti(big?260:150);AU.sfx('cup')}else if(eyebrow==='MISIÓN TERMINADA')AU.sfx('lose');$('overlayEyebrow').textContent=eyebrow;$('overlayTitle').textContent=title;$('overlayText').textContent=body;$('overlayAction').textContent=button;$('overlay').classList.remove('hidden');overlayCallback=callback}
function hideOverlay(){closeRiddle();stopConfetti();$('overlay').classList.add('hidden');overlayCallback=null}
function endGame(won,reason){if(!game||game.finished||game.failed)return;game.finished=won;game.failed=!won;transition=true;const elapsed=Date.now()-game.startAt;const score=Math.max(0,Math.round((config().time*1000-elapsed)/1000)*10+game.completedLevels*1000+game.player.lives*100);if(mode==='solo'&&won){const k=`nova2087-${difficulty}`;let old=Number(localStorage.getItem(k)||0);if(!old||elapsed<old)localStorage.setItem(k,String(elapsed))}if(room&&uid&&dbApi&&mode==='multi'){const data={finished:won,failed:!won,finishMs:won?Math.max(0,Math.round(elapsed)):0,score:Math.max(0,Math.min(999999,score)),level:game.level+1,offline:false,updatedAt:Date.now()};dbApi.update(refPlayer(room,uid),data).catch(console.warn)}
let extra=won?`Tiempo: ${mmss(elapsed)} · Puntos: ${score}.`: `Llegaste al nivel ${game.level+1}/5.`;if(mode==='multi')extra+=' Revisá la clasificación de participantes.';showOverlay(won?'MISIÓN CUMPLIDA':'MISIÓN TERMINADA',won?'¡NOVA ARCADIA DESPIERTA!':'FIN DE LA PARTIDA',`${reason} ${extra}`,'VOLVER AL MENÚ',()=>{hideOverlay();leave()})}
function rounded(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
function drawTile(x,y){
 const xx=x*T,yy=y*T,wall=game.levelData.grid[y][x]==='#';
 const themes=[['#0d2030','#263f51','#78d8ed'],['#102432','#285060','#75dfd4'],['#1b2036','#3a4563','#bd9dff'],['#10252d','#2b5259','#81e5bb'],['#171e35','#404765','#a7b9ff']];
 const [base,metal,accent]=themes[game.level];
 ctx.save();
 if(wall){
  const g=ctx.createLinearGradient(xx,yy,xx+T,yy+T);g.addColorStop(0,'#3b536a');g.addColorStop(.4,metal);g.addColorStop(1,'#101d2d');
  ctx.fillStyle='#07101b';ctx.fillRect(xx,yy,T,T);rounded(xx+1,yy+1,T-2,T-2,5,g,'#8caec33a');
  rounded(xx+5,yy+5,T-10,10,3,'#162c3f','#9cc1d035');
  const light=ctx.createLinearGradient(xx+6,yy+8,xx+T-6,yy+8);light.addColorStop(0,'#204b5c');light.addColorStop(.5,accent);light.addColorStop(1,'#204b5c');
  ctx.fillStyle=light;ctx.globalAlpha=.83;ctx.fillRect(xx+8,yy+8,T-16,2);ctx.globalAlpha=1;
  rounded(xx+7,yy+22,T-14,19,4,'#122336','#a8c4d02e');
  ctx.fillStyle='#91aec0';ctx.fillRect(xx+10,yy+26,4,3);ctx.fillRect(xx+34,yy+26,4,3);
  ctx.fillStyle='#0b1725';ctx.fillRect(xx+13,yy+33,22,3);
 }else{
  const floor=ctx.createLinearGradient(xx,yy,xx+T,yy+T);floor.addColorStop(0,(x+y)%2?'#142d3e':'#112737');floor.addColorStop(1,base);
  ctx.fillStyle=floor;ctx.fillRect(xx,yy,T,T);
  ctx.strokeStyle='#719eb321';ctx.lineWidth=1;ctx.strokeRect(xx+.5,yy+.5,T-1,T-1);
  ctx.strokeStyle='#a8d3dd20';ctx.beginPath();ctx.moveTo(xx+5,yy+5);ctx.lineTo(xx+18,yy+5);ctx.moveTo(xx+5,yy+5);ctx.lineTo(xx+5,yy+18);ctx.moveTo(xx+43,yy+43);ctx.lineTo(xx+30,yy+43);ctx.stroke();
  if((x*7+y*11)%13===0){ctx.fillStyle=accent;ctx.globalAlpha=.4;ctx.fillRect(xx+38,yy+38,3,3);ctx.globalAlpha=1}
  if((x+y*3)%17===0){ctx.strokeStyle='#9dcbd024';ctx.beginPath();ctx.arc(xx+24,yy+24,11,0,Math.PI*2);ctx.stroke()}
 }
 ctx.restore();
}
function glow(x,y,color,symbol){const xx=x*T+24,yy=y*T+24+Math.sin(Date.now()/350+x*2)*2.5;ctx.save();ctx.shadowBlur=23;ctx.shadowColor=color;rounded(xx-16,yy-16,32,32,9,'#0c223a',color);ctx.shadowBlur=10;rounded(xx-12,yy-12,24,24,6,color);ctx.shadowBlur=0;ctx.font='bold 20px system-ui';ctx.fillStyle='#061627';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(symbol,xx,yy+1);ctx.restore()}
function character(x,y,name,color,ghost=false){
 const xx=x*T+24,yy=y*T+23;ctx.save();ctx.globalAlpha=ghost?.74:1;
 ctx.fillStyle='#00091490';ctx.beginPath();ctx.ellipse(xx,yy+17,15,6,0,0,Math.PI*2);ctx.fill();
 // boots, legs and armored coat
 rounded(xx-10,yy+9,8,13,3,'#1b2b40','#6c8599');rounded(xx+2,yy+9,8,13,3,'#1b2b40','#6c8599');
 rounded(xx-13,yy-5,26,22,7,'#263e57',color);
 rounded(xx-17,yy-2,7,17,3,'#1d3049','#759eb3');rounded(xx+10,yy-2,7,17,3,'#1d3049','#759eb3');
 ctx.fillStyle=color;ctx.fillRect(xx-3,yy-2,6,15);ctx.fillStyle='#a7e7ee';ctx.fillRect(xx-1,yy,2,12);
 // head and hair silhouette
 rounded(xx-10,yy-18,20,17,6,'#d4a98b','#e8c2a5');
 ctx.fillStyle='#111c2b';ctx.beginPath();ctx.moveTo(xx-10,yy-10);ctx.lineTo(xx-12,yy-20);ctx.lineTo(xx-4,yy-26);ctx.lineTo(xx+8,yy-22);ctx.lineTo(xx+11,yy-13);ctx.lineTo(xx+4,yy-16);ctx.lineTo(xx-2,yy-14);ctx.closePath();ctx.fill();
 ctx.fillStyle='#b5f5f7';ctx.fillRect(xx-6,yy-12,4,2);ctx.fillRect(xx+3,yy-12,4,2);
 ctx.globalAlpha=1;ctx.font='bold 11px system-ui';ctx.textAlign='center';
 const nameText=String(name).slice(0,12),tw=Math.max(54,ctx.measureText(nameText).width+14);
 rounded(xx-tw/2,yy-42,tw,15,6,'#0b2031ed','#8fb6ca');ctx.fillStyle='#eefbff';ctx.fillText(nameText,xx,yy-31);ctx.restore();
}
function render(){if(!game)return;camBegin();ctx.drawImage(tileLayer(),0,0,W*T,H*T);const d=game.levelData,p=game.player;glow(d.exit.x,d.exit.y,p.terminal?'#49ef9e':'#327b68','➜');if(!p.card)glow(d.card.x,d.card.y,'#55ddec','▣');d.cores.forEach((c,i)=>{if(!p.cores.includes(i))glow(c.x,c.y,'#ffca5a','◆')});glow(d.terminal.x,d.terminal.y,p.terminal?'#54edb4':'#ab78fa','⚡');for(const dn of game.drones)drawDrone(dn);if(roomData?.players)for(const [id,other] of Object.entries(roomData.players)){if(id!==uid&&other.level===game.level+1&&!other.finished&&!other.failed&&Number.isInteger(other.x)&&Number.isInteger(other.y))character(other.x,other.y,other.nick||'Rival','#ff95d2',true)}if(Date.now()>p.invuln||Math.floor(Date.now()/160)%2===0)character(game.vx,game.vy,nick,'#53e5f6');drawParts();camEnd()}
let lastCd='';function countdown(){const wait=game.startAt-Date.now(),el=$('countdown');if(wait>0&&!game.finished&&!game.failed){const t=String(Math.ceil(wait/1000));if(t!==lastCd){lastCd=t;el.innerHTML=`<div>${t}<small>¡PREPARATE! LA CARRERA ARRANCA</small></div>`;AU.sfx('ok')}el.classList.remove('hidden')}else if(!el.classList.contains('hidden')){el.classList.add('hidden');lastCd=''}}
function frame(now){raf=requestAnimationFrame(frame);if(!game)return;countdown();if(!transition&&!game.finished&&!game.failed){if(remaining()<=0){endGame(false,'Se agotó el tiempo. Morfeo cerró todas las salidas.')}else moveDrones(Date.now())}if(now-lastFrame>14){render();$('clock').textContent=mmss(remaining());lastFrame=now}}
function show(section){for(const id of ['menu','lobby','play'])$(id).classList.toggle('hidden',id!==section)}
function cleanNick(){const n=$('nick').value.trim().replace(/[<>\\/\u0000-\u001f]/g,'').slice(0,16);if(!n){message('menuMsg','Primero escribí tu apodo.');return null}return n}
function startSolo(){const n=cleanNick();if(!n)return;nick=n;difficulty=$('difficulty').value;mode='solo';room=null;roomData=null;show('play');$('modeLabel').textContent=`INDIVIDUAL · ${config().label}`;newGame();if(!raf)raf=requestAnimationFrame(frame)}
/* ===== MULTIJUGADOR (Firebase Realtime Database + acceso anónimo) =====
   Las reglas que protegen estos datos están en firebase/database.rules.json (pegarlas en Firebase → Realtime Database → Reglas).
   Estructura:  rooms/{CÓDIGO}/{host,difficulty,seed,status,createdAt,startedAt,players/{uid}/{nick,ready,x,y,level,lives,cores,card,terminal,finished,failed,finishMs,score,updatedAt,offline}} */
const fail=m=>{const e=new Error(m);e.friendly=true;return e};
const withTimeout=(p,ms=9000)=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(fail('Firebase tardó demasiado en responder. Revisá tu conexión, la URL de la base de datos y que las reglas estén publicadas.')),ms))]);
const refRoom=c=>dbApi.ref(db,`rooms/${c}`),refPlayer=(c,id)=>dbApi.ref(db,`rooms/${c}/players/${id}`);
async function initFirebase(){if(uid)return;const [appMod,authMod,dbMod]=await Promise.all([import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js')]);const app=appMod.getApps().length?appMod.getApp():appMod.initializeApp(FIREBASE);authApi=authMod;dbApi=dbMod;db=dbMod.getDatabase(app);const auth=authMod.getAuth(app);const credential=auth.currentUser?{user:auth.currentUser}:await withTimeout(authMod.signInAnonymously(auth),12000);uid=credential.user.uid;dbApi.onValue(dbApi.ref(db,'.info/serverTimeOffset'),s=>{serverOffset=Number(s.val())||0});connected=true}
function errorText(e){console.error(e);if(e?.friendly)return e.message;const c=String(e?.code||'')+' '+String(e?.message||'');
 if(c.includes('operation-not-allowed')||c.includes('admin-restricted'))return 'El acceso anónimo está desactivado. Activalo en Firebase → Authentication → Método de acceso → Anónimo.';
 if(c.includes('unauthorized-domain'))return 'Este dominio no está autorizado. Agregalo en Firebase → Authentication → Configuración → Dominios autorizados (por ejemplo tuusuario.github.io).';
 if(c.includes('api-key-not-valid')||c.includes('invalid-api-key'))return 'La clave de API de Firebase no es válida o tiene restricciones que bloquean este sitio.';
 if(c.includes('PERMISSION_DENIED')||c.toLowerCase().includes('permission denied'))return 'Firebase rechazó la operación. Publicá las reglas de firebase/database.rules.json (Realtime Database → Reglas). Si ya lo hiciste, la sala puede estar llena o ya haber empezado.';
 if(c.includes('network')||c.includes('Failed to fetch')||c.includes('Failed to resolve'))return 'No hay conexión con Firebase. Revisá tu internet e intentá de nuevo.';
 return `No se pudo conectar: ${c.trim()||'error desconocido'}.`}
function codeGen(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';const bytes=new Uint8Array(6);crypto.getRandomValues(bytes);for(const b of bytes)s+=chars[b%chars.length];return s}
function playerData(n,diff,isReady=false){return{nick:n,ready:isReady,x:1,y:1,level:1,lives:SETTINGS[diff]?.lives||3,cores:0,card:false,terminal:false,finished:false,failed:false,finishMs:0,score:0,updatedAt:Date.now()}}
function resetLocal(msg=''){unsub?.();unsub=null;room=null;roomData=null;host=false;game=null;transition=false;mode='solo';lastCd='';$('countdown').classList.add('hidden');hideOverlay();prevP={};show('menu');showBest();message('menuMsg',msg)}
function roomListen(){unsub?.();unsub=dbApi.onValue(refRoom(room),snap=>{roomData=snap.val();
 if(!roomData){if(mode==='multi'&&game&&!game.finished&&!game.failed){endGame(false,'La sala fue cerrada.')}else if(mode==='lobby'){resetLocal('La sala fue cerrada por el anfitrión.')}return}
 if(mode==='lobby'&&!roomData.players?.[uid]){resetLocal('Ya no estás en esa sala.');return}
 host=roomData.host===uid;const players=Object.values(roomData.players||{});
 $('codeLabel').textContent=room;$('lobbyDifficulty').textContent=`Dificultad: ${SETTINGS[roomData.difficulty]?.label||'MEDIO'} · ${players.length}/4 jugadores`;
 $('lobbyPlayers').innerHTML='';for(const [id,p] of Object.entries(roomData.players||{})){const el=document.createElement('div'),isHost=id===roomData.host;el.textContent=`${isHost?'👑':p.ready?'✓':'◌'} ${p.nick||'Jugador'}${id===uid?' (vos)':''}${isHost?' · anfitrión':p.ready?' · listo':' · esperando'}`;$('lobbyPlayers').append(el)}
 $('startRace').classList.toggle('hidden',!host);const guests=Object.entries(roomData.players||{}).filter(([id])=>id!==roomData.host).map(([,p])=>p);$('startRace').disabled=players.length<2||guests.some(p=>!p.ready);$('ready').classList.toggle('hidden',host);
 $('ready').textContent=roomData.players?.[uid]?.ready?'✓ LISTO (tocá para cancelar)':'✓ ESTOY LISTO';
 if(mode==='lobby')message('lobbyMsg',players.length<2?'Esperando a que se una al menos otro jugador…':guests.some(p=>!p.ready)?(host?'Esperando que tus amigos toquen «Estoy listo».':'Tocá «Estoy listo» para avisarle al anfitrión.'):host?'¡Todo listo! Podés iniciar la carrera.':'Esperando que el anfitrión inicie la carrera…');
 updatePlayers();notify();
 if(roomData.status==='playing'&&mode==='lobby'&&roomData.startedAt){mode='multi';difficulty=roomData.difficulty;show('play');$('modeLabel').textContent=`SALA ${room} · ${config().label}`;
  const pr=refPlayer(room,uid);dbApi.onDisconnect(pr).cancel().then(()=>dbApi.onDisconnect(pr).update({offline:true})).catch(console.warn);
  newGame();if(!raf)raf=requestAnimationFrame(frame)}},e=>{if(mode==='lobby'||mode==='multi')message('lobbyMsg',errorText(e))})}
async function createRoom(){const n=cleanNick();if(!n)return;nick=n;difficulty=$('difficulty').value;message('menuMsg','Conectando con Firebase...');
 try{await initFirebase();let code=null;
  for(let i=0;i<8&&!code;i++){const c=codeGen();if((await withTimeout(dbApi.get(refRoom(c)))).exists())continue;
   await withTimeout(dbApi.set(refRoom(c),{host:uid,difficulty,seed:Math.floor(Math.random()*999999999),status:'waiting',createdAt:Date.now(),players:{[uid]:playerData(nick,difficulty,true)}}));code=c}
  if(!code)throw fail('No se pudo generar un código de sala único. Intentá de nuevo.');
  room=code;host=true;mode='lobby';await dbApi.onDisconnect(refRoom(room)).remove();show('lobby');roomListen();message('menuMsg','')}catch(e){room=null;mode='solo';message('menuMsg',errorText(e))}}
async function joinRoom(){const n=cleanNick();if(!n)return;nick=n;const code=$('roomCode').value.trim().toUpperCase();if(!/^[A-Z0-9]{6}$/.test(code)){message('menuMsg','Ingresá un código válido de seis caracteres.');return}
 message('menuMsg','Conectando con Firebase...');
 try{await initFirebase();const snap=await withTimeout(dbApi.get(refRoom(code)));if(!snap.exists())throw fail('No existe ninguna sala con ese código.');const cur=snap.val(),ps=cur.players||{};
  if(cur.status!=='waiting'&&!ps[uid])throw fail('Esa carrera ya empezó. Pedile al anfitrión que cree otra sala.');
  if(!ps[uid]&&Object.keys(ps).length>=4)throw fail('La sala está llena (4/4 jugadores).');
  await withTimeout(dbApi.set(refPlayer(code,uid),playerData(nick,cur.difficulty)));
  room=code;host=cur.host===uid;difficulty=cur.difficulty;mode='lobby';await dbApi.onDisconnect(refPlayer(room,uid)).remove();show('lobby');roomListen();message('menuMsg','')}catch(e){room=null;mode='solo';message('menuMsg',errorText(e))}}
async function setReady(){if(!room||!uid)return;try{await withTimeout(dbApi.set(dbApi.ref(db,`rooms/${room}/players/${uid}/ready`),!roomData?.players?.[uid]?.ready))}catch(e){message('lobbyMsg',errorText(e))}}
async function startRace(){if(!host||!room||!roomData)return;const ps=Object.entries(roomData.players||{});if(ps.length<2||ps.some(([id,p])=>id!==roomData.host&&!p.ready))return;$('startRace').disabled=true;
 try{await dbApi.onDisconnect(refRoom(room)).cancel();
  await withTimeout(dbApi.set(dbApi.ref(db,`rooms/${room}/startedAt`),Date.now()+serverOffset+4500));
  await withTimeout(dbApi.set(dbApi.ref(db,`rooms/${room}/status`),'playing'))}
 catch(e){message('lobbyMsg',errorText(e));try{await dbApi.onDisconnect(refRoom(room)).remove()}catch{}$('startRace').disabled=false}}
function sendProgress(force=false){if(!room||!uid||!dbApi||!game||game.finished||game.failed||mode!=='multi')return;const now=Date.now();if(!force&&now-lastNetwork<130)return;lastNetwork=now;const p=game.player;dbApi.update(refPlayer(room,uid),{x:p.x,y:p.y,level:game.level+1,lives:p.lives,cores:p.cores.length,card:p.card,terminal:p.terminal,offline:false,updatedAt:now}).catch(e=>console.warn('Sincronización:',e?.code||e))}
function updatePlayers(){if(!game||!roomData?.players){$('players').textContent=nick||'Solo vos';return}const ps=Object.entries(roomData.players).map(([id,p])=>({id,...p})).sort((a,b)=>(b.finished?1:0)-(a.finished?1:0)||(a.finished&&b.finished?a.finishMs-b.finishMs:(b.level||0)-(a.level||0)));$('players').innerHTML='';for(const p of ps){const div=document.createElement('div');div.className='playerItem'+(p.offline&&!p.finished&&!p.failed?' off':'');div.textContent=`${p.finished?'🏆':p.failed?'✖':p.offline?'📡':'🎮'} ${p.nick||'Jugador'}${p.id===uid?' (vos)':''} · ${p.finished?mmss(p.finishMs):p.failed?'Sin vidas':p.offline?'Sin conexión':`Nivel ${p.level||1}/5`}`;$('players').append(div)}}
async function leave(){const r=room,wasHost=host,status=roomData?.status;resetLocal();if(!(r&&dbApi&&uid))return;try{await dbApi.onDisconnect(refRoom(r)).cancel();if(wasHost&&status==='waiting'){await dbApi.remove(refRoom(r))}else{await dbApi.remove(refPlayer(r,uid));const left=await dbApi.get(dbApi.ref(db,`rooms/${r}/players`));if(!left.exists())await dbApi.remove(refRoom(r))}}catch(e){console.warn('Salida:',e)}}

/* ===== Diagnóstico del multijugador: muestra en qué paso falla (acceso anónimo → lectura → escritura) ===== */
async function diagnose(){const out=$('diagOut'),lines=[];const log=t=>{lines.push(t);out.textContent=lines.join('\n')};out.classList.remove('hidden');out.textContent='';$('diag').disabled=true;
 const step=async(name,fn)=>{try{const r=await withTimeout(fn(),10000);log('✔ '+name+(r?' · '+r:''));return true}catch(e){console.error(e);log('✖ '+name+'\n   → '+errorText(e).replace(/^No se pudo conectar: /,''));return false}};
 log('Dominio: '+location.host+(location.protocol==='file:'?'  ⚠ abrí el sitio desde GitHub Pages, no con doble clic':''));
 if(!await step('1. Acceso anónimo (Authentication)',async()=>{await initFirebase();return 'uid '+uid.slice(0,6)+'…'})){$('diag').disabled=false;return}
 await step('2. Conexión con Realtime Database',async()=>{const s=await dbApi.get(dbApi.ref(db,'.info/connected'));return s.val()?'conectado':'esperando…'});
 await step('3. Lectura (reglas)',async()=>{await dbApi.get(refRoom('AAAAAA'));return 'permitida'});
 let t='T'+codeGen().slice(0,5),made=false;
 made=await step('4. Crear sala de prueba (reglas)',async()=>{await dbApi.set(refRoom(t),{host:uid,difficulty:'normal',seed:1,status:'waiting',createdAt:Date.now(),players:{[uid]:playerData('Prueba','normal',true)}});return 'sala '+t});
 if(made){await step('5. Actualizar progreso del jugador',async()=>{await dbApi.update(refPlayer(t,uid),{x:2,y:1,level:1,lives:3,cores:0,card:false,terminal:false,offline:false,updatedAt:Date.now()})});
  await step('6. Iniciar carrera (host)',async()=>{await dbApi.set(dbApi.ref(db,`rooms/${t}/startedAt`),Date.now());await dbApi.set(dbApi.ref(db,`rooms/${t}/status`),'playing')});
  await step('7. Borrar sala de prueba',async()=>{await dbApi.remove(refRoom(t))})}
 log(lines.some(l=>l.startsWith('✖'))?'\nHay pasos fallidos: copiá este texto y pasámelo.':'\n¡Todo funciona! Ya podés crear salas y jugar con amigos.');$('diag').disabled=false}
$('diag').onclick=diagnose;
$('solo').onclick=startSolo;$('create').onclick=createRoom;$('join').onclick=joinRoom;$('ready').onclick=setReady;$('startRace').onclick=startRace;$('leaveLobby').onclick=leave;$('exitGame').onclick=()=>{if(confirm('¿Salir de la partida? Se perderá tu progreso.'))leave()};$('overlayAction').onclick=()=>overlayCallback?.();$('copyCode').onclick=async()=>{try{await navigator.clipboard.writeText(room);message('lobbyMsg','Código copiado.')}catch{message('lobbyMsg',`Compartí este código: ${room}`)}};$('interactMobile').onclick=interact;
const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],a:[-1,0],s:[0,1],d:[1,0],W:[0,-1],A:[-1,0],S:[0,1],D:[1,0]};window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;if(keys[e.key]){e.preventDefault();move(...keys[e.key])}else if(e.key==='e'||e.key==='E'||e.code==='Space'){e.preventDefault();interact()}});document.querySelectorAll('[data-move]').forEach(b=>{const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[b.dataset.move];let timer;b.addEventListener('pointerdown',e=>{e.preventDefault();move(...d);timer=setInterval(()=>move(...d),125)});for(const ev of ['pointerup','pointercancel','pointerleave'])b.addEventListener(ev,()=>clearInterval(timer))});
$('nick').value=localStorage.getItem('nova2087-nick')||'';$('nick').addEventListener('change',()=>localStorage.setItem('nova2087-nick',$('nick').value.slice(0,16)));

/* ===== NOVA 4.0: cámara, luz, táctil, sonido, acertijos, copa ===== */
let zoom=matchMedia('(pointer:coarse)').matches?1.9:1.45,cam={x:0,y:0},parts=[],prevP={};
const clampZ=()=>{zoom=Math.min(2.6,Math.max(1,zoom))},mk=(x,y)=>x+','+y;
const motes=Array.from({length:34},()=>({x:Math.random()*960,y:Math.random()*640,s:.15+Math.random()*.4,p:Math.random()*6,r:1+Math.random()*2,c:Math.random()<.5?'#65f5f0':'#a389ff'}));
function tileLayer(){if(game.layer)return game.layer;const c=document.createElement('canvas');c.width=W*T*2;c.height=H*T*2;ctx=c.getContext('2d');ctx.scale(2,2);for(let y=0;y<H;y++)for(let x=0;x<W;x++)drawTile(x,y);ctx=mainCtx;return game.layer=c}
function camBegin(){const p=game.player;game.vx+=(p.x-game.vx)*.3;game.vy+=(p.y-game.vy)*.3;const vw=canvas.width/zoom,vh=canvas.height/zoom;cam.x=Math.max(0,Math.min(W*T-vw,game.vx*T+24-vw/2));cam.y=Math.max(0,Math.min(H*T-vh,game.vy*T+24-vh/2));ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#050c1d';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();let sx=0,sy=0;if(Date.now()<(game.shake||0)){sx=(Math.random()-.5)*8;sy=(Math.random()-.5)*8}ctx.scale(zoom,zoom);ctx.translate(-cam.x+sx,-cam.y+sy)}
function camEnd(){ctx.restore();ctx.setTransform(1,0,0,1,0,0);const px=(game.vx*T+24-cam.x)*zoom,py=(game.vy*T+24-cam.y)*zoom,r=Math.max(canvas.width,canvas.height)*.6;
const gl=ctx.createRadialGradient(px,py,0,px,py,130*zoom/1.5);gl.addColorStop(0,'#39d8e82e');gl.addColorStop(1,'#39d8e800');ctx.fillStyle=gl;ctx.fillRect(0,0,canvas.width,canvas.height);
const v=ctx.createRadialGradient(px,py,r*.25,px,py,r);v.addColorStop(0,'#03061200');v.addColorStop(1,'#030612e0');ctx.fillStyle=v;ctx.fillRect(0,0,canvas.width,canvas.height);
const t=Date.now();ctx.fillStyle='#8ff';for(const m of motes){m.y-=m.s;m.x+=Math.sin(t/900+m.p)*.3;if(m.y<-4){m.y=canvas.height+4;m.x=Math.random()*canvas.width}ctx.globalAlpha=.35;ctx.fillStyle=m.c;ctx.fillRect(m.x,m.y,m.r,m.r)}ctx.globalAlpha=1;
const gx=Math.round(game.vx),gy=Math.round(game.vy);for(let a=-3;a<=3;a++)for(let b=-3;b<=3;b++)game.seen.add(mk(gx+a,gy+b));
const s=6,mx=canvas.width-W*s-14,my=12,d=game.levelData;ctx.fillStyle='#050c1dd0';ctx.fillRect(mx-4,my-4,W*s+8,H*s+8);
for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(game.seen.has(mk(x,y))&&d.grid[y][x]==='.'){ctx.fillStyle=(x===d.exit.x&&y===d.exit.y)?'#49ef9e':(x===d.terminal.x&&y===d.terminal.y)?'#ab78fa':'#2f5876';ctx.fillRect(mx+x*s,my+y*s,s-1,s-1)}
ctx.fillStyle='#65f5f0';ctx.fillRect(mx+gx*s-1,my+gy*s-1,s+1,s+1);ctx.fillStyle='#8ec6d9';ctx.font='bold 12px system-ui';ctx.textAlign='left';ctx.fillText(SECTORS[game.level].subtitle.toUpperCase(),14,22)}
function drawDrone(d){d.vx??=d.x;d.vy??=d.y;const ox=d.x-d.vx,oy=d.y-d.vy;if(Math.abs(ox)>.05||Math.abs(oy)>.05)d.dir=Math.atan2(oy,ox);d.vx+=ox*.2;d.vy+=oy*.2;const x=d.vx*T+24,y=d.vy*T+24,a=d.dir??0;
ctx.save();ctx.translate(x,y);ctx.rotate(a);const g=ctx.createRadialGradient(8,0,4,70,0,95);g.addColorStop(0,'#ff4d7d99');g.addColorStop(1,'#ff4d7d00');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(96,-40);ctx.lineTo(96,40);ctx.closePath();ctx.fill();ctx.rotate(-a);
ctx.shadowColor='#ff3b6b';ctx.shadowBlur=16;ctx.fillStyle='#2a3050';ctx.beginPath();ctx.roundRect(-14,-9,28,18,8);ctx.fill();ctx.fillStyle='#161b30';ctx.fillRect(-23,-3,9,6);ctx.fillRect(14,-3,9,6);ctx.fillStyle=Math.floor(Date.now()/300)%2?'#ff3b6b':'#ffa5ba';ctx.beginPath();ctx.arc(0,0,4.5,0,7);ctx.fill();ctx.restore()}
function burst(tx,ty,c,n=16){for(let i=0;i<n;i++){const a=Math.random()*6.28,s=1+Math.random()*3.2;parts.push({x:tx*T+24,y:ty*T+24,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1,c})}}
function drawParts(){parts=parts.filter(q=>q.l>0);for(const q of parts){q.x+=q.vx;q.y+=q.vy;q.vx*=.96;q.vy*=.96;q.l-=.025;ctx.globalAlpha=Math.max(0,q.l);ctx.fillStyle=q.c;ctx.shadowColor=q.c;ctx.shadowBlur=8;ctx.fillRect(q.x-2,q.y-2,4,4)}ctx.globalAlpha=1;ctx.shadowBlur=0}
/* zoom y control táctil */
const vp=document.querySelector('.viewport'),stick=$('stick'),knob=stick.firstElementChild,ptr=new Map();let sdir=null,sorg=null,pd=0,stickT=0;
const pinch=()=>{const[a,b]=[...ptr.values()];return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)};
function stopStick(){clearInterval(stickT);sdir=null;sorg=null;stick.classList.add('hidden')}
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;AU.init();ptr.set(e.pointerId,e);canvas.setPointerCapture(e.pointerId);if(ptr.size===1){const r=vp.getBoundingClientRect();sorg={x:e.clientX,y:e.clientY};stick.style.left=e.clientX-r.left+'px';stick.style.top=e.clientY-r.top+'px';knob.style.transform='';stick.classList.remove('hidden');stickT=setInterval(()=>sdir&&move(sdir[0],sdir[1]),115)}else if(ptr.size===2){pd=pinch();stopStick()}});
canvas.addEventListener('pointermove',e=>{if(!ptr.has(e.pointerId))return;ptr.set(e.pointerId,e);if(ptr.size===2){const d=pinch();if(pd){zoom*=d/pd;clampZ()}pd=d;return}if(!sorg)return;const dx=e.clientX-sorg.x,dy=e.clientY-sorg.y,m=Math.hypot(dx,dy),k=Math.min(m,46)/(m||1);knob.style.transform=`translate(${dx*k}px,${dy*k}px)`;sdir=m<16?null:Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)]});
for(const ev of['pointerup','pointercancel'])canvas.addEventListener(ev,e=>{ptr.delete(e.pointerId);if(!ptr.size){pd=0;stopStick()}});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom*=e.deltaY<0?1.08:.93;clampZ()},{passive:false});
$('zp').onclick=()=>{zoom*=1.15;clampZ()};$('zm').onclick=()=>{zoom/=1.15;clampZ()};
/* sonido: música y efectos sintetizados */
const AU={c:null,i:0,on:localStorage.getItem('nova2087-mute')!=='1',
init(){if(this.c){this.c.state==='suspended'&&this.c.resume();return}try{this.c=new(window.AudioContext||window.webkitAudioContext)();this.g=this.c.createGain();this.g.gain.value=.55;this.g.connect(this.c.destination);setInterval(()=>this.step(),230)}catch{}},
n(f,d=.2,type='sine',v=.12,at=0){if(!this.c||!this.on)return;const t=this.c.currentTime+at,o=this.c.createOscillator(),g=this.c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(this.g);o.start(t);o.stop(t+d+.05)},
step(){if(!this.c||!this.on||!game||game.finished||game.failed||document.hidden)return;const r=[110,98,123,92,104][game.level]||110,sc=[0,3,5,7,10,12,10,7],k=this.i++;if(k%4===0)this.n(r/2,.9,'sine',.2);this.n(r*2*2**(sc[k%8]/12),.35,'triangle',.07);if(k%8===4)this.n(r*4*2**(sc[(k+3)%8]/12),.5,'sine',.04);if(k%2===0&&game.drones.some(q=>Math.abs(q.x-game.player.x)+Math.abs(q.y-game.player.y)<=3))this.n(r*8,.08,'square',.035)},
sfx(s){const m={card:[[660,.1],[880,.15]],core:[[520,.08],[780,.12],[1040,.16]],term:[[330,.1],[495,.1],[660,.1],[990,.25]],hit:[[160,.25,'sawtooth'],[110,.3,'sawtooth']],bad:[[180,.2,'square'],[140,.3,'square']],toast:[[880,.08],[1320,.14]],ok:[[600,.1],[900,.18]],cup:[[523,.18],[659,.18],[784,.18],[1047,.2],[784,.12],[1047,.7]],lose:[[300,.25,'sawtooth'],[220,.25,'sawtooth'],[150,.6,'sawtooth']]}[s]||[];m.forEach(([f,d,t],i)=>this.n(f,d,t||'triangle',.16,i*.11))}};
['pointerdown','keydown'].forEach(ev=>addEventListener(ev,()=>AU.init()));
$('mute').textContent=AU.on?'🔊':'🔇';$('mute').onclick=()=>{AU.on=!AU.on;localStorage.setItem('nova2087-mute',AU.on?'0':'1');$('mute').textContent=AU.on?'🔊':'🔇'};
/* acertijos en las terminales */
const RID=[[['Soy lo que ves al cerrar los ojos, y Morfeo me gobierna. ¿Qué soy?',['Un eco','Un sueño','Una sombra'],1,'Morfeo es el dios griego de…'],['Tengo agujas pero no pincho, y todos me miran cuando se hace tarde.',['Un reloj','Un cactus','Una brújula'],0,'Marca las horas.']],
[['Guardo tu receta genética en una escalera retorcida. ¿Qué soy?',['Un virus','Una célula','El ADN'],2,'Su forma es una doble hélice.'],['Cuanto más sacás de mí, más grande me vuelvo.',['Un pozo','Una vela','Un globo'],0,'Se cava.']],
[['Tengo ojos rojos, vuelo sin plumas y vigilo sin dormir.',['Un búho','Un dron','Un faro'],1,'Patrulla esta fábrica.'],['Un dron patrulla 3 pasillos por minuto. ¿Cuántos recorre en 4 minutos?',['7','34','12'],2,'Multiplicá 3 × 4.']],
[['Siempre está delante tuyo, pero nunca lo alcanzás.',['El mañana','Tu sombra','La salida'],0,'Nunca llega hoy.'],['Tengo ciudades sin casas, ríos sin agua y bosques sin árboles.',['Un sueño','Un túnel','Un mapa'],2,'Sirve para orientarse.']],
[['Si me nombrás, desaparezco.',['El humo','El silencio','El eco'],1,'Se rompe al hablar.'],['¿Qué sigue? 2, 4, 8, 16, …',['24','20','32'],2,'Cada número es el doble del anterior.']]];
function closeRiddle(){$('riddle').classList.add('hidden');document.body.classList.remove('riddleOpen')}
function askRiddle(done){const r=RID[game.level][(game.seed+game.level)%2],dif=difficulty;transition=true;AU.sfx('ok');try{ptr.clear();stopStick()}catch{}document.body.classList.add('riddleOpen');$('rq').textContent=r[0];$('rh').textContent=dif==='easy'?'Pista: '+r[3]:'';const box=$('ropts');box.innerHTML='';
r[1].forEach((t,i)=>{const b=document.createElement('button');b.textContent=t;b.onclick=()=>{if(i===r[2]){closeRiddle();transition=false;done()}else{b.disabled=true;b.classList.add('wrong');const pen={easy:5,normal:10,hard:15}[dif]||10;game.startAt-=pen*1000;AU.sfx('bad');game.shake=Date.now()+300;$('rh').textContent=`✖ Incorrecto: −${pen} s.`+(dif==='hard'?'':' Pista: '+r[3])}};box.append(b)});$('riddle').scrollTop=0;$('riddle').classList.remove('hidden')}
/* copa y confites */
let cf=[],cfRaf=0;const cc=$('confetti'),cx=cc.getContext('2d');
function startConfetti(n){cc.width=960;cc.height=640;cf=Array.from({length:n},()=>({x:Math.random()*960,y:-Math.random()*640,w:6+Math.random()*7,h:4+Math.random()*6,vy:2+Math.random()*3.5,vx:(Math.random()-.5)*2,r:Math.random()*6,vr:(Math.random()-.5)*.3,c:['#65f5f0','#a389ff','#ffca5a','#ff7e9e','#54edb4','#ffffff'][Math.random()*6|0]}));cancelAnimationFrame(cfRaf);const L=()=>{cx.clearRect(0,0,960,640);for(const p of cf){p.y+=p.vy;p.x+=p.vx+Math.sin(p.y/30);p.r+=p.vr;if(p.y>660){p.y=-10;p.x=Math.random()*960}cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);cx.fillStyle=p.c;cx.fillRect(-p.w/2,-p.h/2,p.w,p.h);cx.restore()}cfRaf=requestAnimationFrame(L)};L()}
function stopConfetti(){cancelAnimationFrame(cfRaf);cx.clearRect(0,0,960,640)}
/* avisos de multijugador */
function toast(t,c=''){const e=document.createElement('div');e.className='toast '+c;e.textContent=t;$('toasts').append(e);AU.sfx(c==='bad'?'bad':'toast');setTimeout(()=>e.remove(),4300)}
function notify(){if(mode!=='multi'||!roomData?.players)return;for(const[id,p]of Object.entries(roomData.players)){const o=prevP[id];if(o&&id!==uid){if(p.finished&&!o.finished)toast(`🥇 ${p.nick} terminó la carrera`);else if(p.failed&&!o.failed)toast(`✖ ${p.nick} se quedó sin vidas`,'bad');else if((p.level||1)>(o.level||1))toast(`🏆 ${p.nick} pasó al nivel ${p.level}`)}prevP[id]={level:p.level,finished:p.finished,failed:p.failed}}}
function showBest(){const v=Number(localStorage.getItem('nova2087-'+$('difficulty').value)||0);$('best').textContent=v?'🏅 Tu mejor tiempo en esta dificultad: '+mmss(v):''}
$('difficulty').addEventListener('change',showBest);showBest();
