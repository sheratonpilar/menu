(function(){
var qs=new URLSearchParams(location.search);
var CARTA=document.body.dataset.carta||qs.get('carta');
var BASE=document.body.dataset.base||'';
var LANGS=['es','en','pt'];
var lang=LANGS.indexOf(qs.get('lang'))>=0?qs.get('lang'):'es';
var data=null,app=document.getElementById('app'),bar=document.getElementById('bar');
var UI={es:{buscar:'Buscar un plato…',sin:'No encontramos nada con eso.',act:'Actualizado',ver:'Ver la carta de vinos',verSub:'Tintos, blancos, espumantes y más'},
en:{buscar:'Search a dish…',sin:'Nothing matches that.',act:'Updated',ver:'See the wine list',verSub:'Reds, whites, sparkling and more'},
pt:{buscar:'Buscar um prato…',sin:'Nada encontrado.',act:'Atualizado',ver:'Ver a carta de vinhos',verSub:'Tintos, brancos, espumantes e mais'}};
function t(o){if(!o)return'';return o[lang]||o.es||''}
function precio(v){if(v==='CONSULTAR')return t({es:'Consultar',en:'Ask us',pt:'Consultar'});return'$ '+Number(v).toLocaleString('es-AR',{maximumFractionDigits:0})}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function norm(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
if(window.__DATA__){data=window.__DATA__;render();}
else{fetch(BASE+'data/'+CARTA+'.json?v='+Date.now()).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){data=d;render()}).catch(function(){app.innerHTML='<p class="empty">No pudimos cargar la carta.</p>'})}

function logoHTML(c,cls){
  if(c.logo)return '<img class="'+cls+'" src="'+BASE+'assets/img/logos/'+esc(c.logo)+'" alt="'+esc(c.nombre)+'">';
  return '<div class="'+cls+' '+cls+'--txt">'+esc(c.nombre)+'</div>';
}

function render(){
var c=data.carta;document.body.dataset.tema=c.tema;document.title=c.nombre;
var idiomas=c.idiomas||['es'];
// Barra compacta (sticky): ident oculto hasta scrollear + idioma + buscador + chips
bar.innerHTML=
 (idiomas.length>1?'<div class="bar__lang">'+idiomas.map(function(l){return'<button data-lang="'+l+'" aria-pressed="'+(l===lang)+'">'+l+'</button>'}).join('')+'</div>':'')+
 '<div class="bar__ident">'+logoHTML(c,'bar__logo')+'<h1 class="bar__name">'+esc(c.nombre)+'</h1></div>'+
 '<div class="search"><input id="q" type="search" autocomplete="off" placeholder="'+esc(UI[lang].buscar)+'"></div>'+
 '<nav class="chips" id="chips">'+data.secciones.map(function(s){return'<a href="#'+s.id+'">'+esc(t(s.nombre))+'</a>'}).join('')+'</nav>';
bar.querySelectorAll('.bar__lang button').forEach(function(b){b.addEventListener('click',function(){lang=b.dataset.lang;qs.set('lang',lang);history.replaceState(null,'','?'+qs.toString());render()})});
bar.querySelector('#q').addEventListener('input',function(e){filtrar(e.target.value)});
paint(data.secciones);spy();watchHero();}

function heroHTML(){
var c=data.carta;
return '<div class="hero2" id="hero">'+logoHTML(c,'hero2__logo')+
 '<h1 class="hero2__name">'+esc(c.nombre)+'</h1>'+
 (t(c.descripcion)?'<p class="hero2__desc">'+esc(t(c.descripcion))+'</p>':'')+
 '</div>';
}

function paint(secciones){
var c=data.carta;
var fecha=new Date(c.actualizado).toLocaleDateString(lang==='en'?'en-GB':lang==='pt'?'pt-BR':'es-AR');
var html=heroHTML()+'<div class="wrap">';
if(!secciones.length){app.innerHTML=html+'<p class="empty">'+esc(UI[lang].sin)+'</p></div>';watchHero();return;}
secciones.forEach(function(s){
html+='<section class="sec" id="'+s.id+'">';
if(s.foto)html+='<img class="sec__foto" src="'+BASE+'assets/img/secciones/'+esc(s.foto)+'" alt="" loading="lazy" onerror="this.remove()">';
html+='<h2 class="sec__title">'+esc(t(s.nombre))+'</h2>';
if(t(s.nota))html+='<p class="sec__note">'+esc(t(s.nota))+'</p>';
html+='<hr class="sec__rule">';
s.items.forEach(function(i){
html+='<article class="item"><div class="item__head"><span class="item__name">'+esc(t(i.nombre))+'</span><span class="item__dots"></span><span class="item__price">'+esc(precio(i.precio))+'</span></div>';
if(t(i.descripcion))html+='<p class="item__desc">'+esc(t(i.descripcion))+'</p>';
if(i.tags&&i.tags.length)html+='<div class="item__tags">'+i.tags.map(function(tg){var l=data.tags[tg]?t(data.tags[tg]):tg;return'<span class="tag tag--'+tg.toLowerCase()+'">'+esc(l)+'</span>'}).join('')+'</div>';
html+='</article>';});
html+='</section>';});
var vt=c.ver_tambien;
html+='<footer class="foot">'+
 (vt?'<a class="vinos-btn" href="'+BASE+'carta/'+esc(vt)+'/">'+esc(UI[lang].ver)+'<small>'+esc(UI[lang].verSub)+'</small></a>':'')+
 (t(c.pie)?'<p>'+esc(t(c.pie))+'</p>':'')+'<p>'+esc(UI[lang].act)+': '+fecha+'</p></footer></div>';
app.innerHTML=html;
watchHero();
}

// La barra pasa a "compact" (muestra logo+nombre) cuando la portada se scrolleó fuera de vista.
function watchHero(){
var hero=document.getElementById('hero');
if(!hero){bar.classList.add('compact');return;}
if(!('IntersectionObserver'in window)){return;}
if(window.__heroObs)window.__heroObs.disconnect();
window.__heroObs=new IntersectionObserver(function(es){
  es.forEach(function(e){ bar.classList.toggle('compact', !e.isIntersecting); });
},{rootMargin:'-60px 0px 0px 0px'});
window.__heroObs.observe(hero);
}

function filtrar(q){var n=norm(q.trim());if(!n){paint(data.secciones);spy();return;}
var res=data.secciones.map(function(s){var items=s.items.filter(function(i){return norm(t(i.nombre)+' '+t(i.descripcion)).indexOf(n)>=0});return items.length?Object.assign({},s,{items:items,foto:''}):null}).filter(Boolean);paint(res);}
function spy(){var chips=document.querySelectorAll('#chips a');if(!('IntersectionObserver'in window))return;
var obs=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;chips.forEach(function(a){var on=a.getAttribute('href')==='#'+e.target.id;a.setAttribute('aria-current',on);if(on)a.scrollIntoView({block:'nearest',inline:'center'})})})},{rootMargin:'-130px 0px -70% 0px'});
document.querySelectorAll('.sec').forEach(function(s){obs.observe(s)});}
})();
