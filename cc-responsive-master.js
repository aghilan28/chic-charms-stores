/* ==========================================================================
   CHIC CHARMS — Responsive Master JS — FIXED v2.0
   Central orchestrator that fixes desktop collapse and mobile leak.

   Responsibilities:
   - Detect desktop vs mobile via matchMedia
   - Ensure only correct UI is visible
   - Cleanup duplicate navs/headers/bottom-navs
   - Restore body scrollability
   - Sync cart/wishlist counts
   - Handle approved mobile UI special case for index.html
   - Prevent FOUC and blank screen

   Load this AFTER cc-global-header.js and cc-bottom-nav.js
   ========================================================================== */
(function () {
  'use strict';

  const DESKTOP_Q = '(min-width: 769px)';
  const MOBILE_Q = '(max-width: 768px)';
  const desktopMQ = window.matchMedia(DESKTOP_Q);
  const mobileMQ = window.matchMedia(MOBILE_Q);

  function isDesktop() { return desktopMQ.matches; }
  function isMobile() { return mobileMQ.matches; }

  function getPageName() {
    const p = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    return p === '' ? 'index.html' : p;
  }

  function cleanupDuplicates() {
    // Remove duplicate headers
    const headers = document.querySelectorAll('#cc-global-header-wrapper');
    if (headers.length > 1) {
      for (let i = 1; i < headers.length; i++) headers[i].remove();
    }

    // Remove duplicate bottom navs
    const bottomNavs = document.querySelectorAll('.cc-bottom-nav');
    if (bottomNavs.length > 1) {
      for (let i = 1; i < bottomNavs.length; i++) bottomNavs[i].remove();
    }

    // Remove legacy mobile systems that compete
    if (isDesktop()) {
      // On desktop, aggressively remove all mobile-only overlays
      document.querySelectorAll('.cc-mobile-ui, .ma-mobile-home, .cc-app-header, .cc-final-home, .cc-final-announcement, .cc-drawer, .cc-drawer-overlay, .cc-app-search-overlay, .cc-bottom-bar, .mobile-commerce-rails, .cc-mobile-brand, .cc-loading-screen').forEach(el => {
        // Keep if it's inside body and is mobile UI — hide via CSS, but also ensure not blocking
        if (el.classList.contains('cc-mobile-ui')) {
          el.style.display = 'none';
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
        }
      });

      // Remove duplicate announcement bars (keep only first)
      const annBars = document.querySelectorAll('#cc-announcement-bar, .announcement-bar');
      if (annBars.length > 1) {
        for (let i = 1; i < annBars.length; i++) annBars[i].remove();
      }

      // Ensure body scroll is restored
      document.body.style.overflow = '';
      document.body.classList.remove('ma-drawer-open', 'd7-menu-open', 'cc-modal-open', 'lux-drawer-open', 'lux-search-open');
    } else {
      // On mobile, handle index.html special case
      const page = getPageName();
      const hasApprovedUI = !!document.querySelector('.cc-mobile-ui');

      if (page === 'index.html' || page === '') {
        if (hasApprovedUI) {
          document.body.classList.add('cc-has-approved-mobile');
          // On mobile home, the approved UI replaces desktop main
          // Hide desktop main only if approved UI exists
          const desktopMain = document.querySelector('body > main');
          if (desktopMain && !desktopMain.closest('.cc-mobile-ui')) {
            // Check if approved mobile CSS already hides it — if not, we help by marking
            const styleCheck = window.getComputedStyle(desktopMain);
            // If approved UI is visible, hide desktop main for cleaner UX
            if (window.matchMedia('(max-width: 767px)').matches) {
              // Don't force hide via JS, let CSS handle, but add class for our CSS to target
            }
          }
        }
      } else {
        // On non-index pages, ensure main is visible even on mobile
        document.querySelectorAll('main, .shop-shell, .product-shell, .cart-shell, .account-shell').forEach(el => {
          el.style.display = '';
          el.style.opacity = '';
          el.style.visibility = '';
        });
        // Hide approved mobile UI if it somehow leaked to other pages
        document.querySelectorAll('.cc-mobile-ui').forEach(el => {
          el.style.display = 'none';
        });
        document.body.classList.remove('cc-has-approved-mobile');
      }
    }
  }

  function fixBodyScrollLock() {
    // If no drawer/modal is open, ensure body is scrollable
    const isDrawerOpen = document.body.classList.contains('ma-drawer-open') || document.body.classList.contains('d7-menu-open');
    const isModalOpen = document.body.classList.contains('cc-modal-open');

    if (!isDrawerOpen && !isModalOpen) {
      // Only reset if we previously locked and no modal is open
      if (document.body.style.overflow === 'hidden') {
        // Check if any open drawer/modal still exists in DOM
        const openDrawer = document.querySelector('.cc-drawer.open, .nav-links.open, .cc-app-search-overlay.is-open');
        if (!openDrawer) {
          document.body.style.overflow = '';
        }
      }
    }
  }

  function fixImageCrop() {
    // Lightweight version of homescreen crop fix — only runs on relevant pages
    const page = getPageName();
    if (page !== 'index.html' && page !== '' && page !== 'category.html') return;

    const cards = document.querySelectorAll('.product-card-lux, .lux-product-card, .cc-product');
    cards.forEach(card => {
      const container = card.querySelector('.lux-img-container, .cc-product-img');
      const img = card.querySelector('img');
      if (!container || !img) return;

      // Ensure container has correct styles
      if (!container.hasAttribute('data-cc-fixed')) {
        container.style.position = 'relative';
        container.style.overflow = 'hidden';
        container.style.backgroundColor = '#FAF1F4';
        container.setAttribute('data-cc-fixed', '1');
      }
    });
  }

  function restoreDesktopLayout() {
    if (!isDesktop()) return;

    // Ensure container isn't collapsed
    const containers = document.querySelectorAll('.container');
    containers.forEach(c => {
      if (c.style.display === 'none') c.style.display = '';
    });

    // Ensure hero, sections visible
    document.querySelectorAll('.hero, .categories, .bestsellers, .why-us, .d6-brand-story, footer').forEach(el => {
      if (el.style.display === 'none') el.style.display = '';
    });

    fixBodyScrollLock();
  }

  function handleViewportChange() {
    cleanupDuplicates();
    if (isDesktop()) {
      restoreDesktopLayout();
    }
    fixImageCrop();
    fixBodyScrollLock();
  }

  function boot() {
    if (!document.body) {
      setTimeout(boot, 50);
      return;
    }

    cleanupDuplicates();
    handleViewportChange();

    // Listen for viewport changes
    if (desktopMQ.addEventListener) {
      desktopMQ.addEventListener('change', handleViewportChange);
      mobileMQ.addEventListener('change', handleViewportChange);
    } else {
      desktopMQ.addListener(handleViewportChange);
      mobileMQ.addListener(handleViewportChange);
    }

    // Also listen for resize with debounce
    let resizeT;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(handleViewportChange, 150);
    }, { passive: true });

    // Watch for DOM mutations that might inject duplicates
    const observer = new MutationObserver(function (mutations) {
      let needsCleanup = false;
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            if (node.matches && (node.matches('.cc-bottom-nav') || node.matches('#cc-global-header-wrapper') || node.matches('.cc-mobile-ui') || node.matches('.announcement-bar'))) {
              needsCleanup = true;
            }
            // If a nested bottom-nav appears inside added subtree
            if (node.querySelector && node.querySelector('.cc-bottom-nav, #cc-global-header-wrapper, .cc-mobile-ui')) {
              needsCleanup = true;
            }
          }
        }
      }
      if (needsCleanup) {
        clearTimeout(window.__ccMasterCleanupTimer);
        window.__ccMasterCleanupTimer = setTimeout(function () {
          cleanupDuplicates();
          handleViewportChange();
        }, 100);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Periodic safety checks for first 5 seconds (catch late injections)
    let checks = 0;
    const interval = setInterval(function () {
      cleanupDuplicates();
      handleViewportChange();
      checks++;
      if (checks > 10) clearInterval(interval);
    }, 500);

    // Fix body scroll lock after load
    window.addEventListener('load', function () {
      setTimeout(function () {
        fixBodyScrollLock();
        cleanupDuplicates();
      }, 800);
    });

    console.log('[CC Responsive Master] Booted — Desktop:', isDesktop(), 'Mobile:', isMobile(), 'Page:', getPageName());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Expose helpers for other scripts
  window.__ccResponsiveMaster = {
    isDesktop,
    isMobile,
    cleanupDuplicates,
    handleViewportChange,
    restoreDesktopLayout
  };
})();
