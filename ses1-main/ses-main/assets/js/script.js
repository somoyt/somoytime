/* Shomoy Time client (JSON fetch) */
(function(){
  const API = window.API_URL;
  const state = { all:[], filtered:[], page:0, pageSize:9, cat:'all', q:'' };

  const $ = (s)=>document.querySelector(s);
  const el = (id)=>document.getElementById(id);

  function wordsOnly(txt, limitWords=28){
    if(!txt) return "";
    const w = String(txt).replace(/<[^>]+>/g,'').split(/\s+/).filter(Boolean);
    return w.slice(0, limitWords).join(' ') + (w.length>limitWords?'…':'');
  }

  async function fetchJSON(url){
    const r = await fetch(url, {mode:'cors'});
    if(!r.ok) throw new Error('HTTP '+r.status);
    return await r.json();
  }

  function storyHTML(n, useLarge=false){
    const img = n.image ? `<div class="thumb"><img src="${n.image}" alt="${n.title}"></div>` : '';
    const sum = n.summary ? wordsOnly(n.summary, 28) : wordsOnly(n.body||n.content, 26);
    const dateTxt = n.published_at || (n.timestamp? new Date(n.timestamp).toLocaleString('bn-BD') : '');
    const cls = useLarge? 'story large':'story';
    return `<article class="${cls}">
      ${img}
      <div>
        <h3><a href="news.html?id=${n.id}">${n.title}</a></h3>
        <p class="sum">${sum}</p>
        <div class="meta">${dateTxt} • ${n.category||'সাধারণ'}</div>
      </div>
    </article>`;
  }

  function paintHome(){
    const lead = el('leadArea'); if(!lead) return;
    const side = el('latestList');
    const start = state.page*state.pageSize, end = start+state.pageSize;
    const slice = state.filtered.slice(start,end);
    if(state.page===0){ lead.innerHTML=''; side.innerHTML=''; }
    if(state.page===0 && slice[0]){
      lead.insertAdjacentHTML('beforeend', storyHTML(slice[0], true));
      slice.slice(1).forEach(s=> lead.insertAdjacentHTML('beforeend', storyHTML(s)));
    }else{
      slice.forEach(s=> lead.insertAdjacentHTML('beforeend', storyHTML(s)));
    }
    const latest = state.all.slice(0,6);
    if(side && state.page===0){
      latest.forEach(s=> side.insertAdjacentHTML('beforeend', storyHTML(s)));
    }
    const hasMore = end < state.filtered.length;
    el('loadMore')?.classList.toggle('hide', !hasMore);
  }

  function applyFilters(){
    const q = state.q.toLowerCase();
    state.filtered = state.all.filter(x=>{
      const catOK = state.cat==='all' || (x.category||'').includes(state.cat);
      const qOK = !q || [x.title,x.summary,x.body,x.category].join(' ').toLowerCase().includes(q);
      return catOK && qOK;
    });
    state.page = 0;
    paintHome();
  }

  async function loadHome(){
    try{
      const data = await fetchJSON(API + "?limit=50");
      state.all = Array.isArray(data) ? data : (data.news||[]);
      state.filtered = state.all.slice();
      paintHome();
    }catch(err){
      console.error('Home load error', err);
      el('leadArea').innerHTML = '<p>খবর লোড করা যাচ্ছে না।</p>';
    }
  }

  async function loadDetail(){
    const id = new URLSearchParams(location.search).get('id');
    const wrap = el('newsDetail'); if(!id||!wrap){ return; }
    try{
      const n = await fetchJSON(API + "?id=" + encodeURIComponent(id));
      const item = n && n.id ? n : (Array.isArray(n)?n[0]:n);
      if(!item || !item.title){ wrap.innerHTML='<p>খবরটি পাওয়া যায়নি।</p>'; return; }
      const dateTxt = item.published_at || (item.timestamp? new Date(item.timestamp).toLocaleString('bn-BD') : '');
      document.title = item.title + ' — সময় টাইম';
      wrap.innerHTML = `
        <h1 class="detail-title">${item.title}</h1>
        <div class="detail-meta">${dateTxt} • ${item.category||'সাধারণ'}</div>
        ${item.image? `<img class="detail-img" src="${item.image}" alt="">` : ''}
        <div class="detail-body">${(item.body||item.content||'').split('\n').map(p=>'<p>'+p+'</p>').join('')}</div>
        <div class="meta"><a target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}">ফেসবুকে শেয়ার</a></div>
      `;
      const rel = await fetchJSON(API + "?limit=12");
      const same = (Array.isArray(rel)?rel:rel.news||[]).filter(x=>x.id!=item.id && (x.category===item.category));
      const grid = el('relatedGrid');
      if(grid){
        grid.innerHTML = same.slice(0,6).map(s=>storyHTML(s)).join('');
      }
    }catch(err){
      console.error('Detail load error', err);
      wrap.innerHTML = '<p>লোড করা যায়নি।</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    if(location.pathname.endsWith('news.html')){ loadDetail(); return; }
    loadHome();
    document.getElementById('navCats')?.addEventListener('click', (e)=>{
      const a = e.target.closest('a'); if(!a) return;
      e.preventDefault();
      Array.from(document.getElementById('navCats').querySelectorAll('a')).forEach(x=>x.classList.remove('active'));
      a.classList.add('active');
      state.cat = a.dataset.cat || 'all';
      state.page = 0;
      document.getElementById('leadArea').innerHTML='';
      applyFilters();
    });
    document.getElementById('searchInput')?.addEventListener('input', (e)=>{
      state.q = e.target.value || '';
      state.page=0;
      document.getElementById('leadArea').innerHTML='';
      applyFilters();
    });
    document.getElementById('loadMore')?.addEventListener('click', ()=>{
      state.page++;
      paintHome();
    });
  });
})();

// === v5 utilities: relative time (1s..23h) then date, and image fit ===
(function(){
  function formatBanglaNum(n){
    const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    return String(n).replace(/[0-9]/g, d => bn[Number(d)]);
  }
  function pad2(n){ return n<10 ? '0'+n : ''+n; }
  function formatDate(d){
    const y=d.getFullYear(), m=pad2(d.getMonth()+1), dd=pad2(d.getDate());
    return `${y}-${m}-${dd}`;
  }
  function timeAgoStr(then){
    const now = new Date();
    const diff = Math.max(0, (now-then)/1000); // seconds
    const H = 3600, M = 60;
    if(diff < 1) return 'এইমাত্র';
    if(diff < 60){
      const s = Math.floor(diff);
      return `${formatBanglaNum(s)} সেকেন্ড আগে`;
    }
    if(diff < 3600*23){
      const h = Math.floor(diff/H);
      const m = Math.floor((diff%H)/M);
      if(h>0 && m>0) return `${formatBanglaNum(h)} ঘন্টা ${formatBanglaNum(m)} মিনিট আগে`;
      if(h>0) return `${formatBanglaNum(h)} ঘন্টা আগে`;
      return `${formatBanglaNum(m)} মিনিট আগে`;
    }
    return formatDate(then);
  }
  function updateAllTimes(){
    document.querySelectorAll('[data-published]').forEach(el=>{
      const ts = el.getAttribute('data-published');
      const d = ts ? new Date(ts) : null;
      if(!d || isNaN(d)) return;
      el.textContent = timeAgoStr(d);
    });
  }
  // Expose for app.js loaders
  window.SOMOY_TIME = Object.assign(window.SOMOY_TIME||{}, {
    attachTime: function(container){
      // expect elements with [data-published] inside container
      updateAllTimes();
      if(!window.__somoyTicker){
        window.__somoyTicker = setInterval(updateAllTimes, 1000);
      }
    },
    ensureImageFit: function(selector){
      document.querySelectorAll(selector||'img').forEach(img=>{
        img.loading = img.loading || 'lazy';
        img.decoding = img.decoding || 'async';
        // no shadow/border; CSS already handles sizes
      });
    }
  });
})();


// After articles render:
document.addEventListener('DOMContentLoaded', function(){
  if(window.SOMOY_TIME && window.SOMOY_TIME.attachTime){
    window.SOMOY_TIME.attachTime(document.body);
    window.SOMOY_TIME.ensureImageFit('img');
  }
});


// === v6 Premium JS ===
(function(){
  function qs(s,root){ return (root||document).querySelector(s); }
  function qsa(s,root){ return (root||document).querySelectorAll(s); }

  // Mobile nav toggle
  const burger = qs('.hamburger');
  const nav = qs('#primaryNav');
  if(burger && nav){
    burger.addEventListener('click', ()=>{
      const opened = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', opened?'true':'false');
    });
  }

  // Dark mode toggle (persist to localStorage)
  const themeBtn = qs('#themeToggle');
  const key='somoy_theme';
  const saved = localStorage.getItem(key);
  if(saved){ document.documentElement.setAttribute('data-theme', saved); }
  if(themeBtn){
    themeBtn.addEventListener('click', ()=>{
      const cur = document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
      document.documentElement.setAttribute('data-theme', cur);
      localStorage.setItem(key, cur);
    });
  }

  // Breaking ticker: Use first few titles on the page (fallback), or global ARTICLES if available
  function populateBreaking(){
    const cont = qs('#breakingTicker');
    if(!cont) return;
    let items = [];
    if(window.ARTICLES && Array.isArray(window.ARTICLES) && window.ARTICLES.length){
      items = window.ARTICLES.slice(0,8).map(a=>({title:a.title, url: a.url || ('article.html?id='+a.id)}));
    }else{
      qsa('.article-title a, h2 a').forEach(a=>{
        if(a.textContent.trim()) items.push({title:a.textContent.trim(), url:a.getAttribute('href')||'#'});
      });
      items = items.slice(0,8);
    }
    if(!items.length){ cont.parentElement.style.display='none'; return; }
    cont.innerHTML = items.map((it,i)=>`<span class="item"><a href="${it.url}">${it.title}</a></span>${i<items.length-1?'<span class="dot"></span>':''}`).join('');
    // basic marquee animation
    const animWidth = cont.scrollWidth;
    cont.animate([{transform:'translateX(0)'},{transform:`translateX(-${animWidth}px)`}], {duration: 30000, iterations: Infinity});
  }
  populateBreaking();

  // Extend time-ago to show "গতকাল"
  if(window.SOMOY_TIME){
    const origAttach = window.SOMOY_TIME.attachTime;
    window.SOMOY_TIME.attachTime = function(root){
      function isYesterday(d){
        const now = new Date(); const y = new Date(now);
        y.setDate(now.getDate()-1); y.setHours(0,0,0,0);
        const yEnd = new Date(y); yEnd.setHours(23,59,59,999);
        return d>=y && d<=yEnd;
      }
      // override display
      document.querySelectorAll('[data-published]').forEach(el=>{
        const ts = el.getAttribute('data-published');
        const d = ts ? new Date(ts) : null;
        if(!d || isNaN(d)) return;
        const now = new Date();
        const diffH = (now-d)/3600000;
        if(diffH >= 23 && isYesterday(d)){
          el.textContent = 'গতকাল';
        }
      });
      // call original + keep ticker
      try{ origAttach && origAttach(root); }catch(e){}
    };
  }

  // Related posts (fallback: use same category if available)
  (function related(){
    const grid = qs('#relatedGrid');
    if(!grid) return;
    let items = [];
    if(window.ARTICLES && Array.isArray(window.ARTICLES)){
      const curId = new URLSearchParams(location.search).get('id');
      const cur = window.ARTICLES.find(a=>String(a.id)==String(curId));
      const cat = cur && cur.category;
      const pool = window.ARTICLES.filter(a=>String(a.id)!==String(curId));
      items = (cat ? pool.filter(a=>a.category===cat) : pool).slice(0,6);
      grid.innerHTML = items.map(a=>`
        <a class="rel" href="${a.url || ('article.html?id='+a.id)}">
          <div class="ratio"><img src="${a.image||''}" alt=""></div>
          <div class="t">${a.title||''}</div>
        </a>`).join('');
    }else{
      grid.parentElement.style.display='none';
    }
  })();
})();
