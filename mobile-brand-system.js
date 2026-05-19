/*
 * mobile-brand-system.js — CONSOLIDATED VERSION
 *
 * DOM INJECTION DISABLED: createBrandHomepage, createGlobalBottomNav,
 * createMobileFooter, createMiniCart, createRecentPurchase,
 * createOnboardingToast, createBottomSheet, createNewsletter,
 * createLoadingScreen — ALL DISABLED.
 *
 * AUTHORITY: final-mobile-stabilization.js is the sole mobile DOM authority.
 * This file retains only non-conflicting utility helpers.
 */
(function () {
  "use strict";

  if (window.innerWidth > 767) {
    document.documentElement.classList.remove('mobile-home', 'cc-mobile', 'app-shell-active');
    return;
  }

  var mobileQuery = window.matchMedia("(max-width: 767px)");

  function isMobile() { return mobileQuery.matches; }

  function $all(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function cleanupStuckVisualState() {
    var activeModal = document.querySelector(
      ".cc-bottom-sheet.is-open, .cc-newsletter-modal.is-open, " +
      ".lux-search-overlay.is-open, .lux-mobile-drawer.is-open, " +
      ".cc-app-search-overlay.is-open, .cc-app-drawer.is-open"
    );
    if (!activeModal) {
      document.body.classList.remove("cc-modal-open", "lux-search-open", "lux-drawer-open", "d7-menu-open");
      document.documentElement.style.filter = "";
      document.body.style.filter = "";
    }
    $all(".cc-loading-screen.is-hidden").forEach(function (el) { el.remove(); });
  }

  function initMotionHardening() {
    if (!isMobile()) return;
    $all("img:not([decoding])").forEach(function (img) {
      img.decoding = "async";
      if (!img.hasAttribute("loading") && !img.closest(".hero, .cc-app-hero")) img.loading = "lazy";
    });
  }

  function cleanupForDesktop() {
    if (isMobile()) return;
    [".cc-mobile-brand", ".cc-loading-screen",
     ".cc-bottom-sheet-backdrop", ".cc-bottom-sheet",
     ".cc-newsletter-modal", ".cc-newsletter-backdrop",
     ".cc-mini-cart", ".cc-recent-purchase", ".cc-onboarding-toast", ".cc-mobile-footer"
    ].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    document.body.classList.remove("cc-modal-open");
    document.body.style.overflow = "";
  }

  function init() {
    if (!isMobile()) return;
    initMotionHardening();
    cleanupStuckVisualState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", function (e) { if (!e.matches) cleanupForDesktop(); });
  }
  window.addEventListener("load", cleanupStuckVisualState);
  window.addEventListener("pageshow", cleanupStuckVisualState);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) cleanupStuckVisualState();
  });
})();
