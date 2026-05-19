/**
 * mobile-app.js — ChicCharms Single Mobile Authority Runtime
 *
 * RULES:
 * - Runs ONLY when window.innerWidth < 768px (or on resize crossing that threshold)
 * - Disables / neutralises all previous mobile runtime systems
 * - Injects new DOM elements (bottom nav, drawer, search overlay, cart sheet)
 * - Sets up all event listeners cleanly
 * - Never mutates desktop DOM
 */

(function () {
  'use strict';

  /* ── Guard: only execute mobile runtime ── */
  const MA_BP = 768;
  let isMobile = window.innerWidth < MA_BP;

  /* ── Neutralise all previous mobile runtimes immediately ── */
  function disableOldRuntimes() {
    // Flags checked by old runtimes
    window.__mobileCommerceReady  = true; // pretend done so they skip init
    window.__brandSystemReady     = true;
    window.__d12Ready             = true;
    window.__d14Ready             = true;
    window.__d15Ready             = true;
    window.__finalMobileReady     = true;

    // Body classes added by old systems — strip them
    const staleClasses = [
      'lux-drawer-open','lux-search-open','cc-modal-open',
      'mobile-brand-active','d12-active','d14-active','d15-active',
      'final-mobile-active'
    ];
    staleClasses.forEach(cls => document.body.classList.remove(cls));
  }

  /* ── Utility: safe querySelector ── */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ── Utility: debounce ── */
  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  /* ══════════════════════════════════════════════════
     1. HEADER HEIGHT MEASUREMENT
     Sets --ma-header-total so main gets correct top offset
  ══════════════════════════════════════════════════ */
  function measureHeader() {
    const navbar = $('.navbar') || $('header.navbar');
    if (!navbar) return;
    const h = navbar.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--ma-header-total', `${Math.ceil(h)}px`);
  }

  /* ══════════════════════════════════════════════════
     2. BOTTOM NAVIGATION
  ══════════════════════════════════════════════════ */
  function injectBottomNav() {
    if ($('.mobile-bottom-nav')) return; // already present

    const page = location.pathname.split('/').pop() || 'index.html';
    const items = [
      { href: 'index.html',    icon: homeIcon(),   label: 'Home',   key: 'index'    },
      { href: 'shop.html',     icon: shopIcon(),   label: 'Shop',   key: 'shop'     },
      { href: '#',             icon: searchIcon(), label: 'Search', key: 'search', id: 'maBtnSearch' },
      { href: 'cart.html',     icon: cartIcon(),   label: 'Cart',   key: 'cart', badge: true },
      { href: 'account.html',  icon: userIcon(),   label: 'Me',     key: 'account'  },
    ];

    const nav = document.createElement('nav');
    nav.className = 'mobile-bottom-nav';
    nav.setAttribute('aria-label', 'Mobile navigation');
    nav.setAttribute('role', 'navigation');

    items.forEach(item => {
      const a = document.createElement('a');
      a.href = item.href;
      a.className = 'ma-nav-item';
      if (item.id) a.id = item.id;
      if (page.includes(item.key)) a.classList.add('is-active');

      a.innerHTML = `
        ${item.icon}
        ${item.badge ? '<span class="ma-nav-badge" id="maBotCartCount"></span>' : ''}
        <span>${item.label}</span>
      `;
      nav.appendChild(a);
    });

    document.body.appendChild(nav);
  }

  /* SVG icons */
  function homeIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/><path d="M5 10v11h14V10"/></svg>`;
  }
  function shopIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 01-8 0"/></svg>`;
  }
  function searchIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`;
  }
  function cartIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 01-8 0"/></svg>`;
  }
  function userIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  }

  /* ══════════════════════════════════════════════════
     3. DRAWER MENU
  ══════════════════════════════════════════════════ */
  function injectDrawer() {
    if ($('.ma-drawer')) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'ma-drawer-backdrop';
    backdrop.id = 'maDrawerBackdrop';

    const drawer = document.createElement('nav');
    drawer.className = 'ma-drawer';
    drawer.id = 'maDrawer';
    drawer.setAttribute('aria-label', 'Site navigation');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');

    drawer.innerHTML = `
      <div class="ma-drawer-head">
        <a href="index.html" class="ma-drawer-logo">Chic<span>Charms</span></a>
        <button class="ma-drawer-close" id="maDrawerClose" aria-label="Close menu">✕</button>
      </div>
      <div class="ma-drawer-body" id="maDrawerBody">
        <p class="ma-drawer-section-label">Collections</p>
        <a class="ma-drawer-link" href="shop.html?cat=studs">
          <span class="ma-drawer-link-icon">💎</span> Studs
        </a>
        <a class="ma-drawer-link" href="shop.html?cat=hoops">
          <span class="ma-drawer-link-icon">⭕</span> Hoops
        </a>
        <a class="ma-drawer-link" href="shop.html?cat=korean">
          <span class="ma-drawer-link-icon">🌸</span> Korean
        </a>
        <a class="ma-drawer-link" href="shop.html?cat=pearl">
          <span class="ma-drawer-link-icon">🫧</span> Pearl
        </a>
        <a class="ma-drawer-link" href="shop.html?cat=bridal">
          <span class="ma-drawer-link-icon">👰</span> Bridal
        </a>
        <a class="ma-drawer-link" href="shop.html?cat=minimal">
          <span class="ma-drawer-link-icon">✦</span> Minimal
        </a>
        <a class="ma-drawer-link" href="shop.html?cat=drop">
          <span class="ma-drawer-link-icon">🌿</span> Drop
        </a>
        <a class="ma-drawer-link" href="shop.html?cat=office">
          <span class="ma-drawer-link-icon">💼</span> Office Wear
        </a>
        <a class="ma-drawer-link" href="shop.html?cat=daily">
          <span class="ma-drawer-link-icon">☀️</span> Daily Wear
        </a>
        <a class="ma-drawer-link" href="shop.html?cat=party">
          <span class="ma-drawer-link-icon">🎉</span> Party Wear
        </a>

        <div class="ma-drawer-divider"></div>
        <p class="ma-drawer-section-label">Account</p>
        <a class="ma-drawer-link" href="account.html">
          <span class="ma-drawer-link-icon">👤</span> My Account
        </a>
        <a class="ma-drawer-link" href="cart.html">
          <span class="ma-drawer-link-icon">🛍️</span> Cart
        </a>
        <a class="ma-drawer-link" href="checkout.html">
          <span class="ma-drawer-link-icon">✅</span> Checkout
        </a>

        <div class="ma-drawer-divider"></div>
        <p class="ma-drawer-section-label">About</p>
        <a class="ma-drawer-link" href="index.html#why-us" id="maDrawerAbout">
          <span class="ma-drawer-link-icon">💫</span> Our Story
        </a>
      </div>
      <div class="ma-drawer-foot">
        All earrings under ₹299 · COD Available · 7-day returns
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
  }

  function openDrawer() {
    const d = $('#maDrawer');
    const b = $('#maDrawerBackdrop');
    const btn = $('#mobileCommerceMenu');
    if (!d || !b) return;
    d.classList.add('is-open');
    b.classList.add('is-open');
    document.body.classList.add('ma-drawer-open');
    if (btn) btn.classList.add('is-open');
    const firstFocus = d.querySelector('a, button');
    if (firstFocus) firstFocus.focus();
  }

  function closeDrawer() {
    const d = $('#maDrawer');
    const b = $('#maDrawerBackdrop');
    const btn = $('#mobileCommerceMenu');
    if (!d || !b) return;
    d.classList.remove('is-open');
    b.classList.remove('is-open');
    document.body.classList.remove('ma-drawer-open');
    if (btn) btn.classList.remove('is-open');
  }

  /* ══════════════════════════════════════════════════
     4. SEARCH OVERLAY
  ══════════════════════════════════════════════════ */
  function injectSearchOverlay() {
    if ($('.ma-search-overlay')) return;

    const trending = ['Studs', 'Pearl', 'Korean', 'Hoops', 'Bridal', 'Minimal', 'Daily Wear', 'Party'];

    const overlay = document.createElement('div');
    overlay.className = 'ma-search-overlay';
    overlay.id = 'maSearchOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Search');

    overlay.innerHTML = `
      <div class="ma-search-overlay-head">
        <input
          type="search"
          class="ma-search-overlay-input"
          id="maSearchInput"
          placeholder="Search earrings, pearls, rings…"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          aria-label="Search products"
        />
        <button class="ma-search-cancel" id="maSearchCancel">Cancel</button>
      </div>
      <div class="ma-search-overlay-body" id="maSearchBody">
        <p class="ma-search-tag-label">Trending</p>
        <div class="ma-search-tags">
          ${trending.map(t => `<a class="ma-search-tag" href="shop.html?q=${encodeURIComponent(t.toLowerCase())}">${t}</a>`).join('')}
        </div>
        <div class="ma-search-results" id="maSearchResults"></div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  function openSearch() {
    const o = $('#maSearchOverlay');
    if (!o) return;
    o.classList.add('is-open');
    document.body.classList.add('ma-search-open');
    const inp = $('#maSearchInput');
    if (inp) {
      setTimeout(() => inp.focus(), 50);
    }
  }

  function closeSearch() {
    const o = $('#maSearchOverlay');
    if (!o) return;
    o.classList.remove('is-open');
    document.body.classList.remove('ma-search-open');
    const inp = $('#maSearchInput');
    if (inp) inp.value = '';
    const results = $('#maSearchResults');
    if (results) results.innerHTML = '';
  }

  function bindSearchInput() {
    const inp = $('#maSearchInput');
    const resultsEl = $('#maSearchResults');
    if (!inp || !resultsEl) return;

    let debTimer;
    inp.addEventListener('input', () => {
      clearTimeout(debTimer);
      const q = inp.value.trim().toLowerCase();
      if (!q) { resultsEl.innerHTML = ''; return; }

      debTimer = setTimeout(() => {
        // Use any product data already on the page
        const allProducts = window.__chicProducts || [];
        if (!allProducts.length) return;

        const matches = allProducts
          .filter(p => {
            const d = p.data || p;
            return (d.name || '').toLowerCase().includes(q);
          })
          .slice(0, 6);

        resultsEl.innerHTML = matches.length
          ? matches.map(p => {
              const d = p.data || p;
              const id = p.id || '';
              const img = d.images?.[0] || d.image || '';
              return `
                <a class="ma-search-result-item" href="product.html?id=${id}">
                  <img class="ma-search-result-img" src="${img}" alt="${d.name || ''}" loading="lazy" onerror="this.style.display='none'" />
                  <div>
                    <div class="ma-search-result-name">${d.name || ''}</div>
                    <div class="ma-search-result-price">₹${Number(d.price || 0).toLocaleString('en-IN')}</div>
                  </div>
                </a>`;
            }).join('')
          : `<p style="color:var(--ma-muted);font-size:.85rem;font-family:var(--ma-font-body)">No results for "${q}"</p>`;
      }, 220);
    });
  }

  /* ══════════════════════════════════════════════════
     5. CART SHEET (mini cart on mobile)
  ══════════════════════════════════════════════════ */
  function injectCartSheet() {
    if ($('.ma-cart-sheet')) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'ma-cart-backdrop';
    backdrop.id = 'maCartBackdrop';

    const sheet = document.createElement('div');
    sheet.className = 'ma-cart-sheet';
    sheet.id = 'maCartSheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', 'Your cart');

    sheet.innerHTML = `
      <div class="ma-cart-handle"></div>
      <div class="ma-cart-head">
        <span class="ma-cart-title">Your Cart</span>
        <button class="ma-cart-close" id="maCartClose" aria-label="Close cart">✕</button>
      </div>
      <div class="ma-cart-body" id="maCartBody">
        <div class="ma-cart-empty" id="maCartEmpty">
          <div class="ma-cart-empty-icon">🛍️</div>
          <p>Your cart is empty</p>
          <a class="ma-cart-empty-cta" href="shop.html">Explore Earrings</a>
        </div>
        <div id="maCartItems" style="display:none"></div>
      </div>
      <div class="ma-cart-foot" id="maCartFoot" style="display:none">
        <div class="ma-cart-total-row">
          <span class="ma-cart-total-label">Total</span>
          <span class="ma-cart-total-amount" id="maCartTotal">₹0</span>
        </div>
        <a href="checkout.html" class="ma-cart-checkout-btn">Checkout →</a>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);
  }

  function openCartSheet() {
    const s = $('#maCartSheet');
    const b = $('#maCartBackdrop');
    if (!s || !b) return;
    refreshCartSheet();
    s.classList.add('is-open');
    b.classList.add('is-open');
    document.body.classList.add('ma-cart-open');
  }

  function closeCartSheet() {
    const s = $('#maCartSheet');
    const b = $('#maCartBackdrop');
    if (!s || !b) return;
    s.classList.remove('is-open');
    b.classList.remove('is-open');
    document.body.classList.remove('ma-cart-open');
  }

  function refreshCartSheet() {
    // Read cart from localStorage (same format used by existing cart system)
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('chic_cart') || '[]'); } catch (_) {}
    if (!Array.isArray(cart)) cart = [];

    const emptyEl  = $('#maCartEmpty');
    const itemsEl  = $('#maCartItems');
    const footEl   = $('#maCartFoot');
    const totalEl  = $('#maCartTotal');
    const badgeBot = $('#maBotCartCount');

    if (!emptyEl || !itemsEl || !footEl) return;

    const count = cart.reduce((s, i) => s + (i.qty || 1), 0);
    const total = cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);

    // Update badges
    [badgeBot, $('.mobile-cart-count'), $('#cartCountBadge')].forEach(el => {
      if (!el) return;
      el.textContent = count > 0 ? count : '';
    });

    if (count === 0) {
      emptyEl.style.display = '';
      itemsEl.style.display = 'none';
      footEl.style.display  = 'none';
    } else {
      emptyEl.style.display = 'none';
      footEl.style.display  = '';
      itemsEl.style.display = '';

      itemsEl.innerHTML = cart.map((item, idx) => `
        <div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--ma-border)">
          <img src="${item.image || ''}" alt="${item.name || ''}" loading="lazy"
            style="width:68px;height:68px;object-fit:cover;border-radius:10px;background:var(--ma-blush);flex-shrink:0"
            onerror="this.style.display='none'" />
          <div style="flex:1;min-width:0">
            <p style="font-family:var(--ma-font-body);font-size:.85rem;font-weight:600;color:var(--ma-ink);margin:0 0 4px;line-height:1.3">${item.name || ''}</p>
            <p style="font-family:var(--ma-font-head);font-size:.9rem;color:var(--ma-rose);margin:0">₹${Number(item.price || 0).toLocaleString('en-IN')}</p>
          </div>
          <button
            data-cart-remove="${idx}"
            aria-label="Remove ${item.name}"
            style="background:var(--ma-blush);border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;color:var(--ma-muted);font-size:.8rem;flex-shrink:0;align-self:center"
          >✕</button>
        </div>
      `).join('');

      // Remove buttons
      $$('[data-cart-remove]', itemsEl).forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.cartRemove, 10);
          cart.splice(idx, 1);
          try { localStorage.setItem('chic_cart', JSON.stringify(cart)); } catch (_) {}
          refreshCartSheet();
        });
      });

      if (totalEl) totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
    }
  }

  /* ══════════════════════════════════════════════════
     6. CATEGORY STRIP — ensure all categories exist
  ══════════════════════════════════════════════════ */
  function ensureCategoryStrip() {
    const strip = $('.mobile-category-strip');
    if (!strip) return;

    // Required categories with their data-mobile-category values
    const required = [
      { slug: 'all',       label: 'All',        img: 'images/editorial-everyday-hoops.png' },
      { slug: 'studs',     label: 'Studs',      img: 'images/editorial-minimal-soul-closeup.png' },
      { slug: 'hoops',     label: 'Hoops',      img: 'images/editorial-everyday-hoops.png' },
      { slug: 'korean',    label: 'Korean',     img: 'images/editorial-korean-morning-coffee.png' },
      { slug: 'pearl',     label: 'Pearl',      img: 'images/story-soft-pearl-drop.png' },
      { slug: 'bridal',    label: 'Bridal',     img: 'images/style-heritage-muse.png' },
      { slug: 'minimal',   label: 'Minimal',    img: 'images/editorial-minimal-soul-closeup.png' },
      { slug: 'drop',      label: 'Drop',       img: 'images/story-intimate-jewelry-detail.png' },
      { slug: 'office',    label: 'Office',     img: 'images/editorial-light-meets-gold.png' },
      { slug: 'daily',     label: 'Daily',      img: 'images/style-everyday-elegance.png' },
      { slug: 'party',     label: 'Party',      img: 'images/style-after-dark.png' },
    ];

    // Find which slugs are already rendered
    const existing = $$('[data-mobile-category]', strip).map(el => el.dataset.mobileCategory);

    required.forEach(cat => {
      if (existing.includes(cat.slug)) return;

      const a = document.createElement('a');
      a.href = cat.slug === 'all' ? '#bestsellers' : `shop.html?cat=${cat.slug}`;
      a.className = 'mobile-category-pill';
      a.dataset.mobileCategory = cat.slug;
      a.innerHTML = `
        <span class="mobile-category-img">
          <img src="${cat.img}" alt="" loading="lazy" />
        </span>
        <span>${cat.label}</span>
      `;
      strip.appendChild(a);
    });
  }

  /* ══════════════════════════════════════════════════
     7. EVENT WIRING
  ══════════════════════════════════════════════════ */
  function wireEvents() {
    // Hamburger → open drawer
    const hamburger = $('#mobileCommerceMenu') || $('.mobile-commerce-menu');
    if (hamburger) {
      hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        const d = $('#maDrawer');
        if (d && d.classList.contains('is-open')) closeDrawer();
        else openDrawer();
      });
    }

    // Drawer close & backdrop
    document.addEventListener('click', (e) => {
      if (e.target.id === 'maDrawerClose' || e.target.closest('#maDrawerClose')) closeDrawer();
      if (e.target.id === 'maDrawerBackdrop') closeDrawer();
    });

    // Search trigger — header search shell clicks open overlay
    const searchShell = $('.mobile-search-shell') || $('.mobile-commerce-search');
    if (searchShell) {
      searchShell.addEventListener('click', (e) => {
        e.preventDefault();
        openSearch();
      });
    }

    // Bottom nav search button
    document.addEventListener('click', (e) => {
      if (e.target.closest('#maBtnSearch')) {
        e.preventDefault();
        openSearch();
      }
    });

    // Search cancel + Escape
    document.addEventListener('click', (e) => {
      if (e.target.id === 'maSearchCancel' || e.target.closest('#maSearchCancel')) closeSearch();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDrawer();
        closeSearch();
        closeCartSheet();
      }
    });

    // Cart icon → open cart sheet (if not on cart.html)
    const page = location.pathname.split('/').pop();
    if (page !== 'cart.html' && page !== 'checkout.html') {
      const cartIcons = $$('.mobile-commerce-cart, [aria-label="Cart"]');
      cartIcons.forEach(icon => {
        if (icon.tagName === 'A' && icon.href && icon.href.includes('cart.html')) {
          icon.addEventListener('click', (e) => {
            e.preventDefault();
            openCartSheet();
          });
        }
      });
    }

    // Cart sheet close + backdrop
    document.addEventListener('click', (e) => {
      if (e.target.id === 'maCartClose'    || e.target.closest('#maCartClose'))    closeCartSheet();
      if (e.target.id === 'maCartBackdrop')                                          closeCartSheet();
    });

    // Category pills → filter products if on homepage
    const strip = $('.mobile-category-strip');
    if (strip) {
      strip.addEventListener('click', (e) => {
        const pill = e.target.closest('.mobile-category-pill');
        if (!pill) return;
        $$('.mobile-category-pill', strip).forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');
      });
    }
  }

  /* ══════════════════════════════════════════════════
     8. CART COUNT SYNC
  ══════════════════════════════════════════════════ */
  function syncCartCount() {
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('chic_cart') || '[]'); } catch (_) {}
    const count = Array.isArray(cart) ? cart.reduce((s, i) => s + (i.qty || 1), 0) : 0;

    [$('.mobile-cart-count'), $('#maBotCartCount'), $('#cartCountBadge')].forEach(el => {
      if (!el) return;
      el.textContent = count > 0 ? count : '';
    });
  }

  /* Listen for cart changes from other scripts */
  window.addEventListener('storage', (e) => {
    if (e.key === 'chic_cart') syncCartCount();
  });

  /* Expose refresh for other scripts to call */
  window.__maRefreshCart = refreshCartSheet;

  /* ══════════════════════════════════════════════════
     9. ACTIVE BOTTOM NAV STATE
  ══════════════════════════════════════════════════ */
  function setActiveNavItem() {
    const page = location.pathname.split('/').pop() || 'index.html';
    $$('.ma-nav-item').forEach(item => {
      item.classList.remove('is-active');
      const href = item.getAttribute('href') || '';
      if (href && href !== '#' && page.includes(href.split('?')[0].replace(/^.*\//, ''))) {
        item.classList.add('is-active');
      }
    });
    // Homepage special case
    if (page === '' || page === 'index.html') {
      const homeItem = $('.ma-nav-item[href="index.html"]');
      if (homeItem) homeItem.classList.add('is-active');
    }
  }

  /* ══════════════════════════════════════════════════
     10. INITIALISE
  ══════════════════════════════════════════════════ */
  function initMobileApp() {
    if (!isMobile) return;

    disableOldRuntimes();
    injectBottomNav();
    injectDrawer();
    injectSearchOverlay();
    injectCartSheet();
    ensureCategoryStrip();
    wireEvents();
    bindSearchInput();
    syncCartCount();
    setActiveNavItem();

    // Measure header after a brief tick for fonts/layout to settle
    requestAnimationFrame(() => {
      measureHeader();
      // Re-measure on font load
      if (document.fonts) {
        document.fonts.ready.then(measureHeader);
      }
    });
  }

  // Re-measure header on resize
  window.addEventListener('resize', debounce(() => {
    isMobile = window.innerWidth < MA_BP;
    measureHeader();
  }, 150));

  /* ── Boot ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileApp);
  } else {
    initMobileApp();
  }

})();
