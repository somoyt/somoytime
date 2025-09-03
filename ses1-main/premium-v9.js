
// === Premium v9 JS ===
(function(){
  function qs(s,root){ return (root||document).querySelector(s); }
  function qsa(s,root){ return (root||document).querySelectorAll(s); }

  // Attach assets once
  function ensureHeaderEnhance(){
    const header = qs('.site-header');
    if(!header) return;

    // Wrap nav list with panel for mobile slide-down
    const nav = qs('#primaryNav') || qs('.nav');
    if(nav && !qs('.nav-panel', nav)){
      const ul = qs('ul', nav);
      if(ul){
        const panel = document.createElement('div');
        panel.className = 'nav-panel';
        ul.parentNode.insertBefore(panel, ul);
        panel.appendChild(ul);
        nav.id = nav.id || 'primaryNav';
      }
    }

    // Hamburger button
    if(!qs('.hamburger', header)){
      const btn = document.createElement('button');
      btn.className = 'hamburger';
      btn.setAttribute('aria-label','Toggle menu');
      btn.setAttribute('aria-expanded','false');
      btn.setAttribute('aria-controls','primaryNav');
      btn.textContent = '☰';
      header.querySelector('.header-inner') ? header.querySelector('.header-inner').prepend(btn) : header.prepend(btn);
    }

    // Brand tighten: সময়🌍টাইম
    let brand = qs('.brand', header);
    if(!brand){
      brand = document.createElement('a');
      brand.className = 'brand';
      brand.href = '/';
      brand.innerHTML = 'সময়<span class="earth"></span>টাইম';
      header.querySelector('.header-inner') ? header.querySelector('.header-inner').appendChild(brand) : header.appendChild(brand);
    }else{
      brand.innerHTML = 'সময়<span class="earth"></span>টাইম';
    }

    // Theme toggle
    if(!qs('#themeToggle', header)){
      const t = document.createElement('button');
      t.id = 'themeToggle';
      t.className = 'theme-toggle';
      t.setAttribute('aria-label','Toggle dark mode');
      t.textContent = '🌓';
      header.appendChild(t);
    }
  }

  function toggleNavInit(){
    const burger = qs('.hamburger');
    const nav = qs('#primaryNav') || qs('.nav');
    if(burger && nav){
      burger.addEventListener('click', ()=>{
        nav.classList.toggle('open');
        burger.setAttribute('aria-expanded', nav.classList.contains('open')?'true':'false');
      });
    }
  }

  function themeInit(){
    const key='somoy_theme';
    const saved = localStorage.getItem(key);
    if(saved){ document.documentElement.setAttribute('data-theme', saved); }
    const t = qs('#themeToggle');
    if(t){
      t.addEventListener('click', ()=>{
        const cur = document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
        document.documentElement.setAttribute('data-theme', cur);
        localStorage.setItem(key, cur);
      });
    }
  }

  function addBreaking(){
    if(qs('.breaking-wrap')) return;
    const after = qs('.site-header');
    if(!after) return;
    const sec = document.createElement('section');
    sec.className = 'breaking-wrap';
    sec.innerHTML = '<div class="container"><div class="breaking-label">Breaking</div><div class="breaking-ticker" id="breakingTicker"></div></div>';
    after.insertAdjacentElement('afterend', sec);

    // Populate ticker
    const cont = qs('#breakingTicker');
    let items = [];
    if(window.ARTICLES && Array.isArray(window.ARTICLES) && window.ARTICLES.length){
      items = window.ARTICLES.slice(0,8).map(a=>({title:a.title, url: a.url || ('article.html?id='+a.id)}));
    }else{
      qsa('.article-title a, h2 a').forEach(a=>{
        if(a.textContent.trim()) items.push({title:a.textContent.trim(), url:a.getAttribute('href')||'#'});
      });
      items = items.slice(0,8);
    }
    if(!items.length){ sec.style.display='none'; return; }
    cont.innerHTML = items.map((it,i)=>`<span class="item"><a href="${it.url}">${it.title}</a></span>${i<items.length-1?'<span class="dot"></span>':''}`).join('');
  }

  // Timeago in Bangla + "গতকাল"
  function timeagoInit(){
    function bn(n){return String(n).replace(/[0-9]/g, d=>'০১২৩৪৫৬৭৮৯'[+d]);}
    function pad2(n){return (n<10?'0':'')+n;}
    function dstr(d){return pad2(d.getDate())+'-'+pad2(d.getMonth()+1)+'-'+d.getFullYear();}
    function isYesterday(d){
      const now=new Date(); const y=new Date(now); y.setDate(now.getDate()-1);
      y.setHours(0,0,0,0); const y2=new Date(y); y2.setHours(23,59,59,999);
      return d>=y && d<=y2;
    }
    function ago(then){
      const now=new Date(); const diff=(now-then)/1000, H=3600, M=60;
      if(diff<1) return 'এইমাত্র';
      if(diff<60) return bn(Math.floor(diff))+' সেকেন্ড আগে';
      if(diff<23*H){
        const h=Math.floor(diff/H), m=Math.floor((diff%H)/M);
        if(h>0 && m>0) return bn(h)+' ঘন্টা '+bn(m)+' মিনিট আগে';
        if(h>0) return bn(h)+' ঘন্টা আগে';
        return bn(m)+' মিনিট আগে';
      }
      if(isYesterday(then)) return 'গতকাল';
      return dstr(then);
    }
    function run(){
      qsa('[data-published]').forEach(el=>{
        const ts=el.getAttribute('data-published'); const d=new Date(ts);
        if(!isNaN(d)) el.textContent=ago(d);
      });
    }
    run(); setInterval(run, 1000);
  }

  // Wrap standalone images with .ratio for 16:9
  function ratioWrap(root){
    qsa('img:not([data-no-ratio])', root||document).forEach(img=>{
      if(img.closest('.ratio')) return;
      const span = document.createElement('span');
      span.className='ratio';
      img.parentNode.insertBefore(span, img);
      span.appendChild(img);
    });
  }

  // Social share on article pages + related
  function enhanceArticle(){
    const isArticle = /article|post|single/i.test(location.pathname) || !!qs('article .article-title, .single-article');
    if(!isArticle) return;

    // Share
    if(!qs('.share-buttons')){
      const share = document.createElement('div');
      share.className='share-buttons';
      share.innerHTML = `
        <a class="share fb" target="_blank" rel="noopener">Facebook</a>
        <a class="share tw" target="_blank" rel="noopener">Twitter</a>
        <a class="share wa" target="_blank" rel="noopener">WhatsApp</a>`;
      (qs('.article-title')||document.body).insertAdjacentElement('afterend', share);
      const u=encodeURIComponent(location.href), t=encodeURIComponent(document.title);
      qs('.share.fb').href='https://www.facebook.com/sharer/sharer.php?u='+u;
      qs('.share.tw').href='https://twitter.com/intent/tweet?url='+u+'&text='+t;
      qs('.share.wa').href='https://wa.me/?text='+t+'%20'+u;
    }

    // Related
    if(!qs('#related')){
      const rel = document.createElement('section');
      rel.className='related'; rel.id='related';
      rel.innerHTML='<div class="container"><h3>আরও পড়ুন</h3><div class="related-grid" id="relatedGrid"></div></div>';
      document.body.appendChild(rel);
    }
    const grid = qs('#relatedGrid');
    if(grid && window.ARTICLES && Array.isArray(window.ARTICLES)){
      const curId = new URLSearchParams(location.search).get('id');
      const cur = window.ARTICLES.find(a=>String(a.id)===String(curId));
      const cat = cur && cur.category;
      const pool = window.ARTICLES.filter(a=>String(a.id)!==String(curId));
      const items = (cat? pool.filter(a=>a.category===cat):pool).slice(0,6);
      grid.innerHTML = items.map(a=>`
        <a class="rel" href="${a.url || ('article.html?id='+a.id)}">
          <div class="ratio"><img src="${a.image||''}" alt=""></div>
          <div class="t">${a.title||''}</div>
        </a>`).join('');
    }
  }

  // Deduplicate search inputs & footer taglines
  function deDupe(){
    const inputs = qsa('input[type="search"]');
    if(inputs.length>1){
      inputs.forEach((el,i)=>{ if(i>0){ el.classList.add('dup-hide'); } });
    }
    // Remove duplicate brand texts if repeated back-to-back
    const brands = qsa('.brand');
    if(brands.length>1){
      for(let i=1;i<brands.length;i++){
        if(brands[i].textContent.trim()===brands[0].textContent.trim()){
          brands[i].classList.add('dup-hide');
        }
      }
    }
    // Footer newspaper line duplication
    const notes = qsa('.footer-note');
    if(notes.length>1){
      for(let i=1;i<notes.length;i++){ notes[i].classList.add('dup-hide'); }
    }
  }

  // Init
  document.addEventListener('DOMContentLoaded', function(){
    ensureHeaderEnhance();
    toggleNavInit();
    themeInit();
    addBreaking();
    timeagoInit();
    ratioWrap();
    enhanceArticle();
    deDupe();
  });
})();
