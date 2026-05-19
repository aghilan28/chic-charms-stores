/* ============================================================
   d15-luxury-stage4-final.js
   Stage 4 · Parts 17–20 (FINAL)
   Navigation Ecosystem · Sensory Smoothness ·
   Editorial Cohesion · Production Polish
   Mobile-only — all logic gated to max-width 900px
   ============================================================ */

(function () {
  "use strict";

  /* ── DESKTOP SAFETY LOCK ── */
  if (window.innerWidth > 767) {
    document.documentElement.classList.remove('mobile-home', 'cc-mobile', 'app-shell-active');
    return;
  }

  const IS_MOBILE = () => window.innerWidth <= 767;
  const REDUCED   = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     PART 17 — LUXURY MOBILE PREMIUM NAVIGATION ECOSYSTEM
     ============================================================ */

  /* ── Navbar scroll state: at-top vs scrolled glass elevation ── */
  function initNavbarScrollState() {
    if (!IS_MOBILE()) return;

    const navbar = document.querySelector(".navbar, .nav, header nav, .site-header");
    if (!navbar) return;

    let lastY = 0;
    let ticking = false;

    function updateNav() {
      const y = window.scrollY;

      if (y < 20) {
        navbar.classList.add("s5-at-top");
        navbar.classList.remove("s5-scrolled");
      } else {
        navbar.classList.remove("s5-at-top");
        navbar.classList.add("s5-scrolled");
      }

      lastY = y;
      ticking = false;
    }

    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateNav);
    }, { passive: true });

    updateNav();
  }

  /* ── Menu: couture open/close with focus management ── */
  function initMenuEcosystem() {
    if (!IS_MOBILE()) return;

    const hamburger = document.getElementById("hamburger");
    const navLinks  = document.getElementById("navLinks") ||
                      document.querySelector(".nav-links");

    if (!hamburger || !navLinks) return;

    let isOpen = false;
    let lastFocus = null;

    function openMenu() {
      isOpen = true;
      lastFocus = document.activeElement;
      navLinks.classList.add("open");
      hamburger.setAttribute("aria-expanded", "true");
      document.body.classList.add("d7-menu-open");

      /* Animate links in: stagger opacity */
      if (!REDUCED) {
        const links = navLinks.querySelectorAll("a");
        links.forEach((link, i) => {
          link.style.opacity   = "0";
          link.style.transform = "translateX(12px)";
          setTimeout(() => {
            link.style.transition = `opacity 0.36s cubic-bezier(0.22,1,0.36,1), transform 0.44s cubic-bezier(0.22,1,0.36,1)`;
            link.style.opacity    = "";
            link.style.transform  = "";
          }, 60 + i * 40);
        });
      }

      /* Focus first link for accessibility */
      setTimeout(() => {
        const firstLink = navLinks.querySelector("a");
        if (firstLink) firstLink.focus({ preventScroll: true });
      }, 80);
    }

    function closeMenu() {
      isOpen = false;
      navLinks.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.classList.remove("d7-menu-open");

      if (lastFocus) {
        lastFocus.focus({ preventScroll: true });
        lastFocus = null;
      }
    }

    /* Hamburger toggle */
    hamburger.addEventListener("click", () => {
      if (isOpen) closeMenu(); else openMenu();
    });

    /* Close on backdrop (left of panel) tap */
    navLinks.addEventListener("click", (e) => {
      const panelW = Math.min(320, window.innerWidth * 0.88);
      if (e.clientX < window.innerWidth - panelW) closeMenu();
    });

    /* Close on Escape */
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) closeMenu();
    });

    /* Close on nav link tap (navigation imminent) */
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        closeMenu();
      });
    });

    /* Expose for other modules */
    window._s5CloseMenu = closeMenu;
  }

  /* ── Section enter: IntersectionObserver for section reveals ── */
  function initSectionEnterReveals() {
    if (!IS_MOBILE()) return;

    const sections = document.querySelectorAll(
      "main > section, " +
      "main > .collections-section, " +
      "main > .products-section, " +
      "main > .featured-section, " +
      "main > .editorial-section, " +
      "main > .testimonials-section"
    );

    if (!sections.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("s5-in-view");
            obs.unobserve(entry.target);
          }
        });
      },
      {
        root:       null,
        rootMargin: "0px 0px -32px 0px",
        threshold:  0.05,
      }
    );

    sections.forEach((s) => obs.observe(s));
  }

  /* ── Active nav link: highlight current page ── */
  function initActiveNavLink() {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const navLinks    = document.querySelectorAll("#navLinks a, .nav-links a, .bottom-nav-item");

    navLinks.forEach((link) => {
      const href = (link.getAttribute("href") || "").split("/").pop();
      if (href === currentPath || (currentPath === "" && href === "index.html")) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  /* ── Page exit: silk cross-fade navigation ── */
  function initPageTransitions() {
    if (!IS_MOBILE()) return;
    if (REDUCED) return;

    document.addEventListener("click", (e) => {
      const link = e.target.closest("a[href]");
      if (!link) return;

      const href = link.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("javascript") ||
        href.startsWith("mailto") ||
        href.startsWith("tel") ||
        link.target === "_blank" ||
        e.metaKey || e.ctrlKey || e.shiftKey
      ) return;

      /* Already intercepted by menu close etc */
      if (e.defaultPrevented) return;

      e.preventDefault();

      document.body.style.transition = "opacity 0.22s cubic-bezier(0.25,0.46,0.45,0.94)";
      document.body.style.opacity    = "0";

      setTimeout(() => {
        window.location.href = href;
      }, 200);
    });
  }

  /* ── Back nav: browser history confidence ── */
  function initBackNavigation() {
    if (!IS_MOBILE()) return;

    const backBtns = document.querySelectorAll(".nav-back, .pdp-back, .btn-back");
    backBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (history.length > 1) {
          history.back();
        } else {
          window.location.href = "index.html";
        }
      });
    });
  }

  /* ============================================================
     PART 18 — LUXURY MOBILE SENSORY SMOOTHNESS
     ============================================================ */

  /* ── Universal reveal system: s5-reveal class ── */
  function initSensoryReveals() {
    if (!IS_MOBILE()) return;

    const targets = document.querySelectorAll(
      ".s5-reveal, " +
      ".product-card-lux, " +
      ".collection-card, " +
      ".testimonial-card, " +
      ".review-card, " +
      ".feature-card, " +
      ".section-header, " +
      ".section-eyebrow, " +
      ".editorial-block"
    );

    if (!targets.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("s5-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      {
        root:       null,
        rootMargin: "0px 0px -28px 0px",
        threshold:  0.06,
      }
    );

    targets.forEach((t) => obs.observe(t));
  }

  /* ── Image: sensory load fade ── */
  function initSensoryImageLoad() {
    if (!IS_MOBILE()) return;

    function applyToImg(img) {
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add("s5-loaded");
        return;
      }
      img.classList.add("s5-loading");
      img.addEventListener("load", () => {
        img.classList.remove("s5-loading");
        img.classList.add("s5-loaded");
      }, { once: true });
      img.addEventListener("error", () => {
        img.classList.remove("s5-loading");
      }, { once: true });
    }

    document.querySelectorAll(
      ".product-img-frame img, " +
      ".product-card-img img, " +
      ".collection-img img, " +
      ".lux-img-container img, " +
      ".hero-img img, " +
      ".editorial-img img"
    ).forEach(applyToImg);

    /* Watch for dynamic images */
    const imgObs = new MutationObserver(() => {
      document.querySelectorAll("img:not(.s5-loading):not(.s5-loaded)").forEach((img) => {
        if (img.closest(".product-img-frame, .product-card-img, .lux-img-container")) {
          applyToImg(img);
        }
      });
    });

    imgObs.observe(document.body, { childList: true, subtree: true });
  }

  /* ── Scroll progress bar: PDP depth indicator ── */
  function initScrollProgressBar() {
    if (!IS_MOBILE()) return;
    if (!document.querySelector(".product-page, .pdp-page")) return;

    let bar = document.querySelector(".pdp-scroll-progress");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "pdp-scroll-progress";
      document.body.prepend(bar);
    }

    let ticking = false;

    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        if (total > 0) {
          bar.style.width = Math.min(100, (window.scrollY / total) * 100) + "%";
        }
        ticking = false;
      });
    }, { passive: true });
  }

  /* ── Touch: prevent scroll bleed on locked body ── */
  function initScrollLockGuard() {
    let touchStartY = 0;

    document.addEventListener("touchstart", (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener("touchmove", (e) => {
      if (!document.body.classList.contains("d7-menu-open")) return;

      const navLinks = document.getElementById("navLinks");
      if (!navLinks) return;

      /* Allow scroll within the panel */
      if (navLinks.contains(e.target)) return;

      e.preventDefault();
    }, { passive: false });
  }

  /* ── Overscroll: iOS elastic bounce containment ── */
  function initOverscrollContainment() {
    if (!IS_MOBILE()) return;

    const scrollers = document.querySelectorAll(
      ".cart-items, .products-grid, .product-grid-lux, " +
      ".collections-grid, .checkout-form, .account-body"
    );

    scrollers.forEach((el) => {
      el.style.overscrollBehavior = "contain";
    });
  }

  /* ============================================================
     PART 19 — LUXURY MOBILE EDITORIAL COHESION
     ============================================================ */

  /* ── Toast system: editorial notification voice ── */
  function initToastSystem() {
    /* Expose globally so other scripts can trigger */
    window.luxToast = function (message, duration = 2400) {
      if (!IS_MOBILE()) return;

      const existing = document.querySelector(".s5-toast-el");
      if (existing) existing.remove();

      const toast = document.createElement("div");
      toast.className = "toast notification s5-toast-el";
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.classList.add("s5-exit");
        toast.addEventListener("animationend", () => toast.remove(), { once: true });
      }, duration);
    };
  }

  /* ── Section stagger: editorial children breathing ── */
  function initSectionChildStagger() {
    if (!IS_MOBILE()) return;

    const containers = document.querySelectorAll(
      ".s5-stagger, " +
      ".products-grid, " +
      ".collections-grid, " +
      ".features-grid, " +
      ".testimonials-grid"
    );

    if (!containers.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const children = Array.from(entry.target.children);
          if (REDUCED) {
            children.forEach((c) => {
              c.style.opacity   = "";
              c.style.transform = "";
            });
          } else {
            children.forEach((child, i) => {
              child.style.transitionDelay = (i * 0.055) + "s";
              child.classList.add("s5-visible");
              /* Clean up delay after transition */
              setTimeout(() => {
                child.style.transitionDelay = "";
              }, 600 + i * 55);
            });
          }

          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.08 }
    );

    containers.forEach((c) => obs.observe(c));
  }

  /* ── Typography polish: apply font hierarchy to dynamic content ── */
  function applyEditorialTypography() {
    if (!IS_MOBILE()) return;

    /* Ensure all prices use serif */
    document.querySelectorAll(".price, .product-price, .card-price").forEach((el) => {
      if (!el.style.fontFamily) {
        el.style.fontFamily = "var(--font-head, 'Cormorant Garamond', Georgia, serif)";
      }
    });

    /* Watch for dynamically injected prices */
    const priceObs = new MutationObserver(() => {
      document.querySelectorAll(".price:not([data-s5-typed]), .product-price:not([data-s5-typed])").forEach((el) => {
        el.style.fontFamily = "var(--font-head, 'Cormorant Garamond', Georgia, serif)";
        el.setAttribute("data-s5-typed", "true");
      });
    });

    priceObs.observe(document.body, { childList: true, subtree: true });
  }

  /* ── Filter bar: snap-scroll with elegant centered selection ── */
  function initFilterBarSnap() {
    if (!IS_MOBILE()) return;

    const filterBars = document.querySelectorAll(
      ".products-filter-bar, .filter-bar, .lux-filter-bar"
    );

    filterBars.forEach((bar) => {
      bar.addEventListener("click", (e) => {
        const btn = e.target.closest(".filter-btn, .lux-filter-btn");
        if (!btn) return;

        /* Smooth scroll selected pill to center view */
        const barRect = bar.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        const offset  = btnRect.left - barRect.left - barRect.width / 2 + btnRect.width / 2;

        bar.scrollBy({ left: offset, behavior: "smooth" });
      }, { passive: true });
    });
  }

  /* ============================================================
     PART 20 — LUXURY MOBILE FINAL PREMIUM PRODUCTION POLISH
     ============================================================ */

  /* ── Smooth cart badge count: live update ── */
  function initCartCount() {
    function updateCount() {
      try {
        const cart  = JSON.parse(localStorage.getItem("cart") || "[]");
        const count = cart.reduce((n, i) => n + (i.qty || i.quantity || 1), 0);

        document.querySelectorAll(".d7-cart-count").forEach((badge) => {
          badge.textContent = count > 0 ? (count > 99 ? "99+" : count) : "";
          badge.style.display = count > 0 ? "" : "none";
        });
      } catch (_) { /* silent */ }
    }

    updateCount();
    window.addEventListener("storage", (e) => { if (e.key === "cart") updateCount(); });
    document.addEventListener("cartUpdated", updateCount);
  }

  /* ── Wishlist: heart persistence from localStorage ── */
  function initWishlistPersistence() {
    if (!IS_MOBILE()) return;

    function getWishlist() {
      try { return JSON.parse(localStorage.getItem("wishlist") || "[]"); }
      catch (_) { return []; }
    }

    function saveWishlist(list) {
      try { localStorage.setItem("wishlist", JSON.stringify(list)); }
      catch (_) {}
    }

    /* Mark already-saved items */
    const wishlist = getWishlist();
    document.querySelectorAll(".btn-wishlist[data-product-id], .card-wishlist[data-product-id]").forEach((btn) => {
      const id = btn.dataset.productId;
      if (wishlist.includes(id)) btn.classList.add("is-saved");
    });

    /* Toggle on tap */
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-wishlist[data-product-id], .card-wishlist[data-product-id]");
      if (!btn) return;

      const id   = btn.dataset.productId;
      const list = getWishlist();
      const idx  = list.indexOf(id);

      if (idx === -1) {
        list.push(id);
        btn.classList.add("is-saved");
        window.luxToast && window.luxToast("Saved to wishlist");
      } else {
        list.splice(idx, 1);
        btn.classList.remove("is-saved");
      }

      saveWishlist(list);
    });
  }

  /* ── Page-level body class: page-specific styling hooks ── */
  function initPageBodyClass() {
    const page = window.location.pathname.split("/").pop() || "index.html";
    const name = page.replace(".html", "");
    document.body.classList.add(`page-${name}`);
  }

  /* ── No-JS fallback: remove no-js class ── */
  function initNoJsFallback() {
    document.documentElement.classList.remove("no-js");
    document.documentElement.classList.add("js");
  }

  /* ── Keyboard nav: trap focus in open menu ── */
  function initMenuFocusTrap() {
    document.addEventListener("keydown", (e) => {
      const navLinks = document.getElementById("navLinks");
      if (!navLinks || !navLinks.classList.contains("open")) return;
      if (e.key !== "Tab") return;

      const focusable = navLinks.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusable.length) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ── View tracking: re-apply stagger on dynamic cards ── */
  function watchForNewContent() {
    if (!IS_MOBILE()) return;

    const grids = document.querySelectorAll(
      "#products-container, .products-grid, .product-grid-lux"
    );

    if (!grids.length) return;

    const mut = new MutationObserver(() => {
      requestAnimationFrame(() => {
        initSensoryReveals();
        initSensoryImageLoad();
        applyEditorialTypography();
      });
    });

    grids.forEach((g) => mut.observe(g, { childList: true, subtree: false }));
  }

  /* ── Body scroll: hide/show bottom nav on scroll direction ── */
  function initScrollDirectionNav() {
    if (!IS_MOBILE()) return;

    const bottomNav = document.querySelector(".bottom-nav, .mobile-bottom-nav, .tab-bar");
    if (!bottomNav) return;

    let lastY    = window.scrollY;
    let ticking  = false;

    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const y    = window.scrollY;
        const diff = y - lastY;

        if (diff > 12 && y > 80) {
          bottomNav.classList.add("s5-hidden");
        } else if (diff < -8) {
          bottomNav.classList.remove("s5-hidden");
        }

        lastY   = y;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ── Prefetch: anticipatory page loading ── */
  function initAnticipatoryPrefetch() {
    if (!IS_MOBILE()) return;
    function prefetch(href) {
      if (!href) return;
      if (document.querySelector(`link[rel='prefetch'][href='${href}']`)) return;
      const link = document.createElement("link");
      link.rel   = "prefetch";
      link.href  = href;
      link.as    = "document";
      document.head.appendChild(link);
    }

    const path = window.location.pathname.split("/").pop() || "index.html";

    if (path === "index.html" || path === "") {
      prefetch("products.html");
      prefetch("collections.html");
    } else if (path === "products.html") {
      prefetch("checkout.html");
    } else if (path === "cart.html") {
      try {
        if (JSON.parse(localStorage.getItem("cart") || "[]").length) {
          prefetch("checkout.html");
        }
      } catch (_) {}
    }
  }

  /* ── iOS: prevent 300ms tap delay legacy browsers ── */
  function initFastTap() {
    if (!IS_MOBILE()) return;
    /* Modern browsers handle this with touch-action: manipulation */
    /* Belt-and-suspenders for older iOS WebViews */
    if ("ontouchstart" in window) {
      document.documentElement.style.touchAction = "manipulation";
    }
  }

  /* ── Final: graceful image error fallback ── */
  function initImageErrorFallback() {
    if (!IS_MOBILE()) return;
    document.addEventListener("error", (e) => {
      const img = e.target;
      if (img.tagName !== "IMG") return;
      if (img.dataset.s5ErrorHandled) return;
      img.dataset.s5ErrorHandled = "true";
      img.style.background   = "rgba(250, 246, 240, 0.7)";
      img.style.minHeight    = "120px";
      img.alt                = img.alt || "";
    }, true);
  }

  /* ── Accessibility: announce page transitions to screen readers ── */
  function initARIALiveRegion() {
    if (!IS_MOBILE()) return;
    if (document.querySelector("#s5-live")) return;
    const live = document.createElement("div");
    live.id                = "s5-live";
    live.setAttribute("aria-live", "polite");
    live.setAttribute("aria-atomic", "true");
    live.setAttribute("class", "sr-only");
    live.style.cssText     =
      "position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
    document.body.appendChild(live);

    window._s5Announce = function (msg) {
      live.textContent = "";
      setTimeout(() => { live.textContent = msg; }, 80);
    };
  }

  /* ============================================================
     INIT — Sequenced luxury boot
     ============================================================ */
  function init() {
    /* Instant: no-JS, body class, prefetch */
    initNoJsFallback();
    initPageBodyClass();
    initARIALiveRegion();
    initFastTap();
    initImageErrorFallback();

    /* Part 17: Navigation Ecosystem */
    initNavbarScrollState();
    initMenuEcosystem();
    initSectionEnterReveals();
    initActiveNavLink();
    initBackNavigation();
    initPageTransitions();

    /* Part 18: Sensory Smoothness */
    initSensoryReveals();
    initSensoryImageLoad();
    initScrollProgressBar();
    initScrollLockGuard();
    initOverscrollContainment();

    /* Part 19: Editorial Cohesion */
    initToastSystem();
    initSectionChildStagger();
    applyEditorialTypography();
    initFilterBarSnap();

    /* Part 20: Final Polish */
    initCartCount();
    initWishlistPersistence();
    initScrollDirectionNav();
    initMenuFocusTrap();
    watchForNewContent();
    initAnticipatoryPrefetch();
  }

  /* Boot on DOM ready */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Resize / orientation re-evaluation */
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (IS_MOBILE()) {
        initNavbarScrollState();
        initSensoryReveals();
        initSectionChildStagger();
      } else {
        // Desktop cleanup: remove mobile-only classes added by this module
        document.querySelectorAll(".s5-at-top, .s5-scrolled").forEach(el => {
          el.classList.remove("s5-at-top", "s5-scrolled");
        });
        document.querySelectorAll(".s5-revealed, .s5-reveal-pending").forEach(el => {
          el.classList.remove("s5-revealed", "s5-reveal-pending");
        });
        // Close any open mobile panels
        const panel = document.querySelector(".s5-mega-panel.s5-open");
        if (panel) panel.classList.remove("s5-open");
        const overlay = document.querySelector(".s5-nav-overlay.s5-open");
        if (overlay) overlay.classList.remove("s5-open");
        document.body.classList.remove("s5-nav-open");
      }
    }, 240);
  }, { passive: true });

})();
