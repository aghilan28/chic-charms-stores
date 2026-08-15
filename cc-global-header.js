/* ==========================================================================
   CHIC CHARMS — Global Header — UNIFIED & STABILIZED v6.0
   Responsive header that works on BOTH desktop and mobile.
   ========================================================================== */
(function () {
  'use strict';

  const ANNOUNCEMENT_TEXT = 'Free Shipping Across India';

  // Define toggleDrawer globally on window using getter/setter to prevent external overrides from breaking layout classes
  let currentToggleDrawer = function (open) {
    const ccDrawer = document.getElementById('ccDrawer');
    const ccDrawerOverlay = document.getElementById('ccDrawerOverlay');
    const btn = document.getElementById('mobileCommerceMenu');
    
    document.body.classList.toggle('ma-drawer-open', !!open);
    document.body.classList.toggle('drawer-open', !!open);
    document.body.style.overflow = open ? 'hidden' : '';
    
    if (ccDrawer) ccDrawer.classList.toggle('open', !!open);
    if (ccDrawerOverlay) ccDrawerOverlay.classList.toggle('open', !!open);
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  Object.defineProperty(window, 'toggleDrawer', {
    get: function () {
      return currentToggleDrawer;
    },
    set: function (newVal) {
      currentToggleDrawer = function (open) {
        // Run the page's own toggle first (if provided)
        if (typeof newVal === 'function') {
          try { newVal(open); } catch (err) { /* ignore page errors */ }
        }

        // Only sync our header drawer state (avoid forcing body classes for page-specific drawers)
        const ccDrawer = document.getElementById('ccDrawer');
        const ccDrawerOverlay = document.getElementById('ccDrawerOverlay');
        const btn = document.getElementById('mobileCommerceMenu');
        if (ccDrawer || ccDrawerOverlay) {
          document.body.classList.toggle('ma-drawer-open', !!open);
          document.body.classList.toggle('drawer-open', !!open);
          document.body.style.overflow = open ? 'hidden' : '';

          if (ccDrawer) ccDrawer.classList.toggle('open', !!open);
          if (ccDrawerOverlay) ccDrawerOverlay.classList.toggle('open', !!open);
          if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
      };
    },
    configurable: true
  });

  const DRAWER_HTML = `
    <div class="cc-drawer-overlay" id="ccDrawerOverlay" onclick="window.toggleDrawer(false)"></div>
    <aside class="cc-drawer" id="ccDrawer" aria-label="Navigation">
      <div class="cc-drawer-inner">
        <div class="cc-drawer-top">
          <span class="cc-drawer-logo">ChicCharms</span>
          <button class="cc-drawer-close" id="ccDrawerClose" aria-label="Close" onclick="window.toggleDrawer(false)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <nav class="cc-drawer-nav" id="ccDrawerNav">
          <a href="index.html" data-cat="all" class="is-active">Shop Jewellery</a>
          <a href="index.html?filter=bestseller" data-filter="bestseller">Best Sellers</a>
          <a href="index.html?category=everyday-elegance" data-cat="everyday-elegance">Minimal Collection</a>
          <a href="index.html?category=after-dark" data-cat="after-dark">Korean Collection</a>
          <a href="index.html?category=after-dark" data-cat="after-dark">Party Collection</a>
          <a href="index.html?category=heritage-muse" data-cat="heritage-muse">Pearl Collection</a>
          <a href="index.html?category=heritage-muse" data-cat="heritage-muse">Bridal Collection</a>
          <a href="index.html?price=under299" data-price="under299" style="color:#B5657A">Under ₹299</a>
          <a href="cart.html">Cart</a>
          <a href="account.html">Account</a>
          <a href="about.html">About Chic Charms</a>
          <a href="contact.html">Contact</a>
        </nav>
      </div>
    </aside>
  `;

  function getCurrentPage() {
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    return path === '' ? 'index.html' : path;
  }

  function getCartCount() {
    try {
      const raw = localStorage.getItem('cart') || localStorage.getItem('cc_cart') || '[]';
      const cart = JSON.parse(raw);
      if (!Array.isArray(cart)) return 0;
      return cart.reduce((s, it) => s + (Number(it.quantity) || Number(it.qty) || 1), 0);
    } catch (e) { return 0; }
  }

  function updateCartBadges() {
    const count = getCartCount();
    document.querySelectorAll('.mobile-cart-count, #global-cart-badge, .ma-header-cart .mobile-cart-count').forEach(badge => {
      if (count > 0) {
        badge.textContent = count > 9 ? '9+' : String(count);
        badge.hidden = false;
        badge.style.display = 'flex';
        badge.removeAttribute('hidden');
      } else {
        badge.textContent = '';
        badge.hidden = true;
        badge.style.display = 'none';
      }
    });
  }

  function cleanupLegacy() {
    document.querySelectorAll('#cc-global-header-wrapper').forEach(el => {
      el.remove();
    });

    document.querySelectorAll('header.navbar, .navbar, header.ccap-header, .cc-app-header, .lux-mobile-header, .mobile-header, .d7-mobile-header').forEach(el => {
      if (!el.closest('#cc-global-header-wrapper')) {
        el.remove();
      }
    });
  }

  function buildHeaderHTML() {
    const page = getCurrentPage();
    const isActive = (href) => {
      if (href === 'index.html' && (page === 'index.html' || page === '')) return 'active';
      if (page === href) return 'active';
      return '';
    };

    // Icons as inline SVG — no external font dependency
    const iconHeart = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6c-1.8-1.7-4.6-1.6-6.3.2L12 7.3 9.5 4.8C7.8 3 5 2.9 3.2 4.6 1.3 6.4 1.3 9.4 3.1 11.2L12 20l8.9-8.8c1.8-1.8 1.8-4.8-.1-6.6Z"/></svg>`;

    return `
      <div id="cc-announcement-bar"><span>${ANNOUNCEMENT_TEXT}</span></div>
      <header class="navbar" id="navbar" role="banner">
        <div class="nav-inner container">
          <button type="button" class="mobile-commerce-menu" id="mobileCommerceMenu" aria-expanded="false" aria-label="Open menu" onclick="window.toggleDrawer(true)">
            <span></span><span></span><span></span>
          </button>

          <a href="index.html" class="logo" aria-label="Chic Charms home">Chic<span>Charms</span></a>

          <div class="mobile-commerce-actions" aria-label="Mobile shopping actions">
            <a href="wishlist.html" class="mobile-commerce-icon" aria-label="Wishlist">${iconHeart}<span class="wishlist-count" style="display:none"></span></a>
          </div>

          <div class="nav-actions" id="navActions" aria-label="Account actions">
            <!-- Auth state injected by auth-nav.js -->
          </div>
        </div>
      </header>
    `;
  }

  function wireHeader() {
    const navbar = document.getElementById('navbar');

    // Direct event listener bindings to close button and overlay as backup
    const closeBtn = document.getElementById('ccDrawerClose');
    const overlay = document.getElementById('ccDrawerOverlay');

    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        window.toggleDrawer(false);
      });
    }
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        window.toggleDrawer(false);
      });
    }

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') window.toggleDrawer(false);
    });

    // Close drawer when clicking any link inside the drawer (important for same-page anchors)
    const drawerNav = document.getElementById('ccDrawerNav');
    if (drawerNav) {
      drawerNav.addEventListener('click', function (e) {
        const link = e.target.closest('a');
        if (link) {
          window.toggleDrawer(false);
        }
      });
    }

    // Scroll shadow
    let ticking = false;
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 12);
          }
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function injectHeader() {
    cleanupLegacy();

    const wrapper = document.createElement('div');
    wrapper.id = 'cc-global-header-wrapper';
    wrapper.innerHTML = buildHeaderHTML();

    // Insert inside .mobile-shell if present (e.g. wishlist, search), otherwise top of body
    const shell = document.querySelector('.mobile-shell');
    if (shell) {
      if (shell.firstChild) {
        shell.insertBefore(wrapper, shell.firstChild);
      } else {
        shell.appendChild(wrapper);
      }
    } else {
      if (document.body.firstChild) {
        document.body.insertBefore(wrapper, document.body.firstChild);
      } else {
        document.body.appendChild(wrapper);
      }
    }

    // Inject the mobile drawer if not already present
    if (!document.getElementById('ccDrawer')) {
      const container = document.querySelector('.mobile-shell') || document.body;
      const drawerWrap = document.createElement('div');
      drawerWrap.innerHTML = DRAWER_HTML;
      while (drawerWrap.firstChild) {
        container.appendChild(drawerWrap.firstChild);
      }
    }

    wireHeader();
    updateCartBadges();

    // Ensure mobile/inline drawer close controls are wired (covers mobile-home.html and others)
    wireCloseControls();

    // Keep badge in sync
    window.addEventListener('storage', updateCartBadges);
    window.addEventListener('cartUpdated', updateCartBadges);
    setInterval(updateCartBadges, 1200);
  }

  function boot() {
    if (!document.body) {
      setTimeout(boot, 30);
      return;
    }
    injectHeader();

    const observer = new MutationObserver(function (mutations) {
      let shouldReinject = false;
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            if (node.matches && (node.matches('header.navbar') || node.matches('.announcement-bar'))) {
              if (!node.closest('#cc-global-header-wrapper')) {
                shouldReinject = true;
              }
            }
          }
        }
      }
      if (shouldReinject) {
        clearTimeout(window.__ccReinjectTimer);
        window.__ccReinjectTimer = setTimeout(function () {
          const existing = document.getElementById('cc-global-header-wrapper');
          if (!existing) injectHeader();
        }, 100);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Attach click handlers to known drawer/overlay close controls across mobile variants
  function wireCloseControls() {
    try {
      const selectors = [
        '#drawer-overlay',
        '#drawer',
        '#drawer-overlay',
        '.drawer-overlay',
        '.cc-drawer-overlay',
        '#ccDrawerOverlay',
        '.cc-drawer-close',
        '[data-close-drawer]',
        '[data-close]',
        '[onclick*="toggleDrawer(false)"]',
        '[onclick*="window.toggleDrawer(false)"]',
        'button[aria-label="Close"]'
      ];

      const nodes = document.querySelectorAll(selectors.join(','));
      nodes.forEach(el => {
        if (el.dataset && el.dataset.ccCloseWired) return;
        el.addEventListener('click', function () {
          if (typeof window.toggleDrawer === 'function') {
            try { window.toggleDrawer(false); return; } catch (err) { console.warn('toggleDrawer failed', err); }
          }
          if (typeof toggleDrawer === 'function') {
            try { toggleDrawer(false); return; } catch (err) { console.warn('toggleDrawer failed', err); }
          }
          // Fallback close
          document.querySelectorAll('.cc-drawer.open, .drawer-content.open, #drawer.open, aside.cc-drawer.open, .ma-drawer.open').forEach(d => d.classList.remove('open'));
          document.body.classList.remove('ma-drawer-open', 'drawer-open', 'd7-menu-open', 'cc-modal-open', 'lux-drawer-open');
          document.body.style.overflow = '';
        });
        if (el.dataset) el.dataset.ccCloseWired = '1';
      });
    } catch (err) {
      // ignore
    }
  }

  // Capture pointerdown early so clicks on SVG children or transformed elements still close drawer
  document.addEventListener('pointerdown', function (e) {
    try {
      const trigger = e.target.closest && e.target.closest('#drawer-overlay, #drawer, #drawer-overlay, .drawer-overlay, .cc-drawer-overlay, .cc-drawer-close, [data-close-drawer], [data-close], [onclick*="toggleDrawer(false)"], [onclick*="window.toggleDrawer(false)"]');
      if (!trigger) return;
      // Prevent interfering with other intents (only handle clear close selectors)
      const closeSelectors = ['.cc-drawer-close', '#ccDrawerOverlay', '.cc-drawer-overlay', '#drawer-overlay', '.drawer-overlay', '[data-close-drawer]', '[data-close]'];
      const isClose = closeSelectors.some(s => trigger.matches && trigger.matches(s)) || (trigger.getAttribute && String(trigger.getAttribute('onclick') || '').includes('toggleDrawer(false)'));
      if (!isClose) return;

      if (typeof window.toggleDrawer === 'function') { window.toggleDrawer(false); return; }
      if (typeof toggleDrawer === 'function') { try { toggleDrawer(false); return; } catch (err) {} }
      document.querySelectorAll('.cc-drawer.open, .drawer-content.open, #drawer.open, aside.cc-drawer.open, .ma-drawer.open').forEach(d => d.classList.remove('open'));
      document.body.classList.remove('ma-drawer-open', 'drawer-open', 'd7-menu-open', 'cc-modal-open', 'lux-drawer-open');
      document.body.style.overflow = '';
    } catch (err) { /* ignore */ }
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Global delegated handler: ensure any drawer/overlay close controls work across pages
  document.addEventListener('click', function (e) {
    try {
      const trigger = e.target.closest('#drawer-overlay, #drawer, #drawer-overlay, .drawer-overlay, .cc-drawer-overlay, .cc-drawer-close, .modal-overlay, [data-close-drawer], [onclick*="toggleDrawer(false)"], [onclick*="window.toggleDrawer(false)"]');
      if (!trigger) return;

      // If the clicked element is meant to close a drawer/overlay, attempt to close via known APIs
      const onclickAttr = trigger && trigger.getAttribute && trigger.getAttribute('onclick');
      const isCloseIntent = trigger.matches('.cc-drawer-close, .cc-drawer-overlay, #ccDrawerOverlay, #drawer-overlay, .drawer-overlay, .modal-overlay') || (typeof onclickAttr === 'string' && onclickAttr.includes('toggleDrawer(false)'));
      if (!isCloseIntent) return;

      if (typeof window.toggleDrawer === 'function') {
        window.toggleDrawer(false);
        return;
      }
      if (typeof toggleDrawer === 'function') {
        try { toggleDrawer(false); return; } catch (err) { /* ignore */ }
      }

      // Fallback: close common drawer elements and restore body state
      document.querySelectorAll('.cc-drawer.open, .drawer-content.open, #drawer.open, aside.cc-drawer.open, .ma-drawer.open').forEach(d => d.classList.remove('open'));
      document.body.classList.remove('ma-drawer-open', 'drawer-open', 'd7-menu-open', 'cc-modal-open', 'lux-drawer-open');
      document.body.style.overflow = '';
    } catch (err) {
      // no-op
    }
  });
})();
