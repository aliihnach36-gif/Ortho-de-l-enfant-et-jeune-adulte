"use strict";
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const DAY=864e5,today=()=>new Date().toISOString().slice(0,10);
const {C,X}=window.DATA;
/* ---------- index ---------- */
const N={},NL=[],Q=[],MOD={1:0,2:1,9:1,8:2,3:2,4:2,5:3,6:4,7:4,11:5,12:5,13:6,14:6,15:6,16:6,17:6,18:6};
const MODN=["Observer","Décider","Agir tôt","Déplacer","Limites et stabilité","Sagittal et vertical","Transversal, espace, dents"];
const tomeOf=ch=>ch>10?2:1,chLab=ch=>`T${tomeOf(ch)} · ch. ${ch>10?ch-10:ch}`;
C.forEach(c=>{c.notions.forEach(n=>{n.ch=c.ch;N[n.id]=n;NL.push(n)});c.qcm.forEach(q=>{q.ch=c.ch;q.i=Q.length;Q.push(q)})});
const CH=Object.fromEntries(C.map(c=>[c.ch,c]));
const SESS=[];X.plan.forEach((m,mi)=>m.s.forEach((s,si)=>SESS.push({...s,m:m.m,mi,si,k:SESS.length})));
const cardKeys=n=>n.f.map((_,i)=>n.id+"#"+i);
const PMAX={1:263,2:288};
const pdfPage=(p,t=1)=>t===2?(p<=129?p+8:p<=162?p+7:p<=230?p+6:p<=244?p+5:p<=252?p+4:p+3):(p<=84?p+8:p<=113?p+6:p<=205?p+5:p<=240?p+4:p<=247?p+2:p+1);
/* ---------- état ---------- */
const KEY="arcade.v1";
const fresh=()=>({v:1,upd:Date.now(),n:{"c5-force":{m:.65,seen:0,seedv:1},"c7-facteurs":{m:.6,seen:0,seedv:1},"c4-age":{m:.35,seen:0,seedv:1}},cards:{},q:{},errs:[],cal:{s:[0,0],m:[0,0],g:[0,0]},cases:{},daily:{},sess:{},tens:{},notes:{},exams:[],place:null,prefs:{exam:"AFK",date:"2027-02-05",dateOk:false,perWeek:5,ndeb:true}});
let S=fresh();
try{const r=localStorage.getItem(KEY);if(r){const p=JSON.parse(r);if(p&&p.v===1)S={...fresh(),...p}}}catch(e){}
let cloudRef=null,saveT=null;
function save(){S.upd=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}clearTimeout(saveT);saveT=setTimeout(push,1500)}
async function push(){if(!cloudRef)return;try{await cloudRef.set({json:JSON.stringify(S),upd:S.upd});setSync("Progression enregistrée sur ton compte")}catch(e){setSync("Enregistrement dans ce navigateur (compte indisponible)")}}
const setSync=t=>{const e=$("#sync");if(e)e.textContent=t};
async function initCloud(){
  if(!window.claude)return;
  try{
    const [db,user]=await Promise.all([claude.use("db"),claude.use("user")]);
    if(!db||!user)return;
    const id=await user.id();if(!id)return;
    cloudRef=db.doc("data/users/"+id+"/progress");
    const snap=await cloudRef.get();
    if(snap.exists){const d=snap.data();if(d&&d.upd>S.upd){const p=JSON.parse(d.json);if(p.v===1){S={...fresh(),...p};try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}route()}}}
    setSync("Progression enregistrée sur ton compte");
  }catch(e){}
}
let SAMPLE=null;
async function initSample(){if(!window.claude)return;try{SAMPLE=await claude.use("sample")}catch(e){}if(curView==="prof")route()}
/* ---------- maîtrise ---------- */
const M=id=>(S.n[id]&&S.n[id].m)||0;
const seen=id=>!!(S.n[id]&&S.n[id].seen);
function learn(id,d){const o=S.n[id]||(S.n[id]={m:0,seen:0});o.m=clamp((o.m||0)+d,0,1);tick()}
function tick(){const d=today();S.daily[d]=(S.daily[d]||0)+1}
const levelName=m=>m<.01?"À découvrir":m<.45?"Fragile":m<.8?"En cours":"Solide";
const chM=c=>{const a=CH[c].notions.map(n=>M(n.id));return a.reduce((x,y)=>x+y,0)/a.length};
function streak(){let n=0;for(let i=0;;i++){const d=new Date(Date.now()-i*DAY).toISOString().slice(0,10);if(S.daily[d])n++;else if(i>0)break;if(i>800)break}return n}
function dueCards(ch){const now=Date.now(),out=[];NL.forEach(n=>{if(ch&&n.ch!==+ch)return;cardKeys(n).forEach(k=>{const c=S.cards[k];if(c&&c.d<=now)out.push(k)})});return out}
function newCards(ch){const out=[];NL.forEach(n=>{if(ch&&n.ch!==+ch)return;if(!seen(n.id))return;cardKeys(n).forEach(k=>{if(!S.cards[k])out.push(k)})});return out}
function gradeCard(key,g){const now=Date.now(),c=S.cards[key]||{e:2.3,i:0,r:0,l:0};
  if(g===0){c.l++;c.r=0;c.i=0;c.d=now+6e5}else{c.r++;
    if(c.r===1)c.i=g===1?1:g===2?2:4;else if(c.r===2)c.i=g===1?3:g===2?6:9;else c.i=Math.round(c.i*(g===1?1.2:g===2?c.e:c.e*1.3));
    c.e=clamp(c.e+(g-2)*.12,1.3,2.8);c.d=now+c.i*DAY}
  S.cards[key]=c;learn(key.split("#")[0],[-.08,.03,.06,.09][g]);save()}
function pickAdaptive(ch,exclude){const cand=Q.filter(q=>(!ch||q.ch===+ch)&&!exclude.has(q.i));if(!cand.length)return null;
  const score=q=>{const m=M(q.n),st=S.q[q.i],target=m<.3?1.5:m<.6?2.3:m<.85?3:3.5;let s=(1-m)*2-Math.abs(q.lv-target)*.5;
    if(st){s-=Math.min(3,(st.a-st.ok)>0?-1.2:.6);const age=(Date.now()-st.t)/DAY;s+=Math.min(1,age/7)-(age<.02?3:0)}else s+=.5;
    if(S.prefs.ndeb)s+=(N[q.n].prio-2)*.35;return s+Math.random()*.5};
  return cand.map(q=>[q,score(q)]).sort((a,b)=>b[1]-a[1])[0][0].i}
function weakList(k=5){return NL.filter(n=>seen(n.id)||S.n[n.id]).filter(n=>M(n.id)<.6).sort((a,b)=>M(a.id)-M(b.id)).slice(0,k)}
function nextSession(){return SESS.find(s=>!S.sess[s.k])}
/* ---------- rendu commun ---------- */
const fmt=t=>esc(t).replace(/\{([RH]):([^}]*)\}/g,(m,k,x)=>`<span class="tag tag-${k}"><b>${k==="R"?"Raisonnement":"Hors livre"}</b>${x}</span>`);
const pg=(p,ch)=>String(p).split(",").map(x=>x.trim()).filter(Boolean).map(x=>{const m=x.match(/^T([12]):(.*)$/),t=m?+m[1]:(ch>10?2:1),v=m?m[2]:x;return `<button class="pg" data-src="${t}:${parseInt(v,10)}" title="Ouvrir cette page du tome ${t}">T${t} p. ${esc(v)}</button>`}).join(" ");
const meter=m=>`<div class="meter" role="img" aria-label="Maîtrise ${Math.round(m*100)} %"><i style="width:${Math.round(m*100)}%"></i></div>`;
const modBadge=ch=>`<span class="badge m" style="background:var(--m${MOD[ch]})">${chLab(ch)}</span>`;
const prioBadge=n=>S.prefs.ndeb?`<span class="badge" title="Mon estimation de la rentabilité pour le NDEB, pas une donnée officielle">NDEB ${"●".repeat(n.prio)}${"○".repeat(3-n.prio)}</span>`:"";
const nitem=n=>`<button class="nitem" data-n="${n.id}"><span class="row">${modBadge(n.ch)}${prioBadge(n)}<span class="badge">${levelName(M(n.id))}</span></span><strong>${esc(n.t)}</strong><span class="sum">${esc(n.s)}</span>${meter(M(n.id))}</button>`;
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("on"),2600)}
/* ---------- navigation ---------- */
const NAV=[["today","Aujourd'hui"],["parcours","Parcours"],["atlas","Atlas"],["carte","Carte"],["train","Entraînement"],["cas","Cas cliniques"],["labo","Labo"],["prof","Professeur"],["critique","Esprit critique"]];
let curView="today",ctx={};
function renderNav(){const due=dueCards().length;$("#navlinks").innerHTML=NAV.map(([k,t])=>`<a href="#${k}" data-go="${k}" ${curView===k?'aria-current="page"':""}>${t}${k==="train"&&due?`<span class="count">${due}</span>`:""}</a>`).join("")}
function go(v,c){ctx=c||{};curView=v;try{history.replaceState(null,"","#"+v)}catch(e){}route();$("#view").focus({preventScroll:true});window.scrollTo(0,0)}
function route(){
  const V={today:vToday,parcours:vParcours,atlas:vAtlas,carte:vCarte,train:vTrain,run:vRun,cas:vCas,labo:vLabo,prof:vProf,critique:vCritique,notion:vNotion,flash:vFlash,caseplay:vCasePlay}[curView]||vToday;
  renderNav();V($("#view"))}
/* ---------- Aujourd'hui ---------- */
function vToday(el){
  const ns=nextSession(),due=dueCards().length,nw=newCards().length,weak=weakList(4),seenN=NL.filter(n=>seen(n.id)).length,solid=NL.filter(n=>M(n.id)>=.8).length;
  const p=S.prefs,days=p.date?Math.ceil((new Date(p.date)-Date.now())/DAY):null,left=SESS.length-Object.keys(S.sess).length,weeks=left/Math.max(1,p.perWeek),finish=new Date(Date.now()+weeks*7*DAY);
  const cal=[["s","Sûr de moi"],["m","Hésitant"],["g","Au hasard"]].map(([k,t])=>{const [a,o]=S.cal[k];return [t,a,a?o/a:0]});
  const et={};S.errs.forEach(e=>{if(e.ty)et[e.ty]=(et[e.ty]||0)+1});
  el.innerHTML=`<div class="wrap">
  <header class="between"><div><span class="eyebrow">Orthodontie de l'enfant et du jeune adulte, tomes 1 et 2</span><h1>Ta prochaine décision clinique</h1></div>
  ${days!=null?`<div class="card tile" style="padding:12px 16px"><b class="mono">${days>0?days:0}</b><span class="small muted">jours avant ${esc(p.exam)}${p.dateOk?"":" (date à confirmer)"}</span></div>`:""}</header>
  <div class="grid2">
    <section class="card"><span class="eyebrow">Séance du jour</span>
      ${ns?`<h2>${ns.k+1}. ${esc(ns.t)}</h2><p class="muted">Module ${esc(ns.m)}, ${ns.n.length} notions, puis un mini-test.</p><div class="row"><button class="btn pri" data-sess="${ns.k}">Commencer la séance</button><button class="btn" data-go="parcours">Voir le parcours</button></div>`:`<h2>Parcours terminé</h2><p class="muted">Passe en mode examen et travaille tes notions faibles.</p>`}
    </section>
    <section class="card"><span class="eyebrow">Révision rapide</span>
      <h2>${due?`${due} carte${due>1?"s":""} à revoir`:"Rien d'urgent"}</h2>
      <p class="muted">${nw} nouvelle${nw>1?"s":""} carte${nw>1?"s":""} disponible${nw>1?"s":""} depuis les notions déjà vues.</p>
      <div class="row"><button class="btn pri" data-quick="1">Lancer 5 minutes</button><button class="btn" data-flash="1">Cartes seules</button></div>
    </section>
  </div>
  ${S.place?"":`<section class="card" style="border-color:var(--accent)"><div class="between"><div><h2>Test de placement</h2><p class="muted">${C.length*2} questions pour situer ton niveau. Les résultats ajustent tes notions de départ.</p></div><button class="btn pri" data-place="1">Faire le test</button></div></section>`}
  <div class="grid3">
    <div class="card tile"><b class="mono">${seenN}<span class="small muted"> / ${NL.length}</span></b><span class="small muted">notions étudiées</span></div>
    <div class="card tile"><b class="mono">${solid}</b><span class="small muted">notions solides</span></div>
    <div class="card tile"><b class="mono">${streak()}</b><span class="small muted">jours de suite</span></div>
    <div class="card tile"><b class="mono">${left}</b><span class="small muted">séances restantes, fin estimée le ${finish.toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span></div>
  </div>
  <div class="grid2">
    <section class="card"><h2>Maîtrise par chapitre</h2>${C.map(c=>{const m=chM(c.ch);return `<div class="hbar" title="${esc(c.title)} : ${Math.round(m*100)} %"><span>${chLab(c.ch)} <span class="muted small">${esc(c.title.split(" ")[0])}</span></span>${meter(m)}<span class="val">${Math.round(m*100)} %</span></div>`}).join("")}</section>
    <section class="card"><h2>Es-tu bien calibré ?</h2><p class="small muted">Réussite selon ta certitude. Une réussite faible quand tu te dis sûr signale une idée fausse.</p>
      ${cal.map(([t,a,r])=>`<div class="hbar" title="${esc(t)} : ${a} réponses"><span>${esc(t)}</span>${meter(r)}<span class="val">${a?Math.round(r*100)+" %":"–"}</span></div>`).join("")}
      <h3>Tes types d'erreurs</h3>${Object.keys(et).length?Object.entries(et).sort((a,b)=>b[1]-a[1]).map(([t,v])=>`<div class="hbar"><span>${esc(t)}</span>${meter(v/Math.max(...Object.values(et)))}<span class="val">${v}</span></div>`).join(""):`<p class="small muted">Après une erreur, indique sa cause. Le plan pourra cibler ce qui bloque vraiment.</p>`}
    </section>
  </div>
  ${weak.length?`<section class="card"><h2>À consolider d'abord</h2><div class="nlist">${weak.map(nitem).join("")}</div></section>`:""}
  <section class="card"><h2>Ton objectif</h2><div class="row">
    <label>Examen<select id="pExam"><option${p.exam==="AFK"?" selected":""}>AFK</option><option${p.exam==="ACJ"?" selected":""}>ACJ</option><option${p.exam==="Autre"?" selected":""}>Autre</option></select></label>
    <label>Date<input id="pDate" type="date" value="${esc(p.date||"")}"></label>
    <label>Séances par semaine<input id="pWeek" type="number" min="1" max="14" value="${p.perWeek}"></label>
    <label style="flex-direction:row;align-items:center;gap:6px"><input id="pNdeb" type="checkbox" ${p.ndeb?"checked":""}>Priorités NDEB</label></div>
    <p class="small muted">La date affichée vient du site du NDEB pour l'AFK au Canada. Remplace-la par la tienne. Les notions marquées ●●● sont une estimation personnelle, pas un programme officiel.</p>
  </section></div>`;
  $("#pExam").onchange=e=>{p.exam=e.target.value;save();route()};
  $("#pDate").onchange=e=>{p.date=e.target.value;p.dateOk=true;save();route()};
  $("#pWeek").onchange=e=>{p.perWeek=clamp(+e.target.value||5,1,14);save();route()};
  $("#pNdeb").onchange=e=>{p.ndeb=e.target.checked;save();route()};
}
/* ---------- parcours ---------- */
function vParcours(el){
  el.innerHTML=`<div class="wrap"><header><span class="eyebrow">${SESS.length} séances, ${X.plan.length} modules</span><h1>Parcours de raisonnement</h1><p class="lead">L'ordre suit le raisonnement clinique plutôt que l'ordre du livre : observer, décider, agir tôt, déplacer, stabiliser, puis traiter chaque malocclusion avec le tome 2.</p></header>
  ${X.plan.map((m,mi)=>`<section class="mod" style="--c:var(--m${mi})"><div><span class="eyebrow">${esc(m.c)}</span><h2>${esc(m.m)}</h2></div>${SESS.filter(s=>s.mi===mi).map(s=>{const d=S.sess[s.k],av=s.n.reduce((a,i)=>a+M(i),0)/s.n.length;return `<button class="sess ${d?"done":""}" data-sess="${s.k}"><span class="num">${d?"✓":s.k+1}</span><span style="flex:1;min-width:0"><strong>${esc(s.t)}</strong><br><span class="small muted">${s.n.length} notions${d?`, mini-test ${d.score} %`:""}</span>${meter(av)}</span></button>`}).join("")}</section>`).join("")}
  </div>`}
function startSession(k){const s=SESS[k];go("notion",{id:s.n[0],sess:k,pos:0})}
/* ---------- notion ---------- */
function vNotion(el){
  const n=N[ctx.id];if(!n)return go("atlas");
  const o=S.n[n.id]||{},first=!o.seen&&!ctx.revealed,s=ctx.sess!=null?SESS[ctx.sess]:null;
  const prev=NL[NL.indexOf(n)-1],next=NL[NL.indexOf(n)+1],qs=Q.filter(q=>q.n===n.id);
  if(first){el.innerHTML=`<div class="narrow">${s?`<div><span class="eyebrow">Séance ${ctx.sess+1} · ${ctx.pos+1} / ${s.n.length}</span><div class="prog"><i style="width:${(ctx.pos)/s.n.length*100}%"></i></div></div>`:""}
    <div class="card"><span class="row">${modBadge(n.ch)}<span class="badge">Avant de lire</span></span><h1>${esc(n.t)}</h1><p class="lead">Essaie d'abord de répondre, même si tu ne sais pas. Chercher la réponse avant de la lire améliore ce que tu retiendras.</p>
    <p style="font:700 20px/1.3 var(--display)">${esc(n.f[0][0])}</p><textarea id="pre" placeholder="Ta réponse, en quelques mots (facultatif)"></textarea><div class="row"><button class="btn pri" id="reveal">Voir l'explication</button></div></div></div>`;
    $("#reveal").onclick=()=>{ctx.pre=$("#pre").value;ctx.revealed=true;S.n[n.id]={...(S.n[n.id]||{m:0}),seen:Date.now()};if(!S.n[n.id].m)S.n[n.id].m=.05;tick();save();route()};return}
  if(!o.seen){S.n[n.id]={...(S.n[n.id]||{m:.05}),seen:Date.now()};save()}
  const links=n.links.map(i=>N[i]).filter(Boolean),incoming=NL.filter(x=>x.links.includes(n.id)&&!n.links.includes(x.id));
  el.innerHTML=`<div class="narrow">
  ${s?`<div><span class="eyebrow">Séance ${ctx.sess+1}, ${esc(s.t)} · ${ctx.pos+1} / ${s.n.length}</span><div class="prog"><i style="width:${(ctx.pos+1)/s.n.length*100}%"></i></div></div>`:""}
  <header class="card"><div class="row">${modBadge(n.ch)}${prioBadge(n)}<span class="badge">${levelName(M(n.id))}</span>${pg(n.p,n.ch)}</div><h1>${esc(n.t)}</h1>${meter(M(n.id))}</header>
  ${ctx.pre?`<div class="card"><span class="eyebrow">Ta réponse de départ</span><p>${esc(ctx.pre)}</p></div>`:""}
  <section class="card"><span class="eyebrow">L'idée simple</span><p style="font-size:19px">${esc(n.s)}</p></section>
  <section class="card"><span class="eyebrow">En profondeur · selon le livre ${pg(n.p,n.ch)}</span><p>${esc(n.d)}</p>${n.why?fmt(n.why):""}</section>
  ${links.length||incoming.length?`<section class="card"><span class="eyebrow">Ce que ça réutilise et prépare</span><div class="row">${[...links,...incoming].map(l=>`<button class="chip" data-n="${l.id}">${chLab(l.ch)} · ${esc(l.t)}</button>`).join("")}</div></section>`:""}
  <section class="card"><span class="eyebrow">À retenir, à tester</span>${n.f.map(([q,a],i)=>`<details><summary>${esc(q)}</summary><p style="margin-top:6px">${esc(a)}</p></details>`).join("")}
    <div class="row">${qs.length?`<button class="btn" data-quiz-n="${n.id}">Me tester (${qs.length} QCM)</button>`:""}<button class="btn" data-ask="${n.id}">Interroge-moi</button></div></section>
  <section class="card"><span class="eyebrow">Explique-le avec tes mots</span><p class="small muted">Si tu peux l'expliquer à un patient, tu l'as compris. Le professeur compare ta réponse au contenu du livre.</p>
    <textarea id="fey" placeholder="Écris comme si tu expliquais à un parent.">${esc((S.notes[n.id]||""))}</textarea>
    <div class="row"><button class="btn" id="feySave">Enregistrer</button><button class="btn" id="feyAsk">Faire corriger</button></div><div id="feyOut"></div></section>
  ${n.en&&n.en.length?`<section class="card"><span class="eyebrow">En anglais pour l'examen · hors livre</span><div class="row">${n.en.map(e=>`<span class="badge mono">${esc(e)}</span>`).join("")}</div></section>`:""}
  <div class="between">${s?`<span></span><button class="btn pri" id="sessNext">${ctx.pos+1<s.n.length?"Notion suivante":"Passer au mini-test"}</button>`:`<span class="row">${prev?`<button class="btn" data-n="${prev.id}">‹ ${esc(prev.t)}</button>`:""}</span><span class="row">${next?`<button class="btn" data-n="${next.id}">${esc(next.t)} ›</button>`:""}</span>`}</div></div>`;
  $("#feySave").onclick=()=>{S.notes[n.id]=$("#fey").value;save();toast("Enregistré")};
  $("#feyAsk").onclick=()=>feynman(n,$("#fey").value,$("#feyOut"));
  if(s)$("#sessNext").onclick=()=>{if(ctx.pos+1<s.n.length)go("notion",{id:s.n[ctx.pos+1],sess:ctx.sess,pos:ctx.pos+1});else{
    const set=shuffle(Q.filter(q=>s.n.includes(q.n)).map(q=>q.i)).slice(0,8);
    if(!set.length){S.sess[ctx.sess]={score:100,t:Date.now()};save();go("parcours");return}
    startQuiz({title:"Mini-test : "+s.t,list:set,sess:ctx.sess})}};
}
/* ---------- quiz ---------- */
let QZ=null;
function startQuiz(o){QZ={mode:"learn",i:0,res:[],pick:null,conf:null,done:false,...o};QZ.perm={};go("run")}
function startAdaptive(ch){const ex=new Set(),list=[];for(let k=0;k<10;k++){const i=pickAdaptive(ch,ex);if(i==null)break;ex.add(i);list.push(i)}startQuiz({title:"QCM adaptatif"+(ch?" · chapitre "+ch:""),list})}
function startExam(){const by=C.map(c=>shuffle(Q.filter(q=>q.ch===c.ch).map(q=>q.i))),n=40,tot=Q.length,list=[];
  by.forEach(a=>list.push(...a.slice(0,Math.max(2,Math.round(a.length/tot*n)))));
  startQuiz({title:"Examen blanc",list:shuffle(list).slice(0,n),mode:"exam",ans:{},end:Date.now()+Math.min(n,list.length)*72e3})}
function startPlace(){const list=[];C.forEach(c=>{const a=shuffle(c.qcm.filter(q=>q.lv>=2));list.push(...a.slice(0,2).map(q=>q.i))});startQuiz({title:"Test de placement",list,place:true})}
function permOf(q){return QZ.perm[q.i]||(QZ.perm[q.i]=shuffle(q.o.map((_,i)=>i)))}
function vRun(el){
  if(!QZ)return go("train");
  if(QZ.finished)return renderResult(el);
  const q=Q[QZ.list[QZ.i]];if(!q){QZ.finished=true;return renderResult(el)}
  if(QZ.mode==="exam")return renderExamQ(el,q);
  const perm=permOf(q),fin=QZ.done,ok=fin&&QZ.pick===q.a;
  el.innerHTML=`<div class="narrow"><div class="between"><span class="eyebrow">${esc(QZ.title)} · ${QZ.i+1} / ${QZ.list.length}</span><button class="btn sm" id="quit">Quitter</button></div><div class="prog"><i style="width:${(QZ.i)/QZ.list.length*100}%"></i></div>
  <section class="card"><div class="row">${modBadge(q.ch)}<span class="badge">Niveau ${q.lv}</span></div><p style="font:700 19px/1.35 var(--display)">${esc(q.q)}</p>
   <div style="display:flex;flex-direction:column;gap:8px">${perm.map((oi,pos)=>{let c="";if(fin){if(oi===q.a)c="good";else if(oi===QZ.pick)c="wrong"}else if(oi===QZ.pick)c="sel";return `<button class="opt ${c}" data-opt="${oi}" ${fin?"disabled":""}>${esc(q.o[oi])}${fin&&q.wrong&&oi!==q.a&&wrongOf(q,oi)?`<small>${esc(wrongOf(q,oi))}</small>`:""}</button>`}).join("")}</div>
   ${fin?`<div class="fb ${ok?"good":"wrong"}"><strong>${ok?"Juste.":"Pas tout à fait."}</strong> ${esc(q.ex)} ${pg(q.p,q.ch)}</div>
     ${!ok?`<div><span class="small muted">D'où vient l'erreur ?</span><div class="row">${["Connaissance","Lecture de l'énoncé","Raisonnement","Confusion entre notions"].map(t=>`<button class="chip" data-errty="${esc(t)}" aria-pressed="${QZ.ety===t}">${esc(t)}</button>`).join("")}</div></div>`:""}
     <div class="row"><button class="btn pri" id="nextq">${QZ.i+1<QZ.list.length?"Question suivante":"Voir le bilan"}</button><button class="btn" data-n="${q.n}">Revoir la notion</button><button class="btn" id="explainq">Pourquoi ? Demande au professeur</button></div>`
   :`<div><span class="small muted">Quelle est ta certitude ?</span><div class="row">${[["s","Sûr"],["m","Hésitant"],["g","Au hasard"]].map(([k,t])=>`<button class="chip" data-conf="${k}" aria-pressed="${QZ.conf===k}">${t}</button>`).join("")}</div></div><div class="row"><button class="btn pri" id="valq" ${QZ.pick==null||!QZ.conf?"disabled":""}>Valider</button></div>`}
  </section></div>`;
  $("#quit").onclick=()=>go("train");
  $$("[data-opt]",el).forEach(b=>b.onclick=()=>{QZ.pick=+b.dataset.opt;vRun(el)});
  $$("[data-conf]",el).forEach(b=>b.onclick=()=>{QZ.conf=b.dataset.conf;vRun(el)});
  $$("[data-errty]",el).forEach(b=>b.onclick=()=>{QZ.ety=b.dataset.errty;const e=S.errs[S.errs.length-1];if(e&&e.q===q.i)e.ty=QZ.ety;save();vRun(el)});
  const val=$("#valq");if(val)val.onclick=()=>{const k=QZ.pick===q.a;QZ.done=true;QZ.res.push({q:q.i,ok:k,conf:QZ.conf});
    const st=S.q[q.i]||(S.q[q.i]={a:0,ok:0,t:0});st.a++;st.ok+=k?1:0;st.t=Date.now();
    S.cal[QZ.conf][0]++;S.cal[QZ.conf][1]+=k?1:0;
    learn(q.n,k?{s:.18,m:.11,g:.04}[QZ.conf]:{s:-.22,m:-.12,g:-.05}[QZ.conf]);
    if(!k){S.errs.push({q:q.i,t:Date.now(),conf:QZ.conf});if(S.errs.length>300)S.errs.shift()}
    save();vRun(el)};
  const nx=$("#nextq");if(nx)nx.onclick=()=>{QZ.i++;QZ.pick=null;QZ.conf=null;QZ.done=false;QZ.ety=null;vRun(el);window.scrollTo(0,0)};
  const ex=$("#explainq");if(ex)ex.onclick=()=>go("prof",{seed:`J'ai répondu « ${q.o[QZ.pick]} » à cette question : « ${q.q} » La bonne réponse est « ${q.o[q.a]} ». Explique-moi où mon raisonnement peut se tromper, puis pose-moi une question pour vérifier.`,focus:q.n});
}
const wrongOf=(q,oi)=>{const others=q.o.map((_,i)=>i).filter(i=>i!==q.a);const pos=others.indexOf(oi);return q.wrong?q.wrong[pos]:null};
function renderExamQ(el,q){
  const left=Math.max(0,Math.round((QZ.end-Date.now())/1000)),perm=permOf(q),answered=Object.keys(QZ.ans).length;
  el.innerHTML=`<div class="narrow"><div class="between"><span class="eyebrow">Examen blanc · ${QZ.i+1} / ${QZ.list.length}</span><span class="mono" id="clock" style="font-weight:600">${fmtT(left)}</span></div><div class="prog"><i style="width:${answered/QZ.list.length*100}%"></i></div>
  <section class="card"><p style="font:700 19px/1.35 var(--display)">${esc(q.q)}</p><div style="display:flex;flex-direction:column;gap:8px">${perm.map(oi=>`<button class="opt ${QZ.ans[q.i]===oi?"sel":""}" data-opt="${oi}">${esc(q.o[oi])}</button>`).join("")}</div>
  <div class="between"><div class="row"><button class="btn" id="pv" ${QZ.i?"":"disabled"}>Précédente</button><button class="btn" id="nx" ${QZ.i+1<QZ.list.length?"":"disabled"}>Suivante</button></div><button class="btn pri" id="endx">Terminer (${answered} répondues)</button></div></section>
  <p class="small muted">Rythme de 72 s par question, calculé à partir des 200 questions en 4 h de l'AFK. Banque construite à partir du livre : ce n'est ni un sujet ni un format officiels.</p></div>`;
  $$("[data-opt]",el).forEach(b=>b.onclick=()=>{QZ.ans[q.i]=+b.dataset.opt;if(QZ.i+1<QZ.list.length)QZ.i++;vRun(el)});
  $("#pv").onclick=()=>{QZ.i--;vRun(el)};$("#nx").onclick=()=>{QZ.i++;vRun(el)};$("#endx").onclick=finishExam;
  clearInterval(QZ.tm);QZ.tm=setInterval(()=>{const c=$("#clock");if(!c||curView!=="run"){clearInterval(QZ.tm);return}const l=Math.round((QZ.end-Date.now())/1000);c.textContent=fmtT(Math.max(0,l));if(l<=0)finishExam()},1000);
}
const fmtT=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
function finishExam(){clearInterval(QZ.tm);QZ.res=QZ.list.map(i=>{const q=Q[i],k=QZ.ans[i]===q.a;const st=S.q[i]||(S.q[i]={a:0,ok:0,t:0});st.a++;st.ok+=k?1:0;st.t=Date.now();learn(q.n,k?.08:-.1);if(!k)S.errs.push({q:i,t:Date.now(),conf:"m"});return {q:i,ok:k}});
  const score=Math.round(QZ.res.filter(r=>r.ok).length/QZ.res.length*100);S.exams.push({t:Date.now(),score});save();QZ.finished=true;route()}
function renderResult(el){
  const r=QZ.res,n=r.length,ok=r.filter(x=>x.ok).length,pc=n?Math.round(ok/n*100):0;
  if(QZ.sess!=null&&!QZ.saved){S.sess[QZ.sess]={score:pc,t:Date.now()};QZ.saved=true;save()}
  if(QZ.place&&!QZ.saved){S.place={score:pc,t:Date.now()};QZ.saved=true;save()}
  const byCh={};r.forEach(x=>{const c=Q[x.q].ch;(byCh[c]=byCh[c]||[0,0])[0]++;if(x.ok)byCh[c][1]++});
  const wrong=r.filter(x=>!x.ok).map(x=>Q[x.q]);
  el.innerHTML=`<div class="narrow"><header class="card"><span class="eyebrow">${esc(QZ.title)}</span><h1 class="mono">${ok} / ${n} · ${pc} %</h1><p class="muted">${pc>=80?"Solide. Augmente la difficulté ou mélange les chapitres.":pc>=50?"Base présente. Reprends d'abord les erreurs ci-dessous.":"Reprends les notions d'abord, puis reviens au test demain."}</p></header>
  <section class="card"><h2>Par chapitre</h2>${Object.entries(byCh).map(([c,[a,o]])=>`<div class="hbar"><span>${chLab(+c)}</span>${meter(o/a)}<span class="val">${o}/${a}</span></div>`).join("")}</section>
  ${wrong.length?`<section class="card"><h2>À reprendre</h2>${wrong.map(q=>`<div class="fb"><p><strong>${esc(q.q)}</strong></p><p class="small">Réponse : ${esc(q.o[q.a])}. ${esc(q.ex)} ${pg(q.p,q.ch)}</p><button class="btn sm" data-n="${q.n}">Revoir la notion</button></div>`).join("")}</section>`:""}
  <div class="row"><button class="btn pri" data-go="today">Retour au tableau de bord</button><button class="btn" data-go="train">Autre entraînement</button></div></div>`}
/* ---------- entraînement ---------- */
function vTrain(el){const due=dueCards().length,nw=newCards().length,errs=[...new Set(S.errs.map(e=>e.q))];
  el.innerHTML=`<div class="wrap"><header><h1>Entraînement</h1><p class="lead">Chaque mode répond à un besoin différent. Commence par celui que le temps disponible te permet.</p></header>
  <div class="grid2">
   <section class="card"><span class="eyebrow">10 questions</span><h2>QCM adaptatif</h2><p class="muted">Les questions visent tes notions les moins solides, au niveau adapté. Ta certitude est prise en compte.</p><div class="row"><select id="tch" aria-label="Chapitre"><option value="">Tous les chapitres</option>${C.map(c=>`<option value="${c.ch}">${chLab(c.ch)}, ${esc(c.title)}</option>`).join("")}</select><button class="btn pri" id="tgo">Commencer</button></div></section>
   <section class="card"><span class="eyebrow">5 minutes</span><h2>Révision rapide</h2><p class="muted">Cartes dues d'abord, puis questions sur tes points faibles.</p><div class="row"><button class="btn pri" data-quick="1">Lancer</button></div></section>
   <section class="card"><span class="eyebrow">${due} dues · ${nw} nouvelles</span><h2>Cartes à répétition espacée</h2><p class="muted">L'intervalle s'allonge selon ta réussite, pour revoir au moment utile.</p><div class="row"><button class="btn pri" data-flash="1" ${due+nw?"":"disabled"}>Réviser</button>${due+nw?"":`<span class="small muted">Étudie une notion pour débloquer ses cartes.</span>`}</div></section>
   <section class="card"><span class="eyebrow">40 questions · 48 min</span><h2>Examen blanc</h2><p class="muted">Sans correction ni indice jusqu'à la fin, au rythme de l'AFK.</p><div class="row"><button class="btn pri" id="exgo">Commencer</button>${S.exams.length?`<span class="small muted">Dernier score : ${S.exams[S.exams.length-1].score} %</span>`:""}</div></section>
   <section class="card"><span class="eyebrow">${errs.length} questions</span><h2>Mes erreurs</h2><p class="muted">Refais les questions manquées, dans un autre ordre.</p><div class="row"><button class="btn pri" id="ergo" ${errs.length?"":"disabled"}>Refaire</button></div></section>
   <section class="card"><span class="eyebrow">Niveau 3 et plus</span><h2>Sans filet</h2><p class="muted">Seulement les questions de raisonnement, tous chapitres mélangés.</p><div class="row"><button class="btn pri" id="hard">Commencer</button></div></section>
  </div></div>`;
  $("#tgo").onclick=()=>startAdaptive($("#tch").value);$("#exgo").onclick=startExam;
  $("#ergo").onclick=()=>startQuiz({title:"Mes erreurs",list:shuffle(errs).slice(0,15)});
  $("#hard").onclick=()=>startQuiz({title:"Sans filet",list:shuffle(Q.filter(q=>q.lv>=3).map(q=>q.i)).slice(0,12)});
}
let FL=null;
function startFlash(limit){const d=shuffle(dueCards()),n=newCards().slice(0,Math.max(0,20-d.length));const list=[...d,...n].slice(0,limit||30);if(!list.length){toast("Étudie d'abord une notion : ses cartes seront débloquées.");return false}FL={list,i:0,show:false,then:null};go("flash");return true}
function quick(){const d=dueCards();if(d.length||newCards().length){startFlash(8);FL.then=()=>{const ex=new Set(),list=[];for(let k=0;k<4;k++){const i=pickAdaptive(null,ex);if(i==null)break;ex.add(i);list.push(i)}startQuiz({title:"Révision rapide",list})}}else{const ex=new Set(),list=[];for(let k=0;k<6;k++){const i=pickAdaptive(null,ex);if(i==null)break;ex.add(i);list.push(i)}startQuiz({title:"Révision rapide",list})}}
function vFlash(el){if(!FL)return go("train");const k=FL.list[FL.i];
  if(!k){const t=FL.then;FL=null;if(t)return t();toast("Cartes terminées");return go("train")}
  const [id,ix]=k.split("#"),n=N[id],[q,a]=n.f[+ix];
  el.innerHTML=`<div class="narrow"><div class="between"><span class="eyebrow">Carte ${FL.i+1} / ${FL.list.length}</span><button class="btn sm" data-go="train">Quitter</button></div><div class="prog"><i style="width:${FL.i/FL.list.length*100}%"></i></div>
  <section class="card flash"><span class="row" style="justify-content:center">${modBadge(n.ch)}${pg(n.p,n.ch)}</span><p class="q">${esc(q)}</p>${FL.show?`<p style="font-size:18px">${esc(a)}</p>`:""}</section>
  ${FL.show?`<div class="row" style="justify-content:center">${["À revoir","Difficile","Bien","Facile"].map((t,g)=>`<button class="btn ${g===2?"pri":""}" data-g="${g}">${t}</button>`).join("")}</div>`:`<div class="row" style="justify-content:center"><button class="btn pri" id="show">Voir la réponse</button></div>`}
  <p class="small muted" style="text-align:center"><button class="chip" data-n="${n.id}">Notion : ${esc(n.t)}</button></p></div>`;
  const sh=$("#show");if(sh)sh.onclick=()=>{FL.show=true;vFlash(el)};
  $$("[data-g]",el).forEach(b=>b.onclick=()=>{gradeCard(k,+b.dataset.g);FL.i++;FL.show=false;vFlash(el);renderNav()});
}
/* ---------- atlas ---------- */
const CMP=[
{t:"Appareils orthopédiques",h:["Appareil","Cible","Force ou port","Limite ou contre-indication","Page"],r:[
["Activateur d'Andresen","Classe II secondaire, mandibulaire ou mixte","12-14 h/jour","Effet tiroir ; DDM, incisives mandibulaires vestibuloversées","101-107"],
["Bielle de Herbst","Propulsion continue","Initiale 3-4 mm, tubes 2-3 mm / 6 semaines","Décompenser avant ; effets dento-alvéolaires","106-107"],
["FEO sur gouttière","Classe II secondaire à prédominance maxillaire","400-1000 g, voire 1500 g, 12 h/24","Sans DDM ; normo- ou hypodivergence","109"],
["Activateur classe III","Prognathie secondaire, proglissement","Réglage limité","Béance : contre-indiqué","107-108"],
["Masque de Delaire","Rétrognathie, rétro-alvéolie maxillaires","800-1500 g, 12-14 h/jour","Effet tiroir ; direction en bas et en avant","109-111"]]},
{t:"Fils et phases",h:["Fil","Propriétés clés","Usage","Limite","Page"],r:[
["Acier monobrin","Rigide, friction faible","Rétraction, ancrage, stabilisation","Peu adapté à l'alignement","135"],
["Acier multibrin","Très flexible","Alignement, fortes dystopies","Friction élevée, plaque","135"],
["TMA (bêta-titane)","Module intermédiaire, façonnable","Presque toutes les phases, finition","Friction élevée","135"],
["Nitinol","Martensitique, sans superélasticité","Alignement, arc préformé","Ni façonnable ni soudable au cabinet","137"],
["NiTi chinois","Austénitique, superélastique","Alignement, torque précoce en rectangulaire","Selon fabrication","137"],
["NiTi japonais","Superélastique, mémoire de forme","Alignement, rendez-vous espacés","Selon température","137"],
["Copper NiTi","Forces plus constantes, 15 à 40 °C","Patients sensibles ou parodonte affaibli (type IV)","Selon type","137"]]},
{t:"Extractions de prémolaires",h:["Choix","Effet principal","Indication typique","Page"],r:[
["14, 24, 34, 44","Grande rétraction incisive","Encombrement antérieur, pro-alvéolie, profil à réduire","153"],
["15, 25, 35, 45","Plus de mésialisation","Encombrement moindre, repositionnement limité, profil concave","153"],
["14, 24, 35, 45","Rétraction maxillaire, mésialisation mandibulaire","Classe II occlusale ; décompensation de classe III","153"],
["15, 25, 34, 44","Mésialisation maxillaire, rétraction mandibulaire","Rattrapage de classe III ; décompensation de classe II","153"],
["14, 24 seules","Classe I canine, classe II molaire","Classe II thérapeutique, moins stable","154"]]},
{t:"Articulation : grades",h:["Stade","Bruit","Douleur","Mouvement","Page"],r:[
["Grade 1","Claquement très précoce","Non","Normal","72"],
["Grade 2","Claquement réciproque","Possible","Déviation (baïonnette)","72"],
["Grade 3 aigu","Non","À l'ouverture","Ouverture et translations réduites","72"],
["Grade 3 chronique","Non","Non","Amples mais non rectilignes","72"],
["Collage","Aller et retour au même niveau","Non","Ressaut du côté atteint","72"],
["Grade 4","Crépitations","Par périodes","Limitation variable","72"]]},
{t:"Normes céphalométriques",h:["Mesure","Norme du livre","Ce qu'elle décrit","Page"],r:[
["SNA","82° ± 2°","Position du maxillaire","27"],["SNB","80° ± 2°","Position de la mandibule","27"],["ANB","2° ± 2°","Décalage maxillomandibulaire","27"],["AoBo","0 mm ± 2 mm","Décalage sur le plan d'occlusion","27"],
["FMA","25° ± 3° ou 26° ± 3°","Inclinaison mandibulaire","28"],["GoGn/SN","32° ± 5°","Inclinaison mandibulaire","28"],["Angle goniaque","126,4° ± 5,4°","Forme de la mandibule","28"],["Axe facial","90° ± 3°","Direction générale de croissance","28"],
["I/NA","22° ± 2°","Orientation de l'incisive maxillaire","29"],["i/NB","25° ± 2°","Orientation de l'incisive mandibulaire","29"],["IMPA","85-92°","Incisive sur plan mandibulaire","29"],["Interincisif","130-135° ± 5°","Selon l'analyse","29"]]},
{t:"Contention",h:["Dispositif","Point fort","Limite","Page"],r:[
["Plaque de Hawley","Semi-passive, petits diastèmes","Coopération","235"],["Plaque de Sved","Contient une supraclusion","Indication ciblée","236"],["Plaque d'Eschler","Classes III","Indication ciblée","236"],
["Gouttière thermoformée","Discrète, fixe la dent","Peu de calage naturel, béances possibles","237"],["Fil 3-3","Distance intercanine","Contrôle mal les dérotations incisives","237"],["Fil sur 6 dents","Contrôle mieux les rotations","Décollement parfois inaperçu, plaque","238"]]}
,{t:"Tome 2 : classe II, que choisir ?",h:["Option","Situation favorable","Point de vigilance","Page"],r:[
["Sans extraction","Pas de grand besoin antérieur mandibulaire, croissance utile","Recul maxillaire et ancrage","T2:38, T2:40-45"],
["14-24","Classe I canine, classe II molaire terminale, pas d'extraction mandibulaire","Ancrage molaire et torque incisif","T2:45-49"],
["14-24-35-45","Problèmes antérieurs modérés, besoin de mésialiser les molaires","Ancrage selon le secteur","T2:49-52"],
["14-24-34-44","Grand manque de place antérieur","Risque de rétraction et d'esthétique","T2:49-52"],
["Chirurgie","Décalage au-delà d'une compensation stable, ou profil dégradé","Normaliser les axes incisifs avant","T2:56-61"]]},
{t:"Tome 2 : élargir le maxillaire",h:["Moyen","Mécanisme","Quand","Limite","Page"],r:[
["Plaque palatine","Expansion surtout alvéolaire, lente","Enfant coopérant","Deux fois plus lente que le quad-hélix","T2:172"],
["Quad-hélix","Expansion et dérotation molaire","Denture temporaire ou mixte","Effet orthopédique limité en denture permanente","T2:172-177"],
["Disjonction rapide","Ouverture de la suture","Endognathie, avant ou à la poussée pubertaire","Récidive, résorption sur dents d'appui","T2:178-188"],
["Disjonction assistée","Libération chirurgicale des résistances","Fin de croissance, plus de 5 mm chez l'adulte","Récidive de 5 à 25 %, contention environ 6 mois","T2:188-189"]]},
{t:"Tome 2 : latérodéviation ou latérognathie ?",h:["Forme","Menton au repos","Menton en occlusion","Chemin de fermeture","Page"],r:[
["Asymétrie dentaire","Centré","Centré, milieu dévié","Sans déviation mandibulaire","T2:203, T2:205"],
["Latérodéviation","Centré","Dévié","Dévié à partir du premier contact","T2:203-205"],
["Latérognathie","Dévié","Dévié, milieu aligné sur lui","Rectiligne","T2:203-205"]]},
{t:"Tome 2 : extractions pilotées",h:["Méthode","Ordre","Point de vigilance","Page"],r:[
["Tweed","Premières molaires temporaires vers 8 ans, puis premières prémolaires et canines temporaires","Attendre la moitié de la racine de la dent permanente","T2:237-239"],
["Hotz","Canines temporaires, premières molaires temporaires, puis premières prémolaires","Recul incisif de 1-2 mm, recouvrement accru, dérive molaire","T2:237-239"]]},
{t:"Tome 2 : agénésie de latérale",h:["Critère","Substitution favorisée","Remplacement favorisé","Page"],r:[
["Squelette","Prognathie maxillaire, hyperdivergence","Classe III, rétrognathie mandibulaire, hypodivergence","T2:271-272"],
["Profil","Convexe, angle nasolabial fermé","Nez long, angle nasolabial ouvert","T2:271-272"],
["Espace","DDM par excès, biproalvéolie","Beaucoup de place","T2:271-272"],
["Occlusion","Rétraction ou extractions utiles","Bout à bout incisif, risque articulaire","T2:271-272"]]}];
function vAtlas(el){
  const tab=ctx.tab||"n";
  el.innerHTML=`<div class="wrap"><header><h1>Atlas</h1><p class="lead">Retrouve chaque notion, chaque terme et chaque source. Les pages citées ouvrent le livre.</p></header>
  <div class="tabs" role="tablist">${[["n","Notions"],["g","Glossaire français-anglais"],["c","Comparateurs"],["x","Chapitres"]].map(([k,t])=>`<button role="tab" aria-selected="${tab===k}" data-tab="${k}">${t}</button>`).join("")}</div><div id="atlasBody" style="display:flex;flex-direction:column;gap:14px"></div></div>`;
  $$("[data-tab]",el).forEach(b=>b.onclick=()=>{ctx.tab=b.dataset.tab;vAtlas(el)});
  const body=$("#atlasBody");
  if(tab==="n"){body.innerHTML=`<div class="row"><input id="q" type="search" placeholder="Chercher : hyalinisation, FMA, contention…" style="flex:1;min-width:220px" value="${esc(ctx.q||"")}" aria-label="Rechercher une notion"><select id="fch" aria-label="Filtrer par chapitre"><option value="">Tous</option>${C.map(c=>`<option value="${c.ch}" ${String(ctx.ch)===String(c.ch)?"selected":""}>${chLab(c.ch)}</option>`).join("")}</select><select id="flv" aria-label="Filtrer par niveau"><option value="">Tout niveau</option><option value="weak" ${ctx.lv==="weak"?"selected":""}>Fragiles</option><option value="no" ${ctx.lv==="no"?"selected":""}>Pas encore vues</option><option value="p3" ${ctx.lv==="p3"?"selected":""}>Priorité ●●●</option></select></div><div id="res"></div>`;
    const draw=()=>{const qq=norm(ctx.q||""),out=NL.filter(n=>(!ctx.ch||n.ch===+ctx.ch)&&(!ctx.lv||(ctx.lv==="weak"?(M(n.id)>0&&M(n.id)<.45):ctx.lv==="no"?!seen(n.id):n.prio===3))&&(!qq||norm(n.t+" "+n.s+" "+n.d+" "+(n.en||[]).join(" ")).includes(qq)));$("#res").innerHTML=`<p class="small muted">${out.length} notion${out.length>1?"s":""}</p><div class="nlist">${out.map(nitem).join("")}</div>`};
    $("#q").oninput=e=>{ctx.q=e.target.value;draw()};$("#fch").onchange=e=>{ctx.ch=e.target.value;draw()};$("#flv").onchange=e=>{ctx.lv=e.target.value;draw()};draw();}
  else if(tab==="g"){const rows=[];NL.forEach(n=>(n.en||[]).forEach(e=>rows.push([e,n])));rows.sort((a,b)=>a[0].localeCompare(b[0]));
    body.innerHTML=`<p class="small muted">Les termes anglais sont un ajout hors livre pour préparer le NDEB. La notion associée reste issue du livre.</p><input id="gq" type="search" placeholder="Chercher un terme" aria-label="Chercher un terme"><div class="scrollx card" style="padding:0"><table class="t"><thead><tr><th>Anglais</th><th>Notion</th><th>Ch.</th><th>Page</th></tr></thead><tbody id="gb"></tbody></table></div>`;
    const dr=v=>{const q=norm(v);$("#gb").innerHTML=rows.filter(([e,n])=>!q||norm(e+" "+n.t).includes(q)).map(([e,n])=>`<tr><td class="mono">${esc(e)}</td><td><button class="chip" data-n="${n.id}">${esc(n.t)}</button></td><td>${chLab(n.ch)}</td><td>${pg(n.p.split(",")[0],n.ch)}</td></tr>`).join("")};$("#gq").oninput=e=>dr(e.target.value);dr("");}
  else if(tab==="c"){body.innerHTML=CMP.map(t=>`<section class="card"><h2>${esc(t.t)}</h2><div class="scrollx"><table class="t"><thead><tr>${t.h.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${t.r.map(r=>`<tr>${r.map((c,i)=>`<td>${i===r.length-1?pg(c):esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`).join("")}
  else{body.innerHTML=`<div class="nlist">${C.map(c=>`<section class="card"><div class="row">${modBadge(c.ch)}<span class="badge">Partie ${c.part}</span>${pg(c.pages,c.ch)}</div><h3>${esc(c.title)}</h3><p class="small muted">${esc(c.pitch||"")}</p><p class="small mono">${c.notions.length} notions · ${c.qcm.length} QCM</p>${meter(chM(c.ch))}<div class="row"><button class="btn sm" data-chf="${c.ch}">Voir les notions</button></div></section>`).join("")}</div>`}
}
const norm=s=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
/* ---------- carte ---------- */
let LAY=null;
function layout(){if(LAY)return LAY;const W=1100,H=1120,cx=[[200,195],[560,190],[925,205],[730,575],[285,580],[290,930],[800,930]],cnt=[0,0,0,0,0,0,0],P=[];
  [...NL].sort((x,y)=>x.ch-y.ch).forEach(n=>{const m=MOD[n.ch],i=cnt[m]++,r=25*Math.sqrt(i+.5),t=i*2.39996;P.push({id:n.id,n,x:clamp(cx[m][0]+r*Math.cos(t),24,W-24),y:clamp(cx[m][1]+r*Math.sin(t),24,H-24)})});
  const I=Object.fromEntries(P.map((p,i)=>[p.id,i])),E=[],seenE=new Set();
  NL.forEach(n=>n.links.forEach(l=>{if(!N[l])return;const k=[n.id,l].sort().join("|");if(seenE.has(k))return;seenE.add(k);E.push([I[n.id],I[l]])}));
  return LAY={W,H,P,E,I,cx}}
function vCarte(el){const L=layout(),ch=ctx.chain;
  el.innerHTML=`<div class="wrap"><header><h1>Carte des liens</h1><p class="lead">Le livre compte peu de renvois explicites. Cette carte rend visibles les liens entre chapitres. Chaque lien est une proposition pédagogique à vérifier dans les pages citées.</p></header>
  <div class="legend">${X.plan.map((m,i)=>`<span style="--c:var(--m${i})">${esc(m.m)}</span>`).join("")}<span class="muted">Taille du point : maîtrise</span></div>
  <div id="mapwrap"><svg id="map" viewBox="0 0 ${L.W} ${L.H}" role="img" aria-label="Carte des ${NL.length} notions reliées entre elles. Les chaînes de raisonnement ci-dessous donnent les mêmes liens sous forme de liste."></svg></div>
  <p class="small muted" id="mapInfo">Survole ou touche un point pour voir ses liens. Un second appui ouvre la notion.</p>
  <section class="card"><h2>Chaînes de raisonnement</h2><p class="small muted">Elles suivent une même idée à travers plusieurs chapitres.</p><div class="nlist">${X.chains.map((c,i)=>`<button class="nitem" data-chain="${i}" ${ch===i?'style="border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)"':""}><strong>${esc(c.t)}</strong><span class="sum">${esc(c.why)}</span></button>`).join("")}</div>
  ${ch!=null?`<ol style="margin:0;padding-left:22px;display:flex;flex-direction:column;gap:6px">${X.chains[ch].ids.map(i=>`<li><button class="chip" data-n="${i}">${chLab(N[i].ch)} · ${esc(N[i].t)}</button> <span class="small muted">${esc(N[i].s)}</span></li>`).join("")}</ol><div class="row"><button class="btn" id="chq">Me tester sur cette chaîne</button><button class="btn" id="chp">Demander au professeur de relier ces notions</button></div>`:""}</section></div>`;
  const svg=$("#map"),setIds=ch!=null?new Set(X.chains[ch].ids):null,chainE=new Set();if(ch!=null){const a=X.chains[ch].ids;for(let i=0;i<a.length-1;i++)chainE.add(a[i]+"|"+a[i+1])}
  let lines=L.E.map(([u,v])=>{const a=L.P[u],b=L.P[v];return `<line class="e ${MOD[a.n.ch]!==MOD[b.n.ch]?"x":""}" data-a="${a.id}" data-b="${b.id}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`}).join("");
  if(ch!=null){const a=X.chains[ch].ids;for(let i=0;i<a.length-1;i++){const p=L.P[L.I[a[i]]],q=L.P[L.I[a[i+1]]];lines+=`<line class="e on" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>`}}
  const nodes=L.P.map(p=>{const r=5+M(p.id)*7,lab=setIds&&setIds.has(p.id);return `<g class="nd ${setIds&&!lab?"dim":""}" data-id="${p.id}" transform="translate(${p.x},${p.y})" tabindex="0" role="button" aria-label="${esc(p.n.t)}"><circle r="${r}" style="fill:var(--m${MOD[p.n.ch]})"><title>${esc(p.n.t)} (ch. ${p.n.ch}, ${Math.round(M(p.id)*100)} %)</title></circle>${lab?`<text x="${r+4}" y="4">${esc(p.n.t)}</text>`:""}</g>`}).join("");
  const titles=X.plan.map((m,i)=>`<text x="${L.cx[i][0]}" y="${L.cx[i][1]-178}" text-anchor="middle" style="font:700 15px var(--display);fill:var(--m${i})">${esc(m.m)}</text>`).join("");svg.innerHTML=lines+titles+nodes;let sel=null;
  const focus=id=>{sel=id;const nb=new Set([id]);L.E.forEach(([u,v])=>{const a=L.P[u].id,b=L.P[v].id;if(a===id)nb.add(b);if(b===id)nb.add(a)});$$(".nd",svg).forEach(g=>{g.classList.toggle("dim",!nb.has(g.dataset.id))});$$(".e[data-a]",svg).forEach(l=>{const on=l.dataset.a===id||l.dataset.b===id;l.classList.toggle("act",on)});const n=N[id];$("#mapInfo").innerHTML=`<strong>${esc(n.t)}</strong> · ${chLab(n.ch)} · ${[...nb].length-1} lien(s). Appuie encore pour ouvrir.`};
  $$(".nd",svg).forEach(g=>{g.addEventListener("mouseenter",()=>focus(g.dataset.id));g.addEventListener("click",()=>{if(sel===g.dataset.id||window.matchMedia("(hover:hover)").matches)go("notion",{id:g.dataset.id});else focus(g.dataset.id)});g.addEventListener("keydown",e=>{if(e.key==="Enter")go("notion",{id:g.dataset.id})})});
  $$("[data-chain]",el).forEach(b=>b.onclick=()=>{ctx.chain=+b.dataset.chain;vCarte(el)});
  const cq=$("#chq");if(cq)cq.onclick=()=>{const ids=X.chains[ch].ids;startQuiz({title:"Chaîne : "+X.chains[ch].t,list:shuffle(Q.filter(q=>ids.includes(q.n)).map(q=>q.i)).slice(0,8)})};
  const cp=$("#chp");if(cp)cp.onclick=()=>go("prof",{seed:`Relie ces notions du livre en un seul raisonnement clinique, puis pose-moi un petit cas pour vérifier : ${X.chains[ch].ids.map(i=>N[i].t).join(" → ")}.`,focus:X.chains[ch].ids[0],extra:X.chains[ch].ids});
}
/* ---------- cas ---------- */
function vCas(el){el.innerHTML=`<div class="wrap"><header><h1>Cas cliniques</h1><p class="lead">Cas inventés pour s'entraîner. Le raisonnement renvoie aux pages du livre, sans reproduire ses patients. Chaque choix a une conséquence expliquée.</p></header>
  <div class="nlist">${X.cases.map(k=>{const st=S.cases[k.id];return `<button class="nitem" data-case="${k.id}"><span class="row"><span class="badge">Niveau ${k.lv}</span>${k.tags.map(t=>`<span class="badge">${esc(t)}</span>`).join("")}${st?`<span class="badge">Meilleur ${st.best} %</span>`:""}</span><strong>${esc(k.t)}</strong><span class="sum">${esc(k.intro)}</span></button>`}).join("")}</div></div>`}
function vCasePlay(el){const k=X.cases.find(x=>x.id===ctx.id);if(!k)return go("cas");ctx.i=ctx.i||0;ctx.ans=ctx.ans||[];const i=ctx.i,done=i>=k.steps.length;
  if(done){const ok=ctx.ans.filter(a=>a.ok).length,pc=Math.round(ok/k.steps.length*100);S.cases[k.id]={best:Math.max(pc,(S.cases[k.id]||{}).best||0),t:Date.now()};if(!ctx.saved){ctx.saved=true;tick();save()}
    el.innerHTML=`<div class="narrow"><header class="card"><span class="eyebrow">Bilan du cas</span><h1>${esc(k.t)}</h1><p class="mono" style="font-size:22px">${ok} / ${k.steps.length} décisions justes</p><p style="font-size:18px">${esc(k.end)}</p></header>
    <section class="card"><h3>Explique ton raisonnement</h3><textarea id="crep" placeholder="Résume ta démarche en quatre phrases."></textarea><div class="row"><button class="btn pri" id="caskp">Faire corriger par le professeur</button><button class="btn" data-go="cas">Autres cas</button></div></section></div>`;
    $("#caskp").onclick=()=>go("prof",{seed:`Voici mon raisonnement pour un cas d'entraînement. Évalue-le et pose une question de relance.\nCas : ${k.intro}\nMon raisonnement : ${$("#crep").value}`,focus:null,chs:k.ch});return}
  const s=k.steps[i],a=ctx.ans[i];ctx.perm=ctx.perm||{};const perm=ctx.perm[i]||(ctx.perm[i]=shuffle(s.o.map((_,x)=>x)));
  el.innerHTML=`<div class="narrow"><div class="between"><span class="eyebrow">${esc(k.t)} · décision ${i+1} / ${k.steps.length}</span><button class="btn sm" data-go="cas">Quitter</button></div><div class="prog"><i style="width:${i/k.steps.length*100}%"></i></div>
  ${i===0?`<p class="lead">${esc(k.intro)}</p>`:""}<section class="card"><p style="font-size:18px">${esc(s.s)}</p><h3>${esc(s.q)}</h3><div style="display:flex;flex-direction:column;gap:8px">${perm.map(x=>{const o=s.o[x];let c="";if(a){if(o[1])c="good";else if(a.x===x)c="wrong"}return `<button class="opt ${c}" data-co="${x}" ${a?"disabled":""}>${esc(o[0])}${a&&(a.x===x||o[1])?`<small>${esc(o[2])}</small>`:""}</button>`}).join("")}</div>
  ${a?`<div class="between"><span>${pg(s.p)}</span><button class="btn pri" id="cnx">${i+1<k.steps.length?"Suite du cas":"Voir le bilan"}</button></div>`:""}</section></div>`;
  $$("[data-co]",el).forEach(b=>b.onclick=()=>{const x=+b.dataset.co;ctx.ans[i]={x,ok:!!s.o[x][1]};vCasePlay(el)});
  const nx=$("#cnx");if(nx)nx.onclick=()=>{ctx.i++;vCasePlay(el);window.scrollTo(0,0)};
}
/* ---------- labo ---------- */
const TOOLS=[["ceph","Céphalométrie"],["force","Force et zone hyaline"],["mom","Moment et mouvement"],["fil","Rigidité du fil"],["feo","Réglage FEO"],["esp","Bilan d'espace"],["mat","Maturation"],["bol","Bolton"]];
function vLabo(el){const t=ctx.tool||"ceph";el.innerHTML=`<div class="wrap"><header><h1>Labo</h1><p class="lead">Fais varier les paramètres et observe la décision changer. Les calculs reprennent les formules et normes du livre. Les schémas sont simplifiés.</p></header><div class="tabs" role="tablist">${TOOLS.map(([k,v])=>`<button role="tab" aria-selected="${k===t}" data-tool="${k}">${v}</button>`).join("")}</div><div id="tool"></div></div>`;
  $$("[data-tool]",el).forEach(b=>b.onclick=()=>{ctx.tool=b.dataset.tool;vLabo(el)});({ceph:tCeph,force:tForce,mom:tMom,fil:tFil,feo:tFeo,esp:tEsp,mat:tMat,bol:tBol})[t]($("#tool"))}
const slider=(id,label,min,max,val,step=1,unit="")=>`<label for="${id}"><span class="between"><span>${label}</span><span class="mono" id="${id}V">${val}${unit}</span></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
function bind(ids,fn,units={}){ids.forEach(i=>{const e=$("#"+i);e.oninput=()=>{const v=$("#"+i+"V");if(v)v.textContent=e.value+(units[i]||"");fn()}});fn()}
const v=i=>+$("#"+i).value;
function tCeph(el){el.innerHTML=`<div class="grid2"><section class="card"><h2>Lire un patient</h2><div class="row"><button class="btn sm" data-pre="82,80,25,22,25">Norme</button><button class="btn sm" data-pre="81,75,33,28,32">Classe II, mandibule en retrait</button><button class="btn sm" data-pre="78,83,28,30,18">Classe III compensée</button><button class="btn sm" data-pre="84,80,20,14,26">Hypodivergent</button></div>
  ${slider("sna","SNA",70,92,82,1,"°")}${slider("snb","SNB",68,92,80,1,"°")}${slider("fma","FMA",12,45,25,1,"°")}${slider("ina","I/NA",5,40,22,1,"°")}${slider("inb","i/NB",5,45,25,1,"°")}
  <svg id="cephS" viewBox="0 0 320 250" role="img" aria-label="Schéma des angles" style="max-width:100%"></svg><p class="small muted">Schéma géométrique, non anatomique.</p></section>
  <section class="card"><h2>Interprétation</h2><div id="cephO" style="display:flex;flex-direction:column;gap:8px"></div><p>${pg("27-29")}</p>${fmt("{R:Ces règles simples servent à l'entraînement. Un chiffre hors norme ouvre une question : on le croise avec la clinique, les autres mesures et les limites des normes.}")}</section></div>`;
  const draw=()=>{const a=v("sna"),b=v("snb"),f=v("fma"),i=v("ina"),j=v("inb"),anb=a-b;const msg=[];
    const st=(x,n,e)=>Math.abs(x-n)<=e?"dans la norme":x>n?"au-dessus":"au-dessous";
    msg.push(`<strong class="mono">ANB ${anb}°</strong> : ${anb>4?"oriente vers un décalage de classe II":anb<0?"oriente vers un décalage de classe III":"dans ou proche de la norme de 2° ± 2°"}.`);
    msg.push(`Maxillaire : SNA ${st(a,82,2)} (82° ± 2°). Mandibule : SNB ${st(b,80,2)} (80° ± 2°).`);
    msg.push(`Vertical : FMA ${f}°, ${f>28?"hyperdivergence probable":f<22?"hypodivergence probable":"normodivergence"} (25° ± 3°).`);
    msg.push(`Incisives : I/NA ${st(i,22,2)} (22° ± 2°), i/NB ${st(j,25,2)} (25° ± 2°).`);
    if(anb<0&&i>24&&j<23)msg.push(`<strong>Compensation de classe III probable</strong> : incisive maxillaire vestibuloversée, mandibulaire linguoversée ${pg("11")}.`);
    if(anb>4&&j>27&&i<20)msg.push(`<strong>Compensation de classe II probable</strong> : incisive mandibulaire vestibuloversée, maxillaire linguoversée ${pg("11")}.`);
    if(anb>4&&f>28)msg.push(`Classe II et hyperdivergence : orthopédie à discuter avec prudence ${pg("100")}, tractions de classe II à éviter ${pg("144")}, traction cervicale à proscrire ${pg("141")}.`);
    if(anb>4&&f<22)msg.push(`Classe II hypodivergente : surveiller le profil avant toute grande rétraction ${pg("59")}.`);
    $("#cephO").innerHTML=msg.map(m=>`<p>${m}</p>`).join("");
    const N0=[265,50],S0=[85,50],r=175,ray=d=>{const t=d*Math.PI/180;return [N0[0]-r*Math.cos(t),N0[1]+r*Math.sin(t)]},A=ray(a),B=ray(b),Fr=[40,88],m=[Fr[0]+250*Math.cos(f*Math.PI/180),Fr[1]+250*Math.sin(f*Math.PI/180)];
    $("#cephS").innerHTML=`<g fill="none" stroke-linecap="round"><line x1="${S0[0]}" y1="${S0[1]}" x2="${N0[0]}" y2="${N0[1]}" style="stroke:var(--ink)" stroke-width="2"/><line x1="${N0[0]}" y1="${N0[1]}" x2="${A[0]}" y2="${A[1]}" style="stroke:var(--m0)" stroke-width="2.5"/><line x1="${N0[0]}" y1="${N0[1]}" x2="${B[0]}" y2="${B[1]}" style="stroke:var(--m1)" stroke-width="2.5"/><line x1="${Fr[0]}" y1="${Fr[1]}" x2="310" y2="${Fr[1]}" style="stroke:var(--muted)" stroke-dasharray="5 5"/><line x1="${Fr[0]}" y1="${Fr[1]}" x2="${m[0]}" y2="${m[1]}" style="stroke:var(--m3)" stroke-width="2.5"/></g><g font-size="12" font-weight="700" style="fill:var(--ink)"><text x="${S0[0]-12}" y="${S0[1]-6}">S</text><text x="${N0[0]+4}" y="${N0[1]-6}">N</text><text x="${A[0]-16}" y="${A[1]+2}">A</text><text x="${B[0]-16}" y="${B[1]+12}">B</text><text x="${m[0]-30}" y="${m[1]-6}">Plan mand.</text><text x="255" y="${Fr[1]-6}">Francfort</text></g>`};
  bind(["sna","snb","fma","ina","inb"],draw,{sna:"°",snb:"°",fma:"°",ina:"°",inb:"°"});
  $$("[data-pre]",el).forEach(b=>b.onclick=()=>{const p=b.dataset.pre.split(",");["sna","snb","fma","ina","inb"].forEach((k,i)=>{$("#"+k).value=p[i];$("#"+k+"V").textContent=p[i]+"°"});draw()});
}
function tForce(el){el.innerHTML=`<div class="grid2"><section class="card"><h2>De la force à la pression</h2>${slider("ff","Force",10,400,100,5," g")}${slider("fs","Surface radiculaire sollicitée (valeur d'exercice)",.5,6,2,.1," cm²")}
  <div class="row"><button class="btn sm" data-fs="1.0">Peu de surface</button><button class="btn sm" data-fs="4.0">Beaucoup de surface</button></div><div id="fo"></div>
  <p class="small muted">Les surfaces sont des valeurs d'exercice, pas des données du livre. Le seuil de 20 g/cm² est préconisé par certains auteurs ${pg("119")}.</p></section>
  <section class="card"><h2>Courbe qualitative</h2><svg id="fS" viewBox="0 0 360 210" role="img" aria-label="Déplacement selon le temps" style="max-width:100%"></svg><div id="fx"></div><p>${pg("117-118")}</p></section></div>`;
  const dr=()=>{const f=v("ff"),s=v("fs"),p=f/s,hi=p>20,lag=hi?Math.min(150,50+(p-20)*1.6):26;
    $("#fo").innerHTML=`<p class="mono" style="font-size:22px">${p.toFixed(0)} g/cm²</p><p>${hi?"Au-dessus du seuil cité : risque de zone hyaline, résorption indirecte et retard.":"Sous le seuil cité : la circulation reste possible et la résorption directe se met en place plus vite."}</p>`;
    const x0=40,y0=180,y1=y0-34;$("#fS").innerHTML=`<g style="stroke:var(--line)"><line x1="${x0}" y1="${y0}" x2="350" y2="${y0}"/><line x1="${x0}" y1="10" x2="${x0}" y2="${y0}"/></g><polyline fill="none" stroke-width="2.5" stroke-linejoin="round" style="stroke:var(--accent)" points="${x0},${y0} ${x0+6},${y1} ${x0+6+lag},${y1} 345,${Math.max(20,y1-(345-x0-6-lag)*.45)}"/><g font-size="12" style="fill:var(--muted)"><text x="${x0+12}" y="${y1-8}">Déplacement initial</text><text x="${x0+8+Math.max(0,lag/2-18)}" y="${y1+18}">Latence</text><text x="210" y="198">Temps</text><text x="8" y="16">Dent</text></g>`;
    $("#fx").innerHTML=`<p class="small">La latence varie selon le livre d'un à une dizaine de jours, selon la pression. La courbe n'est pas à l'échelle.</p>`};
  bind(["ff","fs"],dr,{ff:" g",fs:" cm²"});$$("[data-fs]",el).forEach(b=>b.onclick=()=>{$("#fs").value=b.dataset.fs;$("#fsV").textContent=b.dataset.fs+" cm²";dr()})}
function tMom(el){el.innerHTML=`<div class="grid2"><section class="card"><h2>Choisir le mouvement</h2>${slider("mf","Force de recul",20,300,100,10," g")}${slider("md","Distance au centre de résistance",2,14,8,1," mm")}${slider("mc","Moment opposé (couple)",0,2400,0,20," g.mm")}<div id="mo"></div><p>${pg("120-121")}</p></section>
  <section class="card"><h2>Effet sur la dent</h2><svg viewBox="0 0 300 300" role="img" aria-label="Dent et centre de rotation" style="max-width:100%;max-height:300px"><line x1="10" y1="120" x2="290" y2="120" style="stroke:var(--line)" stroke-dasharray="5 5"/><text x="12" y="112" font-size="11" style="fill:var(--muted)">Crête alvéolaire</text><g id="toothG" class="tooth"><path d="M122 36q28-14 56 0q7 42-3 76l-11 118q-5 12-14 12t-13-13l-12-117q-9-34-3-76z" style="fill:var(--raise);stroke:var(--ink)" stroke-width="2"/><circle cx="150" cy="150" r="8" style="fill:var(--m1)"/></g><circle id="crot" r="4" style="fill:var(--m3)"/><text x="12" y="290" font-size="11" style="fill:var(--muted)">Orange : centre de résistance. Violet : centre de rotation.</text></svg>
  <div id="mx"></div>${fmt("{R:Le livre décrit les quatre mouvements et la position du centre de rotation. Le passage automatique d'un mouvement à l'autre en fonction du rapport est une simplification pédagogique.}")}</section></div>`;
  const dr=()=>{const M1=v("mf")*v("md"),Mc=v("mc"),r=Mc/M1;let t,ang,cy;
    if(r<.05){t=["Version incontrôlée","Centre de rotation proche du centre de résistance."];ang=-14;cy=150}
    else if(r<.85){t=["Version contrôlée","Centre de rotation vers l'apex."];ang=-14*(1-r);cy=232}
    else if(r<=1.1){t=["Translation","Centre de rotation à l'infini : la dent se déplace parallèlement à elle-même."];ang=0;cy=-999}
    else{t=["Mouvement radiculaire (torque)","Centre de rotation au niveau du bord libre."];ang=Math.min(16,(r-1)*16);cy=36}
    $("#mo").innerHTML=`<p class="mono">M(f) = ${v("mf")} × ${v("md")} = ${M1} g.mm · rapport ${r.toFixed(2)}</p><p><strong>${t[0]}</strong>. ${t[1]}</p>`;
    $("#toothG").setAttribute("transform",`rotate(${ang} 150 ${cy>0?cy:150})`+(cy<0?" translate(-14 0)":""));const c=$("#crot");c.setAttribute("cx",150);c.setAttribute("cy",cy>0?cy:-40);c.style.display=cy>0?"":"none"};
  bind(["mf","md","mc"],dr,{mf:" g",md:" mm",mc:" g.mm"})}
function tFil(el){el.innerHTML=`<div class="grid2"><section class="card"><h2>Fil rond</h2>${slider("wd","Diamètre (millièmes de pouce)",12,22,16,1)}${slider("wl","Longueur active relative",1,3,1,.1," ×")}<div id="wo"></div></section>
  <section class="card"><h2>Fil rectangulaire</h2>${slider("re","Épaisseur e (millièmes)",16,25,17,1)}${slider("rl","Largeur l (millièmes)",16,28,25,1)}<div id="ro"></div><p class="small muted">Le fil de référence est .016 rond, ou .017 × .025 rectangulaire. Rapport charge/flexion ∝ d⁴/L³ pour le rond et l·e³/L³ pour le rectangulaire ${pg("132")}.</p></section></div>`;
  const dr=()=>{const k=Math.pow(v("wd")/16,4)/Math.pow(v("wl"),3),q=(v("rl")/25)*Math.pow(v("re")/17,3);
    $("#wo").innerHTML=`<p class="mono" style="font-size:24px">× ${k.toFixed(2)}</p><p>Force délivrée pour une même activation, par rapport au fil de référence.</p><p>${k<.6?"Plus souple : utile pour l'alignement. Une boucle allonge le fil et réduit moins la charge maximale élastique qu'une baisse de section.":k>2?"Beaucoup plus rigide : plus adapté à la stabilisation qu'à l'alignement.":"Rigidité proche de la référence."} ${pg("133-134")}</p>`;
    $("#ro").innerHTML=`<p class="mono" style="font-size:24px">× ${q.toFixed(2)}</p><p>Plus de rigidité augmente aussi le contrôle, si le fil remplit la gorge ${pg("125")}.</p>`};
  bind(["wd","wl","re","rl"],dr,{wl:" ×"})}
function tFeo(el){const sel=(id,o)=>`<select id="${id}">${o.map(([k,t])=>`<option value="${k}">${t}</option>`).join("")}</select>`;
  el.innerHTML=`<div class="grid2"><section class="card"><h2>Réglages</h2><label>Type de traction${sel("fT",[["c","Cervicale (basse)"],["o","Occipitale (intermédiaire)"],["p","Pariétale (haute)"]])}</label><label>Ligne d'action par rapport au centre de résistance molaire${sel("fL",[["u","Au-dessous"],["t","À travers"],["a","Au-dessus"]])}</label><label>Typologie du patient${sel("fP",[["hy","Hyperdivergent"],["no","Normodivergent"],["ho","Hypodivergent"]])}</label><label>Intensité${sel("fI",[["o","Moins de 450 g (action orthodontique)"],["h","De 400 à 1500 g (action orthopédique)"]])}</label></section>
  <section class="card"><h2>Effets attendus</h2><div id="fR" style="display:flex;flex-direction:column;gap:8px"></div><p>${pg("105-106")} ${pg("109")} ${pg("139-141")}</p></section></div>`;
  const dr=()=>{const T=$("#fT").value,L=$("#fL").value,P=$("#fP").value,I=$("#fI").value,o=[];
    o.push({c:"Vertical : égression de la molaire, ouverture de l'occlusion.",o:"Vertical : force modérément ingressante, freine l'égression.",p:"Vertical : force ingressante, freine ou bloque l'égression."}[T]);
    o.push({u:"Sagittal : version coronodistale de la molaire.",t:"Sagittal : translation de la molaire.",a:"Sagittal : version coronomésiale, recul apical."}[L]);
    o.push(T==="c"?"Frontal : version coronolinguale, contraction possible de l'arcade.":T==="p"?"Frontal : version coronovestibulaire, expansion possible de l'arcade.":"Frontal : effet transversal à contrôler selon la composante verticale.");
    o.push(I==="h"?"Intensité : forces lourdes visant les sutures périmaxillaires, avec port intermittent.":"Intensité : action sur la molaire, port de 10 à 12 h sur 24 selon le livre.");
    const w=[];if(T==="c"&&P==="hy")w.push("Traction cervicale à proscrire chez un sujet hyperdivergent.");if(T==="p"&&P==="ho")w.push("Traction haute : à discuter, l'égression peut au contraire être recherchée chez un sujet hypodivergent.");if(P==="hy"&&I==="h")w.push("Hyperdivergence sévère et postérorotation figurent parmi les contre-indications.");
    $("#fR").innerHTML=o.map(t=>`<p>${t}</p>`).join("")+w.map(t=>`<div class="fb wrong"><strong>Attention.</strong> ${t}</div>`).join("")+`<p class="small muted">Un système de sécurité est obligatoire pour prévenir les blessures, notamment oculaires.</p>`};
  ["fT","fL","fP","fI"].forEach(i=>$("#"+i).onchange=dr);dr()}
function tEsp(el){el.innerHTML=`<div class="grid2"><section class="card"><h2>Besoin d'espace</h2>${slider("eE","Encombrement",0,14,5,.5," mm")}${slider("eD","Courbe de Spee à droite",0,6,2,.5," mm")}${slider("eG","Courbe de Spee à gauche",0,6,2,.5," mm")}<label>Formule${`<select id="eF"><option value="t">Fondation Tweed : ½(D+G)+1</option><option value="g">Garcia : ⅔(D+G)+1</option><option value="b">Baldridge : 0,488(D+G)−0,51</option></select>`}</label>${slider("eI","Espace pour reculer l'incisive",0,10,2,.5," mm")}</section>
  <section class="card"><h2>Solutions</h2><label style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" id="eX">Extraire deux prémolaires (+15 mm en moyenne)</label>${slider("eS","Stripping",0,4,0,.5," mm")}${slider("eM","Redressement molaire ou expansion",0,5,0,.5," mm")}<div id="eO"></div><p>${pg("62-66")}</p></section></div>`;
  const dr=()=>{const k=v("eD")+v("eG"),f=$("#eF").value,sp=f==="t"?k/2+1:f==="g"?k*2/3+1:Math.max(0,.488*k-.51),need=v("eE")+sp+v("eI"),gain=($("#eX").checked?15:0)+v("eS")+v("eM"),bal=gain-need;
    $("#eO").innerHTML=`<p class="mono">Besoin ${need.toFixed(1)} mm · apport ${gain.toFixed(1)} mm</p><p class="mono" style="font-size:24px">${bal>=0?"+":""}${bal.toFixed(1)} mm</p><p>${Math.abs(bal)<.5?"Bilan équilibré.":bal>0?"Excédent : à fermer, par mésialisation des secteurs latéraux, ou à reconsidérer.":"Déficit : il faut trouver de l'espace ou modifier les objectifs."}</p>${$("#eX").checked&&need<8?`<div class="fb wrong">Extraire pour un besoin faible oblige à gérer un grand excédent. Vérifie profil et ancrage.</div>`:""}${v("eM")>3?`<div class="fb wrong">Une expansion improvisée expose à la récidive et au risque parodontal : elle doit être planifiée.</div>`:""}`};
  bind(["eE","eD","eG","eI","eS","eM"],dr,{eE:" mm",eD:" mm",eG:" mm",eI:" mm",eS:" mm",eM:" mm"});$("#eF").onchange=dr;$("#eX").onchange=dr}
function tBol(el){el.innerHTML=`<div class="grid2"><section class="card"><h2>Mesures</h2>${slider("bM12","12 dents mandibulaires",70,110,91,.5," mm")}${slider("bX12","12 dents maxillaires",80,120,100,.5," mm")}${slider("bM6","6 dents antérieures mandibulaires",30,50,39,.5," mm")}${slider("bX6","6 dents antérieures maxillaires",40,60,50,.5," mm")}</section>
  <section class="card"><h2>Rapports</h2><div id="bO"></div><p>${pg("T2:249")}</p>${fmt("{R:Le calcul signale une question. Le livre demande un écart d'au moins une déviation standard et un set-up avant de conclure.}")}</section></div>`;
  const row=(l,val,mean,ds,lo,hi)=>{const d=(val-mean)/ds;return `<p class="mono">${l} : ${val.toFixed(1)} % (moyenne ${mean}, DS ${ds})</p><p>${Math.abs(d)<1?"Écart de moins d'une déviation standard : pas d'argument pour une DDD.":d>0?"Excès mandibulaire relatif à vérifier sur set-up.":"Excès maxillaire relatif à vérifier sur set-up."}${val<lo||val>hi?` Hors de la dispersion citée (${lo} à ${hi}).`:""}</p>`};
  const dr=()=>{$("#bO").innerHTML=row("Total",v("bM12")/v("bX12")*100,91.3,1.81,87.5,94.8)+row("Antérieur",v("bM6")/v("bX6")*100,77.2,1.65,74.5,80.4)};
  bind(["bM12","bX12","bM6","bX6"],dr,{bM12:" mm",bX12:" mm",bM6:" mm",bX6:" mm"})}
function tMat(el){const ST=[["PP2 =","3 ans à 1 an avant le pic",-2],["MP3 = et S","Année qui précède le pic",-.5],["MP3 cap","Sommet du pic et année qui suit",.5],["PP1 cap","1 an après",1],["DP3 u","1 à 2 ans après",1.5],["PP3 u","2 ans après",2],["MP3 u","2 à 3 ans après",2.5],["Ru","3 à 4 ans après",3.5]];
  el.innerHTML=`<section class="card"><h2>Où en est le patient ?</h2><label>Stade observé (radiographie de la main)<select id="mS">${ST.map((s,i)=>`<option value="${i}">${s[0]}</option>`).join("")}</select></label><svg id="mC" viewBox="0 0 680 130" role="img" aria-label="Position sur la courbe de croissance" style="max-width:100%"></svg><div id="mO"></div><p>${pg("54-56")} ${pg("59-60")} ${pg("100")} ${pg("211")}</p>${fmt("{R:Les décisions affichées résument la logique des pages citées. Elles ne remplacent pas l'analyse du cas : la direction de croissance et la typologie restent décisives.}")}</section>`;
  const dr=()=>{const s=ST[+$("#mS").value],x=t=>340+t*80,pts=[];for(let t=-3.5;t<=4;t+=.1){pts.push(`${x(t)},${100-70*Math.exp(-t*t/1.6)}`)}
    $("#mC").innerHTML=`<line x1="40" y1="100" x2="660" y2="100" style="stroke:var(--line)"/><polyline fill="none" stroke-width="2.5" style="stroke:var(--accent)" points="${pts.join(" ")}"/><line x1="${x(s[2])}" y1="14" x2="${x(s[2])}" y2="100" style="stroke:var(--m1)" stroke-width="2"/><circle cx="${x(s[2])}" cy="${100-70*Math.exp(-s[2]*s[2]/1.6)}" r="7" style="fill:var(--m1);stroke:var(--surface)" stroke-width="2"/><g font-size="12" style="fill:var(--muted)"><text x="${x(0)-14}" y="118">Pic</text><text x="${x(-3)}" y="118">Avant</text><text x="${x(3)}" y="118">Après</text></g>`;
    const t=s[2];$("#mO").innerHTML=`<p><strong>${esc(s[1])}.</strong></p><p>${t<0?"Phase ascendante : favorable à une action orthopédique si la direction de croissance l'est aussi.":t<=1?"Autour du pic : forte croissance encore utile, mais le temps restant se réduit.":t<3?"Phase descendante : l'orthopédie perd en intérêt. Période utile pour limiter l'aggravation d'une croissance défavorable.":"Fin de croissance proche : l'action squelettique orthopédique n'est plus l'objectif. Discuter orthodontie ou chirurgie selon le cas."}</p>`};
  $("#mS").onchange=dr;dr()}
/* ---------- professeur ---------- */
let CHAT=[],profMode="socr",aborter=null;
const PMODES={socr:["Socratique","Pose une seule question à la fois, attends ma réponse, puis adapte le niveau. Ne donne la solution qu'après ma tentative."],simple:["Explique simplement","Explique d'abord avec une image simple, puis en profondeur, puis termine par une question."],exam:["Examinateur NDEB","Pose un QCM à réponse unique de style NDEB, attends ma réponse, corrige, puis pose le suivant en augmentant la difficulté si je réussis."],corr:["Corrige mon raisonnement","Analyse ma démarche : ce qui est juste, ce qui manque, l'erreur principale, puis une question de relance."]};
function retrieve(text,extra=[],chs=null,k=7){const qt=norm(text).split(/[^a-z0-9]+/).filter(w=>w.length>3);
  const sc=NL.map(n=>{const hay=norm(n.t+" "+n.s+" "+n.d+" "+(n.en||[]).join(" ")),t=norm(n.t);let s=0;qt.forEach(w=>{if(hay.includes(w))s+=1;if(t.includes(w))s+=2});if(chs&&chs.includes(n.ch))s+=.5;return [n,s]}).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,k).map(x=>x[0]);
  const set=new Map();extra.forEach(i=>N[i]&&set.set(i,N[i]));sc.forEach(n=>set.set(n.id,n));return [...set.values()].slice(0,k+2)}
const nCtx=n=>`[Livre T${tomeOf(n.ch)}, ${chLab(n.ch)}, p. ${n.p}] ${n.t}\nSimple : ${n.s}\nDétail : ${n.d}${n.why?"\nNote de la plateforme : "+n.why.replace(/\{R:/g,"(raisonnement) ").replace(/\{H:/g,"(hors livre) ").replace(/}/g,""):""}`;
function profPrompt(lastUser,focusIds,chs){const notes=retrieve(lastUser+" "+CHAT.slice(-3).map(m=>m.c).join(" "),focusIds,chs).map(nCtx).join("\n\n"),weak=weakList(4).map(n=>n.t).join(", ")||"inconnues";
  return `Tu es un professeur d'orthodontie. Tu t'adresses en français, en tutoyant, à un étudiant de dernière année de médecine dentaire au Maroc qui prépare le NDEB et veut développer son raisonnement clinique.
Mode : ${PMODES[profMode][1]}
Règles de source, strictes :
- Utilise d'abord les extraits ci-dessous, issus de fiches du livre « Orthodontie de l'enfant et du jeune adulte » (tomes 1 et 2).
- Cite chaque idée du livre ainsi : [Livre T1, p. X] ou [Livre T2, p. X], avec le tome et une page présents dans les extraits. N'invente jamais de page.
- Tout ajout venant d'ailleurs commence par [Hors livre] et reste bref. Signale quand il mérite vérification.
- Toute déduction personnelle commence par [Raisonnement].
- Si les extraits ne couvrent pas la question, dis-le clairement.
- Sois concis : 140 mots maximum, sauf demande contraire. Pas de titres.
Notions faibles de l'étudiant : ${weak}.
Extraits :
${notes||"Aucun extrait pertinent trouvé."}`}
function renderMsg(t){let h=esc(t).replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
  h=h.replace(/\[Livre(?:\s*T([12]))?,?\s*p\.?\s*(\d+)([^\]]*)\]/g,(m,t,p,r)=>`<button class="cite L" data-src="${t||1}:${p}">Livre T${t||1}, p. ${p}${esc(r)}</button>`).replace(/\[Hors livre\]/g,`<span class="cite H">Hors livre</span>`).replace(/\[Raisonnement\]/g,`<span class="cite R">Raisonnement</span>`);return h}
async function sendProf(text,focus,chs){const box=$("#chat");CHAT.push({r:"user",c:text});CHAT.push({r:"assistant",c:""});drawChat();const last=CHAT[CHAT.length-1];const st=$("#pstop"),snd=$("#psend");if(snd)snd.disabled=true;if(st)st.hidden=false;
  aborter=new AbortController();
  const turns=CHAT.slice(0,-1).slice(-8).map((m,i,a)=>({role:m.r,content:i===a.length-1?profPrompt(text,focus||[],chs)+"\n\nMessage de l'étudiant : "+m.c:m.c}));
  while(turns.length&&turns[0].role!=="user")turns.shift();
  try{const r=await SAMPLE(turns,{cache:false,signal:aborter.signal,onText:({text:t})=>{last.c=t;const e=$("#chat .msg.a:last-child");if(e)e.innerHTML=renderMsg(t);window.scrollTo(0,document.body.scrollHeight)}});last.c=r.text;tick();save()}
  catch(e){last.c=e&&e.code==="not_granted"?"Tu as refusé l'accès à Claude pour cette page. Recharge la page pour réactiver le professeur.":e&&e.code==="rate_limited"?"Trop de demandes pour le moment. Réessaie dans un instant.":(e&&e.text)||"Le professeur n'a pas pu répondre. Vérifie ta connexion et réessaie."}
  drawChat();if(snd)snd.disabled=false;if(st)st.hidden=true}
function drawChat(){const b=$("#chat");if(!b)return;b.innerHTML=CHAT.map(m=>`<div class="msg ${m.r==="user"?"u":"a"}">${m.r==="user"?esc(m.c):renderMsg(m.c||"…")}</div>`).join("")}
function vProf(el){const seed=ctx.seed,focus=ctx.extra||(ctx.focus?[ctx.focus]:[]),chs=ctx.chs;ctx.seed=null;
  if(!SAMPLE){const w=weakList(1)[0]||NL[0];el.innerHTML=`<div class="narrow"><header><h1>Professeur</h1><p class="lead">Le professeur conversationnel a besoin de ton accès à Claude. Il n'est pas disponible dans cette vue, ou il est encore en cours de chargement.</p></header><section class="card"><span class="eyebrow">Mode autonome</span><p>${esc(w.f[0][0])}</p><details><summary>Voir la réponse</summary><p>${esc(w.f[0][1])} ${pg(w.p,w.ch)}</p></details><button class="btn" data-n="${w.id}">Reprendre la notion</button></section></div>`;return}
  el.innerHTML=`<div class="narrow"><header><h1>Professeur</h1><p class="lead">Il répond à partir des fiches du livre, marque ce qui vient d'ailleurs, et utilise ton propre accès à Claude. Les réponses restent à vérifier dans les pages citées.</p></header>
  <div class="row" role="group" aria-label="Mode">${Object.entries(PMODES).map(([k,[t]])=>`<button class="chip" data-pm="${k}" aria-pressed="${profMode===k}">${t}</button>`).join("")}</div>
  ${CHAT.length?"":`<div class="row">${["Interroge-moi sur mes notions faibles","Fais-moi raisonner sur une classe II hyperdivergente","Quelle différence entre résorption directe et indirecte ?","Pose-moi un QCM difficile sur l'ancrage"].map(t=>`<button class="chip" data-pq="${esc(t)}">${esc(t)}</button>`).join("")}</div>`}
  <div id="chat" class="chat" aria-live="polite"></div>
  <form id="pf" class="card" style="padding:10px"><label for="pin" class="small">Ton message</label><textarea id="pin" rows="3" placeholder="Pose ta question ou réponds au professeur."></textarea><div class="between"><button type="button" class="btn sm" id="pclr">Effacer la conversation</button><div class="row"><button type="button" class="btn" id="pstop" hidden>Arrêter</button><button class="btn pri" id="psend">Envoyer</button></div></div></form></div>`;
  drawChat();
  $$("[data-pm]",el).forEach(b=>b.onclick=()=>{profMode=b.dataset.pm;$$("[data-pm]",el).forEach(x=>x.setAttribute("aria-pressed",x.dataset.pm===profMode))});
  $$("[data-pq]",el).forEach(b=>b.onclick=()=>sendProf(b.dataset.pq,focus,chs));
  $("#pf").onsubmit=e=>{e.preventDefault();const t=$("#pin").value.trim();if(!t)return;$("#pin").value="";sendProf(t,focus,chs)};
  $("#pstop").onclick=()=>aborter&&aborter.abort();$("#pclr").onclick=()=>{CHAT=[];route()};
  if(seed)sendProf(seed,focus,chs)}
async function feynman(n,text,out){if(!text.trim()){toast("Écris d'abord ton explication.");return}S.notes[n.id]=text;save();
  if(!SAMPLE){out.innerHTML=`<div class="fb"><strong>Compare toi-même.</strong> As-tu couvert : ${esc(n.s)} <details><summary>Voir les détails du livre</summary><p>${esc(n.d)}</p></details></div>`;return}
  out.innerHTML=`<div class="fb">Le professeur lit ta réponse…</div>`;
  try{const r=await SAMPLE(`Tu corriges en français, en tutoyant, l'explication d'un étudiant. Base-toi d'abord sur cet extrait. Cite [Livre T1, p. X] ou [Livre T2, p. X] avec le tome et la page de l'extrait. Marque tout ajout externe par [Hors livre] et toute déduction par [Raisonnement]. Donne en 90 mots maximum : ce qui est juste, ce qui manque, et une question de relance.\nExtrait :\n${nCtx(n)}\n\nExplication de l'étudiant :\n${text}`,{cache:false,onText:({text:t})=>{out.innerHTML=`<div class="fb">${renderMsg(t)}</div>`}});out.innerHTML=`<div class="fb">${renderMsg(r.text)}</div>`;learn(n.id,.05);save()}
  catch(e){out.innerHTML=`<div class="fb wrong">La correction n'a pas abouti. Compare ta réponse aux détails de la notion ci-dessus.</div>`}}
/* ---------- esprit critique ---------- */
function vCritique(el){const tab=ctx.tab||"t",hors=NL.filter(n=>/\{H:/.test(n.why||"")).map(n=>[n,n.why.match(/\{H:([^}]*)\}/)[1]]);
  el.innerHTML=`<div class="wrap"><header><h1>Esprit critique</h1><p class="lead">Un livre n'est pas un bloc. Ici, tu confrontes ses passages, repères ses limites et vois ce qui a été ajouté hors du livre.</p></header>
  <div class="tabs" role="tablist">${[["t","Tensions du livre"],["e","Erreurs et coquilles"],["h","Registre hors livre"],["m","Méthode et limites"]].map(([k,t])=>`<button role="tab" aria-selected="${tab===k}" data-tab="${k}">${t}</button>`).join("")}</div><div id="cb" style="display:flex;flex-direction:column;gap:14px"></div></div>`;
  $$("[data-tab]",el).forEach(b=>b.onclick=()=>{ctx.tab=b.dataset.tab;vCritique(el)});const b=$("#cb");
  if(tab==="t"){b.innerHTML=X.tensions.map((t,i)=>`<section class="card"><h2>${esc(t.t)}</h2><div class="grid2"><div class="fb"><span class="eyebrow">Une lecture</span><p>${esc(t.a)}</p>${pg(t.ap)}</div><div class="fb"><span class="eyebrow">Une autre lecture</span><p>${esc(t.b)}</p>${pg(t.bp)}</div></div><label for="tn${i}" style="font-size:16px;color:var(--ink);font-weight:700">${esc(t.q)}</label><textarea id="tn${i}" data-tn="${i}">${esc(S.tens[i]||"")}</textarea><div class="row">${t.n.map(x=>`<button class="chip" data-n="${x}">${esc(N[x].t)}</button>`).join("")}<button class="btn sm" data-tp="${i}">Discuter avec le professeur</button></div></section>`).join("");
    $$("[data-tn]",b).forEach(e=>e.onchange=()=>{S.tens[e.dataset.tn]=e.value;save();toast("Réponse enregistrée")});
    $$("[data-tp]",b).forEach(e=>e.onclick=()=>{const t=X.tensions[+e.dataset.tp];go("prof",{seed:`Le livre semble en tension sur ce sujet : ${t.t}. ${t.a} ${t.b} ${t.q} Ma réponse : ${S.tens[e.dataset.tp]||"je n'ai pas encore d'avis"}.`,extra:t.n})})}
  else if(tab==="e"){const all=C.flatMap(c=>c.errata.map(e=>({...e,ch:c.ch})));b.innerHTML=`<p class="muted">Ces points relèvent de ma lecture du PDF. Une coquille d'extraction reste possible : vérifie la page avant de considérer qu'il s'agit d'une erreur de l'ouvrage.</p><div class="scrollx card" style="padding:0"><table class="t"><thead><tr><th>Ch.</th><th>Page</th><th>Type</th><th>Observation</th></tr></thead><tbody>${all.map(e=>`<tr><td>${chLab(e.ch)}</td><td>${pg(e.p,e.ch)}</td><td>${esc(e.type)}</td><td>${esc(e.txt)}</td></tr>`).join("")}</tbody></table></div>`}
  else if(tab==="h"){b.innerHTML=`<p class="muted">Tout ce qui n'est pas tiré du livre est marqué dans la plateforme. Les remarques de cette liste sont de mémoire, sauf indication : vérifie-les avant de t'y fier. Les termes anglais et les priorités NDEB sont aussi des ajouts.</p>${hors.map(([n,t])=>`<div class="card"><div class="row">${modBadge(n.ch)}<button class="chip" data-n="${n.id}">${esc(n.t)}</button></div><p>${esc(t)}</p></div>`).join("")}
    <section class="card"><h2>Sources sur le NDEB</h2><ul style="margin:0;padding-left:20px"><li><a href="https://ndeb-bned.ca/equivalency-process/assessment-of-fundamental-knowledge-afk/">Page de l'AFK sur le site du NDEB</a></li><li><a href="https://ndeb-bned.ca/wp-content/uploads/2022/11/2023-ACJ-Protocol_Approved-Oct-2022.pdf">Protocole ACJ 2023</a></li><li><a href="https://ndeb-bned.ca/wp-content/uploads/2021/06/2021-06-Reference-Texts-Textes-de-reference.pdf">Textes de référence, juin 2021</a></li></ul><p class="small muted">Formats et dates à revérifier sur le site du NDEB avant de t'inscrire.</p></section>`}
  else{b.innerHTML=`<section class="card"><h2>Comment cette plateforme a été construite</h2><ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px"><li>Le texte des 17 chapitres des deux tomes et les légendes ont été lus. La plupart des images n'ont pas été examinées une par une : ouvre le livre pour les figures.</li><li>Les notions sont des reformulations, relues pour rester fidèles, sans relecture par un enseignant.</li><li>Les cas cliniques sont inventés. Les QCM sont originaux. Aucun n'est un sujet officiel du NDEB.</li><li>Les tomes datent de 2011 et 2013, et le chapitre 9 du tome 1 décrit le droit français : à actualiser et transposer.</li></ul></section>
  <section class="card"><h2>Sauvegarde de ta progression</h2><p class="muted">${esc($("#sync").textContent)}.</p><div class="row"><button class="btn" id="expo">Copier ma progression</button></div></section>
  <section class="card"><h2>Recommencer</h2><p class="muted">Efface toute ta progression. Cette action est définitive.</p><div class="row"><button class="btn" id="rst">Tout effacer</button></div></section>`;
    $("#expo").onclick=async()=>{try{await navigator.clipboard.writeText(JSON.stringify(S));toast("Progression copiée")}catch(e){toast("Copie impossible dans cette vue")}};
    $("#rst").onclick=e=>{const btn=e.target;if(btn.dataset.ok){S=fresh();save();toast("Progression effacée");go("today")}else{btn.dataset.ok=1;btn.textContent="Confirmer l'effacement"}}}
}
/* ---------- source PDF ---------- */
let PDFS={},srcP=1,srcT=1,pdfLoading=null;
const IDBK="arcade-pdf";
function idb(){return new Promise((res,rej)=>{const r=indexedDB.open(IDBK,1);r.onupgradeneeded=()=>r.result.createObjectStore("f");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function idbGet(K="book"){try{const d=await idb();return await new Promise(r=>{const q=d.transaction("f").objectStore("f").get(K);q.onsuccess=()=>r(q.result||null);q.onerror=()=>r(null)})}catch(e){return null}}
async function idbPut(b,K="book"){try{const d=await idb();d.transaction("f","readwrite").objectStore("f").put(b,K)}catch(e){}}
function loadScript(u){return new Promise((res,rej)=>{const s=document.createElement("script");s.src=u;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
async function ensurePdfJs(){if(window.pdfjsLib)return;const B="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";await loadScript(B+"pdf.min.js");await loadScript(B+"pdf.worker.min.js")}
async function openFile(blob,t){const body=$("#srcbody");body.innerHTML=`<p class="muted">Ouverture du livre…</p>`;try{await ensurePdfJs();const data=new Uint8Array(await blob.arrayBuffer());PDFS[t]=await pdfjsLib.getDocument({data,disableAutoFetch:true,isEvalSupported:false}).promise;drawPage()}catch(e){PDFS[t]=null;body.innerHTML=`<div class="fb wrong">Le PDF n'a pas pu être ouvert ici. Ouvre-le à la page indiquée ci-dessus dans ton lecteur habituel.</div>`}}
async function showSource(p,t){if(t)srcT=t;srcP=clamp(p||1,1,PMAX[srcT]);const pn=$("#srcpanel");pn.hidden=false;$("#srcinput").max=PMAX[srcT];$("#srcinput").value=srcP;$("#srctitle").textContent=`T${srcT} · page ${srcP} · PDF ${pdfPage(srcP,srcT)}`;
  if(PDFS[srcT])return drawPage();
  const k=srcT;const stored=await idbGet(k===1?"book":"book2");if(stored&&!PDFS[k])return openFile(stored,k);
  $("#srcbody").innerHTML=`<p>Tome ${k}, page imprimée <strong>${srcP}</strong>, soit la page <strong>${pdfPage(srcP,k)}</strong> de ton fichier PDF.</p><p class="muted small">Pour lire la page ici, choisis le PDF du tome ${k} dans le dossier ouvrage3. Il reste sur ton appareil : il n'est ni envoyé ni publié.</p><label>Fichier PDF du tome ${k}<input type="file" id="pdffile" accept="application/pdf"></label>`;
  $("#pdffile").onchange=e=>{const f=e.target.files[0];if(f){idbPut(f,k===1?"book":"book2");openFile(f,k)}}}
async function drawPage(){const body=$("#srcbody");$("#srcinput").value=srcP;$("#srctitle").textContent=`T${srcT} · page ${srcP} · PDF ${pdfPage(srcP,srcT)}`;body.innerHTML="";try{const page=await PDFS[srcT].getPage(pdfPage(srcP,srcT)),w=body.clientWidth-30,base=page.getViewport({scale:1}),scale=Math.min(2,(w/base.width)*(window.devicePixelRatio||1)),vp=page.getViewport({scale}),c=document.createElement("canvas");c.width=vp.width;c.height=vp.height;c.style.width=Math.min(w,base.width*2)+"px";body.appendChild(c);await page.render({canvasContext:c.getContext("2d"),viewport:vp}).promise}catch(e){body.innerHTML=`<div class="fb wrong">Cette page n'a pas pu être affichée.</div>`}}
/* ---------- événements ---------- */
document.addEventListener("click",e=>{const t=e.target.closest("[data-go],[data-n],[data-sess],[data-src],[data-quick],[data-flash],[data-place],[data-quiz-n],[data-ask],[data-case],[data-chf]");if(!t)return;
  if(t.dataset.src){e.preventDefault();const[st,sp]=t.dataset.src.split(":");showSource(+sp,+st);return}
  if(t.dataset.go){e.preventDefault();go(t.dataset.go);return}
  if(t.dataset.n){e.preventDefault();go("notion",{id:t.dataset.n});return}
  if(t.dataset.sess!=null){startSession(+t.dataset.sess);return}
  if(t.dataset.quick){quick();return}
  if(t.dataset.flash){startFlash();return}
  if(t.dataset.place){startPlace();return}
  if(t.dataset.quizN){startQuiz({title:N[t.dataset.quizN].t,list:shuffle(Q.filter(q=>q.n===t.dataset.quizN).map(q=>q.i))});return}
  if(t.dataset.ask){go("prof",{seed:`Interroge-moi sur cette notion : ${N[t.dataset.ask].t}. Commence par une question de raisonnement clinique.`,focus:t.dataset.ask});return}
  if(t.dataset.case){go("caseplay",{id:t.dataset.case});return}
  if(t.dataset.chf){go("atlas",{tab:"n",ch:t.dataset.chf});return}
});
$("#srcclose").onclick=()=>{$("#srcpanel").hidden=true};
$("#srcprev").onclick=()=>showSource(srcP-1);$("#srcnext").onclick=()=>showSource(srcP+1);
$("#srcinput").onchange=e=>showSource(+e.target.value);
document.addEventListener("keydown",e=>{if(e.key==="Escape")$("#srcpanel").hidden=true;
  if(curView==="run"&&QZ&&!QZ.finished&&QZ.mode==="learn"&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){const opts=$$("[data-opt]:not([disabled])");if(/^[1-5]$/.test(e.key)&&opts[+e.key-1])opts[+e.key-1].click();else if(e.key==="s"){const b=$('[data-conf="s"]');b&&b.click()}else if(e.key==="h"){const b=$('[data-conf="m"]');b&&b.click()}else if(e.key==="Enter"){const b=$("#valq:not([disabled]),#nextq");if(b){e.preventDefault();b.click()}}}});
/* ---------- démarrage ---------- */
const start=location.hash.slice(1);if(NAV.some(n=>n[0]===start))curView=start;else if(start.startsWith("n.")&&N[start.slice(2)]){curView="notion";ctx={id:start.slice(2)}}
route();initCloud();initSample();
