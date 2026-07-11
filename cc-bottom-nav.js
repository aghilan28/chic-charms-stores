/* ═══════════════════════════════════════════════════════════════════
   CHIC CHARMS — Global Bottom Navigation Component
   Source of truth: product.html cc-bottom-nav (EXACT replica)
   Single reusable component — injected once, shared across all pages.
   
   Excluded pages: auth, register, admin, checkout, payment, confirmation
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ── Configuration ─────────────────────────────────────────────── */
  var BREAKPOINT = 768;          // px — hide on desktop
  var Z_INDEX = 9999;           // ensure it's always on top

  /* Pages where the bottom nav should NOT appear */
  var EXCLUDED_PAGES = [
    "auth.html",
    "register.html",
    "admin.html",
    "admin-orders.html",
    "checkout.html",
    "checkout-review.html",
    "delivery-method.html",
    "delivery-information.html",
    "confirmation.html",
    "payment.html",
    "404.html"
  ];

  /* ── Helpers ──────────────────────────────────────────────────── */
  function pageName() {
    return (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  }

  function isExcluded() {
    var p = pageName();
    for (var i = 0; i < EXCLUDED_PAGES.length; i++) {
      if (p === EXCLUDED_PAGES[i]) return true;
    }
    // Also skip if URL contains /admin or /checkout paths
    if (/\/admin\//.test(window.location.pathname)) return true;
    return false;
  }

  function isMobile() {
    return window.matchMedia("(max-width: " + (BREAKPOINT - 1) + "px)").matches;
  }

  /* ── SVG Icons: EXACT replicas from product.html ─────────────── */
  function iconHome() {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  }

  function iconSearch() {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  }

  function iconWishlist() {
    return '<div class="nav-icon-wrapper" style="position:relative">' +
           '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
           '<span class="wishlist-count" style="position:absolute;top:-5px;right:-8px;background:#8e4559;color:white;font-size:9px;min-width:14px;height:14px;border-radius:50%;display:none;align-items:center;justify-content:center;font-family:sans-serif;font-weight:600">0</span>' +
           '</div>';
  }

  function iconBag() {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
  }

  function iconAccount() {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  }

  /* ── Nav HTML: EXACT replica from product.html ────────────────── */
  function buildNavHTML() {
    return [
      '<nav class="cc-bottom-nav" aria-label="Primary" role="navigation">',
      '  <a href="index.html" data-nav="home">',
      '    ' + iconHome(),
      '    <span>Home</span>',
      '  </a>',
      '  <a href="search.html" data-nav="search">',
      '    ' + iconSearch(),
      '    <span>Search</span>',
      '  </a>',
      '  <a href="wishlist.html" data-nav="wishlist">',
      '    ' + iconWishlist(),
      '    <span>Wishlist</span>',
      '  </a>',
      '  <a href="cart.html" data-nav="cart">',
      '    ' + iconBag(),
      '    <span>Bag</span>',
      '  </a>',
      '  <a href="account.html" data-nav="account">',
      '    ' + iconAccount(),
      '    <span>Account</span>',
      '  </a>',
      '</nav>'
    ].join("");
  }

  /* ── Activate correct tab based on current URL ────────────────── */
  function activateTab() {
    var path = pageName();
    var nav = document.querySelector(".cc-bottom-nav");
    if (!nav) return;

    var links = nav.querySelectorAll("a");
    var matched = false;

    links.forEach(function (a) {
      var href = (a.getAttribute("href") || "").split("#")[0].split("?")[0];
      a.classList.remove("active");
      a.removeAttribute("aria-current");

      if (!matched && (href === path || (path === "" && href === "index.html"))) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
        matched = true;
      }
    });

    // Fallback: if home page is rendered but path is empty
    if (!matched && (path === "" || path === "index.html")) {
      var homeLink = nav.querySelector('a[data-nav="home"]');
      if (homeLink) {
        homeLink.classList.add("active");
        homeLink.setAttribute("aria-current", "page");
      }
    }
  }

  /* ── Inject nav into the page ─────────────────────────────────── */
  function injectNav() {
    // Guard: don't inject if already present
    if (document.querySelector(".cc-bottom-nav")) return;

    var navHTML = buildNavHTML();

    // Create a container wrapper for proper DOM insertion
    var wrapper = document.createElement("div");
    wrapper.innerHTML = navHTML;
    var navElement = wrapper.firstChild;

    // Set z-index
    navElement.style.zIndex = String(Z_INDEX);

    // Append to body
    document.body.appendChild(navElement);

    // Mark body for CSS padding
    document.body.classList.add("cc-nav-active");

    // Activate correct tab
    activateTab();

    // Sync wishlist UI if the system is loaded
    if (window.CCWishlist && window.CCWishlist.syncUI) {
      window.CCWishlist.syncUI();
    }
  }

  /* ── Tear down (for viewport change to desktop) ───────────────── */
  function removeNav() {
    var nav = document.querySelector(".cc-bottom-nav");
    if (nav) nav.remove();
    document.body.classList.remove("cc-nav-active");
  }

  /* ── Viewport change handler ──────────────────────────────────── */
  function handleViewportChange() {
    if (isMobile() && !isExcluded()) {
      injectNav();
    } else {
      removeNav();
    }
  }

  /* ── Boot ─────────────────────────────────────────────────────── */
  function boot() {
    if (isExcluded()) return;
    if (!isMobile()) return;

    injectNav();
  }

  // Run on load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // Watch for viewport changes
  var mq = window.matchMedia("(max-width: " + (BREAKPOINT - 1) + "px)");
  if (mq.addEventListener) {
    mq.addEventListener("change", handleViewportChange);
  } else {
    mq.addListener(handleViewportChange);
  }

})();
