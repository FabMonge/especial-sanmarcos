(function(){
const D=window.DATA, EX=D.EX, EX9=D.EX9, $=s=>document.querySelector(s);
const fmt=n=>Math.round(n).toLocaleString('en-US');
const f1=n=>(Math.round(n*10)/10).toFixed(1);
const sgn=(n,d=0)=>(n>0?'+':n<0?'−':'')+Math.abs(n).toFixed(d);
const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
const regime=ex=>ex.startsWith('2024')?'var(--rust)':'var(--sand)';
const norm=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();

/* ---------- tooltip ---------- */
const tip=$('#tip');
function showTip(h,e){tip.innerHTML=h;tip.classList.add('on');moveTip(e)}
function moveTip(e){const p=14;let x=e.clientX+p,y=e.clientY+p;const r=tip.getBoundingClientRect();
  if(x+r.width>innerWidth-8)x=e.clientX-r.width-p;if(y+r.height>innerHeight-8)y=e.clientY-r.height-p;
  tip.style.left=Math.max(8,x)+'px';tip.style.top=Math.max(8,y)+'px'}
function hideTip(){tip.classList.remove('on')}
function bindTip(el,fn){
  el.addEventListener('mouseenter',e=>showTip(fn(),e));
  el.addEventListener('mousemove',moveTip);
  el.addEventListener('mouseleave',hideTip);
  el.addEventListener('focus',()=>{const r=el.getBoundingClientRect();showTip(fn(),{clientX:r.left+r.width/2,clientY:r.top})});
  el.addEventListener('blur',hideTip);
}
document.addEventListener('touchstart',e=>{if(!e.target.closest('.col,.bar-row,.pp,.lg,.mm-node'))hideTip()},{passive:true});
window.addEventListener('scroll',hideTip,{passive:true});

/* ---------- animación al entrar en pantalla ---------- */
const pending=[];
function onView(el,fn){
  if(reduce||!('IntersectionObserver' in window)){fn();return}
  const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){io.disconnect();fn()}})},{threshold:.15});
  io.observe(el);pending.push(fn);
}
setTimeout(()=>pending.forEach(f=>{try{f()}catch(e){}}),2800);

/* ---------- gráfico de columnas ---------- */
function colChart(sel,o){
  const el=$(sel);let first=true,selKey=null,done=false;
  const grp=o.group||[];
  function setHover(k){grp.forEach(g=>{const b=g.el;b.classList.toggle('hov',k!=null);b.querySelectorAll('.col').forEach(c=>c.classList.toggle('on',k!=null&&c.dataset.k===k))});o.onHover&&o.onHover(k)}
  function setSel(k){selKey=selKey===k?null:k;grp.forEach(g=>g.el.querySelectorAll('.col').forEach(c=>c.classList.toggle('sel',selKey!=null&&c.dataset.k===selKey)));o.onSel&&o.onSel(selKey)}
  function draw(){
    const w=Math.max(el.clientWidth,200),H=o.h||140,m={t:24,b:24};
    el.innerHTML='';
    const svg=d3.select(el).append('svg').attr('viewBox',`0 0 ${w} ${H+m.t+m.b}`).attr('height',H+m.t+m.b).attr('role','img').attr('aria-label',o.aria||'Gráfico de columnas');
    const x=d3.scaleBand().domain(o.items.map(d=>d.k)).range([0,w]).paddingInner(.22).paddingOuter(.08);
    const vmax=o.vmax||d3.max(o.items,d=>d.v)*1.02||1;
    const y=d3.scaleLinear().domain([0,vmax]).range([H,0]);
    const narrow=x.bandwidth()<54;
    svg.append('line').attr('x1',0).attr('x2',w).attr('y1',m.t+H).attr('y2',m.t+H).style('stroke','var(--fg)').style('stroke-width',2);
    o.items.forEach((d,i)=>{
      const v=d.v==null?0:d.v;
      const g=svg.append('g').attr('class','col').attr('data-k',d.k).attr('tabindex',0).attr('role','button').attr('aria-label',d.aria||d.label);
      const bx=x(d.k),bw=x.bandwidth(),hh=H-y(v);
      g.append('rect').attr('class','bg').attr('x',bx-4).attr('y',0).attr('width',bw+8).attr('height',H+m.t+m.b);
      const r=g.append('rect').attr('class','m').attr('x',bx).attr('width',bw).style('fill',d.color).attr('rx',2);
      if(d.outline)r.style('stroke','var(--fg)').style('stroke-width',1.5).style('stroke-dasharray','4 3');
      if(first&&!reduce&&!done){r.attr('y',m.t+H).attr('height',0)}else{r.attr('y',m.t+y(v)).attr('height',hh)}
      r.node().__t=[m.t+y(v),hh];
      g.append('g').attr('class','vl').append('text').attr('x',bx+bw/2).attr('y',m.t+y(v)-6).attr('text-anchor','middle').text(d.v==null?'–':(o.labelFmt?o.labelFmt(d.v,narrow):fmt(d.v)));
      g.append('g').attr('class','ax').append('text').attr('x',bx+bw/2).attr('y',m.t+H+17).attr('text-anchor','middle').text(narrow&&d.short?d.short:d.label);
      const node=g.node();
      bindTip(node,()=>d.tip);
      node.addEventListener('mouseenter',()=>setHover(d.k));node.addEventListener('mouseleave',()=>setHover(null));
      node.addEventListener('focus',()=>setHover(d.k));node.addEventListener('blur',()=>setHover(null));
      node.addEventListener('click',()=>setSel(d.k));
      node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSel(d.k)}});
      if(selKey===d.k)node.classList.add('sel');
    });
    if(first&&!reduce){
      const run=()=>{done=true;svg.selectAll('rect.m').each(function(){const t=this.__t;d3.select(this).transition().duration(750).attr('y',t[0]).attr('height',t[1])})};
      onView(el,run);
    }
    first=false;
  }
  const ref={el,draw,get sel(){return selKey}};
  grp.push(ref);draw();
  let rt;new ResizeObserver(()=>{clearTimeout(rt);rt=setTimeout(()=>{if(Math.abs((ref.w||0)-el.clientWidth)>2){ref.w=el.clientWidth;draw()}},120)}).observe(el);
  ref.w=el.clientWidth;
  return ref;
}

/* ---------- 1. postulantes y tasa de ingreso ---------- */
(function(){
  const E=D.exams;
  $('#k-pct').textContent=sgn(D.years.pct,1)+'%';
  $('#k-txt').innerHTML=`más postulantes inscritos en San Marcos en 2026 que en 2023: de <b>${fmt(D.years.ins[0])}</b> a <b>${fmt(D.years.ins[3])}</b>, sumando los dos exámenes de cada año. Durante 2024 se estableció un piso mínimo de 900 puntos para ingresar y se permitió tener una segunda opción de carrera.`;
  const grp=[];
  const def='Pasa el cursor o toca una columna para ver el detalle de cada examen.';
  const dl=$('#d-v1');
  let selK=null;
  const txt=k=>{const e=E.find(x=>x.ex===k);return `<b>${e.ex}</b>: ${fmt(e.ins)} postulantes inscritos, ${fmt(e.ing)} ingresantes y una tasa de ingreso de <b>${f1(e.tasa)}%</b>.`};
  const show=k=>{if(k==null){dl.innerHTML=selK?txt(selK):def;return}dl.innerHTML=txt(k)};
  const tipf=e=>`<strong>${e.ex}</strong>${fmt(e.ins)} postulantes inscritos<br>${fmt(e.ing)} ingresantes<br>Tasa de ingreso: <span class="u">${f1(e.tasa)}%</span>${e.ex.startsWith('2024')?'<br>Con piso mínimo de 900 puntos':''}`;
  const common={group:grp,onHover:show,onSel:k=>{selK=k;show(null)}};
  colChart('#c-ins',Object.assign({},common,{h:120,aria:'Postulantes inscritos por examen',labelFmt:(v,n)=>n?(v/1000).toFixed(1)+'k':fmt(v),
    items:E.map(e=>({k:e.ex,label:e.ex,short:e.ex.slice(2),v:e.ins,color:regime(e.ex),tip:tipf(e),aria:`${e.ex}: ${fmt(e.ins)} postulantes inscritos`}))}));
  colChart('#c-tasa',Object.assign({},common,{h:120,aria:'Tasa de ingreso por examen',labelFmt:v=>f1(v)+'%',
    items:E.map(e=>({k:e.ex,label:e.ex,short:e.ex.slice(2),v:e.tasa,color:regime(e.ex),tip:tipf(e),aria:`${e.ex}: tasa de ingreso ${f1(e.tasa)}%`}))}));
})();

/* ---------- barras (2 y 3) ---------- */
function barRows(sel,rows){
  const el=$(sel);const mx=Math.max(...rows.map(r=>Math.abs(r.p)));
  el.innerHTML=rows.map((r,i)=>`<div class="bar-row${r.ref?' ref':''}" role="listitem" tabindex="0" data-i="${i}"><div class="bar-name">${r.n}<small>${fmt(r.a)} → ${fmt(r.b)}</small></div><div class="bar-track"><div class="bar-fill" data-w="${Math.abs(r.p)/mx*100}" style="background:${r.color}"></div></div><div class="bar-val">${sgn(r.p)}%</div></div>`).join('');
  const els=[...el.querySelectorAll('.bar-row')];
  els.forEach((row,i)=>{const r=rows[i];
    bindTip(row,()=>`<strong>${r.n}</strong>${fmt(r.a)} postulantes inscritos en 2023<br>${fmt(r.b)} postulantes inscritos en 2026<br>Variación: <span class="u">${sgn(r.p)}%</span> (${sgn(r.b-r.a)} postulantes)`);
    const hv=on=>{el.classList.toggle('hov',on);row.classList.toggle('on',on)};
    row.addEventListener('mouseenter',()=>hv(true));row.addEventListener('mouseleave',()=>hv(false));
    row.addEventListener('focus',()=>hv(true));row.addEventListener('blur',()=>hv(false));
    const tg=()=>row.classList.toggle('sel');
    row.addEventListener('click',tg);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tg()}});
  });
  const fill=()=>el.querySelectorAll('.bar-fill').forEach(f=>f.style.width=f.dataset.w+'%');
  if(reduce)fill();else onView(el,()=>requestAnimationFrame(fill));
}
barRows('#m-cae',D.cae.map(r=>({n:r.n,a:r.a,b:r.b,p:r.p,color:['Comunicación Social','Ingeniería de Software','Ingeniería de Sistemas'].includes(r.n)?'var(--rust)':'var(--sand)'})));
barRows('#m-sube',D.sube.map((r,i)=>({n:r.n,a:r.a,b:r.b,p:r.p,ref:r.k!=='c',color:r.k!=='c'?'var(--g4)':i<3?'var(--dark)':'var(--sand)'})));

/* ---------- 4. cien personas ---------- */
(function(){
  const P=D.people,svg=d3.select('#pop-svg'),cw=30,ch=37;
  const wrapEl=$('.pop-wrap'),svgEl=$('#pop-svg');
  svg.attr('viewBox',`0 0 ${10*cw} ${10*ch}`);
  const st={y:'2026',hov:null,pin:null};
  const cat=y=>{const n=P.map(p=>y==='2023'?p.n23:p.n26),out=[];n.forEach((c,i)=>{for(let j=0;j<c;j++)out.push(i)});return out};
  const gs=svg.selectAll('g.pp').data(d3.range(100)).enter().append('g').attr('class','pp').attr('transform',i=>`translate(${(i%10)*cw},${Math.floor(i/10)*ch})`).attr('tabindex',-1);
  gs.append('rect').attr('class','hit').attr('x',0).attr('y',0).attr('width',cw).attr('height',ch);
  const body=gs.append('g').attr('class','pb');
  body.append('circle').attr('cx',15).attr('cy',9).attr('r',6.6);
  body.append('path').attr('d','M5 34 C5 22 9 17.5 15 17.5 C21 17.5 25 22 25 34 Z');
  const ul=$('#pop-leg');
  ul.innerHTML=P.map((p,i)=>`<li class="lg" data-i="${i}" tabindex="0" role="button"><i style="background:var(--c${i})"></i><span class="nm">${p.n}<small></small></span><span class="nv"></span></li>`).join('');
  const lgs=[...ul.querySelectorAll('.lg')];
  const hl=()=>st.pin!=null?st.pin:st.hov;
  /* el final de las figuras llega hasta el final de "Otras carreras" */
  function sync(){
    if(innerWidth<=760){wrapEl.classList.remove('sync');wrapEl.style.gridTemplateColumns='';svgEl.style.width='';svgEl.style.height='';return}
    wrapEl.classList.add('sync');
    let w=Math.min(wrapEl.clientWidth*.46,440);
    for(let k=0;k<4;k++){
      wrapEl.style.gridTemplateColumns=`${Math.round(w)}px minmax(0,1fr)`;
      const nw=Math.min(Math.round(ul.offsetHeight*cw/ch),460);
      if(Math.abs(nw-w)<2){w=nw;break}w=nw;
    }
    svgEl.style.width=Math.round(w)+'px';svgEl.style.height=Math.round(w*ch/cw)+'px';
  }
  function paint(delay,resync){
    const c=cat(st.y),h=hl();
    gs.each(function(i){const k=c[i];d3.select(this).datum(i).attr('data-c',k);
      d3.select(this).selectAll('circle,path').style('fill',`var(--c${k})`).style('transition-delay',delay?(i*7)+'ms':'0ms').style('opacity',h==null||h===k?1:.16)});
    lgs.forEach((li,i)=>{const p=P[i],d=p.p26-p.p23;
      li.querySelector('.nv').textContent=st.y==='2023'?p.n23:p.n26;
      const cur=st.y==='2023'?p.p23:p.p26,oth=st.y==='2023'?`2026: ${f1(p.p26)}%`:`2023: ${f1(p.p23)}%`;
      li.querySelector('small').innerHTML=`${f1(cur)}% · ${oth} (<b class="${d>0?'up':'down'}">${sgn(d,1)} pts</b>)`;
      li.classList.toggle('sel',st.pin===i);li.classList.toggle('on',h===i)});
    ul.classList.toggle('hov',h!=null);if(resync)sync();
  }
  function tipOf(i){const p=P[i],d=p.p26-p.p23;return `<strong>${p.n}</strong>2023: ${f1(p.p23)}% de los postulantes (${fmt(p.i23)})<br>2026: ${f1(p.p26)}% (${fmt(p.i26)})<br>Cambio: <span class="u">${sgn(d,1)} puntos</span>`}
  gs.each(function(){const el=this;
    el.addEventListener('mouseenter',e=>{const i=+el.getAttribute('data-c');st.hov=i;paint();showTip(tipOf(i),e)});
    el.addEventListener('mousemove',moveTip);
    el.addEventListener('mouseleave',()=>{st.hov=null;paint();hideTip()});
    el.addEventListener('click',()=>{const i=+el.getAttribute('data-c');st.pin=st.pin===i?null:i;paint()});
  });
  lgs.forEach((li,i)=>{
    li.addEventListener('mouseenter',e=>{st.hov=i;paint();showTip(tipOf(i),e)});
    li.addEventListener('mousemove',moveTip);li.addEventListener('mouseleave',()=>{st.hov=null;paint();hideTip()});
    li.addEventListener('click',()=>{st.pin=st.pin===i?null:i;paint()});
    li.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();st.pin=st.pin===i?null:i;paint()}});
  });
  document.querySelectorAll('.pop-ctrl [data-y]').forEach(b=>b.addEventListener('click',()=>{
    st.y=b.dataset.y;document.querySelectorAll('.pop-ctrl [data-y]').forEach(x=>x.setAttribute('aria-pressed',x===b));paint(true,true)}));
  paint(false,true);
  let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(sync,120)});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(sync);
})();

/* ---------- herramienta ---------- */
(function(){
  const T=D.tool,input=$('#cb-in'),list=$('#cb-list'),btn=$('#cb-btn'),out=$('#tool-out');
  let cur=T.findIndex(t=>t.n==='Medicina Humana'),act=-1,shown=[];
  const ratio=r=>r&&r[1]>0?r[0]/r[1]:null;          /* postulantes inscritos por ingresante */
  function renderList(q){
    const nq=norm(q||'');shown=T.map((t,i)=>({t,i})).filter(x=>!nq||norm(x.t.n).includes(nq));
    list.innerHTML=shown.length?shown.map((x,j)=>`<li role="option" id="op${j}" data-j="${j}" aria-selected="${j===act}"><span class="n">${x.t.n}</span><span class="a">${x.t.a}</span></li>`).join(''):'<li class="cb-empty">No hay carreras con ese nombre.</li>';
  }
  function open(q){renderList(q);list.hidden=false;input.setAttribute('aria-expanded','true')}
  function close(){list.hidden=true;input.setAttribute('aria-expanded','false');act=-1;input.removeAttribute('aria-activedescendant')}
  function pick(i){cur=i;input.value=T[i].n;close();render()}
  input.addEventListener('focus',()=>{input.select();open('')});
  input.addEventListener('input',()=>{act=0;open(input.value)});
  input.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(list.hidden)open(input.value);act=(act+(e.key==='ArrowDown'?1:-1)+shown.length)%Math.max(shown.length,1);renderList(input.value);input.setAttribute('aria-activedescendant','op'+act);const o=list.querySelector('[aria-selected=true]');o&&o.scrollIntoView({block:'nearest'})}
    else if(e.key==='Enter'){e.preventDefault();const s=shown[act>=0?act:0];if(s)pick(s.i)}
    else if(e.key==='Escape'){close();input.value=T[cur].n}
  });
  list.addEventListener('mousedown',e=>{const li=e.target.closest('li[data-j]');if(li){e.preventDefault();pick(shown[+li.dataset.j].i)}});
  btn.addEventListener('click',()=>{if(list.hidden){input.focus();open('')}else{close()}});
  document.addEventListener('click',e=>{if(!e.target.closest('.tool-search')){if(!list.hidden){close();input.value=T[cur].n}}});
  const lab=(v,n)=>n?(v>=10?String(Math.round(v)):f1(v)):f1(v);
  function render(){
    const c=T[cur],r=c.r,r7=r[7],r6=r[6],V=c.v;
    const first=r.findIndex(x=>x&&x[1]>0);
    const p7=ratio(r7),p6=ratio(r6);
    let c1;
    if(p7==null) c1=`<div class="big">—</div><div class="s">${r7?'Sin ingresantes en 2026-II.':'La carrera no tuvo postulantes en 2026-II.'}</div>`;
    else{
      const d=p6!=null?(p7/p6-1)*100:null;
      c1=`<div class="big">${f1(p7)}</div><div class="s">${fmt(r7[0])} postulantes inscritos para ${fmt(r7[1])} ${r7[1]===1?'ingresante':'ingresantes'} en 2026-II.</div>`+
        (p6!=null?`<div class="dl ${d>0?'up':'down'}">${d>0?'▲':'▼'} ${Math.abs(d).toFixed(0)}% frente a 2026-I</div><div class="s">En 2026-I fueron ${f1(p6)} postulantes por ingresante.</div>`:'<div class="s">En 2026-I no hubo ingresantes en esta carrera.</div>');
    }
    const cuts=[],pcs=[],per=[];for(let k=4;k<8;k++){const x=r[k];if(x&&x[2]!=null){cuts.push(x[2]);pcs.push(x[3]);per.push(`${EX[k].slice(2)}: <b>${fmt(x[2])}</b>`)}}
    let c2;
    if(!cuts.length) c2='<div class="big">—</div><div class="s">Sin ingresantes en los exámenes de 2025-I a 2026-II.</div>';
    else{const a=cuts.reduce((s,v)=>s+v,0)/cuts.length,pc=pcs.reduce((s,v)=>s+v,0)/pcs.length;
      c2=`<div class="big">${fmt(a)}</div><div class="s">Promedio del puntaje del último ingresante en ${cuts.length} de los 4 exámenes de 2025-I a 2026-II.</div><div class="s">Superó, en promedio, al <b>${pc.toFixed(0)}%</b> de los postulantes de su carrera que rindieron el examen (todas las sedes).</div><div class="s xs">Por examen · ${per.join(' · ')}</div>`}
    const fv=k=>V[k]==null?'—':fmt(V[k]);
    out.innerHTML=`<div class="fade-in"><div class="tool-head"><h4>${c.n}</h4><span class="chip">${c.a}</span>${c.new?`<span class="chip">Carrera nueva · desde ${EX[first]}</span>`:''}</div>
<div class="tool-cards">
<div class="tcard"><div class="l">Postulantes por ingresante, 2026-II</div>${c1}<div class="chart-box" id="tool-ch1"></div></div>
<div class="tcard"><div class="l">Puntaje promedio para ingresar</div>${c2}</div>
<div class="tcard"><div class="l">Evolución de las vacantes</div><div class="chart-box" id="tool-ch2"></div><div class="s">Vacantes que fijó el reglamento de cada examen (todas las sedes). 2027-I: <b>${fv(8)}</b>; 2026-II: <b>${fv(7)}</b>; 2026-I: <b>${fv(6)}</b>.</div><div class="s xs">En rojo, los exámenes de 2024 (piso de 900 puntos). La columna punteada es la convocatoria 2027-I.</div></div>
</div></div>`;
    const it1=EX.map((e,k)=>{const x=r[k],q=ratio(x);
      const t=x?`<strong>${e}</strong>${fmt(x[0])} postulantes inscritos<br>${fmt(x[1])} ${x[1]===1?'ingresante':'ingresantes'}${q!=null?`<br>Postulantes por ingresante: <span class="u">${f1(q)}</span>`:''}`:`<strong>${e}</strong>La carrera no tuvo postulantes en este examen.`;
      return {k:e,label:e,short:e.slice(2),v:q,color:regime(e),tip:t,aria:`${e}: ${q==null?'sin ingresantes':f1(q)+' postulantes por ingresante'}`}});
    colChart('#tool-ch1',{h:88,items:it1,aria:'Postulantes por ingresante por examen',vmax:Math.max(1,...it1.map(i=>i.v||0))*1.05,labelFmt:lab});
    const it2=EX9.map((e,k)=>{const v=V[k],x=r[k];
      let t;
      if(k===8)t=`<strong>2027-I</strong>${v==null?'Sin dato en el reglamento':`Vacantes del reglamento: <span class="u">${fmt(v)}</span>`}<br>Convocatoria: todavía no hay examen`;
      else if(v!=null)t=`<strong>${e}</strong>Vacantes del reglamento: <span class="u">${fmt(v)}</span>${x?`<br>${fmt(x[1])} ${x[1]===1?'ingresante':'ingresantes'}<br>${fmt(x[0])} postulantes inscritos`:''}`;
      else t=`<strong>${e}</strong>${x?'Esta carrera no figura en el cuadro de vacantes del reglamento de este examen.':'La carrera no se ofreció en este examen.'}`;
      return {k:e,label:e,short:e.slice(2),v:v,color:k===8?'var(--card)':regime(e),outline:k===8,tip:t,aria:`${e}: ${v==null?'sin dato':fmt(v)+' vacantes'}`}});
    colChart('#tool-ch2',{h:88,items:it2,aria:'Vacantes del reglamento por examen',vmax:Math.max(1,...it2.map(i=>i.v||0))*1.05,labelFmt:v=>fmt(v)});
  }
  input.value=T[cur].n;render();
})();

/* ---------- 6. mapa mental de carreras nuevas ---------- */
(function(){
  const N=D.nuevas,box=$('#mm'),dl=$('#d-mm'),TOT=D.nuevas_tot;
  const pc=v=>(v/TOT*100).toFixed(1)+'%';
  const nl=N.reduce((s,a)=>s+a.ls.length,0),share=(TOT/D.years.ins[3]*100).toFixed(1);
  $('#k-new').textContent='+'+fmt(TOT);
  $('#k-newtxt').innerHTML=`postulantes inscritos en <b>${nl}</b> carreras nuevas en 2026: el <b>${share}%</b> de todos los postulantes del año.`;
  const colOf=k=>`var(--ar-${k})`;
  const short=n=>n.replace('Ingeniería','Ing.').replace('Administración','Adm.').replace('Lenguas, Traducción e Interpretación','Lenguas, Traducción e Interpr.').replace('Criminalística Financiera Forense','Criminalística Fin. Forense');
  const wrap=(s,m)=>{const w=s.replace(/-/g,'- ').split(' '),L=[];let c='';w.forEach(x=>{const j=c.endsWith('-')?'':' ';if((c+j+x).trim().length>m&&c){L.push(c);c=x}else c=(c+j+x).trim()});L.push(c);return L};
  let pin=null,hovK=null;
  const defTxt='Pasa el cursor o toca un área o una carrera para ver el detalle.';
  const nodesAll=[];
  const root={depth:0,id:'root',children:[]};nodesAll.push(root);
  N.forEach(a=>{const an={depth:1,id:a.k,data:a,parent:root,children:[]};root.children.push(an);nodesAll.push(an);
    a.ls.forEach(l=>{const ln={depth:2,id:a.k+'|'+l.n,data:l,parent:an};an.children.push(ln);nodesAll.push(ln)})});
  const byId=id=>nodesAll.find(n=>n.id===id);
  function info(d){
    if(d.depth===0)return `<b>${nl} carreras nuevas</b> sumaron <b>${fmt(TOT)}</b> postulantes en 2026, el <b>${share}%</b> de todos los postulantes del año. Nuevas = sin postulantes en 2023.`;
    if(d.depth===1)return `<b>${d.data.a}</b>: ${d.data.ls.length} ${d.data.ls.length===1?'carrera nueva':'carreras nuevas'} con <b>${fmt(d.data.tot)}</b> postulantes en 2026, el <b>${pc(d.data.tot)}</b> de los postulantes de las carreras nuevas.`;
    return `<b>${d.data.n}</b>: <b>${fmt(d.data.ins)}</b> postulantes en 2026 (<b>${pc(d.data.ins)}</b> de los de las carreras nuevas) y ${fmt(d.data.ing)} ingresantes. Apareció en ${d.data.deb}.`;
  }
  function tipOf(d){
    if(d.depth===0)return `<strong>${nl} carreras nuevas</strong>${fmt(TOT)} postulantes en 2026<br>${share}% de todos los postulantes`;
    if(d.depth===1)return `<strong>${d.data.a}</strong>${d.data.ls.length} carreras · ${fmt(d.data.tot)} postulantes<br>${pc(d.data.tot)} de los de las carreras nuevas`;
    return `<strong>${d.data.n}</strong>${fmt(d.data.ins)} postulantes en 2026 (${pc(d.data.ins)})<br>${fmt(d.data.ing)} ingresantes en 2026<br>Debutó en ${d.data.deb}`;
  }
  function layout(W){
    const wide=W>=720,SP=wide?60:58,GAP=wide?44:30;
    if(wide){
      const L=W/2-200,A=Math.min(170,L*.58),cx=W/2;
      const side={r:[],l:[]},cnt={r:0,l:0};
      root.children.forEach(a=>{const s=cnt.r<=cnt.l?'r':'l';side[s].push(a);cnt[s]+=a.children.length});
      const hs=s=>side[s].reduce((t,a)=>t+a.children.length*SP,0)+Math.max(0,side[s].length-1)*GAP;
      const H=Math.max(hs('r'),hs('l'))+110;
      ['r','l'].forEach(s=>{let y=(H-hs(s))/2,dir=s==='r'?1:-1;
        side[s].forEach(a=>{const y0=y;a.children.forEach((l,i)=>{l.px=cx+dir*L;l.py=y+SP*(i+.5);l.side=s});y+=a.children.length*SP+GAP;a.px=cx+dir*A;a.py=(y0+y-GAP)/2;a.side=s})});
      root.px=cx;root.py=H/2;return{H,wide,R:56}
    }
    let y=16;root.children.forEach(a=>{const y0=y;a.children.forEach(l=>{l.py=y+SP/2;y+=SP;l.px=W-176});const need=a.children.length*SP;if(need<112)y+=(112-need);a.py=(y0+y-(need<112?(112-need):0))/2;if(need<112)a.py=y0+need/2-6;a.px=(W-176)*.5+30;y+=GAP});
    root.px=34;root.py=(root.children[0].py+root.children.at(-1).py)/2;return{H:y+6,wide,R:32}
  }
  function draw(){
    const W=Math.max(box.clientWidth,300);box.innerHTML='';
    const {H,wide,R}=layout(W);
    const rl=d3.scaleSqrt().domain([0,1200]).range([5,wide?24:15]),ra=d3.scaleSqrt().domain([0,3800]).range([wide?17:13,wide?36:24]);
    const rOf=d=>d.depth===0?R:d.depth===1?ra(d.data.tot):rl(d.data.ins);
    const svg=d3.select(box).append('svg').attr('viewBox',`0 0 ${W} ${H}`).attr('height',H).attr('role','img').attr('aria-label','Mapa mental de las carreras nuevas por área');
    const links=[];nodesAll.forEach(n=>{if(n.parent)links.push({s:n.parent,t:n})});
    const ln=svg.selectAll('path.mm-link').data(links).enter().append('path').attr('class','mm-link')
      .attr('d',l=>{const x0=l.s.px,y0=l.s.py,x1=l.t.px,y1=l.t.py,xm=(x0+x1)/2;return `M${x0},${y0}C${xm},${y0} ${xm},${y1} ${x1},${y1}`})
      .style('stroke-width',l=>l.t.depth===1?3:2);
    const nodes=svg.selectAll('g.mm-node').data(nodesAll).enter().append('g').attr('class','mm-node').attr('transform',d=>`translate(${d.px},${d.py})`).attr('tabindex',0).attr('role','button').attr('aria-label',d=>d.depth===0?'Carreras nuevas':d.depth===1?d.data.a:d.data.n);
    nodes.append('circle').attr('r',rOf).style('fill',d=>d.depth===0?'var(--fg)':colOf(d.depth===1?d.data.k:d.parent.data.k)).style('opacity',d=>d.depth===2?.92:1);
    nodes.filter(d=>d.depth===0).append('text').attr('text-anchor','middle').style('fill','var(--bg)').style('font','700 '+(wide?16:11)+'px Georgia,serif')
      .selectAll('tspan').data([nl+' carreras','nuevas']).enter().append('tspan').attr('x',0).attr('dy',(t,i)=>i?(wide?18:12):(wide?-2:-1)).text(t=>t);
    nodes.filter(d=>d.depth===1).append('text').attr('text-anchor','middle').attr('dy',5).style('fill','#fff').style('font','700 '+(wide?14:12)+'px Arial').text(d=>d.data.ls.length);
    const al=nodes.filter(d=>d.depth===1).append('text').style('font','700 '+(wide?12.5:11)+'px Arial').style('fill','var(--fg)').style('paint-order','stroke').style('stroke','var(--panel)').style('stroke-width',4).attr('text-anchor','middle').attr('y',d=>ra(d.data.tot)+16);
    al.selectAll('tspan').data(d=>[...wrap(d.data.a,wide?18:14),pc(d.data.tot)+' de las nuevas']).enter().append('tspan').attr('x',0).attr('dy',(t,i)=>i?14:0).style('font-weight',function(t){return/de las nuevas$/.test(t)?400:700}).text(t=>t);
    nodes.filter(d=>d.depth===2).each(function(d){
      const lines=wrap(short(d.data.n),wide?30:22),r=rl(d.data.ins);
      let anchor='start',dx=r+9;if(wide&&d.side==='l'){anchor='end';dx=-(r+9)}
      const t=d3.select(this).append('text').attr('class','mm-lbl').attr('text-anchor',anchor).style('font-size',wide?'12.5px':'11px');
      const tot=lines.length+1;
      lines.forEach((ln_,i)=>t.append('tspan').attr('x',dx).attr('y',(i-tot/2+.5)*14+4).text(ln_));
      t.append('tspan').attr('class','v').attr('x',dx).attr('y',(tot/2-.5)*14+4).text(`${fmt(d.data.ins)} postulantes · ${pc(d.data.ins)}`);
    });
    function apply(){
      const a=pin||hovK;box.classList.toggle('hov',!!a);
      nodes.classed('on',false);ln.classed('on',false);
      if(a){const sel=byId(a),area=sel.depth===0?null:sel.depth===1?sel:sel.parent;
        const on=n=>n.depth===0||sel.depth===0||(area&&(n===area||n===sel||(sel.depth===1&&n.parent===area)));
        nodes.classed('on',on);ln.classed('on',l=>sel.depth===0||(area&&(l.t===area||l.t===sel||(sel.depth===1&&l.s===area))))}
      nodes.classed('sel',n=>pin&&n.id===pin);
    }
    nodes.each(function(d){const el=this;
      bindTip(el,()=>tipOf(d));
      el.addEventListener('mouseenter',()=>{hovK=d.id;apply();dl.innerHTML=info(d)});
      el.addEventListener('mouseleave',()=>{hovK=null;apply();dl.innerHTML=pin?info(byId(pin)):defTxt});
      el.addEventListener('focus',()=>{hovK=d.id;apply()});el.addEventListener('blur',()=>{hovK=null;apply()});
      const tg=()=>{pin=pin===d.id?null:d.id;apply();dl.innerHTML=pin?info(d):defTxt};
      el.addEventListener('click',tg);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tg()}});
    });
    apply();
    if(!reduce&&!draw.done){nodes.style('opacity',0);ln.style('opacity',0);
      const show=()=>{draw.done=true;ln.transition().duration(500).style('opacity',1);nodes.transition().duration(600).delay(d=>d.depth*220).style('opacity',1).on('end',function(){this.style.opacity=''})};
      onView(box,show);pending.push(()=>{nodes.style('opacity','');ln.style('opacity','')})}
  }
  draw();let rt,lw=box.clientWidth;
  new ResizeObserver(()=>{clearTimeout(rt);rt=setTimeout(()=>{const w=box.clientWidth;if(Math.abs(w-lw)>2){lw=w;draw()}},150)}).observe(box);
})();

/* ---------- 7. Sistemas y Software ---------- */
(function(){
  const P=D.puerta,box=$('#m-puerta');
  box.innerHTML=P.map((p,i)=>{
    const dIns=(p.ins26/p.ins23-1)*100,dI=(p.ing_c/p.ing_a-1)*100,dT=(p.t_c/p.t_a-1)*100;
    return `<div class="panel"><h4 class="panel-title">${p.n}</h4>
<div class="metric"><div class="l">Postulantes inscritos, 2023 → 2026</div><div class="v">${fmt(p.ins23)} → ${fmt(p.ins26)}</div><div class="d down">${sgn(dIns,0)}%</div></div>
<div class="metric"><div class="l">Ingresantes por examen (promedio)</div><div class="v">${f1(p.ing_a)} → ${f1(p.ing_c)}</div><div class="d down">${sgn(dI,0)}%</div></div>
<div class="metric"><div class="l">Tasa de ingreso, 2023 → 2025-26</div><div class="v">${f1(p.t_a)}% → ${f1(p.t_c)}%</div><div class="d down">${sgn(dT,0)}%</div></div>
<div class="chart-title">Tasa de ingreso por examen</div><div class="chart-box" id="pc${i}"></div></div>`}).join('');
  P.forEach((p,i)=>{
    const items=p.ser.map(s=>({k:s.ex,label:s.ex,short:s.ex.slice(2),v:s.t,color:regime(s.ex),
      tip:`<strong>${p.n} · ${s.ex}</strong>${fmt(s.ins)} postulantes inscritos<br>${fmt(s.ing)} ingresantes<br>Tasa de ingreso: <span class="u">${f1(s.t)}%</span>${s.ex.startsWith('2024')?'<br>Con piso mínimo de 900 puntos':''}`,aria:`${p.n} ${s.ex}: tasa de ingreso ${f1(s.t)}%`}));
    colChart('#pc'+i,{h:110,items,aria:`Tasa de ingreso de ${p.n} por examen`,labelFmt:v=>f1(v)+'%'});
  });
  $('#m-callout').textContent='En las otras siete carreras grandes que perdieron 15% o más de sus postulantes, la tasa de ingreso subió.';
})();
})();
