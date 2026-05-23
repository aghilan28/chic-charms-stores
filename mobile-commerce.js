/*
 * mobile-commerce.js — CONSOLIDATED VERSION
 *
 * DOM INJECTION DISABLED:
 *   - createDrawer() → DISABLED (final-mobile-stabilization.js handles it)
 *   - createSearchOverlay() → DISABLED (final-mobile-stabilization.js handles it)
 *   - createCommerceRails() → DISABLED (duplicate product rails removed)
 *   - createFinalFilterSheet() → KEPT (filter/sort sheet, unique to this file)
 *
 * KEPT: scroll handlers, cart sync, promo slider, category pill clicks,
 *       filter sheet, cart count badge sync.
 *
 * AUTHORITY: final-mobile-stabilization.js is the sole mobile DOM authority.
 */
(function () {
  "use strict";

  if (window.innerWidth > 767) {
    document.documentElement.classList.remove('mobile-home', 'cc-mobile', 'app-shell-active');
    return;
  }

  var mobileQuery = window.matchMedia("(max-width: 767px)");
  var navbar = document.getElementById("navbar");
  var menuBtn = document.getElementById("mobileCommerceMenu");
  var promoTrack = document.getElementById("mobilePromoTrack");
  var categoryFilter = document.getElementById("categoryFilter");
  var sortFilter = document.getElementById("sortFilter");

  function isMobile() { return mobileQuery.matches; }

  function setCompactHeader() {
    if (!navbar || !isMobile()) return;
    navbar.classList.toggle("mobile-compact", window.scrollY > 18);
  }

  function scrollToShop() {
    var target = document.getElementById("shopControls") || document.getElementById("bestsellers");
    if (!target) return;
    var navH = navbar ? navbar.offsetHeight : 64;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - navH - 16, behavior: "smooth" });
  }

  function syncCartCount() {
    var count = 0;
    try {
      var cart = JSON.parse(localStorage.getItem("cart") || "[]");
      count = cart.reduce(function (sum, item) { return sum + Number(item.quantity || 1); }, 0);
    } catch (err) {}
    document.querySelectorAll(".mobile-cart-count, .d7-cart-count").forEach(function (el) {
      el.textContent = count ? String(count) : "";
    });
  }

  function cleanupOverlayState() {
    var active = document.querySelector(
      ".cc-app-search-overlay.is-open, .cc-app-drawer.is-open, " +
      ".lux-search-overlay.is-open, .lux-mobile-drawer.is-open"
    );
    if (!active) {
      document.body.classList.remove("lux-drawer-open", "lux-search-open", "cc-modal-open", "d7-menu-open");
      document.body.style.overflow = "";
      document.body.style.overflowY = "auto";
      document.body.style.touchAction = "";
      document.documentElement.style.overflowY = "visible";
    }
  }

  function icon(name) {
    var icons = {
      spark: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z"/></svg>',
      bag: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg>'
    };
    return icons[name] || "";
  }

  /* ── Category pill clicks ── */
  document.querySelectorAll("[data-mobile-category]").forEach(function (pill) {
    pill.addEventListener("click", function () {
      var category = pill.getAttribute("data-mobile-category") || "all";
      if (categoryFilter) {
        categoryFilter.value = category;
        categoryFilter.dispatchEvent(new Event("change", { bubbles: true }));
      }
      scrollToShop();
    });
  });

  /* ── Bottom tab active state ── */
  document.querySelectorAll(".mobile-bottom-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".mobile-bottom-tab").forEach(function (t) { t.classList.remove("is-active"); });
      tab.classList.add("is-active");
    });
  });

  /* ── Promo slider auto-scroll ── */
  if (promoTrack && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.setInterval(function () {
      if (!isMobile() || promoTrack.matches(":hover")) return;
      var firstCard = promoTrack.querySelector(".mobile-promo-card");
      if (!firstCard) return;
      var cardWidth = firstCard.getBoundingClientRect().width + 12;
      var nearEnd = promoTrack.scrollLeft + promoTrack.clientWidth >= promoTrack.scrollWidth - cardWidth;
      promoTrack.scrollTo({ left: nearEnd ? 0 : promoTrack.scrollLeft + cardWidth, behavior: "smooth" });
    }, 4200);
  }

  /* ── Filter/Sort sheet (unique feature, kept) ── */
  function createFinalFilterSheet() {
    if (!isMobile() || window.__ccFinalFilterSheet) return;
    window.__ccFinalFilterSheet = true;
    if (!categoryFilter && !sortFilter) return;

    var filterBtn = document.createElement("button");
    filterBtn.type = "button";
    filterBtn.className = "cc-mobile-filter-trigger";
    filterBtn.setAttribute("data-cc-injected", "1");
    filterBtn.innerHTML = icon("spark") + "<span>Filter</span>";

    var sortBtn = document.createElement("button");
    sortBtn.type = "button";
    sortBtn.className = "cc-mobile-sort-trigger";
    sortBtn.setAttribute("data-cc-injected", "1");
    sortBtn.innerHTML = icon("bag") + "<span>Sort</span>";

    var backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "cc-filter-sheet-backdrop";
    backdrop.setAttribute("data-cc-injected", "1");
    backdrop.setAttribute("aria-label", "Close filters");

    var sheet = document.createElement("section");
    sheet.className = "cc-filter-sheet";
    sheet.setAttribute("data-cc-injected", "1");
    sheet.setAttribute("aria-label", "Shop filters");
    sheet.innerHTML =
      "<h3>Refine your edit</h3>" +
      '<div class="cc-filter-sheet-row"><label for="ccSheetCategory">Collection</label><select id="ccSheetCategory"></select></div>' +
      '<div class="cc-filter-sheet-row"><label for="ccSheetSort">Sort by</label><select id="ccSheetSort"></select></div>' +
      '<div class="cc-filter-sheet-actions"><button type="button" data-cc-filter-reset>Reset</button><button type="button" class="is-primary" data-cc-filter-apply>Apply</button></div>';

    document.body.appendChild(filterBtn);
    document.body.appendChild(sortBtn);
    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);

    var sheetCategory = document.getElementById("ccSheetCategory");
    var sheetSort = document.getElementById("ccSheetSort");
    if (categoryFilter && sheetCategory) sheetCategory.innerHTML = categoryFilter.innerHTML;
    if (sortFilter && sheetSort) sheetSort.innerHTML = sortFilter.innerHTML;

    function syncToSheet() {
      if (categoryFilter && sheetCategory) sheetCategory.value = categoryFilter.value;
      if (sortFilter && sheetSort) sheetSort.value = sortFilter.value;
    }
    function openSheet(mode) {
      syncToSheet();
      sheet.classList.add("is-open");
      backdrop.classList.add("is-open");
      document.body.classList.add("cc-modal-open");
      window.setTimeout(function () {
        var target = mode === "sort" ? sheetSort : sheetCategory;
        if (target) target.focus({ preventScroll: true });
      }, 80);
    }
    function closeSheet() {
      sheet.classList.remove("is-open");
      backdrop.classList.remove("is-open");
      document.body.classList.remove("cc-modal-open");
      cleanupOverlayState();
    }
    function applySheet() {
      if (categoryFilter && sheetCategory) {
        categoryFilter.value = sheetCategory.value;
        categoryFilter.dispatchEvent(new Event("change", { bubbles: true }));
      }
      if (sortFilter && sheetSort) {
        sortFilter.value = sheetSort.value;
        sortFilter.dispatchEvent(new Event("change", { bubbles: true }));
      }
      closeSheet();
      scrollToShop();
    }

    filterBtn.addEventListener("click", function () { openSheet("filter"); });
    sortBtn.addEventListener("click", function () { openSheet("sort"); });
    backdrop.addEventListener("click", closeSheet);
    sheet.querySelector("[data-cc-filter-apply]").addEventListener("click", applySheet);
    sheet.querySelector("[data-cc-filter-reset]").addEventListener("click", function () {
      if (sheetCategory) sheetCategory.value = "all";
      if (sheetSort) sheetSort.value = "default";
      applySheet();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });
  }

  /* ── Image performance ── */
  function initCommercePolish() {
    if (!isMobile() || window.__ccCommercePolish) return;
    window.__ccCommercePolish = true;
    document.querySelectorAll("img:not([decoding])").forEach(function (img) {
      img.decoding = "async";
      if (!img.hasAttribute("loading") && !img.closest(".hero, .mobile-promo-card, .cc-app-hero")) img.loading = "lazy";
    });
  }

  /* ── Cart localStorage patch ── */
  if (isMobile()) {
    var origSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key, value) {
      origSetItem(key, value);
      if (key === "cart") syncCartCount();
    };
  }

  /* ── Scroll / resize listeners ── */
  window.addEventListener("scroll", setCompactHeader, { passive: true });
  window.addEventListener("storage", syncCartCount);
  window.addEventListener("keydown", function (e) { if (e.key === "Escape") cleanupOverlayState(); });
  window.addEventListener("load", cleanupOverlayState);
  window.addEventListener("pageshow", cleanupOverlayState);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) cleanupOverlayState(); });

  document.addEventListener("DOMContentLoaded", function () {
    if (!isMobile()) return;
    createFinalFilterSheet();
    initCommercePolish();
    setCompactHeader();
    syncCartCount();
    cleanupOverlayState();
  });
})();
