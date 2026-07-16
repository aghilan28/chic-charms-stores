/* ==========================================================================
   CHIC CHARMS — Bottom Navigation JS — FIXED v2.0
   Ensures single bottom nav instance, works on mobile only,
   syncs cart/wishlist counts, sets active state.
   Desktop is protected — nav is hidden via CSS.
   ========================================================================== */
(function () {
  'use strict';

  const MOBILE_BP = 768;
  const NAV_HTML = `
    <nav class="cc-bottom-nav" aria-label="Mobile primary">
      <a href="index.html" data-nav="home" aria-label="Home">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9L12 2l9 7v11a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9Z"/></svg>
        <span>Home</span>
      </a>
      <a href="shop.html" data-nav="shop" aria-label="Shop">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="M20 20l-3.5-3.5"/><path d="M8 11h6"/></svg>
        <span>Shop</span>
      </a>
      <a href="wishlist.html" data-nav="wishlist" aria-label="Wishlist" style="position:relative">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6c-1.8-1.7-4.6-1.6-6.3.2L12 7.3 9.5 4.8C7.8 3 5 2.9 3.2 4.6 1.3 6.4 1.3 9.4 3.1 11.2L12 20l8.9-8.8c1.8-1.8 1.8-4.8-.1-6.6Z"/></svg>
        <span>Wishlist</span>
        <span class="wishlist-count" hidden></span>
      </a>
      <a href="account.html" data-nav="account" aria-label="Account">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>
        <span>Account</span>
      </a>
      <a href="cart.html" data-nav="cart" aria-label="Cart" style="position:relative">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <span>Cart</span>
        <span class="mobile-cart-count" hidden></span>
      </a>
    </nav>
  `;

  function getCurrentPage() {
    const p = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    return p === '' ? 'index.html' : p;
  }

  function setActive() {
    const page = getCurrentPage();
    const nav = document.querySelector('.cc-bottom-nav');
    if (!nav) return;
    nav.querySelectorAll('a').forEach(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      let active = false;
      if (href === page) active = true;
      else if (page === 'index.html' && href === 'index.html') active = true;
      else if (href === 'shop.html' && (page === 'shop.html' || page.includes('category') || page.includes('search'))) active = true;
      else if (href === 'wishlist.html' && page === 'wishlist.html') active = true;
      else if (href === 'account.html' && (page === 'account.html' || page === 'auth.html' || page === 'register.html')) active = true;
      else if (href === 'cart.html' && (page === 'cart.html' || page.includes('checkout') || page === 'confirmation.html')) active = true;

      if (active) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      } else {
        a.classList.remove('active');
        a.removeAttribute('aria-current');
      }
    });
  }

  function getCartCount() {
    try {
      const raw = localStorage.getItem('cart') || localStorage.getItem('cc_cart') || '[]';
      const cart = JSON.parse(raw);
      if (!Array.isArray(cart)) return 0;
      return cart.reduce((s, it) => s + (Number(it.quantity) || Number(it.qty) || 1), 0);
    } catch (e) { return 0; }
  }

  function getWishlistCount() {
    try {
      const raw = localStorage.getItem('wishlist') || '[]';
      const wl = JSON.parse(raw);
      return Array.isArray(wl) ? wl.length : 0;
    } catch (e) { return 0; }
  }

  function updateBadges() {
    const cartCount = getCartCount();
    const wishCount = getWishlistCount();

    document.querySelectorAll('.cc-bottom-nav .mobile-cart-count').forEach(b => {
      if (cartCount > 0) {
        b.textContent = cartCount > 9 ? '9+' : String(cartCount);
        b.hidden = false;
        b.style.display = 'flex';
      } else {
        b.textContent = '';
        b.hidden = true;
        b.style.display = 'none';
      }
    });

    document.querySelectorAll('.cc-bottom-nav .wishlist-count').forEach(b => {
      if (wishCount > 0) {
        b.textContent = wishCount > 9 ? '9+' : String(wishCount);
        b.hidden = false;
        b.style.display = 'flex';
      } else {
        b.textContent = '';
        b.hidden = true;
        b.style.display = 'none';
      }
    });

    // Also sync header badges if present
    document.querySelectorAll('.mobile-commerce-actions .mobile-cart-count, #global-cart-badge').forEach(b => {
      if (cartCount > 0) {
        b.textContent = cartCount > 9 ? '9+' : String(cartCount);
        b.hidden = false;
        b.style.display = 'flex';
      } else {
        b.textContent = '';
        b.hidden = true;
        b.style.display = 'none';
      }
    });
  }

  function cleanupDuplicates() {
    // Remove legacy mobile bottom navs
    const all = document.querySelectorAll('.cc-bottom-nav, nav.mobile-bottom-nav, .ma-bottom-nav, .cc-app-bottom-nav, .cc-global-bottom-nav');
    if (all.length > 1) {
      // Keep only first .cc-bottom-nav
      const keep = document.querySelector('.cc-bottom-nav');
      all.forEach(el => {
        if (el !== keep) el.remove();
      });
    }
  }

  function inject() {
    // Don't inject if already exists
    if (document.querySelector('.cc-bottom-nav')) {
      cleanupDuplicates();
      setActive();
      updateBadges();
      return;
    }

    const temp = document.createElement('div');
    temp.innerHTML = NAV_HTML.trim();
    const nav = temp.firstElementChild;
    document.body.appendChild(nav);

    document.body.classList.add('cc-nav-active');
    cleanupDuplicates();
    setActive();
    updateBadges();

    // Keep badges synced
    window.addEventListener('storage', updateBadges);
    window.addEventListener('cartUpdated', updateBadges);
    window.addEventListener('wishlistUpdated', updateBadges);
    setInterval(updateBadges, 1500);
  }

  function boot() {
    if (!document.body) {
      setTimeout(boot, 30);
      return;
    }
    // Always inject but CSS will hide on desktop — safe
    inject();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Expose for manual trigger
  window.__ccInjectBottomNav = inject;
})();
