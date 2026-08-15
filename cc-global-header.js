/* ==========================================================================
   CHIC CHARMS — Global Header — FIXED v2.0
   Responsive header that works on BOTH desktop and mobile.
   Replaces the broken mobile-only injection that destroyed desktop UI.

   - Desktop >=901px : full navbar with centered nav-links, auth actions
   - Mobile <=900px  : hamburger + centered logo + wishlist/cart icons
   - Handles drawer, scroll shadow, cart badge, and cleanup of legacy elements
   ========================================================================== */
(function () {
  'use strict';

  const ANNOUNCEMENT_TEXT = 'Free Shipping Across India';

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

  // Cleanup legacy injections — remove only old duplicated wrappers, not the one we are about to create
  function cleanupLegacy() {
    // Remove any previous wrapper we injected earlier (to avoid duplicates on SPA navigation)
    document.querySelectorAll('#cc-global-header-wrapper').forEach(el => {
      // Keep the first one if we are mid-reinject? We'll remove all and re-add.
      el.remove();
    });

    // Remove other competing header systems that might hide content
    document.querySelectorAll('header.navbar, .navbar, header.ccap-header, .cc-app-header, .lux-mobile-header, .mobile-header, .d7-mobile-header').forEach(el => {
      // Only remove if it's NOT inside our wrapper (which we already removed) — safe to remove all outside
      if (!el.closest('#cc-global-header-wrapper')) {
        el.remove();
      }
    });

    // Remove duplicate announcement bars
    document.querySelectorAll('.announcement-bar, .shop-announcement, .cc-final-announcement, #ccFinalAnnouncement, .ccap-announcement').forEach(el => {
      // These legacy bars are replaced by our single bar
      el.remove();
    });

    // Remove any div that contains the broken sticky tailwind class from previous injection
    document.querySelectorAll('div').forEach(el => {
      if (el.className && typeof el.className === 'string' && el.className.includes('sticky top-0 z-[60] bg-primary')) {
        el.remove();
      }
    });

    // Clean stray mobile rails that may block scroll
    document.querySelectorAll('.mobile-commerce-rails, .cc-mobile-brand, .cc-loading-screen').forEach(el => el.remove());
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
          <button type="button" class="mobile-commerce-menu" id="mobileCommerceMenu" aria-expanded="false" aria-label="Open menu">
            <span></span><span></span><span></span>
          </button>

          <a href="index.html" class="logo" aria-label="Chic Charms home">Chic<span>Charms</span></a>

          <div class="mobile-commerce-actions" aria-label="Mobile shopping actions">
            <a href="wishlist.html" class="mobile-commerce-icon" aria-label="Wishlist">${iconHeart}<span class="wishlist-count mobile-cart-count" style="display:none"></span></a>
          </div>

          <nav class="nav-links" id="navLinks" aria-label="Main navigation">
            <a href="index.html#bestsellers" class="">Best Sellers</a>
            <a href="category.html?category=everyday-elegance" class="">Everyday Elegance</a>
            <a href="category.html?category=modern-romance" class="">Modern Romance</a>
            <a href="category.html?category=after-dark" class="">After Dark</a>
            <a href="category.html?category=heritage-muse" class="">Heritage Muse</a>
            <a href="about.html" class="${isActive('about.html')}" id="navAboutLink">About</a>
            <a href="cart.html" class="${isActive('cart.html')}">Cart</a>
          </nav>

          <div class="nav-actions" id="navActions" aria-label="Account actions">
            <!-- Auth state injected by auth-nav.js -->
          </div>
        </div>
      </header>
      <div class="ma-drawer-backdrop" aria-hidden="true"></div>
    `;
  }

  function wireHeader() {
    const hamburger = document.getElementById('mobileCommerceMenu');
    const navLinks = document.getElementById('navLinks');
    const backdrop = document.querySelector('.ma-drawer-backdrop');
    const navbar = document.getElementById('navbar');

    if (!hamburger || !navLinks) return;

    function openDrawer() {
      const ccDrawer = document.getElementById('ccDrawer');
      const ccDrawerOverlay = document.getElementById('ccDrawerOverlay');
      if (ccDrawer && ccDrawerOverlay) {
        ccDrawer.classList.add('open');
        ccDrawerOverlay.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = 'hidden';
        return;
      }

      navLinks.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('ma-drawer-open');
      document.body.classList.add('d7-menu-open'); // for legacy CSS compatibility
    }

    function closeDrawer() {
      const ccDrawer = document.getElementById('ccDrawer');
      const ccDrawerOverlay = document.getElementById('ccDrawerOverlay');
      if (ccDrawer && ccDrawerOverlay) {
        ccDrawer.classList.remove('open');
        ccDrawerOverlay.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        return;
      }

      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('ma-drawer-open');
      document.body.classList.remove('d7-menu-open');
    }

    window.__ccCloseDrawer = closeDrawer;

    hamburger.addEventListener('click', function (e) {
      e.stopPropagation();
      const ccDrawer = document.getElementById('ccDrawer');
      const isOpen = ccDrawer ? ccDrawer.classList.contains('open') : navLinks.classList.contains('open');
      if (isOpen) closeDrawer();
      else openDrawer();
    });

    if (backdrop) {
      backdrop.addEventListener('click', closeDrawer);
    }

    // Close on link click
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', function () {
        // Delay slightly for navigation
        setTimeout(closeDrawer, 80);
      });
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });

    // Close when clicking outside navbar + drawer
    document.addEventListener('click', function (e) {
      if (!navLinks.classList.contains('open')) return;
      if (navbar && navbar.contains(e.target)) return;
      if (backdrop && backdrop === e.target) return;
      // If click is inside open drawer, don't close unless link
      if (navLinks.contains(e.target)) return;
      closeDrawer();
    });

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

    wireHeader();
    updateCartBadges();

    // Keep badge in sync
    window.addEventListener('storage', updateCartBadges);
    window.addEventListener('cartUpdated', updateCartBadges);
    // Also poll slightly for same-tab updates (cart added without storage event)
    setInterval(updateCartBadges, 1200);

    // Re-expose global toggle for compatibility with previous approved mobile UI
    window.toggleDrawer = function (open) {
      const ccDrawer = document.getElementById('ccDrawer');
      const ccDrawerOverlay = document.getElementById('ccDrawerOverlay');
      const btn = document.getElementById('mobileCommerceMenu');
      if (ccDrawer && ccDrawerOverlay) {
        ccDrawer.classList.toggle('open', !!open);
        ccDrawerOverlay.classList.toggle('open', !!open);
        if (btn) btn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = open ? 'hidden' : '';
        return;
      }

      const nav = document.getElementById('navLinks');
      if (!nav || !btn) return;
      if (open) {
        nav.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        document.body.classList.add('ma-drawer-open');
      } else {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('ma-drawer-open');
        document.body.classList.remove('d7-menu-open');
      }
    };
  }

  function boot() {
    // If DOM not ready, wait
    if (!document.body) {
      setTimeout(boot, 30);
      return;
    }
    injectHeader();

    // Also observe for third-party scripts trying to re-inject header and clean after
    const observer = new MutationObserver(function (mutations) {
      // If we detect another header injected after ours, clean and re-ensure ours is top
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
        // Debounce
        clearTimeout(window.__ccReinjectTimer);
        window.__ccReinjectTimer = setTimeout(function () {
          const existing = document.getElementById('cc-global-header-wrapper');
          if (!existing) injectHeader();
        }, 100);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
