/* ============================================================
   d14-luxury-stage4.js
   Stage 4 · Parts 14–16
   Micro-Interactions · Emotional Visual Layer · Conversion Psychology
   Mobile-only — all logic gated to max-width 900px
   ============================================================ */

(function () {
  "use strict";

  const IS_MOBILE = () => window.innerWidth <= 900;

  /* ============================================================
     PART 14 — LUXURY MOBILE MICRO-INTERACTIONS
     ============================================================ */

  /* ── Button: CTA shimmer on first viewport entry ── */
  function initCTAShimmerOnReveal() {
    if (!IS_MOBILE()) return;

    const primaryBtns = document.querySelectorAll(
      ".btn-primary, .btn-add-cart, .d11-sticky-cta-btn"
    );
    if (!primaryBtns.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const btn = entry.target;
            /* Delay shimmer so user has moment to register button */
            setTimeout(() => {
              btn.classList.add("s4-shimmer");
              btn.addEventListener("animationend", () => {
                btn.classList.remove("s4-shimmer");
              }, { once: true });
            }, 260);
            obs.unobserve(btn);
          }
        });
      },
      { threshold: 0.7 }
    );

    primaryBtns.forEach((btn) => obs.observe(btn));
  }

  /* ── Cart icon: premium badge bump on cart change ── */
  function initCartBadgeBump() {
    const badges = document.querySelectorAll(".d7-cart-count");
    if (!badges.length) return;

    let prevCount = null;

    function checkBadge() {
      try {
        const cart  = JSON.parse(localStorage.getItem("cart") || "[]");
        const count = cart.reduce((n, i) => n + (i.qty || i.quantity || 1), 0);

        if (prevCount !== null && count !== prevCount) {
          badges.forEach((b) => {
            b.classList.remove("s4-bumping");
            void b.offsetWidth;
            b.classList.add("s4-bumping");
            b.addEventListener("animationend", () => b.classList.remove("s4-bumping"), { once: true });
          });
        }

        prevCount = count;
      } catch (_) { /* silent */ }
    }

    checkBadge();
    window.addEventListener("storage", (e) => { if (e.key === "cart") checkBadge(); });
    document.addEventListener("cartUpdated", checkBadge);
  }

  /* ── Add-to-cart: post-add confirmation ripple ── */
  function initAddToCartFeedback() {
    if (!IS_MOBILE()) return;

    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-add-cart");
      if (!btn) return;

      /* Fire only after cart logic has time to complete */
      setTimeout(() => {
        btn.classList.add("s4-added");
        btn.addEventListener("animationend", () => btn.classList.remove("s4-added"), { once: true });
      }, 60);
    });
  }

  /* ── Wishlist: organic heart beat ── */
  function initWishlistFeedback() {
    if (!IS_MOBILE()) return;

    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-wishlist, .btn-save, .btn-favorite");
      if (!btn) return;

      btn.classList.remove("s4-saved");
      void btn.offsetWidth;
      btn.classList.add("s4-saved");
      btn.addEventListener("animationend", () => btn.classList.remove("s4-saved"), { once: true });
    });
  }

  /* ── Quantity button: haptic-quality pulse ── */
  function initQtyMicroFeedback() {
    if (!IS_MOBILE()) return;

    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".qty-btn");
      if (!btn) return;

      const controls = btn.closest(".qty-controls");
      if (!controls) return;

      const val = controls.querySelector(".qty-value");
      if (!val) return;

      /* Remove first to re-trigger if rapid */
      val.classList.remove("d11-pulse");
      void val.offsetWidth;
      val.classList.add("d11-pulse");
      val.addEventListener("animationend", () => val.classList.remove("d11-pulse"), { once: true });
    });
  }

  /* ── Form focus: scroll field above keyboard with elegance ── */
  function initFormFocusScroll() {
    if (!IS_MOBILE()) return;

    const inputs = document.querySelectorAll(
      ".form-group input, .form-group textarea, .form-group select"
    );

    inputs.forEach((input) => {
      input.addEventListener("focus", () => {
        setTimeout(() => {
          input.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }, { passive: true });

      /* Clear error class on new input */
      input.addEventListener("input", () => {
        input.classList.remove("error");
        const err = document.getElementById(input.id + "Error");
        if (err) err.classList.remove("visible");
      }, { passive: true });
    });
  }

  /* ── Filter pills: selection ripple ── */
  function initFilterPillFeedback() {
    if (!IS_MOBILE()) return;

    document.addEventListener("click", (e) => {
      const pill = e.target.closest(".filter-btn, .lux-filter-btn, .sort-option");
      if (!pill) return;

      const siblings = pill.closest(".filter-bar, .sort-bar, .products-filter-bar, .lux-filter-bar");
      if (siblings) {
        siblings.querySelectorAll(".filter-btn, .lux-filter-btn").forEach((p) => {
          p.classList.remove("active");
        });
      }
      pill.classList.add("active");
    });
  }

  /* ── Gallery dot: liquid tap feedback ── */
  function initGalleryDotFeedback() {
    if (!IS_MOBILE()) return;

    document.addEventListener("click", (e) => {
      const dot = e.target.closest(".gallery-dot");
      if (!dot) return;

      const container = dot.closest(".product-gallery-dots");
      if (!container) return;

      container.querySelectorAll(".gallery-dot").forEach((d) => d.classList.remove("active"));
      dot.classList.add("active");
    });
  }

  /* ── Menu links: silk directional press ── */
  function initMenuLinkFeedback() {
    if (!IS_MOBILE()) return;

    const navLinks = document.querySelectorAll(".nav-link, #navLinks a");
    navLinks.forEach((link) => {
      link.addEventListener("touchstart", () => {
        link.style.opacity   = "0.6";
        link.style.transform = "translateX(3px)";
        link.style.transition = `opacity 80ms ease, transform 80ms ease`;
      }, { passive: true });

      link.addEventListener("touchend", () => {
        link.style.transition = `opacity 0.32s cubic-bezier(0.16,1,0.3,1), transform 0.32s cubic-bezier(0.16,1,0.3,1)`;
        link.style.opacity   = "";
        link.style.transform = "";
      }, { passive: true });

      link.addEventListener("touchcancel", () => {
        link.style.transition = `opacity 0.2s ease, transform 0.2s ease`;
        link.style.opacity   = "";
        link.style.transform = "";
      }, { passive: true });
    });
  }

  /* ── Remove button: understated icon press ── */
  function initRemoveButtonFeedback() {
    if (!IS_MOBILE()) return;

    document.addEventListener("touchstart", (e) => {
      const btn = e.target.closest(".btn-remove");
      if (!btn) return;
      btn.style.transition = "opacity 80ms ease, transform 80ms ease";
      btn.style.opacity    = "0.45";
      btn.style.transform  = "scale(0.88)";
    }, { passive: true });

    document.addEventListener("touchend", (e) => {
      const btn = e.target.closest(".btn-remove");
      if (!btn) return;
      btn.style.transition = "opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.35s cubic-bezier(0.16,1,0.3,1)";
      btn.style.opacity    = "";
      btn.style.transform  = "";
    }, { passive: true });
  }

  /* == Variant option: selection ceremony ── */
  function initVariantSelectionCeremony() {
    if (!IS_MOBILE()) return;

    document.addEventListener("click", (e) => {
      const opt = e.target.closest(".variant-option");
      if (!opt) return;

      const group = opt.closest(".variant-options");
      if (group) {
        group.querySelectorAll(".variant-option").forEach((o) => o.classList.remove("is-active"));
      }
      opt.classList.add("is-active");

      /* Update variant label */
      const label = opt.closest(".variant-selector")?.querySelector(".variant-selected-name");
      if (label) label.textContent = opt.textContent.trim();
    });
  }

  /* ============================================================
     PART 15 — LUXURY MOBILE EMOTIONAL VISUAL LAYER
     ============================================================ */

  /* ── Atmospheric image entrance: stagger on load ── */
  function initAtmosphericImageReveal() {
    if (!IS_MOBILE()) return;

    const all = document.querySelectorAll(
      ".product-card-lux img, .collection-card img, " +
      ".testimonial-card img, .why-us-card img, .feature-card img"
    );

    all.forEach((img) => {
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add("d10-loaded");
        return;
      }
      img.classList.add("d10-loading");
      img.addEventListener("load", () => {
        img.classList.remove("d10-loading");
        img.classList.add("d10-loaded");
      }, { once: true });
    });
  }

  /* ── Section atmosphere: ambient background transitions ── */
  function initSectionAtmosphere() {
    if (!IS_MOBILE()) return;

    const sections = document.querySelectorAll(
      ".bestsellers.section, .featured-section, .products-section, " +
      ".why-us.section, .testimonials-section, .categories.section"
    );

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.style.opacity = entry.isIntersecting ? "1" : "";
        });
      },
      { threshold: 0.04 }
    );

    sections.forEach((s) => obs.observe(s));
  }

  /* ── Navbar: scroll atmosphere transition ── */
  function initNavbarAtmosphere() {
    const navbar = document.getElementById("navbar") ||
                   document.querySelector(".navbar, .site-nav");
    if (!navbar) return;

    let ticking    = false;
    let lastScroll = 0;

    window.addEventListener("scroll", () => {
      lastScroll = window.scrollY;
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        navbar.classList.toggle("scrolled", lastScroll > 20);
        ticking = false;
      });
    }, { passive: true });
  }

  /* ── Testimonial: intimate entrance reveal ── */
  function initTestimonialReveals() {
    if (!IS_MOBILE()) return;

    const cards = document.querySelectorAll(
      ".testimonial-card, .review-card"
    );
    if (!cards.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, idx) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add("d10-visible");
            }, idx * 80);
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -32px 0px", threshold: 0.08 }
    );

    cards.forEach((c) => obs.observe(c));
  }

  /* ── Why-us / feature cards: stagger reveal ── */
  function initFeatureCardReveals() {
    if (!IS_MOBILE()) return;

    const cards = document.querySelectorAll(
      ".why-us-card, .why-feature, .feature-card"
    );
    if (!cards.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, idx) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add("d10-visible");
            }, idx * 65);
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -20px 0px", threshold: 0.06 }
    );

    cards.forEach((c) => obs.observe(c));
  }

  /* ── Collection cards: cinematic row reveal ── */
  function initCollectionCardReveals() {
    if (!IS_MOBILE()) return;

    const cards = document.querySelectorAll(".collection-card");
    if (!cards.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, idx) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("d10-visible"), idx * 55);
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -24px 0px", threshold: 0.06 }
    );

    cards.forEach((c) => obs.observe(c));
  }

  /* ── Hero: cinematic word-by-word entrance (if not already set) ── */
  function initHeroCinematicEntry() {
    if (!IS_MOBILE()) return;

    const headline = document.querySelector(".hero-headline");
    if (!headline || headline.dataset.s4Split) return;
    headline.dataset.s4Split = "true";

    /* Only apply if headline isn't already animating */
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      headline.style.opacity   = "0";
      headline.style.transform = "translateY(8px)";
      headline.style.transition = "opacity 0.72s cubic-bezier(0.16,1,0.3,1) 0.12s, transform 0.72s cubic-bezier(0.16,1,0.3,1) 0.12s";

      /* Trigger after first paint */
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          headline.style.opacity   = "1";
          headline.style.transform = "translateY(0)";
        });
      });
    }
  }

  /* ============================================================
     PART 16 — LUXURY MOBILE CONVERSION PSYCHOLOGY
     ============================================================ */

  /* ── Free shipping progress: invisible but felt ── */
  function initFreeShippingProgress() {
    if (!IS_MOBILE()) return;

    const FREE_THRESHOLD = 399; /* ₹399 free shipping */

    const bar  = document.querySelector(".free-shipping-fill, .shipping-progress-fill");
    const text = document.querySelector(".free-shipping-msg, .shipping-progress-msg");
    if (!bar) return;

    function updateBar() {
      try {
        const cart  = JSON.parse(localStorage.getItem("cart") || "[]");
        const total = cart.reduce((n, i) => {
          const price = parseFloat(i.price) || 0;
          const qty   = i.qty || i.quantity || 1;
          return n + (price * qty);
        }, 0);

        const pct = Math.min(100, (total / FREE_THRESHOLD) * 100);
        bar.style.width = pct + "%";

        if (text) {
          if (pct >= 100) {
            text.textContent = "You've unlocked free shipping ✨";
            text.style.color = "var(--rose-dark, #b5657a)";
          } else {
            const remaining = (FREE_THRESHOLD - total).toFixed(0);
            text.textContent = `₹${remaining} away from free shipping`;
          }
        }
      } catch (_) { /* silent */ }
    }

    updateBar();
    window.addEventListener("storage",      (e) => { if (e.key === "cart") updateBar(); });
    document.addEventListener("cartUpdated", updateBar);
  }

  /* ── CTA: subtle scroll-velocity CTA reveal ── */
  function initScrollCTAReveal() {
    if (!IS_MOBILE()) return;

    const stickyBar = document.querySelector(".d11-sticky-cart-cta");
    if (!stickyBar) return;

    let lastY   = 0;
    let ticking = false;

    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        /* If scrolling up fast — briefly enhance CTA visibility */
        if (currentY < lastY - 30 && !stickyBar.classList.contains("d11-hidden")) {
          stickyBar.style.transform = "translateY(0) scale(1.008)";
          setTimeout(() => { stickyBar.style.transform = ""; }, 380);
        }
        lastY   = currentY;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ── Section view-all: animated arrow shimmer ── */
  function initViewAllArrow() {
    if (!IS_MOBILE()) return;

    document.querySelectorAll(
      ".section-view-all:not([data-s4-arrow]), .view-all-link:not([data-s4-arrow])"
    ).forEach((link) => {
      link.setAttribute("data-s4-arrow", "true");

      if (!link.querySelector(".s4-arrow")) {
        const arrow = document.createElement("span");
        arrow.className = "s4-arrow";
        arrow.textContent = "→";
        arrow.style.cssText = [
          "display:inline-block",
          "transition:transform 0.32s cubic-bezier(0.16,1,0.3,1)",
          "will-change:transform",
        ].join(";");
        link.appendChild(arrow);
      }

      link.addEventListener("touchstart", () => {
        const a = link.querySelector(".s4-arrow");
        if (a) a.style.transform = "translateX(4px)";
      }, { passive: true });

      link.addEventListener("touchend", () => {
        const a = link.querySelector(".s4-arrow");
        if (a) a.style.transform = "";
      }, { passive: true });
    });
  }

  /* ── Cart: observe for new view-all links after render ── */
  function watchForViewAllLinks() {
    if (!IS_MOBILE()) return;

    const mut = new MutationObserver(() => {
      requestAnimationFrame(initViewAllArrow);
    });

    mut.observe(document.body, { childList: true, subtree: true });
  }

  /* ── Conversion: product card view tracking (passive intent signal) ── */
  function initProductViewTracking() {
    if (!IS_MOBILE()) return;

    const cards = document.querySelectorAll(".product-card-lux");
    if (!cards.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            /* Mark as seen: CSS can use this for depth/subtle effects */
            entry.target.dataset.s4Seen = "true";
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    cards.forEach((c) => obs.observe(c));
  }

  /* ── New product cards: re-apply all reveals on dynamic insert ── */
  function watchForNewProductCards() {
    if (!IS_MOBILE()) return;

    const container = document.getElementById("products-container") ||
                      document.querySelector(".products-grid, .product-grid-lux");
    if (!container) return;

    const mut = new MutationObserver(() => {
      requestAnimationFrame(() => {
        initProductViewTracking();
        initViewAllArrow();
      });
    });

    mut.observe(container, { childList: true, subtree: false });
  }

  /* ── Checkout form: real-time field validation feedback ── */
  function initCheckoutFieldHints() {
    if (!IS_MOBILE()) return;
    if (!document.querySelector(".checkout-page, .form-card")) return;

    document.querySelectorAll(".form-group input[required]").forEach((input) => {
      input.addEventListener("blur", () => {
        const isEmpty = !input.value.trim();
        input.classList.toggle("error", isEmpty);
        /* If empty and left: add very subtle opacity signal only */
        if (isEmpty) {
          input.style.opacity = "0.85";
          setTimeout(() => { input.style.opacity = ""; }, 1200);
        }
      }, { passive: true });

      input.addEventListener("input", () => {
        if (input.value.trim()) {
          input.classList.remove("error");
          input.style.opacity = "";
        }
      }, { passive: true });
    });
  }

  /* ── Prefetch next pages: anticipatory navigation ── */
  function initAnticipatoryPrefetch() {
    function prefetch(href) {
      if (!href) return;
      if (document.querySelector(`link[rel='prefetch'][href='${href}']`)) return;
      const link   = document.createElement("link");
      link.rel     = "prefetch";
      link.href    = href;
      link.as      = "document";
      document.head.appendChild(link);
    }

    /* Cart page: prefetch checkout */
    if (document.querySelector(".cart-page")) {
      try {
        const items = JSON.parse(localStorage.getItem("cart") || "[]");
        if (items.length) prefetch("checkout.html");
      } catch (_) {}
    }

    /* Home page: prefetch products */
    if (document.querySelector(".hero")) {
      prefetch("products.html");
    }
  }

  /* ── Trust signal: dynamic free shipping threshold indicator ── */
  function initFreeShippingBar() {
    if (!IS_MOBILE()) return;

    /* Only inject bar on cart page, near summary */
    const summary = document.querySelector(".cart-summary");
    if (!summary) return;

    /* Don't inject twice */
    if (document.querySelector(".s4-shipping-bar-wrap")) return;

    const wrap = document.createElement("div");
    wrap.className = "s4-shipping-bar-wrap";
    wrap.innerHTML = `
      <p class="free-shipping-msg shipping-progress-msg" style="
        font-size:0.7rem;
        letter-spacing:0.07em;
        text-transform:uppercase;
        color:var(--muted,#9b7b85);
        margin:0 0 6px;
        font-weight:600;
      "></p>
      <div class="free-shipping-bar shipping-progress-bar">
        <div class="free-shipping-fill shipping-progress-fill" style="width:0%"></div>
      </div>
    `;
    wrap.style.cssText = "padding:14px 18px 0;";
    summary.prepend(wrap);

    /* Trigger the existing progress init */
    initFreeShippingProgress();
  }

  /* ── Page transitions: silk cross-fade on navigation ── */
  function initPageTransitionLinks() {
    if (!IS_MOBILE()) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.addEventListener("click", (e) => {
      const link = e.target.closest("a[href]");
      if (!link) return;

      const href = link.getAttribute("href");
      /* Only internal, non-anchor links */
      if (!href || href.startsWith("#") || href.startsWith("javascript") ||
          href.startsWith("mailto") || href.startsWith("tel") ||
          link.target === "_blank") return;

      /* Don't intercept if modifier key */
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;

      e.preventDefault();

      document.body.style.transition = "opacity 0.24s cubic-bezier(0.25,0.46,0.45,0.94)";
      document.body.style.opacity    = "0";

      setTimeout(() => {
        window.location.href = href;
      }, 220);
    });
  }

  /* ============================================================
     INIT — Sequenced boot
     ============================================================ */

  function init() {
    /* Part 14: Micro-interactions */
    initCTAShimmerOnReveal();
    initCartBadgeBump();
    initAddToCartFeedback();
    initWishlistFeedback();
    initQtyMicroFeedback();
    initFormFocusScroll();
    initFilterPillFeedback();
    initGalleryDotFeedback();
    initMenuLinkFeedback();
    initRemoveButtonFeedback();
    initVariantSelectionCeremony();

    /* Part 15: Emotional visual layer */
    initAtmosphericImageReveal();
    initSectionAtmosphere();
    initNavbarAtmosphere();
    initTestimonialReveals();
    initFeatureCardReveals();
    initCollectionCardReveals();
    initHeroCinematicEntry();

    /* Part 16: Conversion psychology */
    initFreeShippingBar();
    initFreeShippingProgress();
    initScrollCTAReveal();
    initViewAllArrow();
    watchForViewAllLinks();
    initProductViewTracking();
    watchForNewProductCards();
    initCheckoutFieldHints();
    initAnticipatoryPrefetch();
    initPageTransitionLinks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Re-evaluate on resize / orientation change */
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (IS_MOBILE()) {
        initAtmosphericImageReveal();
        initViewAllArrow();
        initProductViewTracking();
      }
    }, 220);
  }, { passive: true });

})();
