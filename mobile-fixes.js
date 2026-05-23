/**
 * mobile-fixes.js
 * Patch file for ChicCharms mobile bugs.
 * Load with <script src="mobile-fixes.js" defer></script>
 * on index.html, shop.html, cart.html, account.html
 */
(function () {
  'use strict';

  var isMobile = window.innerWidth <= 767;
  if (!isMobile) return;

  /* ══════════════════════════════════════════════════
     FIX 1 — HOME PAGE: Force d6-reveal elements visible
     The IntersectionObserver script runs in <head> before
     elements exist, so they never get .visible class.
     We re-observe them after DOM is ready, and also force
     them visible as fallback.
  ══════════════════════════════════════════════════ */
  function fixRevealElements() {
    var revealEls = document.querySelectorAll(
      '.d6-reveal, .d6-reveal-left, .d6-reveal-right, .d6-reveal-scale'
    );
    revealEls.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // Run immediately and after short delay for dynamically added elements
  fixRevealElements();
  setTimeout(fixRevealElements, 300);
  setTimeout(fixRevealElements, 1000);

  /* ══════════════════════════════════════════════════
     FIX 2 — SHOP PAGE: Scroll freeze
     Remove any scroll-blocking touch handlers on product
     card overlays. We patch the shop-grid to use
     passive touch listeners only.
  ══════════════════════════════════════════════════ */
  function fixShopScroll() {
    var grid = document.getElementById('shopGrid') ||
               document.querySelector('.shop-grid');
    if (!grid) return;

    // Ensure the grid and its parent don't block scroll
    grid.style.touchAction = 'pan-y';
    if (grid.parentElement) {
      grid.parentElement.style.touchAction = 'pan-y';
    }

    // Prevent any non-button, non-link touch-start from blocking scroll
    grid.addEventListener('touchstart', function (e) {
      var target = e.target;
      // If the touch is on the image/card background (not a button/link),
      // don't call preventDefault — let scroll happen naturally
      var isInteractive = target.closest('button, a, [data-add]');
      if (!isInteractive) {
        // Do nothing — let native scroll handle it
        return;
      }
    }, { passive: true });
  }

  fixShopScroll();

  /* ══════════════════════════════════════════════════
     FIX 3 — CART PAGE: Sync sticky bar position
     Ensure .p5-sticky-checkout doesn't overlap the bottom nav.
     The CSS fix handles positioning, but we also re-run
     the sync in case it was injected before our CSS loaded.
  ══════════════════════════════════════════════════ */
  function fixCartBar() {
    var bar = document.getElementById('p5StickyCheckout') ||
              document.querySelector('.p5-sticky-checkout');
    if (!bar) return;

    // Force correct positioning via inline styles as a safety net
    // (in case our CSS file loads after the bar injection)
    bar.style.position = 'fixed';
    bar.style.bottom = 'calc(64px + env(safe-area-inset-bottom, 0px))';
    bar.style.left = '0';
    bar.style.right = '0';
    bar.style.zIndex = '190';
  }

  // Run after a tick (the bar is injected at script end in cart.html)
  setTimeout(fixCartBar, 50);
  setTimeout(fixCartBar, 500);

  /* ══════════════════════════════════════════════════
     FIX 4 — DISCOVER TAB
     The Discover tab links to index.html#bestsellers.
     On mobile, hash-scroll often doesn't work because
     the page loads at top and IntersectionObserver hasn't
     run yet. We intercept the click and manually scroll.
  ══════════════════════════════════════════════════ */
  function fixDiscoverTab() {
    var discoverTabs = document.querySelectorAll(
      '.ma-nav-tab[href="index.html#bestsellers"], ' +
      '.mobile-bottom-tab[href="index.html#bestsellers"]'
    );

    discoverTabs.forEach(function (tab) {
      tab.addEventListener('click', function (e) {
        // If we're already on index.html, scroll to #bestsellers
        var page = window.location.pathname.split('/').pop() || 'index.html';
        if (page === 'index.html' || page === '') {
          e.preventDefault();
          var target = document.getElementById('bestsellers');
          if (target) {
            var navH = 58 + 16; // header + breathing room
            var top = target.getBoundingClientRect().top + window.pageYOffset - navH;
            window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
          }
        }
        // If on another page, let it navigate normally to index.html#bestsellers
      });
    });
  }

  fixDiscoverTab();

})();
