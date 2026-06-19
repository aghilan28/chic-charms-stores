/* ==========================================================================
   CHIC CHARMS — APPROVED MOBILE COMMERCE UI
   Visual Fidelity Enforcement Protocol v1.0
   Backend integration only – visual output is byte-faithful to code.html
   ========================================================================== */
(function(){
  'use strict';

  let mounted = false;
  function mountUI(){
    if(mounted) return;
    mounted = true;

    // inject Material Symbols + Playfair + Inter if not present (exact code.html)
    (function ensureFonts(){
      const h = document.head;
      if(!document.querySelector('link[href*="Playfair+Display"]')){
        const l = document.createElement('link');
        l.rel='stylesheet';
        l.href='https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@100..900&display=swap';
        h.appendChild(l);
      }
      if(!document.querySelector('link[href*="Material+Symbols+Outlined"]')){
        const l2 = document.createElement('link');
        l2.rel='stylesheet';
        l2.href='https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
        h.appendChild(l2);
      }
    })();

    const ui = document.createElement('div');
    ui.className = 'cc-mobile-ui';
    ui.setAttribute('aria-label','Chic Charms Mobile Storefront');
    ui.innerHTML = `
<div class="cc-announce">Free Shipping Across India</div>
<header class="cc-header">
  <button class="cc-header-btn" id="ccMenuBtn" aria-label="Menu"><span class="material-symbols-outlined">menu</span></button>
  <a href="index.html" class="cc-logo">CHIC CHARMS</a>
  <button class="cc-header-btn" id="ccSearchBtn" aria-label="Search"><span class="material-symbols-outlined">search</span></button>
</header>

<div class="cc-drawer-overlay" id="ccDrawerOverlay"></div>
<aside class="cc-drawer" id="ccDrawer" aria-label="Navigation">
  <div class="cc-drawer-inner">
    <div class="cc-drawer-top">
      <span class="cc-drawer-logo">CHIC CHARMS</span>
      <button class="cc-drawer-close" id="ccDrawerClose" aria-label="Close"><span class="material-symbols-outlined">close</span></button>
    </div>
    <nav class="cc-drawer-nav" id="ccDrawerNav">
      <a href="#" data-cat="all" class="is-active">Shop Jewellery</a>
      <a href="#" data-cat="all">Collections</a>
      <a href="#" data-cat="all">Curations</a>
      <a href="#" data-filter="new" class="is-accent">New Arrivals</a>
      <a href="#" data-filter="bestseller">Best Sellers</a>
      <a href="#" data-cat="heritage-muse"><em>Pearl Collection</em></a>
      <a href="#" data-cat="everyday-elegance">Minimal Collection</a>
      <a href="#" data-cat="after-dark">Korean Collection</a>
      <a href="#" data-cat="after-dark">Party Collection</a>
      <a href="#" data-cat="heritage-muse">Bridal Collection</a>
      <a href="#" data-price="under299" style="color:#B5657A">Under ₹299</a>
      <a href="about.html">About Chic Charms</a>
      <a href="contact.html">Contact</a>
    </nav>
  </div>
</aside>

<main class="cc-main">
  <div class="cc-crumb">
    <nav class="cc-crumb-nav"><a href="index.html">Home</a><span class="sep">|</span><strong id="ccCrumbCat">Earrings</strong></nav>
    <p class="cc-crumb-count" id="ccResultCount">Loading products…</p>
  </div>

  <div class="cc-grid" id="ccGrid">
    <div class="cc-state">Loading the Chic Charms edit…</div>
  </div>

  <section class="cc-editorial" id="ccEditorial" style="display:none">
    <div class="cc-editorial-bg" id="ccEditorialBg"></div>
    <div class="cc-editorial-scrim"></div>
    <div class="cc-editorial-inner">
      <h2>The Eternal Pearl Collection</h2>
      <button class="cc-editorial-btn" id="ccEditorialBtn">Discover</button>
    </div>
  </section>

  <div class="cc-grid" id="ccGrid2"></div>
</main>

<nav class="cc-bottom-bar" aria-label="Filters">
  <button id="ccFilterBtn"><span class="material-symbols-outlined">tune</span> Filters</button>
  <button id="ccSortBtn"><span class="material-symbols-outlined">sort</span> Sort By</button>
</nav>

<!-- Filter Modal -->
<div class="cc-modal-overlay" id="ccFilterOverlay"></div>
<div class="cc-modal" id="ccFilterModal" role="dialog" aria-label="Filters" style="height:707px;max-height:88dvh">
  <div class="cc-modal-head">
    <h2>Filters</h2>
    <button class="cc-modal-close" data-close="filter"><span class="material-symbols-outlined">close</span></button>
  </div>
  <div class="cc-modal-body">
    <details class="cc-accordion" open>
      <summary>Product Type <span class="acc-arrow material-symbols-outlined">expand_more</span></summary>
      <div class="cc-accordion-content">
        <div class="cc-filter-grid" id="ccTypeFilters">
          <label class="cc-check"><input type="checkbox" value="drop"><span>Drop</span></label>
          <label class="cc-check"><input type="checkbox" value="stud"><span>Stud</span></label>
          <label class="cc-check"><input type="checkbox" value="hoop"><span>Hoop</span></label>
          <label class="cc-check"><input type="checkbox" value="statement"><span>Statement</span></label>
        </div>
      </div>
    </details>
    <details class="cc-accordion">
      <summary>Collection <span class="acc-arrow material-symbols-outlined">expand_more</span></summary>
      <div class="cc-accordion-content">
        <div style="display:flex;flex-direction:column;gap:12px" id="ccCollectionFilters">
          <label class="cc-check"><input type="checkbox" value="heritage-muse"><span>Pearl Collection</span></label>
          <label class="cc-check"><input type="checkbox" value="everyday-elegance"><span>Minimal Collection</span></label>
          <label class="cc-check"><input type="checkbox" value="after-dark"><span>Korean Collection</span></label>
        </div>
      </div>
    </details>
    <details class="cc-accordion">
      <summary>Price Range <span class="acc-arrow material-symbols-outlined">expand_more</span></summary>
      <div class="cc-accordion-content">
        <div style="display:flex;flex-direction:column;gap:12px" id="ccPriceFilters">
          <label class="cc-check"><input type="checkbox" value="under500"><span>Under ₹499</span></label>
          <label class="cc-check"><input type="checkbox" value="500-1499"><span>₹500 - ₹1499</span></label>
          <label class="cc-check"><input type="checkbox" value="above1500"><span>Above ₹1500</span></label>
        </div>
      </div>
    </details>
  </div>
  <div class="cc-modal-footer">
    <button class="cc-btn-primary" data-close="filter">Done</button>
  </div>
</div>

<!-- Sort Modal -->
<div class="cc-modal-overlay" id="ccSortOverlay"></div>
<div class="cc-modal" id="ccSortModal" role="dialog" aria-label="Sort">
  <div style="padding:32px 24px 8px;text-align:center">
    <h2 style="font-family:'Inter',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#9F4C67;margin-bottom:16px">Sort By</h2>
    <div class="cc-sort-list" id="ccSortList">
      <button data-sort="bestsellers" class="is-active">Best Sellers</button>
      <button data-sort="newest">Newest First</button>
      <button data-sort="popularity">Popularity</button>
      <button data-sort="low-high">Price: Low to High</button>
      <button data-sort="high-low">Price: High to Low</button>
    </div>
  </div>
  <div class="cc-modal-footer">
    <button class="cc-btn-primary" data-close="sort">Done</button>
  </div>
</div>

<div class="cc-toast" id="ccToast" role="status" aria-live="polite"></div>
`;
    document.body.appendChild(ui);
    initInteractions();
    initBackend();
  }

  // --- Interactions – faithful to code.html ---
  function initInteractions(){
    const drawer = document.getElementById('ccDrawer');
    const overlay = document.getElementById('ccDrawerOverlay');
    function toggleDrawer(open){
      drawer.classList.toggle('open', !!open);
      overlay.classList.toggle('open', !!open);
      document.body.style.overflow = open ? 'hidden' : '';
    }
    document.getElementById('ccMenuBtn')?.addEventListener('click', ()=>toggleDrawer(true));
    document.getElementById('ccDrawerClose')?.addEventListener('click', ()=>toggleDrawer(false));
    overlay?.addEventListener('click', ()=>toggleDrawer(false));

    function openModal(name){
      document.getElementById('cc'+name+'Modal')?.classList.add('open');
      document.getElementById('cc'+name+'Overlay')?.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeModal(name){
      document.getElementById('cc'+name+'Modal')?.classList.remove('open');
      document.getElementById('cc'+name+'Overlay')?.classList.remove('open');
      document.body.style.overflow = '';
    }
    document.getElementById('ccFilterBtn')?.addEventListener('click', ()=>openModal('Filter'));
    document.getElementById('ccSortBtn')?.addEventListener('click', ()=>openModal('Sort'));
    document.querySelectorAll('[data-close]').forEach(b=>{
      b.addEventListener('click', ()=> closeModal(b.dataset.close.charAt(0).toUpperCase()+b.dataset.close.slice(1)));
    });
    document.getElementById('ccFilterOverlay')?.addEventListener('click', ()=>closeModal('Filter'));
    document.getElementById('ccSortOverlay')?.addEventListener('click', ()=>closeModal('Sort'));

    // Search button – scroll to top / focus – matches approved UI (no search overlay in code.html, header search is decorative)
    document.getElementById('ccSearchBtn')?.addEventListener('click', ()=>{
      window.scrollTo({top:0, behavior:'smooth'});
      showToast('Search coming soon');
    });

    document.getElementById('ccEditorialBtn')?.addEventListener('click', (e)=>{
      e.preventDefault();
      // Activate Pearl / Heritage collection
      activeFilters.collections = ['heritage-muse'];
      document.querySelectorAll('#ccCollectionFilters input').forEach(cb=>{ cb.checked = cb.value==='heritage-muse'; });
      renderAll();
      window.scrollTo({top:140, behavior:'smooth'});
      const crumb = document.getElementById('ccCrumbCat');
      if(crumb) crumb.textContent = 'Pearl Collection';
    });
  }

  // --- Backend ---
  let allProducts = [];
  let currentSort = 'bestsellers';
  let activeFilters = { types:[], collections:[], prices:[] };

  async function initBackend(){
    try {
      const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
      const { getFirestore, collection, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const firebaseConfig = {
        apiKey: "AIzaSyA5Bh77_4HE3yQF0hi5ddvbFLZC7rEerxg",
        authDomain: "chic-charms-store.firebaseapp.com",
        projectId: "chic-charms-store",
        storageBucket: "chic-charms-store.firebasestorage.app",
        messagingSenderId: "342514318589",
        appId: "1:342514318589:web:31c3490c10731e46d75294",
      };
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const db = getFirestore(app);

      const CATEGORY_LABELS = {
        "everyday-elegance":"Everyday Elegance",
        "modern-romance":"Modern Romance",
        "after-dark":"After Dark",
        "heritage-muse":"Heritage Muse"
      };
      const CATEGORY_ORDER = ["everyday-elegance","modern-romance","after-dark","heritage-muse"];
      const CATEGORY_ALIASES = {
        earring:"everyday-elegance", earrings:"everyday-elegance",
        stud:"everyday-elegance", studs:"everyday-elegance",
        pearl:"heritage-muse", korean:"after-dark", party:"after-dark",
        bridal:"heritage-muse", minimal:"everyday-elegance", gold:"modern-romance"
      };
      function normalizeCategory(v){
        const k = String(v||'').trim().toLowerCase();
        return CATEGORY_LABELS[k] ? k : CATEGORY_ALIASES[k] || '';
      }
      function inferCat(product, docId){
        const c = normalizeCategory(product?.category);
        if(c) return c;
        const hay = [product?.name, product?.tag, product?.description, docId].join(' ').toLowerCase();
        for(const a in CATEGORY_ALIASES){ if(hay.includes(a)) return CATEGORY_ALIASES[a]; }
        let h=0; const s = String(product?.name||docId||'');
        for(let i=0;i<s.length;i++) h = (h + s.charCodeAt(i)*(i+1)) % CATEGORY_ORDER.length;
        return CATEGORY_ORDER[h];
      }
      function productImage(p){
        const img = p?.productImage || p?.image || p?.imageUrl || p?.imageURL || '';
        if(img && (/^https?:\/\//.test(img) || img.startsWith('data:image') || /images\/.+\.(jpe?g|png|webp)$/i.test(img))) return img;
        return 'images/product-placeholder-jewelry.jpg';
      }

      onSnapshot(collection(db, "products"), (snap)=>{
        allProducts = [];
        snap.forEach(doc=>{
          const raw = doc.data();
          const cat = inferCat(raw, doc.id);
          allProducts.push({
            id: doc.id,
            name: raw.name || 'Chic Charms Piece',
            price: Number(raw.price || 0),
            description: raw.description || '',
            tag: raw.tag || '',
            categorySlug: cat,
            image: productImage(raw),
            raw
          });
        });
        renderAll();
      }, (err)=>{
        console.error('[CC] Firestore error', err);
        const g = document.getElementById('ccGrid');
        if(g) g.innerHTML = '<div class="cc-state error">Could not load products.</div>';
      });

    } catch(e){
      console.error('[CC] Firebase init failed', e);
      return;
    }

    // Filter wiring
    document.querySelectorAll('#ccTypeFilters input').forEach(cb=>{
      cb.addEventListener('change', ()=>{
        activeFilters.types = [...document.querySelectorAll('#ccTypeFilters input:checked')].map(i=>i.value);
        renderAll();
      });
    });
    document.querySelectorAll('#ccCollectionFilters input').forEach(cb=>{
      cb.addEventListener('change', ()=>{
        activeFilters.collections = [...document.querySelectorAll('#ccCollectionFilters input:checked')].map(i=>i.value);
        renderAll();
      });
    });
    document.querySelectorAll('#ccPriceFilters input').forEach(cb=>{
      cb.addEventListener('change', ()=>{
        activeFilters.prices = [...document.querySelectorAll('#ccPriceFilters input:checked')].map(i=>i.value);
        renderAll();
      });
    });

    document.querySelectorAll('#ccSortList button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        document.querySelectorAll('#ccSortList button').forEach(b=>b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentSort = btn.dataset.sort;
        renderAll();
        document.getElementById('ccSortModal')?.classList.remove('open');
        document.getElementById('ccSortOverlay')?.classList.remove('open');
        document.body.style.overflow = '';
      });
    });

    // Drawer nav
    document.getElementById('ccDrawerNav')?.addEventListener('click', (e)=>{
      const a = e.target.closest('a[data-cat],a[data-filter],a[data-price]');
      if(!a) return;
      if(a.href.includes('about.html') || a.href.includes('contact.html')) return; // allow real navigation
      e.preventDefault();
      document.querySelectorAll('#ccDrawerNav a').forEach(x=>x.classList.remove('is-active'));
      a.classList.add('is-active');
      document.querySelectorAll('#ccCollectionFilters input, #ccTypeFilters input, #ccPriceFilters input').forEach(i=>i.checked=false);
      activeFilters = {types:[], collections:[], prices:[]};
      if(a.dataset.cat && a.dataset.cat !== 'all'){
        activeFilters.collections = [a.dataset.cat];
        const cb = document.querySelector('#ccCollectionFilters input[value="'+a.dataset.cat+'"]');
        if(cb) cb.checked = true;
      }
      if(a.dataset.price === 'under299'){
        activeFilters.prices = ['under500'];
      }
      const crumb = document.getElementById('ccCrumbCat');
      if(crumb) crumb.textContent = a.textContent.replace(/Collection/g,'').trim() || 'Earrings';
      renderAll();
      toggleDrawer(false);
      function toggleDrawer(open){
        document.getElementById('ccDrawer')?.classList.toggle('open', !!open);
        document.getElementById('ccDrawerOverlay')?.classList.toggle('open', !!open);
        document.body.style.overflow = open ? 'hidden' : '';
      }
      toggleDrawer(false);
      window.scrollTo({top:120, behavior:'smooth'});
    });
  }

  function getFiltered(){
    let list = allProducts.slice();
    if(activeFilters.collections.length){
      list = list.filter(p => activeFilters.collections.includes(p.categorySlug));
    }
    if(activeFilters.prices.length){
      list = list.filter(p=> activeFilters.prices.some(r=>{
        if(r==='under500') return p.price < 499;
        if(r==='500-1499') return p.price >= 500 && p.price <= 1499;
        if(r==='above1500') return p.price > 1500;
        return true;
      }));
    }
    if(activeFilters.types.length){
      list = list.filter(p=>{
        const hay = (p.name+' '+p.description+' '+p.tag).toLowerCase();
        return activeFilters.types.some(t => hay.includes(t));
      });
    }
    if(currentSort==='low-high') list.sort((a,b)=>a.price-b.price);
    else if(currentSort==='high-low') list.sort((a,b)=>b.price-a.price);
    else if(currentSort==='newest') list = list.slice().reverse();
    return list;
  }

  // Wishlist – uses existing repo key "wishlist"
  function getWish(){ try{ return JSON.parse(localStorage.getItem('wishlist')||'[]'); }catch(e){ return []; } }
  function saveWish(l){ try{ localStorage.setItem('wishlist', JSON.stringify(l)); }catch(e){} }

  function productCard(p){
    const url = `product.html?id=${encodeURIComponent(p.id)}&category=${encodeURIComponent(p.categorySlug)}`;
    const wl = getWish();
    const saved = wl.includes(p.id);
    // Exact visual structure from code.html – no stock labels, no add-to-cart, no ratings
    return `<div class="cc-product">
      <div class="cc-product-img">
        <a href="${url}"><img src="${escAttr(p.image)}" alt="${escAttr(p.name)}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect width=%22400%22 height=%22400%22 fill=%22%23FAF1F4%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2242%22%3E🌸%3C/text%3E%3C/svg%3E'"></a>
        <button class="cc-wish${saved?' is-saved':''}" data-wish="${escAttr(p.id)}" aria-label="Wishlist"><span class="material-symbols-outlined" style="font-variation-settings:'FILL' ${saved?1:0};font-size:20px">${saved?'favorite':'favorite_border'}</span></button>
      </div>
      <div class="cc-product-info">
        <h3 class="cc-product-name"><a href="${url}">${escHtml(p.name)}</a></h3>
        <p class="cc-product-price">₹${Number(p.price).toLocaleString('en-IN')}</p>
      </div>
    </div>`;
  }

  function renderAll(){
    const list = getFiltered();
    const grid = document.getElementById('ccGrid');
    const grid2 = document.getElementById('ccGrid2');
    const countEl = document.getElementById('ccResultCount');
    if(countEl) countEl.textContent = list.length ? `Showing ${list.length} of ${allProducts.length} products` : 'No products match your filters';

    if(!list.length){
      if(grid) grid.innerHTML = '<div class="cc-state">No products found. Try clearing filters.</div>';
      if(grid2) grid2.innerHTML = '';
      const ed = document.getElementById('ccEditorial'); if(ed) ed.style.display='none';
      return;
    }
    const first = list.slice(0,8);
    const second = list.slice(8);
    if(grid) grid.innerHTML = first.map(productCard).join('');

    const editorial = document.getElementById('ccEditorial');
    const editorialBg = document.getElementById('ccEditorialBg');
    if(editorial && first.length >= 4){
      editorial.style.display = 'block';
      editorialBg.style.backgroundImage = "url('images/editorial-light-meets-gold.jpg'), linear-gradient(180deg,#e8c7cf,#d6a8b5)";
    } else if(editorial){ editorial.style.display='none'; }

    if(grid2) grid2.innerHTML = second.map(productCard).join('');

    // wire wishlist – matches repo d15-luxury-stage4-final.js behaviour
    document.querySelectorAll('[data-wish]').forEach(btn=>{
      btn.onclick = (e)=>{
        e.preventDefault(); e.stopPropagation();
        const id = btn.dataset.wish;
        let wl = getWish();
        const was = wl.includes(id);
        if(was) wl = wl.filter(x=>x!==id); else wl.push(id);
        saveWish(wl);
        btn.classList.toggle('is-saved', !was);
        const icon = btn.querySelector('.material-symbols-outlined');
        if(icon){ icon.textContent = !was ? 'favorite' : 'favorite_border'; icon.style.fontVariationSettings = `'FILL' ${!was?1:0}`; }
        showToast(!was ? 'Saved to wishlist' : 'Removed from wishlist');
      };
    });
  }

  let toastT;
  function showToast(msg){
    const t = document.getElementById('ccToast'); if(!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(()=> t.classList.remove('show'), 2200);
  }
  function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escAttr(s){ return escHtml(s).replace(/"/g,'&quot;'); }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountUI);
  else mountUI();

})();
