/* ==========================================================================
   CHIC CHARMS — GLOBAL HEADER (inject + normalization)
   - Ensures Playfair Display is loaded (exact desktop brand font)
   - Injects ONE reusable header on pages that don't already have one
   - Replaces any uppercase "CHIC CHARMS" / <img wordmark> with the EXACT
     desktop wordmark:  ChicCharms   (no caps, no letterspacing, #8e4559)
   - Syncs cart badge count across localStorage / sessionStorage
   ========================================================================== */
(function () {
  if (window.__ccGlobalHeaderInit) return;
  window.__ccGlobalHeaderInit = true;

  /* ---------- 1. Ensure Playfair Display 500 is available (desktop font) ---------- */
  (function ensureFont() {
    var href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Jost:wght@300;400;500;600&display=swap';
    if (document.querySelector('link[href*="Playfair+Display"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  })();

  /* ---------- 2. Normalize any existing brand text nodes to the desktop wordmark ---------- */
  var DESKTOP_WORDMARK_HTML = 'Chic<span>Charms</span>';
  var DESKTOP_WORDMARK_TEXT = 'ChicCharms';

  function normalizeLogoText(el) {
    if (!el) return;
    // Already correct?
    if (el.getAttribute('data-cc-gh-normalized') === '1') return;

    // If element contains the desktop markup already, leave it
    var html = (el.innerHTML || '').replace(/\s+/g, ' ').trim();
    var isUppercaseFlat = /^\s*(CHIC\s*CHARMS|Chic\s*Charms|chic\s*charms)\s*$/i.test(el.textContent || '');
    var hasImage = el.querySelector('img');

    if (hasImage && /wordmark/i.test(el.querySelector('img').alt || '')) {
      // Replace wordmark image with text wordmark
      el.innerHTML = DESKTOP_WORDMARK_HTML;
    } else if (isUppercaseFlat) {
      el.innerHTML = DESKTOP_WORDMARK_HTML;
    }
    el.setAttribute('data-cc-gh-normalized', '1');
  }

  function normalizeAllExistingLogos() {
    var selectors = [
      '.cc-logo', '.ccap-brand', '.brand-mark', '.brand', '.drawer-brand',
      '.cc-drawer-logo', '.logo', '.cc-app-logo',
      'header h1', 'header .brand', 'header [class*="brand"]'
    ];
    document.querySelectorAll(selectors.join(',')).forEach(normalizeLogoText);
  }

  /* ---------- 3. Cart count sync ---------- */
  function getCartCount() {
    try {
      var raw = localStorage.getItem('cc_cart') || sessionStorage.getItem('cc_cart') || '[]';
      var arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr.reduce(function (n, it) { return n + (Number(it.qty) || Number(it.quantity) || 1); }, 0);
      }
      if (arr && typeof arr === 'object' && Array.isArray(arr.items)) {
        return arr.items.reduce(function (n, it) { return n + (Number(it.qty) || Number(it.quantity) || 1); }, 0);
      }
    } catch (e) {}
    return 0;
  }
  function syncCartBadges() {
    var count = getCartCount();
    document.querySelectorAll('[data-cc-gh-count], .cc-cart-count, .ccap-bag-count, .mobile-cart-count').forEach(function (b) {
      if (!b) return;
      if (count > 0) {
        b.textContent = count > 99 ? '99+' : String(count);
        b.classList.add('is-visible');
        b.style.display = '';
      } else {
        b.textContent = '';
        b.classList.remove('is-visible');
        b.style.display = 'none';
      }
    });
  }

  /* ---------- 4. Inject Global Header if missing ---------- */
  function injectHeader() {
    // Don't inject into admin pages or pages that already have a branded mobile header
    var path = (location.pathname || '').toLowerCase();
    if (/admin/.test(path)) return;

    // If page is mobile (≤767) AND has no branded header yet, inject the global one.
    if (window.innerWidth >= 768) return;

    // If existing mobile header is present, just normalize it instead of injecting
    var existingHeader = document.querySelector(
      'header.cc-header, header.ccap-header, header.navbar#navbar, header.header, ' +
      '.mobile-shell > header, .topbar, ' +
      'header.fixed.top-\\[40px\\], ' +
      'header.sticky.top-0.z-50, ' +
      'header.sticky.top-\\[40px\\]'
    );
    if (existingHeader) {
      normalizeAllExistingLogos();
      syncCartBadges();
      return;
    }

    // Pages without any mobile header (policy pages, about, contact, faq, etc.)
    var headerHTML =
      '<header class="cc-global-header" role="banner" data-cc-global-header="1">' +
        '<div class="cc-global-header__inner">' +
          '<div class="cc-global-header__left">' +
            '<button type="button" class="cc-global-header__btn" data-cc-gh-menu aria-label="Open menu">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
                '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>' +
              '</svg>' +
            '</button>' +
          '</div>' +
          '<div class="cc-global-header__center">' +
            '<a href="index.html" class="cc-global-header__logo" aria-label="ChicCharms home">' +
              DESKTOP_WORDMARK_HTML +
            '</a>' +
          '</div>' +
          '<div class="cc-global-header__right">' +
            '<a href="cart.html" class="cc-global-header__btn" data-cc-gh-bag aria-label="Shopping bag">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6Z"/>' +
                '<path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>' +
              '</svg>' +
              '<span class="cc-global-header__bag-count" data-cc-gh-count></span>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</header>';

    // Insert as very first child of <body>, after any admin banner
    var body = document.body;
    var anchor = body.querySelector('#adminReturnBanner');
    var wrap = document.createElement('div');
    wrap.innerHTML = headerHTML;
    var headerEl = wrap.firstElementChild;

    if (anchor && anchor.parentNode === body) {
      anchor.insertAdjacentElement('afterend', headerEl);
    } else {
      body.insertBefore(headerEl, body.firstChild);
    }

    // Body top padding so content clears sticky header
    body.style.paddingTop = '0';

    // Wire menu button → slide open the existing drawer if one exists, else go to home menu
    var menuBtn = headerEl.querySelector('[data-cc-gh-menu]');
    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        // Prefer existing drawer mechanisms used across the app
        var candidates = [
          document.getElementById('ccMenuBtn'),
          document.getElementById('mobileCommerceMenu'),
          document.getElementById('menuBtn'),
          document.querySelector('[data-drawer-open]'),
          document.querySelector('.mobile-commerce-menu'),
          document.querySelector('.icon-btn#menuBtn')
        ];
        for (var i = 0; i < candidates.length; i++) {
          if (candidates[i]) { candidates[i].click(); return; }
        }
        // Fallback: history back if there is history, else home
        if (window.history.length > 1) history.back();
        else location.href = 'index.html';
      });
    }

    syncCartBadges();
  }

  function boot() {
    normalizeAllExistingLogos();
    injectHeader();
    syncCartBadges();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Re-run shortly after to catch late-injected headers (approved mobile UI, etc.)
  setTimeout(boot, 300);
  setTimeout(boot, 1200);

  // Re-sync cart count when storage changes
  window.addEventListener('storage', syncCartBadges);
  document.addEventListener('cc:cart-changed', syncCartBadges);
  setInterval(syncCartBadges, 2000);
})();
