
/* ================= Premium v11 JS =================
   Builds homepage dynamically from window.ARTICLES (if available).
   Adds dark mode, font-size control, timeago, breaking ticker, SEO schema,
   AdSense auto slots (hidden by default).
====================================================*/

(function(){
  const $ = (s, r)=> (r||document).querySelector(s);
  const $$= (s, r)=> Array.from((r||document).querySelectorAll(s));

  // Fonts (if not already injected)
  if(!document.querySelector('link[href*="fonts.googleapis.com"]')){
    const l1=document.createElement('link');
    l1.rel='preconnect'; l1.href='https://fonts.googleapis.com';
    const l2=document.createElement('link');
    l2.rel='preconnect'; l2.href='https://fonts.gstatic.com'; l2.crossOrigin='';
    const l3=document.createElement('link');
    l3.rel='stylesheet';
    l3.href='https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;700&display=swap';
    document.head.append(l1,l2,l3);
  }

  // Helper: timeago in Bengali
  function timeAgo(dtIso){
    const now = new Date();
    const pub = new Date(dtIso);
    const diff = (now - pub)/1000; // seconds
    if(diff < 60) return 'এইমাত্র';
    if(diff < 3600){
      const m = Math.floor(diff/60);
      return m+' মিনিট আগে';
    }
    if(diff < 86400){
      const h = Math.floor(diff/3600);
      return h+' ঘন্টা আগে';
    }
    // if yesterday
    const y = new Date(now); y.setDate(now.getDate()-1);
    if(pub.toDateString() === y.toDateString()) return 'গতকাল';
    return pub.toLocaleDateString('bn-BD', {year:'numeric', month:'long', day:'numeric'});
  }

  // Build header
  function buildHeader(){
    const header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = `
      <div class="container header-inner">
        <a class="logo" href="/">
          <div class="brand">সময়<span class="globe"></span>টাইম</div>
        </a>
        <nav class="primary-nav" aria-label="প্রধান মেনু">
          <a href="#national">জাতীয়</a>
          <a href="#international">আন্তর্জাতিক</a>
          <a href="#sports">খেলা</a>
          <a href="#economy">অর্থনীতি</a>
          <a href="#entertainment">বিনোদন</a>
          <a href="#opinion">মতামত</a>
          <a href="#tech">প্রযুক্তি</a>
        </nav>
        <div class="header-actions">
          <div class="search-wrap">
            <input id="searchBox" type="search" placeholder="খবর খুঁজুন…" aria-label="খোঁজ"/>
          </div>
          <div class="controls">
            <button class="btn" id="decFont" aria-label="ফন্ট ছোট">A–</button>
            <button class="btn" id="incFont" aria-label="ফন্ট বড়">A+</button>
            <button class="btn" id="toggleDark" aria-label="ডার্ক মোড">🌓</button>
          </div>
        </div>
      </div>
    `;
    document.body.prepend(header);

    // Events
    $('#toggleDark').addEventListener('click', ()=>{
      const d = document.documentElement.classList.toggle('dark');
      localStorage.setItem('dark', d ? '1':'0');
    });
    if(localStorage.getItem('dark')==='1') document.documentElement.classList.add('dark');

    $('#incFont').addEventListener('click', ()=> adjustFont(0.1));
    $('#decFont').addEventListener('click', ()=> adjustFont(-0.1));

    const savedScale = parseFloat(localStorage.getItem('fontScale')||'1');
    if(savedScale !== 1) setFontScale(savedScale);

    // Search
    $('#searchBox').addEventListener('input', (e)=>{
      filterSearch(e.target.value.trim());
    });
  }

  function setFontScale(n){
    document.documentElement.style.setProperty('--font-scale', n);
    localStorage.setItem('fontScale', String(n));
  }
  function adjustFont(delta){
    const cur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--font-scale')) || 1;
    let next = Math.min(1.4, Math.max(0.9, cur + delta));
    setFontScale(next);
  }

  // Breaking bar
  function buildBreaking(articles){
    const wrap = document.createElement('div');
    wrap.className = 'breaking-wrap';
    const titles = articles.slice(0, 12).map(a=>`<a href="${a.url || ('article.html?id='+a.id)}">${a.title||''}</a>`).join(' • ');
    wrap.innerHTML = `
      <div class="container breaking-bar">
        <strong>Breaking:</strong>
        <div class="ticker"><div class="ticker-track">${titles} &nbsp; ${titles}</div></div>
      </div>`;
    document.body.insertBefore(wrap, document.querySelector('main'));
  }

  // Homepage build
  function buildHome(articles){
    const main = document.createElement('main');
    main.innerHTML = `<div class="container">
      <section class="home-top">
        <div class="hero-main"></div>
        <aside class="sidebar"></aside>
      </section>

      <section id="national" class="section">
        <div class="section-title"><h2>জাতীয়</h2></div>
        <div class="cards-4" id="sec-national"></div>
      </section>

      <section id="international" class="section">
        <div class="section-title"><h2>আন্তর্জাতিক</h2></div>
        <div class="cards-4" id="sec-international"></div>
      </section>

      <section id="sports" class="section">
        <div class="section-title"><h2>খেলা</h2></div>
        <div class="cards-4" id="sec-sports"></div>
      </section>

      <section id="economy" class="section">
        <div class="section-title"><h2>অর্থনীতি</h2></div>
        <div class="cards-4" id="sec-economy"></div>
      </section>

      <section id="entertainment" class="section">
        <div class="section-title"><h2>বিনোদন</h2></div>
        <div class="cards-4" id="sec-entertainment"></div>
      </section>

      <section id="opinion" class="section">
        <div class="section-title"><h2>মতামত</h2></div>
        <div class="cards-3" id="sec-opinion"></div>
      </section>

      <section id="tech" class="section">
        <div class="section-title"><h2>প্রযুক্তি</h2></div>
        <div class="cards-4" id="sec-tech"></div>
      </section>

      <div class='ad-slot ad-728x90'></div>

      <section id="latest" class="section">
        <div class="section-title"><h2>সর্বশেষ</h2></div>
        <div class="cards-4" id="sec-latest"></div>
        <div style="text-align:center;margin-top:12px;">
          <button id="loadMore" class="controls btn">আরও দেখুন</button>
        </div>
      </section>
    </div>`;
    document.body.appendChild(main);

    // Build hero (1 big + 4 small)
    const hero = $('.hero-main', main);
    if(articles.length){
      const lead = articles[0];
      hero.innerHTML = `
        <article class="card">
          <a href="${lead.url || ('article.html?id='+lead.id)}">
            <div class="img"><img src="${lead.image||''}" alt=""></div>
            <h1>${lead.title||''}</h1>
          </a>
          <div class="meta"><time>${timeAgo(lead.published||new Date().toISOString())}</time></div>
          <p class="sum">${lead.summary||''}</p>
          <div class='ad-slot ad-300x250'></div>
        </article>
        <div class="hero-list" id="hero-list"></div>
      `;
      const heroList = $('#hero-list', hero.parentElement);
      articles.slice(1,5).forEach(a=>{
        const el = document.createElement('article');
        el.className = 'hero-item';
        el.innerHTML = `
          <a href="${a.url || ('article.html?id='+a.id)}" class="thumb"><img src="${a.image||''}" alt=""></a>
          <div>
            <a href="${a.url || ('article.html?id='+a.id)}"><h3>${a.title||''}</h3></a>
            <div class="meta"><time>${timeAgo(a.published||new Date().toISOString())}</time></div>
          </div>`;
        heroList.appendChild(el);
      });
    }

    // Sidebar: Trending
    const side = $('.sidebar', main);
    side.innerHTML = `<div>
      <h3>টপ ট্রেন্ডিং</h3>
      <div id="trend"></div>
      <div class='ad-slot ad-300x250'></div>
    </div>`;
    const trend = $('#trend', side);
    articles.slice(0,8).forEach(a=>{
      const d = document.createElement('div');
      d.innerHTML = `<a href="${a.url || ('article.html?id='+a.id)}">${a.title||''}</a>`;
      trend.appendChild(d);
    });

    // Sections by category
    const byCat = (cat)=> articles.filter(a=> (a.category||'').toLowerCase() === cat).slice(0,8);
    const fill = (id, list)=>{
      const host = $('#sec-'+id);
      list.forEach(a=>{
        const el = document.createElement('article');
        el.className = 'card';
        el.innerHTML = `
          <a href="${a.url || ('article.html?id='+a.id)}">
            <div class="ratio"><img src="${a.image||''}" alt=""></div>
            <div class="title">${a.title||''}</div>
          </a>
          <div class="meta"><time>${timeAgo(a.published||new Date().toISOString())}</time></div>
        `;
        host && host.appendChild(el);
      });
    };
    fill('national', byCat('জাতীয়'));
    fill('international', byCat('আন্তর্জাতিক'));
    fill('sports', byCat('খেলা'));
    fill('economy', byCat('অর্থনীতি'));
    fill('entertainment', byCat('বিনোদন'));
    fill('opinion', byCat('মতামত'));
    fill('tech', byCat('প্রযুক্তি'));

    // Latest (after hero + sections) up to 20–25 total, with Load More
    const latestHost = $('#sec-latest');
    let cursor = 5; // already used 1+4
    const page = 12;
    function pushLatest(){
      const end = Math.min(cursor + page, articles.length);
      for(let i=cursor; i<end; i++){
        const a = articles[i];
        const el = document.createElement('article');
        el.className = 'card';
        el.innerHTML = `
          <a href="${a.url || ('article.html?id='+a.id)}">
            <div class="ratio"><img src="${a.image||''}" alt=""></div>
            <div class="title">${a.title||''}</div>
          </a>
          <div class="meta"><time>${timeAgo(a.published||new Date().toISOString())}</time></div>
        `;
        latestHost.appendChild(el);
      }
      cursor = end;
      if(cursor >= Math.min(articles.length, 30)) $('#loadMore').style.display='none';
    }
    pushLatest();
    $('#loadMore').addEventListener('click', pushLatest);
  }

  // Footer
  function buildFooter(){
    const f = document.createElement('footer');
    f.className = 'site-footer';
    f.innerHTML = `
      <div class="container footer-top">
        <div class="footer-col">
          <h4>আমাদের সম্পর্কে</h4>
          <a href="#">পোর্টাল পরিচিতি</a>
          <a href="#">এডিটোরিয়াল নীতি</a>
        </div>
        <div class="footer-col">
          <h4>যোগাযোগ</h4>
          <a href="mailto:contact@example.com">contact@example.com</a>
          <a href="#">অফিসের ঠিকানা</a>
        </div>
        <div class="footer-col">
          <h4>নীতিমালা</h4>
          <a href="#">প্রাইভেসি পলিসি</a>
          <a href="#">টার্মস & কন্ডিশনস</a>
        </div>
        <div class="footer-col">
          <h4>আরও লিংক</h4>
          <a href="#">সাইটম্যাপ</a>
          <a href="#">Careers</a>
          <a href="#">Subscription</a>
        </div>
      </div>
      <div class="container">
        <div class="ad-slot ad-728x90"></div>
      </div>
      <div class="container footer-bottom">
        <div>© ২০২৫ সময় টাইম</div>
        <div>
          <a href="#">Facebook</a> ·
          <a href="#">X</a> ·
          <a href="#">YouTube</a>
        </div>
      </div>
    `;
    document.body.appendChild(f);
  }

  // Search filter (simple client-side on titles)
  function filterSearch(q){
    q = q.toLowerCase();
    $$('.card .title, .hero-item, .hero-main h1').forEach(el=>{
      const box = el.closest('article') || el.closest('.hero-item') || el.closest('.hero-main');
      if(!q){ box.style.display=''; return; }
      const text = (el.textContent||'').toLowerCase();
      box.style.display = text.includes(q) ? '' : 'none';
    });
  }

  // JSON-LD on article pages (if article layout detected)
  function articleSchema(){
    const isDetail = !!document.querySelector('.article');
    if(!isDetail) return;
    const title = (document.querySelector('h1')||{}).textContent || document.title;
    const img = (document.querySelector('.article .hero img')||{}).src || '';
    const pub = (document.querySelector('[data-published]')||{}).getAttribute?.('data-published') || new Date().toISOString();
    const data = {
      "@context":"https://schema.org",
      "@type":"NewsArticle",
      "headline": title,
      "image": img?[img]:undefined,
      "datePublished": pub,
      "dateModified": pub,
      "mainEntityOfPage": {"@type":"WebPage","@id": location.href},
      "publisher": {"@type":"Organization","name":"সময় টাইম"}
    };
    const s = document.createElement('script');
    s.type='application/ld+json';
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  // AdSense loader (invisible until ads arrive)
  function ensureAdSense(){
    if(window.ADSENSE_CLIENT){
      if(!document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')){
        const s = document.createElement('script');
        s.async=true;
        s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(window.ADSENSE_CLIENT);
        s.crossOrigin='anonymous';
        document.head.appendChild(s);
      }
      // prepare ins tags
      document.querySelectorAll('.ad-slot').forEach(wrap=>{
        if(wrap.querySelector('ins.adsbygoogle')) return;
        const ins = document.createElement('ins');
        ins.className='adsbygoogle';
        ins.style.display='block';
        ins.setAttribute('data-ad-client', window.ADSENSE_CLIENT);
        ins.setAttribute('data-ad-format','auto');
        ins.setAttribute('data-full-width-responsive','true');
        wrap.appendChild(ins);
      });
      const tryPush=()=>{
        if(window.adsbygoogle && Array.isArray(window.adsbygoogle)){
          document.querySelectorAll('.adsbygoogle').forEach(()=>{
            try{ (adsbygoogle = window.adsbygoogle || []).push({}); }catch(e){}
          });
        }else setTimeout(tryPush,600);
      };
      window.addEventListener('load', tryPush);
    }
  }

  // Build the page (homepage only)
  document.addEventListener('DOMContentLoaded', ()=>{
    // If the page already has its own markup, we only enhance the styles
    // If there's no main or explicit v11 hook, we build it fully.
    const hasApp = !!document.querySelector('main[data-v11]');
    const shouldBuild = !document.querySelector('main') || document.body.dataset.forceV11 === '1';

    buildHeader();

    // Ensure MAIN
    if(!document.querySelector('main') || shouldBuild){
      const m=document.createElement('main'); m.setAttribute('data-v11','');
      document.body.appendChild(m);
    }

    const articles = (window.ARTICLES && Array.isArray(window.ARTICLES) && window.ARTICLES.length)
      ? window.ARTICLES
      : demoArticles();

    buildBreaking(articles);
    buildHome(articles);
    buildFooter();
    articleSchema();
    ensureAdSense();
  });

  // Demo filler if no ARTICLES present
  function demoArticles(){
    const now = Date.now();
    return Array.from({length:40}).map((_,i)=> ({
      id:i+1,
      title:`ডেমো শিরোনাম ${i+1} — সময় টাইম`,
      summary:`এটি একটি ডেমো সারাংশ। আপনার Google Sheet থেকে ডাটা এলে এই অংশ অটোমেটিক রিপ্লেস হবে।`,
      image:`https://picsum.photos/seed/somoytime${i}/800/450`,
      url:`#`,
      published: new Date(now - i*3600*1000).toISOString(),
      category: ['জাতীয়','আন্তর্জাতিক','খেলা','অর্থনীতি','বিনোদন','মতামত','প্রযুক্তি'][i%7]
    }));
  }
})();
