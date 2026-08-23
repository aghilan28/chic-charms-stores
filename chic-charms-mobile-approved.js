/* ==========================================================================
   CHIC CHARMS — APPROVED MOBILE COMMERCE UI
   Injects the approved code.html mobile storefront into index.html on mobile.
   Desktop is protected and untouched.
   ========================================================================== */
(function () {
  "use strict";

  const MOBILE_QUERY = "(max-width: 767px)";
  const mq = window.matchMedia(MOBILE_QUERY);
  let mounted = false;

  function onMobile() { return mq.matches; }

  function ensureFonts() {
    const h = document.head;
    if (!document.querySelector('link[href*="Playfair+Display"]')) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@100..900&display=swap";
      h.appendChild(l);
    }
    // Material Symbols font not needed — icons are now inline SVGs
  }

  function getCart() {
    try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch (e) { return []; }
  }
  function getWishlist() {
    try { return JSON.parse(localStorage.getItem("wishlist") || "[]"); } catch (e) { return []; }
  }
  function saveWishlist(list) {
    localStorage.setItem("wishlist", JSON.stringify(list));
  }
  function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + (Number(item.quantity) || Number(item.qty) || 1), 0);
    const badge = document.querySelector(".cc-cart-count");
    if (badge) {
      badge.textContent = count > 9 ? "9+" : String(count);
      badge.classList.toggle("hidden", count === 0);
    }
  }

  let toastT;
  function showToast(msg) {
    const t = document.querySelector(".cc-toast");
    if (!t) return;
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function toggleDrawer(open) {
    const drawer = document.getElementById("ccDrawer");
    const overlay = document.getElementById("ccDrawerOverlay");
    if (!drawer || !overlay) return;
    drawer.classList.toggle("open", !!open);
    overlay.classList.toggle("open", !!open);
    document.body.style.overflow = open ? "hidden" : "";
    document.body.classList.toggle('ma-drawer-open', !!open);
    document.body.classList.toggle('drawer-open', !!open);
    const btn = document.getElementById('mobileCommerceMenu');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  window.toggleDrawer = toggleDrawer;

  function openModal(name) {
    document.getElementById("cc" + name + "Modal")?.classList.add("open");
    document.getElementById("cc" + name + "Overlay")?.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal(name) {
    document.getElementById("cc" + name + "Modal")?.classList.remove("open");
    document.getElementById("cc" + name + "Overlay")?.classList.remove("open");
    document.body.style.overflow = "";
  }

  function mountUI() {
    if (mounted) return;
    mounted = true;
    ensureFonts();

    const ui = document.createElement("div");
    ui.className = "cc-mobile-ui";
    ui.setAttribute("aria-label", "Chic Charms Mobile Storefront");
    ui.innerHTML = `
<main class="cc-main">
  <div class="cc-crumb">
    <nav class="cc-crumb-nav"><a href="index.html">Home</a><span class="sep">|</span><strong id="ccCrumbCat">Earrings</strong></nav>
  </div>

  <div class="cc-section-header">
    <h2 class="cc-section-title" id="ccSectionTitle">Special For You</h2>
    <a href="#" class="cc-section-link" onclick="filterByCategory('all'); return false;">See All</a>
  </div>

  <div class="cc-grid" id="ccGrid">
    <div class="cc-state">Loading the Chic Charms edit…</div>
  </div>

  <section class="cc-editorial" id="ccEditorial" style="display:none">
    <div class="cc-editorial-bg" id="ccEditorialBg" style="background-image: url('images/editorial-light-meets-gold.png'), linear-gradient(180deg,#e8c7cf,#d6a8b5)"></div>
    <div class="cc-editorial-scrim"></div>
    <div class="cc-editorial-inner">
      <h2>The Eternal Pearl Collection</h2>
      <button class="cc-editorial-btn" id="ccEditorialBtn">Discover</button>
    </div>
  </section>

  <div class="cc-grid" id="ccGrid2"></div>
</main>

<!-- Chic Charms – Unified Site Footer (Mobile Injection) -->
<footer class="cc-site-footer" style="border-top:1px solid #d7c1c5; background:#fff8f7; padding:32px 20px 40px; margin-top:24px;">
  <p style="font-family:Jost,sans-serif;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.14em;color:#8e4559;margin:0 0 8px">Chic Charms</p>
  <p style="font-family:Jost,sans-serif;font-size:14px;line-height:1.6;color:#534346;margin:0 0 16px;max-width:34ch">Fast mobile discovery for daily wear, gifting, and soft statement earrings. COD available · Ships in 24h · Skin-friendly finish.</p>
  <nav style="display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:#857276">
    <a href="about.html" style="color:inherit;text-decoration:none">About</a>
    <a href="shipping.html" style="color:inherit;text-decoration:none">Shipping</a>
    <a href="returns.html" style="color:inherit;text-decoration:none">Returns</a>
    <a href="contact.html" style="color:inherit;text-decoration:none">Contact</a>
    <a href="privacy.html" style="color:inherit;text-decoration:none">Privacy</a>
    <a href="terms.html" style="color:inherit;text-decoration:none">Terms</a>
  </nav>
  <p style="font-family:Jost,sans-serif;font-size:11px;color:#857276;margin:16px 0 0">© <span class="cc-year-mobile">${new Date().getFullYear()}</span> Chic Charms. All rights reserved.</p>
</footer>

<nav class="cc-bottom-bar" aria-label="Filters">
  <button id="ccFilterBtn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg> Filters</button>
  <button id="ccSortBtn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg> Sort By</button>
</nav>

<!-- Filter Modal -->
<div class="cc-modal-overlay" id="ccFilterOverlay"></div>
<div class="cc-modal" id="ccFilterModal" role="dialog" aria-label="Filters" style="height:707px;max-height:88dvh">
  <div class="cc-modal-head">
    <h2>Filters</h2>
    <button class="cc-modal-close" data-close="filter"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
  </div>
  <div class="cc-modal-body">
    <details class="cc-accordion" open>
      <summary>Product Type <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></summary>
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
      <summary>Collection <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></summary>
      <div class="cc-accordion-content">
        <div style="display:flex;flex-direction:column;gap:12px" id="ccCollectionFilters">
          <label class="cc-check"><input type="checkbox" value="heritage-muse"><span>Pearl Collection</span></label>
          <label class="cc-check"><input type="checkbox" value="everyday-elegance"><span>Minimal Collection</span></label>
          <label class="cc-check"><input type="checkbox" value="after-dark"><span>Korean Collection</span></label>
        </div>
      </div>
    </details>
    <details class="cc-accordion">
      <summary>Price Range <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></summary>
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

    // Interactions
    document.getElementById("ccMenuBtn")?.addEventListener("click", () => toggleDrawer(true));
    document.getElementById("ccDrawerClose")?.addEventListener("click", () => toggleDrawer(false));
    document.getElementById("ccDrawerOverlay")?.addEventListener("click", () => toggleDrawer(false));
    document.getElementById("ccFilterBtn")?.addEventListener("click", () => openModal("Filter"));
    document.getElementById("ccSortBtn")?.addEventListener("click", () => openModal("Sort"));
    document.querySelectorAll("[data-close]").forEach(b => {
      b.addEventListener("click", () => closeModal(b.dataset.close.charAt(0).toUpperCase() + b.dataset.close.slice(1)));
    });
    document.getElementById("ccFilterOverlay")?.addEventListener("click", () => closeModal("Filter"));
    document.getElementById("ccSortOverlay")?.addEventListener("click", () => closeModal("Sort"));
    document.getElementById("ccEditorialBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      filterByCategory("heritage-muse");
    });

    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { toggleDrawer(false); closeModal("Filter"); closeModal("Sort"); } });
  }

  // --- Backend ---
  let allProducts = [];
  let currentSort = "bestsellers";
  let activeFilters = { types: [], collections: [], prices: [] };
  let backendReady = false;

  const CATEGORY_LABELS = {
    "everyday-elegance": "Everyday Elegance",
    "modern-romance": "Modern Romance",
    "after-dark": "After Dark",
    "heritage-muse": "Heritage Muse"
  };
  const CATEGORY_ORDER = ["everyday-elegance", "modern-romance", "after-dark", "heritage-muse"];
  const CATEGORY_ALIASES = {
    all: "", jewellery: "", jewelry: "", collection: "", collections: "",
    earring: "everyday-elegance", earrings: "everyday-elegance",
    stud: "everyday-elegance", studs: "everyday-elegance",
    simple: "everyday-elegance", daily: "everyday-elegance", everyday: "everyday-elegance",
    hoop: "modern-romance", hoops: "modern-romance",
    pearl: "heritage-muse",
    purple: "modern-romance", dangling: "modern-romance",
    romance: "modern-romance", romantic: "modern-romance",
    korean: "after-dark", party: "after-dark", evening: "after-dark", statement: "after-dark",
    heritage: "heritage-muse", traditional: "heritage-muse", classic: "heritage-muse",
    bridal: "heritage-muse", minimal: "everyday-elegance", gold: "modern-romance"
  };

  function normalizeCategory(v) {
    const k = String(v || "").trim().toLowerCase();
    return CATEGORY_LABELS[k] ? k : CATEGORY_ALIASES[k] || "";
  }
  function inferCategory(product, docId) {
    const c = normalizeCategory(product?.category);
    if (c) return c;
    const hay = [product?.name, product?.tag, product?.description, docId].join(" ").toLowerCase();
    for (const a of Object.keys(CATEGORY_ALIASES)) { if (hay.includes(a)) return CATEGORY_ALIASES[a]; }
    let h = 0; const s = String(product?.name || docId || "");
    for (let i = 0; i < s.length; i += 1) h = (h + s.charCodeAt(i) * (i + 1)) % CATEGORY_ORDER.length;
    return CATEGORY_ORDER[h];
  }
  function productImage(p) {
    const img = p?.productImage || p?.image || p?.imageUrl || p?.imageURL || "";
    if (img && (/^https?:\/\//.test(img) || img.startsWith("data:image") || /images\/.+\.(jpe?g|png|webp)$/i.test(img))) return img;
    return "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect width=%22400%22 height=%22400%22 fill=%22%23FAF1F4%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2242%22%3E🌸%3C/text%3E%3C/svg%3E";
  }
  function formatPrice(price) {
    return "₹" + Number(price || 0).toLocaleString("en-IN");
  }
  function escapeHtml(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function escapeAttr(str) { return escapeHtml(str).replace(/'/g, "&#39;"); }

  function getFiltered() {
    let list = allProducts.slice();
    if (activeFilters.collections.length) {
      list = list.filter(p => activeFilters.collections.includes(p.categorySlug));
    }
    if (activeFilters.prices.length) {
      list = list.filter(p => activeFilters.prices.some(r => {
        if (r === "under500") return p.price < 499;
        if (r === "500-1499") return p.price >= 500 && p.price <= 1499;
        if (r === "above1500") return p.price > 1500;
        return true;
      }));
    }
    if (activeFilters.types.length) {
      list = list.filter(p => {
        const hay = (p.name + " " + p.description + " " + p.tag).toLowerCase();
        return activeFilters.types.some(t => hay.includes(t));
      });
    }
    if (currentSort === "low-high") list.sort((a, b) => a.price - b.price);
    else if (currentSort === "high-low") list.sort((a, b) => b.price - a.price);
    else if (currentSort === "newest") list.reverse();
    else if (currentSort === "popularity") list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    else {
      // Default sort: Shuffled/Random order for dynamic e-commerce catalog feel
      // We do not apply any sorting here to preserve the shuffled order of allProducts.
    }
    return list;
  }

  function productCard(p) {
    const url = `product.html?id=${encodeURIComponent(p.id)}&category=${encodeURIComponent(p.categorySlug)}`;
    const wl = getWishlist();
    const saved = wl.includes(p.id);
    const name = escapeHtml(p.name);
    const hasDiscount = p.oldPrice && p.oldPrice > p.price;
    return `
      <div class="cc-product">
        <div class="cc-product-img">
          <a href="${url}" aria-label="View ${name}">
            <img src="${escapeAttr(p.image)}" alt="${name}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect width=%22400%22 height=%22400%22 fill=%22%23FAF1F4%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2242%22%3E🌸%3C/text%3E%3C/svg%3E'">
          </a>
          <button class="cc-wish${saved ? ' is-saved' : ''}" data-wish="${escapeAttr(p.id)}" aria-label="${saved ? 'Remove from wishlist' : 'Add to wishlist'}">
            ${saved ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'}
          </button>
        </div>
        <div class="cc-product-info">
          <h3 class="cc-product-name"><a href="${url}">${name}</a></h3>
          <p class="cc-product-price">
            <span class="cc-price-actual">${formatPrice(p.price)}</span>
            ${hasDiscount ? `<span class="cc-product-old-price">${formatPrice(p.oldPrice)}</span>` : ""}
          </p>
        </div>
      </div>
    `;
  }

  function renderAll() {
    const list = getFiltered();
    const grid1 = document.getElementById("ccGrid");
    const grid2 = document.getElementById("ccGrid2");
    const countEl = document.getElementById("ccResultCount");
    const editorial = document.getElementById("ccEditorial");

    if (countEl) countEl.textContent = list.length ? `Showing ${list.length} of ${allProducts.length} products` : "No products match your filters";

    if (!list.length) {
      if (grid1) grid1.innerHTML = '<div class="cc-state">No products found. Try clearing filters.</div>';
      if (grid2) grid2.innerHTML = "";
      if (editorial) editorial.style.display = "none";
      return;
    }
    const first = list.slice(0, 8);
    const second = list.slice(8);
    if (grid1) grid1.innerHTML = first.map(productCard).join("");
    if (grid2) grid2.innerHTML = second.map(productCard).join("");
    if (editorial) editorial.style.display = "none";

    document.querySelectorAll("[data-wish]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation();
        const id = btn.dataset.wish;
        let wl = getWishlist();
        const was = wl.includes(id);
        if (was) wl = wl.filter(x => x !== id); else wl.push(id);
        saveWishlist(wl);
        btn.classList.toggle("is-saved", !was);
        btn.innerHTML = was
          ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
          : '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
        btn.setAttribute("aria-label", was ? "Add to wishlist" : "Remove from wishlist");
        showToast(was ? "Removed from wishlist" : "Saved to wishlist");
      });
    });
  }

  function updateFilterState() {
    activeFilters.types = [...document.querySelectorAll("#ccTypeFilters input:checked")].map(i => i.value);
    activeFilters.collections = [...document.querySelectorAll("#ccCollectionFilters input:checked")].map(i => i.value);
    activeFilters.prices = [...document.querySelectorAll("#ccPriceFilters input:checked")].map(i => i.value);
    renderAll();
  }

  function clearFilters() {
    document.querySelectorAll("#ccTypeFilters input, #ccCollectionFilters input, #ccPriceFilters input").forEach(i => i.checked = false);
    activeFilters = { types: [], collections: [], prices: [] };
    currentSort = "bestsellers";
    document.querySelectorAll("#ccSortList button").forEach(b => b.classList.toggle("is-active", b.dataset.sort === "bestsellers"));
  }

  function updateCrumb(label) {
    const el = document.getElementById("ccCrumbCat");
    if (el) el.textContent = label;
    const titleEl = document.getElementById("ccSectionTitle");
    if (titleEl) {
      const l = String(label || "").trim().toLowerCase();
      if (l.includes("best seller")) titleEl.textContent = "Best Sellers For You";
      else if (l.includes("new arrival")) titleEl.textContent = "New Arrivals For You";
      else if (l.includes("elegant pick")) titleEl.textContent = "Elegant Picks For You";
      else if (l.includes("trending")) titleEl.textContent = "Trending Picks For You";
      else if (l === "home" || l === "shop" || l === "earrings" || l === "all" || l === "") titleEl.textContent = "Special For You";
      else titleEl.textContent = label;
    }
  }

  window.filterByCategory = function (slug) {
    clearFilters();
    if (slug !== "all") {
      activeFilters.collections = [slug];
      const cb = document.querySelector(`#ccCollectionFilters input[value="${slug}"]`);
      if (cb) cb.checked = true;
    }
    updateCrumb(CATEGORY_LABELS[slug] || "Shop");
    renderAll();
    toggleDrawer(false);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  window.filterByTag = function (tag) {
    clearFilters();
    // Normalize 'best-seller' -> 'best seller'
    const filterVal = tag.replace('-', ' ');
    activeFilters.types = [filterVal];
    let label = "Shop";
    if (filterVal === "best seller") label = "Best Seller";
    else if (filterVal === "new arrival") label = "New Arrivals";
    else if (filterVal === "elegant pick") label = "Elegant Pick";
    else if (filterVal === "trending") label = "Trending";
    else label = filterVal.charAt(0).toUpperCase() + filterVal.slice(1);
    updateCrumb(label);
    renderAll();
    toggleDrawer(false);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  window.filterByPrice = function () {
    clearFilters();
    activeFilters.prices = ["under500"];
    const cb = document.querySelector('#ccPriceFilters input[value="under500"]');
    if (cb) cb.checked = true;
    updateCrumb("Under ₹299");
    renderAll();
    toggleDrawer(false);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  async function initBackend() {
    if (backendReady) return;
    backendReady = true;
    try {
      const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
      const { getFirestore, collection, onSnapshot } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
      const firebaseConfig = {
        apiKey: "AIzaSyA5Bh77_4HE3yQF0hi5ddvbFLZC7rEerxg",
        authDomain: "chic-charms-store.firebaseapp.com",
        projectId: "chic-charms-store",
        storageBucket: "chic-charms-store.firebasestorage.app",
        messagingSenderId: "342514318589",
        appId: "1:342514318589:web:31c3490c10731e46d75294"
      };
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const db = getFirestore(app);

      onSnapshot(collection(db, "products"), (snap) => {
        allProducts = [];
        snap.forEach(doc => {
          const raw = doc.data();
          const categorySlug = inferCategory(raw, doc.id);
          const rawStock = raw.stock ?? raw.Stock ?? null;
          const parsed = Number(rawStock ?? 0);
          const stock = isNaN(parsed) ? 0 : parsed;
          allProducts.push({
            id: doc.id,
            name: raw.name || "Chic Charms Piece",
            price: Number(raw.price || 0),
            oldPrice: Number(raw.oldPrice || raw.compareAtPrice || raw.mrp || (raw.price ? Math.ceil(Number(raw.price) * 1.28) : 0)),
            description: raw.description || "",
            tag: raw.tag || "",
            rating: raw.rating || 0,
            stock,
            categorySlug,
            image: productImage(raw)
          });
        });

        // Seeded PRNG for stable shuffle per session
        function getSeededRandom(seed) {
          return function() {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
          }
        }
        let seedStr = sessionStorage.getItem('cc_shuffle_seed');
        if (!seedStr) {
          seedStr = String(Math.floor(Math.random() * 1e6));
          sessionStorage.setItem('cc_shuffle_seed', seedStr);
        }
        const rand = getSeededRandom(parseInt(seedStr, 10));

        // Fisher-Yates Shuffle with seeded PRNG
        for (let i = allProducts.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          const temp = allProducts[i];
          allProducts[i] = allProducts[j];
          allProducts[j] = temp;
        }

        renderAll();
        updateCartCount();
      }, (err) => {
        console.error("[CC] Firestore error", err);
        const g = document.getElementById("ccGrid");
        if (g) g.innerHTML = '<div class="cc-state error">Could not load products. Please try again later.</div>';
      });
    } catch (e) {
      console.error("[CC] Firebase init failed", e);
    }
  }

  function wireDrawerNav() {
    const nav = document.getElementById("ccDrawerNav");
    if (!nav) return;
    nav.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-cat], a[data-filter], a[data-price]");
      if (!a) return;
      e.preventDefault();
      nav.querySelectorAll("a").forEach(x => x.classList.remove("is-active"));
      a.classList.add("is-active");
      if (a.dataset.cat) filterByCategory(a.dataset.cat);
      if (a.dataset.filter) filterByTag(a.dataset.filter);
      if (a.dataset.price) filterByPrice();
    });
  }

  function wireFilters() {
    document.querySelectorAll("#ccTypeFilters input, #ccCollectionFilters input, #ccPriceFilters input").forEach(cb => {
      cb.addEventListener("change", updateFilterState);
    });
    document.querySelectorAll("#ccSortList button").forEach(btn => {
      btn.addEventListener("click", () => {
        currentSort = btn.dataset.sort;
        document.querySelectorAll("#ccSortList button").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        renderAll();
      });
    });
  }

  function boot() {
    if (!onMobile()) return;
    mountUI();
    wireDrawerNav();
    wireFilters();
    
    // Parse URL params for initial filters
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');
    const cat = params.get('category');
    if (filter) {
      activeFilters.types = [filter];
      let label = "Shop";
      if (filter === "bestseller") label = "Best Seller";
      else if (filter === "new") label = "New Arrivals";
      else if (filter === "elegant") label = "Elegant Pick";
      else if (filter === "trending") label = "Trending";
      else label = filter.charAt(0).toUpperCase() + filter.slice(1);
      updateCrumb(label);
    }
    if (cat) {
      const slug = normalizeCategory(cat);
      if (slug) {
        activeFilters.collections = [slug];
        updateCrumb(CATEGORY_LABELS[slug] || slug);
      }
    }
    if (params.get('price') === 'under299') {
      activeFilters.prices = ["under500"];
      updateCrumb("Under ₹299");
    }

    initBackend();
    updateCartCount();
    window.addEventListener("storage", updateCartCount);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  function handleViewportChange() {
    if (onMobile() && !mounted) {
      boot();
    } else if (!onMobile() && mounted) {
      toggleDrawer(false);
      closeModal("Filter"); closeModal("Sort");
    }
  }
  if (mq.addEventListener) mq.addEventListener("change", handleViewportChange);
  else mq.addListener(handleViewportChange);
})();
