/* ═══════════════════════════════════════════════════════════════════
   CHIC CHARMS — Global Reusable Header Component
   Single source of truth for the site header across ALL pages.
   
   Usage: Include this script in any page that needs the global header.
   The script checks if a header already exists; if not, it injects one.
   
   Pages using this:
   - index.html (inline header can be replaced by this)
   - product.html
   - shop.html, cart.html, account.html, etc.
   
   This header includes:
   - Announcement bar
   - Logo (centered)
   - Desktop nav links
   - Mobile hamburger menu
   - Search, Wishlist, Cart icons
   - Auth state container
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /**
   * Build the header HTML — EXACT match of index.html's header.
   */
  function buildHeaderHTML() {
    return [
      '<!-- ░░ ADMIN RETURN BANNER — only visible when admin is logged in ░░ -->',
      '<div id="adminReturnBanner" class="admin-return-banner" aria-hidden="true">',
      '  <span class="admin-return-copy">',
      '    You are browsing as <strong id="adminReturnEmail"></strong>',
      '  </span>',
      '  <a href="admin.html">Back to Admin Dashboard</a>',
      '</div>',
      '',
      '<!-- ░░ GLOBAL NAVBAR ░░ -->',
      '<header class="navbar" id="navbar">',
      '  <div class="nav-inner container">',
      '    <button',
      '      type="button"',
      '      class="mobile-commerce-menu"',
      '      id="mobileCommerceMenu"',
      '      aria-expanded="false"',
      '      aria-label="Open menu"',
      '    >',
      '      <span></span><span></span>',
      '    </button>',
      '    <a href="index.html" class="logo" aria-label="Chic Charms home">',
      '      Chic<span>Charms</span>',
      '    </a>',
      '    <div class="mobile-commerce-actions" aria-label="Mobile shopping actions">',
      '      <a href="search.html" class="mobile-commerce-icon" aria-label="Search">',
      '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.8-3.8"></path></svg>',
      '      </a>',
      '      <a href="wishlist.html" class="mobile-commerce-icon relative" aria-label="Wishlist">',
      '        <svg viewBox="0 0 24 24" aria-hidden="true">',
      '          <path d="M20.8 4.6c-1.8-1.7-4.6-1.6-6.3.2L12 7.3 9.5 4.8C7.8 3 5 2.9 3.2 4.6 1.3 6.4 1.3 9.4 3.1 11.2L12 20l8.9-8.8c1.8-1.8 1.8-4.8-.1-6.6Z" />',
      '        </svg>',
      '        <span class="wishlist-count absolute -top-1 -right-1 bg-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center" style="display:none">0</span>',
      '      </a>',
      '      <a href="cart.html" class="mobile-commerce-icon mobile-commerce-cart" aria-label="Cart">',
      '        <svg viewBox="0 0 24 24" aria-hidden="true">',
      '          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6Z" />',
      '          <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />',
      '        </svg>',
      '        <span class="mobile-cart-count" aria-hidden="true"></span>',
      '      </a>',
      '    </div>',
      '    <nav class="nav-links" id="navLinks" aria-label="Main navigation">',
      '      <a href="shop.html">Shop</a>',
      '      <a href="shop.html">Best Sellers</a>',
      '      <a href="about.html" id="navAboutLink">About</a>',
      '      <a href="index.html#testimonials">Reviews</a>',
      '      <a href="search.html">Search</a>',
      '      <a href="cart.html">Cart 🛍️</a>',
      '    </nav>',
      '    <div class="nav-actions" id="navActions">',
      '      <!-- Auth state injected by auth-nav.js -->',
      '    </div>',
      '  </div>',
      '</header>'
    ].join('\n');
  }

  /**
   * Inject the header if one doesn't already exist.
   */
  function injectHeader() {
    // If a .navbar already exists (e.g. index.html with inline header), skip injection
    if (document.querySelector('header.navbar')) return;

    var html = buildHeaderHTML();
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    // Insert each top-level element at the beginning of body
    var fragment = document.createDocumentFragment();
    while (wrapper.firstChild) {
      fragment.appendChild(wrapper.firstChild);
    }

    // Insert before the first child of body
    if (document.body.firstChild) {
      document.body.insertBefore(fragment, document.body.firstChild);
    } else {
      document.body.appendChild(fragment);
    }
  }

  /**
   * Wire up mobile menu toggle (hamburger).
   */
  function wireMobileMenu() {
    var menuBtn = document.getElementById('mobileCommerceMenu');
    var navLinks = document.getElementById('navLinks');
    
    if (menuBtn && navLinks) {
      menuBtn.addEventListener('click', function () {
        var isOpen = navLinks.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('d7-menu-open', isOpen);
      });
    }
  }

  /**
   * Wire up cart badge updates.
   */
  function wireCartBadge() {
    function updateMobileCartCount() {
      var cart = [];
      try { cart = JSON.parse(localStorage.getItem('cc_cart') || '[]'); } catch(e) {}
      var count = cart.reduce(function(s, i) { return s + (Number(i.quantity) || 1); }, 0);
      var badge = document.querySelector('.mobile-cart-count');
      if (badge) {
        badge.textContent = count > 9 ? '9+' : String(count);
        badge.style.display = count > 0 ? '' : 'none';
      }
    }
    updateMobileCartCount();
    // Listen for storage changes from other tabs
    window.addEventListener('storage', updateMobileCartCount);
    // Periodic sync for same-tab updates
    setInterval(updateMobileCartCount, 1500);
  }

  /**
   * Boot
   */
  function boot() {
    injectHeader();
    wireMobileMenu();
    wireCartBadge();
  }

  // Run on DOMContentLoaded or immediately if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Expose for external use
  window.CCGlobalHeader = {
    inject: injectHeader,
    buildHTML: buildHeaderHTML
  };
})();
