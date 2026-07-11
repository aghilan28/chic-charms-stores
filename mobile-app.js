/*
 * CHIC CHARMS mobile runtime
 * Single authority for phone-only homepage UI. Desktop markup stays untouched.
 *
 * NOTE: Bottom navigation is now a separate global component (cc-bottom-nav.js).
 * This file no longer builds or manages bottom nav — it was removed to avoid
 * duplicate/conflicting navigation bars.
 */
(function () {
  "use strict";

  var MOBILE_QUERY = "(max-width: 767px)";
  var mq = window.matchMedia(MOBILE_QUERY);
  var state = {
    ready: false,
    backdrop: null,
    headerCart: null,
    categoryRail: null,
    promoRail: null,
    lastScroll: 0,
    ticking: false
  };

  var categories = [
    ["all",               "All",      "images/editorial-everyday-hoops.png"],
    ["everyday-elegance", "Earrings", "images/style-everyday-elegance.png"],
    ["everyday-elegance", "Minimal",  "images/editorial-minimal-soul-closeup.png"],
    ["modern-romance",    "Pearl",    "images/story-soft-pearl-drop.png"],
    ["modern-romance",    "Korean",   "images/editorial-korean-morning-coffee.png"],
    ["heritage-muse",     "Bridal",   "images/style-heritage-muse.png"],
    ["everyday-elegance", "Gold",     "images/editorial-light-meets-gold.png"],
    ["after-dark",        "Party",    "images/style-after-dark.png"]
  ];

  var promos = [
    ["New Arrivals",    "Fresh drops under Rs.299",    "images/editorial-light-meets-gold.png",     "ma-promo-new"],
    ["Under Rs.299",    "Everyday shine, easy prices", "images/editorial-everyday-hoops.png",        "ma-promo-deal"],
    ["Bridal Soft Edit","Pearls, gold tones, glow",    "images/style-heritage-muse.png",             "ma-promo-bridal"],
    ["Minimal Muse",    "Clean pieces for daily wear", "images/editorial-minimal-soul-closeup.png",  "ma-promo-minimal"]
  ];

  /* ─── unchanged helpers ─────────────────────────────────────── */
  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  function icon(name) {
    var paths = {
      menu:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
      home:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      shop:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
      discover:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      account: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      admin:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      cart:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
      search:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
    };
    return paths[name] || "";
  }

  function onMobile() { return mq.matches; }

  function pageName() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  function currentCartCount() {
    try {
      var cart = typeof window.getCart === "function"
        ? window.getCart()
        : JSON.parse(localStorage.getItem("chic_cart") || "[]");
      return Array.isArray(cart)
        ? cart.reduce(function (sum, item) { return sum + Number(item.qty || item.quantity || 1); }, 0)
        : 0;
    } catch (err) { return 0; }
  }

  function updateCartBadges() {
    var count = currentCartCount();
    var label = count > 0 ? (count > 9 ? "9+" : String(count)) : "";
    document.querySelectorAll("[data-ma-cart-count], .mobile-cart-count").forEach(function (badge) {
      badge.textContent = label;
      badge.hidden = !label;
    });
  }

  function syncFilter(category) {
    var filter = document.getElementById("categoryFilter");
    if (filter) {
      filter.value = category || "all";
      filter.dispatchEvent(new Event("change", { bubbles: true }));
    }
    document.querySelectorAll("[data-ma-category]").forEach(function (item) {
      item.classList.toggle("is-active", item.getAttribute("data-ma-category") === (category || "all"));
    });
    document.querySelectorAll("[data-mobile-category]").forEach(function (item) {
      item.classList.toggle("is-active", item.getAttribute("data-mobile-category") === (category || "all"));
    });
  }

  function scrollToShop() {
    var target = document.getElementById("bestsellers");
    if (!target) return;
    var header = document.getElementById("navbar");
    var offset = header ? header.offsetHeight : 58;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.pageYOffset - offset - 10,
      behavior: "smooth"
    });
  }

  function bindCategoryLink(node, category) {
    node.addEventListener("click", function (event) {
      event.preventDefault();
      syncFilter(category);
      scrollToShop();
    });
  }

  function buildHeader() {
    var header = document.getElementById("navbar");
    var inner  = header && header.querySelector(".nav-inner");
    if (!header || !inner) return;
    var menu = document.getElementById("mobileCommerceMenu") || header.querySelector(".hamburger");
    if (menu) {
      menu.classList.add("ma-menu-button");
      menu.setAttribute("aria-controls", "navLinks");
      menu.setAttribute("aria-expanded", "false");
      if (!menu.querySelector("svg")) menu.innerHTML = icon("menu");
      menu.addEventListener("click", function () {
        document.body.classList.contains("ma-drawer-open") ? closeDrawer() : openDrawer();
      });
    }
    if (!inner.querySelector(".ma-header-cart")) {
      var cart = el("a", "ma-header-cart", { href: "cart.html", "aria-label": "Cart" });
      cart.innerHTML = icon("cart") + '<span class="mobile-cart-count" hidden></span>';
      inner.appendChild(cart);
      state.headerCart = cart;
    }
  }

  function buildDrawer() {
    var nav = document.getElementById("navLinks");
    if (nav) {
      nav.classList.add("ma-drawer");
      nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () { setTimeout(closeDrawer, 80); });
      });
    }
    state.backdrop = document.querySelector(".ma-drawer-backdrop");
    if (!state.backdrop) {
      state.backdrop = el("div", "ma-drawer-backdrop", { "aria-hidden": "true" });
      document.body.appendChild(state.backdrop);
    }
    state.backdrop.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeDrawer();
    });
  }

  function openDrawer() {
    document.body.classList.add("ma-drawer-open");
    var menu = document.getElementById("mobileCommerceMenu") || document.querySelector(".hamburger");
    if (menu) menu.setAttribute("aria-expanded", "true");
  }

  function closeDrawer() {
    document.body.classList.remove("ma-drawer-open");
    var menu = document.getElementById("mobileCommerceMenu") || document.querySelector(".hamburger");
    if (menu) menu.setAttribute("aria-expanded", "false");
  }

  function buildMobileSections() {
    var main = document.querySelector("main");
    if (!main) return;
    var page = pageName();
    if (page !== "index.html" && page !== "") return;

    var legacyPromo = document.querySelector(".mobile-promo-slider");
    if (legacyPromo) legacyPromo.classList.add("ma-legacy-mobile");
    var legacyStrip = document.querySelector(".mobile-category-strip");
    if (legacyStrip) legacyStrip.classList.add("ma-legacy-mobile");

    if (!document.querySelector(".ma-mobile-home")) {
      var home = el("section", "ma-mobile-home", { "aria-label": "Mobile shopping highlights" });

      var search = el("form", "ma-search", { role: "search" });
      search.innerHTML = icon("search") + '<input type="search" placeholder="Search jewellery…" aria-label="Search">';
      search.addEventListener("submit", function (event) {
        event.preventDefault();
        var input         = search.querySelector("input");
        var desktopSearch = document.getElementById("searchInput");
        if (desktopSearch && input) {
          desktopSearch.value = input.value;
          desktopSearch.dispatchEvent(new Event("input", { bubbles: true }));
        }
        scrollToShop();
      });
      home.appendChild(search);

      var catRail = el("div", "ma-category-rail", { "aria-label": "Shop categories" });
      categories.forEach(function (item) {
        var category = item[0], label = item[1], src = item[2];
        var card = el("a", "ma-category-pill" + (category === "all" ? " is-active" : ""), {
          href: "#bestsellers", "data-ma-category": category
        });
        card.innerHTML = '<img src="' + src + '" alt="' + label + '" loading="lazy"><span>' + label + "</span>";
        bindCategoryLink(card, category);
        catRail.appendChild(card);
      });
      home.appendChild(catRail);
      state.categoryRail = catRail;

      var promoRail = el("div", "ma-promo-rail", { "aria-label": "Featured offers" });
      promos.forEach(function (item) {
        var card = el("a", "ma-promo-card " + item[3], { href: "#bestsellers" });
        card.innerHTML = '<img src="' + item[2] + '" alt="' + item[0] + '" loading="lazy"><span>' + item[0] + " <strong>" + item[1] + "</strong></span>";
        card.addEventListener("click", function (event) { event.preventDefault(); scrollToShop(); });
        promoRail.appendChild(card);
      });
      home.appendChild(promoRail);
      state.promoRail = promoRail;

      var hero = document.querySelector(".hero");
      main.insertBefore(home, hero || main.firstChild);
    }

    document.querySelectorAll("[data-mobile-category]").forEach(function (item) {
      bindCategoryLink(item, item.getAttribute("data-mobile-category") || "all");
    });
  }

  function wireSearch() {
    var mobileSearch  = document.getElementById("mobileCommerceSearch");
    var desktopSearch = document.getElementById("searchInput");
    if (!mobileSearch || !desktopSearch || mobileSearch.dataset.maBound) return;
    mobileSearch.dataset.maBound = "true";
    mobileSearch.addEventListener("input", function () {
      desktopSearch.value = mobileSearch.value;
      desktopSearch.dispatchEvent(new Event("input", { bubbles: true }));
    });
    mobileSearch.addEventListener("focus", scrollToShop);
  }

  function smartHeader() {
    var header = document.getElementById("navbar");
    if (!header || state.ticking) return;
    state.ticking = true;
    requestAnimationFrame(function () {
      var y          = window.pageYOffset || 0;
      var shouldHide = y > state.lastScroll && y > 120 && !document.body.classList.contains("ma-drawer-open");
      header.classList.toggle("ma-header-hidden", shouldHide);
      header.classList.toggle("scrolled", y > 8);
      state.lastScroll = Math.max(0, y);
      state.ticking    = false;
    });
  }

  function boot() {
    if (!onMobile()) return;
    document.documentElement.classList.add("ma-mobile-active");
    var currentPage = pageName();
    document.body.classList.remove("cc-mobile-home-page", "cc-mobile-account-page", "cc-mobile-cart-page", "cc-mobile-auth-page");
    if      (currentPage === "account.html") document.body.classList.add("cc-mobile-account-page");
    else if (currentPage === "cart.html")    document.body.classList.add("cc-mobile-cart-page");
    else if (currentPage === "auth.html" || currentPage === "register.html")    document.body.classList.add("cc-mobile-auth-page");
    else                                     document.body.classList.add("cc-mobile-home-page");

    buildHeader();
    buildDrawer();
    buildMobileSections();
    /* bottom nav is now handled by cc-bottom-nav.js (global component) */
    wireSearch();
    updateCartBadges();

    if (!state.ready) {
      state.ready = true;
      window.addEventListener("scroll",       smartHeader,      { passive: true });
      window.addEventListener("cart-updated", updateCartBadges);
      window.addEventListener("storage",      updateCartBadges);

      document.addEventListener("click", function (event) {
        if (event.target.closest(".lux-cart-btn, .btn-cart, [data-add]")) {
          setTimeout(updateCartBadges, 250);
        }
      });
    }
  }

  function handleViewportChange() {
    if (onMobile()) {
      boot();
    } else {
      closeDrawer();
      document.documentElement.classList.remove("ma-mobile-active");
      var header = document.getElementById("navbar");
      if (header) header.classList.remove("ma-header-hidden");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  if (mq.addEventListener) mq.addEventListener("change", handleViewportChange);
  else mq.addListener(handleViewportChange);
})();
