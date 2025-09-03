
// === Premium v10 JS: AdSense, Infinite Scroll, Lazy Images, Schema, Breadcrumbs ===
(function(){
  const ADS = {
    client: (window.ADSENSE_CLIENT || 'ca-pub-XXXXXXXXXXXXXXX'), // TODO: replace with your client ID
    slots: {
      header: '000000001',   // replace with your ad-slot ids
      infeed: '000000002',
      inarticle: '000000003',
      sidebar: '000000004',
      footer: '000000005'
    }
  };

  function qs(s,root){ return (root||document).querySelector(s); }
  function qsa(s,root){ return (root||document).querySelectorAll(s); }

  // 1) Ensure AdSense script
  function ensureAdSense(){
    if(qs('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(ADS.client);
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }

  // Helper to create a responsive ad <ins>
  function createAdIns(slot){
    const wrap = document.createElement('div');
    wrap.className = 'ad-slot';
    const label = document.createElement('div');
    label.className = 'ad-label';
    label.textContent = 'Advertisement';
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', ADS.client);
    ins.setAttribute('data-ad-slot', slot);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    wrap.appendChild(label);
    wrap.appendChild(ins);
    // Trigger render when AdSense ready
    const tryPush = () => {
      if(window.adsbygoogle && Array.isArray(window.adsbygoogle)){
        try{ (adsbygoogle = window.adsbygoogle || []).push({}); }catch(e){}
      } else {
        setTimeout(tryPush, 600);
      }
    };
    if(document.readyState === 'complete') tryPush();
    else window.addEventListener('load', tryPush);
    return wrap;
  }

  // 2) Place default ad positions
  function placeAds(){
    // Header-bottom ad (below breaking bar if exists)
    const anchor = qs('.breaking-wrap') || qs('.site-header');
    if(anchor && !qs('.ad-slot.header-ad')){
      const ad = createAdIns(ADS.slots.header); ad.classList.add('header-ad');
      anchor.insertAdjacentElement('afterend', ad);
    }

    // Sidebar ad (desktop only)
    const sidebar = qs('.sidebar');
    if(sidebar && !qs('.ad-slot.sidebar-ad', sidebar)){
      const ad = createAdIns(ADS.slots.sidebar); ad.classList.add('sidebar-ad');
      sidebar.insertBefore(ad, sidebar.firstChild);
    }

    // Footer ad
    const footer = qs('.site-footer');
    if(footer && !qs('.ad-slot.footer-ad', footer)){
      const ad = createAdIns(ADS.slots.footer); ad.classList.add('footer-ad');
      footer.insertBefore(ad, footer.firstChild);
    }

    // In-article ad (after first paragraph)
    const body = qs('.article-body');
    if(body && !qs('.ad-slot.in-article', body)){
      const p = qs('p', body);
      if(p){
        const ad = createAdIns(ADS.slots.inarticle); ad.classList.add('in-article');
        p.insertAdjacentElement('afterend', ad);
      }
    }

    // In-feed ads (insert after every 6th item in .news-list)
    const list = qs('.news-list') || qs('.list.grid') || qs('#newsList');
    if(list){
      const items = Array.from(list.children);
      items.forEach((item, idx)=>{
        if((idx+1) % 6 === 0){
          const ad = createAdIns(ADS.slots.infeed);
          if(!item.nextElementSibling || !item.nextElementSibling.classList.contains('ad-slot')){
            item.insertAdjacentElement('afterend', ad);
          }
        }
      });
    }
  }

  // 3) Infinite Scroll + Lazy Images
  function ensureLazy(){
    qsa('img').forEach(img=>{
      if(!img.hasAttribute('loading')) img.setAttribute('loading','lazy');
    });
  }

  function buildCard(a){
    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `
      <a href="${a.url || ('article.html?id='+a.id)}">
        <span class="ratio"><img src="${a.image||''}" alt=""></span>
        <h2 class="article-title">${a.title||''}</h2>
      </a>
      <div class="summary">${a.summary||''}</div>
      <time class="timeago" data-published="${a.published||new Date().toISOString()}"></time>
    `;
    return el;
  }

  let page = 1;
  function loadMore(){
    const list = qs('.news-list') || qs('.list.grid') || qs('#newsList');
    if(!list) return;
    if(!(window.ARTICLES && Array.isArray(window.ARTICLES))) return;
    const size = 12;
    const start = page*size, end = start + size;
    const batch = window.ARTICLES.slice(start, end);
    if(!batch.length) return;
    const frag = document.createDocumentFragment();
    batch.forEach(a=> frag.appendChild(buildCard(a)));
    list.appendChild(frag);
    page += 1;
    ensureLazy();
    // add in-feed ads again for the new items
    placeAds();
  }

  function infiniteScrollInit(){
    const sentinel = document.createElement('div');
    sentinel.id = 'infinite-sentinel';
    (qs('main')||document.body).appendChild(sentinel);
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          loadMore();
        }
      });
    }, {rootMargin: '400px'});
    io.observe(sentinel);
  }

  // 4) JSON-LD Schema & Breadcrumb
  function schemaAndBreadcrumb(){
    const isArticle = /article|post|single/i.test(location.pathname) || !!qs('.single-article, article[data-article]');
    if(!isArticle) return;

    const title = (qs('h1') && qs('h1').textContent.trim()) || document.title;
    const pub = (qs('[data-published]') && qs('[data-published]').getAttribute('data-published')) || new Date().toISOString();
    const img = (qs('.article-hero img') && qs('.article-hero img').src) || (qs('article img') && qs('article img').src) || '';

    // Breadcrumb
    if(!qs('.breadcrumb')){
      const bc = document.createElement('nav');
      bc.className = 'breadcrumb';
      bc.setAttribute('aria-label','Breadcrumb');
      bc.innerHTML = `<a href="/">প্রথম পাতা</a><span class="sep">›</span><a href="#">সংবাদ</a><span class="sep">›</span><span>${title}</span>`;
      const header = qs('.site-header');
      (header && header.nextSibling) ? header.parentNode.insertBefore(bc, header.nextSibling) : document.body.insertBefore(bc, document.body.firstChild);
    }

    // JSON-LD
    if(!qs('script[type="application/ld+json"].article-schema')){
      const data = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": title,
        "image": img ? [img] : undefined,
        "datePublished": pub,
        "dateModified": pub,
        "mainEntityOfPage": {"@type":"WebPage","@id": location.href},
        "publisher": {"@type":"Organization","name":"সময় টাইম"}
      };
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.className = 'article-schema';
      s.textContent = JSON.stringify(data);
      document.head.appendChild(s);
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    ensureAdSense();
    ensureLazy();
    placeAds();
    infiniteScrollInit();
    schemaAndBreadcrumb();
  });
})();