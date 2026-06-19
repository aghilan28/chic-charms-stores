/* ==========================================================================
   CHIC CHARMS — APPROVED MOBILE COMMERCE UI
   Integration Bridge — MOBILE ONLY
   Connects approved UI to existing Firebase backend
   ========================================================================== */
(function(){
  'use strict';

  // Only run in mobile viewport, but allow resize
  function isMobile(){ return window.matchMedia('(max-width: 1024px)').matches; }

  // Inject required fonts for Material Symbols / Playfair (if not already present) – harmless on desktop, CSS hides UI there
  function ensureFonts(){
    const head = document.head;
    if(!document.querySelector('link[href*="Material+Symbols+Outlined"]')){
      const l = document.createElement('link');
      l.rel='stylesheet';
      l.href='https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
      head.appendChild(l);
    }
    if(!document.querySelector('link[href*="Playfair+Display"]')){
      const l2 = document.createElement('link');
      l2.rel='stylesheet';
      l2.href='https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@100..900&display=swap';
      head.appendChild(l2);
    }
  }

  // Inject UI once
  let mounted = false;
  function mountUI(){
    if(mounted) return;
    mounted = true;
    ensureFonts();

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
<aside class="cc-drawer" id="ccDrawer" aria-label="Navigation menu">
  <div class="cc-drawer-inner">
    <div class="cc-drawer-top">
      <span class="cc-drawer-logo">CHIC CHARMS</span>
      <button class="cc-drawer-close" id="ccDrawerClose" aria-label="Close"><span class="material-symbols-outlined">close</span></button>
    </div>
    <nav class="cc-drawer-nav" id="ccDrawerNav">
      <a href="#" data-filter="all" class="is-active">Shop Jewellery</a>
      <a href="#" data-filter="all">Collections</a>
      <a href="#" data-filter="all">Curations</a>
      <a href="#" data-filter="new" class="is-accent">New Arrivals</a>
      <a href="#" data-filter="bestseller">Best Sellers</a>
      <a href="#" data-cat="heritage-muse">Pearl Collection</a>
      <a href="#" data-cat="everyday-elegance">Minimal Collection</a>
      <a href="#" data-cat="after-dark">Korean Collection</a>
      <a href="#" data-cat="after-dark">Party Collection</a>
      <a href="#" data-cat="heritage-muse">Bridal Collection</a>
      <a href="#" data-price="under500" style="color:#B5657A">Under ₹299</a>
      <a href="about.html">About Chic Charms</a>
      <a href="contact.html">Contact</a>
    </nav>
  </div>
</aside>

<div class="cc-search-overlay" id="ccSearchOverlay" role="search">
  <div class="cc-search-head">
    <input type="search" id="ccSearchInput" placeholder="Search earrings, pearls, rings…" autocomplete="off" />
    <button id="ccSearchClose" style="font-size:22px;color:#6B4A58">✕</button>
  </div>
  <div class="cc-search-results" id="ccSearchResults"></div>
</div>

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
      <a href="#" class="cc-editorial-btn" id="ccEditorialBtn">Discover</a>
    </div>
  </section>

  <div class="cc-grid" id="ccGrid2"></div>
</main>

<nav class="cc-bottom-bar" aria-label="Filters">
  <button id="ccFilterBtn"><span class="ico material-symbols-outlined">tune</span> Filters</button>
  <button id="ccSortBtn"><span class="ico material-symbols-outlined">sort</span> Sort By</button>
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
          <label class="cc-check"><input type="checkbox" value="drop"> <span>Drop</span></label>
          <label class="cc-check"><input type="checkbox" value="stud"> <span>Stud</span></label>
          <label class="cc-check"><input type="checkbox" value="hoop"> <span>Hoop</span></label>
          <label class="cc-check"><input type="checkbox" value="statement"> <span>Statement</span></label>
        </div>
      </div>
    </details>
    <details class="cc-accordion">
      <summary>Collection <span class="acc-arrow material-symbols-outlined">expand_more</span></summary>
      <div class="cc-accordion-content">
        <div style="display:flex;flex-direction:column;gap:12px" id="ccCollectionFilters">
          <label class="cc-check"><input type="checkbox" value="heritage-muse"> <span>Pearl Collection</span></label>
          <label class="cc-check"><input type="checkbox" value="everyday-elegance"> <span>Minimal Collection</span></label>
          <label class="cc-check"><input type="checkbox" value="after-dark"> <span>Korean Collection</span></label>
        </div>
      </div>
    </details>
    <details class="cc-accordion">
      <summary>Price Range <span class="acc-arrow material-symbols-outlined">expand_more</span></summary>
      <div class="cc-accordion-content">
        <div style="display:flex;flex-direction:column;gap:12px" id="ccPriceFilters">
          <label class="cc-check"><input type="checkbox" value="under500"> <span>Under ₹499</span></label>
          <label class="cc-check"><input type="checkbox" value="500-1499"> <span>₹500 - ₹1499</span></label>
          <label class="cc-check"><input type="checkbox" value="above1500"> <span>Above ₹1500</span></label>
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
  <div style="padding:28px 24px 8px;text-align:center">
    <h2 style="font-family:'Jost','Inter',sans-serif;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#9F4C67;margin-bottom:14px">Sort By</h2>
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

  // --- UI Interactions ---
  function initInteractions(){
    const drawer = document.getElementById('ccDrawer');
    const overlay = document.getElementById('ccDrawerOverlay');
    function toggleDrawer(open){
      drawer.classList.toggle('open', open);
      overlay.classList.toggle('open', open);
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
    window.ccOpenModal = openModal;
    window.ccCloseModal = closeModal;
    document.getElementById('ccFilterBtn')?.addEventListener('click', ()=>openModal('Filter'));
    document.getElementById('ccSortBtn')?.addEventListener('click', ()=>openModal('Sort'));
    document.querySelectorAll('[data-close]').forEach(b=>{
      b.addEventListener('click', ()=> closeModal(b.dataset.close.charAt(0).toUpperCase()+b.dataset.close.slice(1)));
    });
    document.getElementById('ccFilterOverlay')?.addEventListener('click', ()=>closeModal('Filter'));
    document.getElementById('ccSortOverlay')?.addEventListener('click', ()=>closeModal('Sort'));

    // Search overlay
    const searchOverlay = document.getElementById('ccSearchOverlay');
    document.getElementById('ccSearchBtn')?.addEventListener('click', ()=>{
      searchOverlay.classList.add('open');
      setTimeout(()=>document.getElementById('ccSearchInput')?.focus(), 40);
    });
    document.getElementById('ccSearchClose')?.addEventListener('click', ()=> searchOverlay.classList.remove('open'));
    document.getElementById('ccSearchInput')?.addEventListener('input', e=> doSearch(e.target.value));
  }

  // --- Backend Wiring (Firebase Firestore) ---
  let allProducts = [];
  let currentSort = 'bestsellers';
  let activeFilters = { types:[], collections:[], prices:[] };
  let searchQuery = '';

  async function initBackend(){
    // Reuse existing Firebase app if auth-nav / index already initialized it
    let db;
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
      db = getFirestore(app);

      // --- Product helpers (mirroring index.html) ---
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
        const key = String(v||'').trim().toLowerCase();
        return CATEGORY_LABELS[key] ? key : CATEGORY_ALIASES[key] || '';
      }
      function inferProductCategory(product, docId){
        const current = normalizeCategory(product?.category);
        if(current) return current;
        const hay = [product?.name, product?.tag, product?.description, docId].join(' ').toLowerCase();
        for(const a of Object.keys(CATEGORY_ALIASES)){ if(hay.includes(a)) return CATEGORY_ALIASES[a]; }
        let h=0; const seed=String(product?.name||docId||'');
        for(let i=0;i<seed.length;i++) h=(h+seed.charCodeAt(i)*(i+1))%CATEGORY_ORDER.length;
        return CATEGORY_ORDER[h];
      }

      function productImageUrl(p){
        const img = p?.productImage || p?.image || p?.imageUrl || p?.imageURL || '';
        if(img && (/^https?:\/\//.test(img) || img.startsWith('data:image') || /images\/.+\.(jpe?g|png|webp)$/i.test(img))) return img;
        return 'images/product-placeholder-jewelry.jpg';
      }

      // Listen to products
      onSnapshot(collection(db, "products"), (snapshot)=>{
        allProducts = [];
        snapshot.forEach(doc=>{
          const raw = doc.data();
          const stock = Number(raw.stock ?? raw.Stock ?? 0) || 0;
          const categorySlug = inferProductCategory(raw, doc.id);
          allProducts.push({
            id: doc.id,
            name: raw.name || 'Chic Charms Piece',
            price: Number(raw.price||0),
            description: raw.description || '',
            tag: raw.tag || '',
            stock,
            categorySlug,
            categoryLabel: CATEGORY_LABELS[categorySlug] || 'Everyday Elegance',
            image: productImageUrl(raw),
            raw
          });
        });
        renderAll();
      }, (err)=>{
        console.error('[CC Mobile] Firestore error', err);
        const grid = document.getElementById('ccGrid');
        if(grid) grid.innerHTML = '<div class="cc-state error">Could not load products. Please refresh.</div>';
      });

      window._ccProductHelpers = { normalizeCategory, inferProductCategory };
    } catch(e){
      console.error('[CC Mobile] Firebase init failed', e);
      const grid = document.getElementById('ccGrid');
      if(grid) grid.innerHTML = '<div class="cc-state error">Backend connection failed.</div>';
      return;
    }

    // Wire filter checkboxes
    document.querySelectorAll('#ccTypeFilters input').forEach(cb=>{
      cb.addEventListener('change', ()=>{ activeFilters.types = [...document.querySelectorAll('#ccTypeFilters input:checked')].map(i=>i.value); renderAll(); });
    });
    document.querySelectorAll('#ccCollectionFilters input').forEach(cb=>{
      cb.addEventListener('change', ()=>{ activeFilters.collections = [...document.querySelectorAll('#ccCollectionFilters input:checked')].map(i=>i.value); renderAll(); });
    });
    document.querySelectorAll('#ccPriceFilters input').forEach(cb=>{
      cb.addEventListener('change', ()=>{ activeFilters.prices = [...document.querySelectorAll('#ccPriceFilters input:checked')].map(i=>i.value); renderAll(); });
    });

    // Sort
    document.querySelectorAll('#ccSortList button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        document.querySelectorAll('#ccSortList button').forEach(b=>b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentSort = btn.dataset.sort;
        renderAll();
        ccCloseModal('Sort');
      });
    });

    // Drawer nav filtering
    document.getElementById('ccDrawerNav')?.addEventListener('click', (e)=>{
      const a = e.target.closest('a[data-cat], a[data-filter], a[data-price]');
      if(!a) return;
      e.preventDefault();
      document.querySelectorAll('#ccDrawerNav a').forEach(x=>x.classList.remove('is-active'));
      a.classList.add('is-active');
      // reset filters
      document.querySelectorAll('#ccCollectionFilters input, #ccTypeFilters input, #ccPriceFilters input').forEach(i=> i.checked=false);
      activeFilters = { types:[], collections:[], prices:[] };
      if(a.dataset.cat){
        activeFilters.collections = [a.dataset.cat];
        const cb = document.querySelector('#ccCollectionFilters input[value="'+a.dataset.cat+'"]');
        if(cb) cb.checked = true;
        document.getElementById('ccCrumbCat').textContent = a.textContent.trim();
      }
      if(a.dataset.price === 'under500'){
        activeFilters.prices = ['under500'];
      }
      renderAll();
      document.getElementById('ccDrawer')?.classList.remove('open');
      document.getElementById('ccDrawerOverlay')?.classList.remove('open');
      document.body.style.overflow = '';
      window.scrollTo({ top: 140, behavior: 'smooth' });
    });
  }

  function getFilteredProducts(){
    let list = allProducts.slice();

    // search
    if(searchQuery){
      const q = searchQuery.toLowerCase();
      list = list.filter(p => (p.name+' '+p.tag+' '+p.categoryLabel).toLowerCase().includes(q));
    }
    // collection filter
    if(activeFilters.collections.length){
      list = list.filter(p => activeFilters.collections.includes(p.categorySlug));
    }
    // price filter
    if(activeFilters.prices.length){
      list = list.filter(p=>{
        return activeFilters.prices.some(range=>{
          if(range==='under500') return p.price < 499;
          if(range==='500-1499') return p.price >= 500 && p.price <= 1499;
          if(range==='above1500') return p.price > 1500;
          return true;
        });
      });
    }
    // type filter - keyword match in name/description
    if(activeFilters.types.length){
      list = list.filter(p=>{
        const hay = (p.name+' '+p.description+' '+p.tag).toLowerCase();
        return activeFilters.types.some(t => hay.includes(t));
      });
    }

    // sort
    if(currentSort==='low-high') list.sort((a,b)=>a.price-b.price);
    else if(currentSort==='high-low') list.sort((a,b)=>b.price-a.price);
    else if(currentSort==='newest') list.reverse();

    return list;
  }

  function productCardHTML(p){
    const inStock = p.stock > 0;
    const url = `product.html?id=${encodeURIComponent(p.id)}&category=${encodeURIComponent(p.categorySlug)}`;
    const wishActive = (JSON.parse(localStorage.getItem('cc_wishlist')||'[]')).includes(p.id);
    return `<div class="cc-product">
      <div class="cc-product-img">
        <a href="${url}"><img src="${p.image}" alt="${esc(p.name)}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect width=%22400%22 height=%22400%22 fill=%22%23FAF1F4%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2242%22%3E🌸%3C/text%3E%3C/svg%3E'"></a>
        <button class="cc-wish ${wishActive?'is-active':''}" data-wish="${p.id}" aria-label="Wishlist"><span class="material-symbols-outlined" style="font-variation-settings:'FILL' ${wishActive?1:0}">${wishActive?'favorite':'favorite_border'}</span></button>
      </div>
      <div class="cc-product-info">
        <h3 class="cc-product-name"><a href="${url}">${esc(p.name)}</a></h3>
        <p class="cc-product-price">₹${Number(p.price).toLocaleString('en-IN')}</p>
        <p class="cc-product-stock ${inStock?'':'oos'}">${inStock ? 'In Stock' : 'Sold Out'}</p>
        <button class="cc-add-cart" data-cart-id="${p.id}" ${inStock?'':'disabled'}>${inStock?'Add to Cart':'Out of Stock'}</button>
      </div>
    </div>`;
  }

  function renderAll(){
    const list = getFilteredProducts();
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
    const firstHalf = list.slice(0, 8);
    const secondHalf = list.slice(8);
    if(grid) grid.innerHTML = firstHalf.map(productCardHTML).join('');
    
    // Editorial insertion
    const editorial = document.getElementById('ccEditorial');
    const editorialBg = document.getElementById('ccEditorialBg');
    if(editorial && firstHalf.length >= 4){
      editorial.style.display = 'block';
      // Use a local editorial image if available
      editorialBg.style.backgroundImage = "url('images/editorial-light-meets-gold.jpg'), linear-gradient(180deg,#e8c7cf,#d6a8b5)";
    } else if(editorial){ editorial.style.display='none'; }

    if(grid2) grid2.innerHTML = secondHalf.map(productCardHTML).join('');

    // wire wishlist + cart
    document.querySelectorAll('[data-wish]').forEach(btn=>{
      btn.onclick = (e)=>{
        e.preventDefault();
        const id = btn.dataset.wish;
        let wl = JSON.parse(localStorage.getItem('cc_wishlist')||'[]');
        if(wl.includes(id)) wl = wl.filter(x=>x!==id); else wl.push(id);
        localStorage.setItem('cc_wishlist', JSON.stringify(wl));
        btn.classList.toggle('is-active');
        const icon = btn.querySelector('.material-symbols-outlined');
        if(icon){ const active = btn.classList.contains('is-active'); icon.textContent = active ? 'favorite':'favorite_border'; icon.style.fontVariationSettings = `'FILL' ${active?1:0}`; }
        showToast(wl.includes(id) ? 'Added to wishlist' : 'Removed from wishlist');
      };
    });
    document.querySelectorAll('[data-cart-id]').forEach(btn=>{
      btn.onclick = ()=>{
        const id = btn.dataset.cartId;
        const p = allProducts.find(x=>x.id===id);
        if(!p) return;
        // Use existing cart system
        try{
          if(typeof window.addToCartWithId === 'function'){
            window.addToCartWithId(p.name, p.price, p.id);
          } else if(typeof window.addToCart === 'function'){
            window.addToCart(p.name, p.price, p.id, p.stock);
          } else {
            // fallback localStorage
            const cart = JSON.parse(localStorage.getItem('cart')||'[]');
            const ex = cart.find(i=>i.name===p.name);
            if(ex) ex.quantity++; else cart.push({name:p.name, price:p.price, quantity:1, productId:p.id});
            localStorage.setItem('cart', JSON.stringify(cart));
          }
          showToast('Added to cart');
          btn.textContent = 'Added ✓';
          setTimeout(()=> btn.textContent='Add to Cart', 1400);
        }catch(e){ console.error(e); showToast('Could not add to cart'); }
      };
    });
  }

  function doSearch(q){
    searchQuery = q.trim();
    const resultsEl = document.getElementById('ccSearchResults');
    if(!resultsEl) return;
    if(!searchQuery){ resultsEl.innerHTML = '<p style="color:#6B4A58;padding:12px 0;font-family:Jost,Inter,sans-serif">Start typing to search the collection…</p>'; renderAll(); return; }
    const list = getFilteredProducts();
    resultsEl.innerHTML = list.length ? list.slice(0,12).map(p=>`
      <a class="cc-search-item" href="product.html?id=${encodeURIComponent(p.id)}">
        <img src="${p.image}" alt="" loading="lazy">
        <div><strong>${esc(p.name)}</strong><span>₹${Number(p.price).toLocaleString('en-IN')}</span></div>
      </a>`).join('') : `<p style="color:#6B4A58;padding:12px 0;font-family:Jost,Inter,sans-serif">No results for "${esc(searchQuery)}"</p>`;
    // also update main grid
    renderAll();
  }

  let toastTimer;
  function showToast(msg){
    const t = document.getElementById('ccToast');
    if(!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> t.classList.remove('show'), 2400);
  }
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // Auto-mount when DOM ready, only on mobile width
  function tryMount(){
    if(document.body && (isMobile() || true)) mountUI(); // mount always, CSS hides on desktop
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryMount);
  else tryMount();

})();
