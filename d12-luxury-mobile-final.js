/* ============================================================
   d12-luxury-mobile-final.js
   Stage 3 · Parts 11–13
   Mobile Storytelling · Gesture UX · Navigation Psychology
   Mobile-only — all logic gated to max-width 900px
   ============================================================ */

(function () {
  "use strict";

  const IS_MOBILE = () => window.innerWidth <= 900;

  /* ============================================================
     PART 11 — LUXURY MOBILE STORYTELLING EXPERIENCE
     ============================================================ */

  /* ── D6 Brand Story reveal observer ── */
  function initStoryReveals() {
    if (!IS_MOBILE()) return;

    const storyEls = document.querySelectorAll(
      ".d6-reveal, .d6-reveal-left, .d6-reveal-right, " +
      ".d6-story-text, .d6-story-visuals, .d6-story-pull, " +
      ".d6-campaign-content, .d6-mood-item, " +
      ".why-us-card, .why-feature, " +
      ".testimonial-card, .review-card"
    );

    if (!storyEls.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("d6-visible", "d10-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -40px 0px",
        threshold: 0.06,
      }
    );

    storyEls.forEach((el) => obs.observe(el));
  }

  /* ── Cinematic section entrance sequencer ── */
  function initSectionSequencer() {
    if (!IS_MOBILE()) return;

    const sections = document.querySelectorAll(
      ".hero, .marquee-wrap, .d6-brand-story, .d6-marquee, " +
      ".categories.section, .bestsellers.section, " +
      ".d6-campaign, .d6-mood-strip, .why-us.section, " +
      ".testimonials-section, .d6-newsletter"
    );

    if (!sections.length) return;

    /* Each section: track when it starts to enter viewport */
    const sectionObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-d12-visible", "true");
            /* Stagger children in order */
            scheduleChildrenReveal(entry.target);
            sectionObs.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -20px 0px",
        threshold: 0.04,
      }
    );

    sections.forEach((s) => sectionObs.observe(s));
  }

  /* Reveal direct editorial children in staggered sequence */
  function scheduleChildrenReveal(section) {
    const candidates = section.querySelectorAll(
      ".section-eyebrow, .section-title, .section-header, " +
      ".d6-story-eyebrow, .d6-story-headline, .d6-story-body, " +
      ".d6-story-pull, .d6-story-cta"
    );

    candidates.forEach((el, i) => {
      if (el.classList.contains("d10-visible")) return;
      const delay = i * 90; /* 90ms stagger */
      setTimeout(() => {
        el.classList.add("d10-visible");
      }, delay);
    });
  }

  /* ── Scroll-linked parallax: hero image gentle drift ── */
  function initHeroParallax() {
    if (!IS_MOBILE()) return;

    const heroImg = document.querySelector(".hero-img");
    if (!heroImg) return;

    let ticking = false;

    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroH   = document.querySelector(".hero")?.offsetHeight || 0;

        if (scrollY < heroH) {
          /* Gentle upward drift: max 24px at bottom of hero */
          const progress = scrollY / heroH;
          const drift    = progress * 24;
          heroImg.style.transform = `translateY(${drift}px) translateZ(0)`;
        }

        ticking = false;
      });
    }, { passive: true });
  }

  /* ── Marquee: emotional pace control ── */
  function initMarqueePacing() {
    if (!IS_MOBILE()) return;

    const tracks = document.querySelectorAll(
      ".marquee-track, .d6-marquee-track, .ticker-track"
    );

    tracks.forEach((track) => {
      /* Slow to editorial pace */
      track.style.animationDuration = "32s";
      track.style.animationTimingFunction = "linear";

      /* Pause on touch — tactile editorial pause */
      track.addEventListener("touchstart", () => {
        track.style.animationPlayState = "paused";
      }, { passive: true });

      track.addEventListener("touchend", () => {
        /* Resume with brief delay — felt, not instant */
        setTimeout(() => {
          track.style.animationPlayState = "running";
        }, 280);
      }, { passive: true });
    });
  }

  /* ── Editorial image load crossfade ── */
  function initStoryImageReveal() {
    if (!IS_MOBILE()) return;

    const storyImgs = document.querySelectorAll(
      ".d6-story-img-main img, .d6-campaign img, " +
      ".d6-mood-item img, .collection-card img"
    );

    storyImgs.forEach((img) => {
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

  /* ============================================================
     PART 12 — LUXURY MOBILE GESTURE UX
     ============================================================ */

  /* ── Premium scroll feel: jitter elimination ── */
  function initScrollJitterFix() {
    if (!IS_MOBILE()) return;

    /* Force GPU layer on primary scroll containers */
    const scrollables = document.querySelectorAll(
      ".collection-cards-row, .related-scroll-row, " +
      ".product-gallery-thumbs, .lux-filter-bar, " +
      ".products-filter-bar, .hero-trust-row"
    );

    scrollables.forEach((el) => {
      el.style.webkitTransform = "translateZ(0)";
      el.style.transform       = "translateZ(0)";
      el.style.willChange      = "scroll-position";
    });
  }

  /* ── Gallery: refined swipe with velocity momentum ── */
  function initGalleryGestureRefinement() {
    if (!IS_MOBILE()) return;

    const frame = document.querySelector(".product-img-frame");
    if (!frame) return;

    let startX      = 0;
    let startY      = 0;
    let startTime   = 0;
    let currentX    = 0;
    let isDragging  = false;
    let isHorizontal = null;

    const img = frame.querySelector("img");
    if (!img) return;

    frame.addEventListener("touchstart", (e) => {
      startX      = e.touches[0].clientX;
      startY      = e.touches[0].clientY;
      startTime   = performance.now();
      currentX    = startX;
      isDragging  = true;
      isHorizontal = null;

      /* Live drag preview: subtle shift */
      img.style.transition = "none";
    }, { passive: true });

    frame.addEventListener("touchmove", (e) => {
      if (!isDragging) return;

      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;

      /* Determine axis on first significant movement */
      if (isHorizontal === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        isHorizontal = Math.abs(dx) > Math.abs(dy);
      }

      currentX = e.touches[0].clientX;

      /* Live feedback: slight image drag */
      if (isHorizontal) {
        const liveShift = dx * 0.12; /* resist — spring-like */
        img.style.transform = `translateX(${liveShift}px) translateZ(0)`;
      }
    }, { passive: true });

    frame.addEventListener("touchend", (e) => {
      if (!isDragging) return;
      isDragging = false;

      /* Restore image position with spring */
      img.style.transition = "transform 0.38s cubic-bezier(0.34, 1.04, 0.64, 1)";
      img.style.transform  = "translateX(0) translateZ(0)";

      /* Only fire swipe navigation if horizontal */
      if (!isHorizontal) return;

      const dx  = e.changedTouches[0].clientX - startX;
      const dt  = performance.now() - startTime;
      const vel = Math.abs(dx) / dt;

      const isFlick = vel > 0.25 && Math.abs(dx) > 18;
      const isDrag  = Math.abs(dx) > 48;

      if (!isFlick && !isDrag) return;

      /* Fire custom event — d9-luxury-mobile-pdp.js handles goTo() */
      const dir = dx < 0 ? "next" : "prev";
      frame.dispatchEvent(new CustomEvent("d12-swipe", { detail: { dir }, bubbles: true }));
    }, { passive: true });

    /* Listen to our custom event and proxy to existing goTo if present */
    frame.addEventListener("d12-swipe", (e) => {
      const dots  = frame.querySelectorAll(".gallery-dot");
      const active = frame.querySelector(".gallery-dot.active");
      if (!active) return;

      const currentIdx = parseInt(active.dataset.index, 10);
      const nextIdx    = e.detail.dir === "next"
        ? Math.min(currentIdx + 1, dots.length - 1)
        : Math.max(currentIdx - 1, 0);

      if (nextIdx === currentIdx) return;

      /* Simulate thumb click (d9 already handles this) */
      const thumbs = document.querySelectorAll(".product-gallery-thumb");
      if (thumbs[nextIdx]) thumbs[nextIdx].click();
    });
  }

  /* ── Button press: premium haptic-like timing ── */
  function initButtonGestures() {
    if (!IS_MOBILE()) return;

    /* Unified press handler for all interactive elements */
    const interactives = document.querySelectorAll(
      ".btn-primary, .btn-secondary, .btn-ghost, " +
      ".d11-sticky-cta-btn, .btn-add-cart"
    );

    interactives.forEach((btn) => {
      btn.addEventListener("touchstart", () => {
        btn.style.transitionDuration = "0.07s";
      }, { passive: true });

      btn.addEventListener("touchend", () => {
        /* Spring back with premium timing */
        setTimeout(() => {
          btn.style.transitionDuration = "";
        }, 80);
      }, { passive: true });

      btn.addEventListener("touchcancel", () => {
        btn.style.transitionDuration = "";
      }, { passive: true });
    });
  }

  /* ── Horizontal scroll: momentum indicator dots ── */
  function initScrollMomentumIndicators() {
    if (!IS_MOBILE()) return;

    const rows = document.querySelectorAll(
      ".collection-cards-row, .related-scroll-row"
    );

    rows.forEach((row) => {
      /* Gradient fade edges — CSS-driven via overflow */
      row.style.webkitMaskImage =
        "linear-gradient(to right, transparent 0%, black 5%, black 90%, transparent 100%)";
      row.style.maskImage =
        "linear-gradient(to right, transparent 0%, black 5%, black 90%, transparent 100%)";
    });
  }

  /* ── Touch: prevent ghost clicks after swipe ── */
  function initGhostClickPrevention() {
    if (!IS_MOBILE()) return;

    let lastTouchEndTime = 0;
    let didSwipe = false;

    document.addEventListener("touchstart", () => {
      didSwipe = false;
    }, { passive: true });

    document.addEventListener("touchmove", (e) => {
      const touch = e.changedTouches[0];
      if (Math.abs(touch.clientX - (e.touches[0]?.clientX || touch.clientX)) > 8) {
        didSwipe = true;
      }
    }, { passive: true });

    document.addEventListener("touchend", () => {
      lastTouchEndTime = Date.now();
    }, { passive: true });

    document.addEventListener("click", (e) => {
      if (didSwipe && Date.now() - lastTouchEndTime < 300) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, { capture: true });
  }

  /* ============================================================
     PART 13 — MOBILE NAVIGATION PSYCHOLOGY & FINAL POLISH
     ============================================================ */

  /* ── Navbar: intelligent hide/show on scroll ── */
  function initSmartNavbar() {
    if (!IS_MOBILE()) return;

    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    let lastScrollY  = window.scrollY;
    let ticking      = false;
    let navHidden    = false;
    const THRESHOLD  = 80; /* px scrolled before hide */
    const SHOW_EDGE  = 12; /* px scrolled up to re-show */

    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const scrollDelta    = currentScrollY - lastScrollY;

        /* Always show at very top */
        if (currentScrollY < THRESHOLD) {
          showNav();
        } else if (scrollDelta > 4 && !navHidden) {
          /* Scrolling down — hide */
          hideNav();
        } else if (scrollDelta < -SHOW_EDGE && navHidden) {
          /* Scrolling up — show */
          showNav();
        }

        lastScrollY = currentScrollY;
        ticking = false;
      });
    }, { passive: true });

    function hideNav() {
      navHidden = true;
      navbar.style.transform = "translateY(-100%)";
      navbar.style.transition = "transform 0.36s cubic-bezier(0.16, 1, 0.3, 1)";
    }

    function showNav() {
      navHidden = false;
      navbar.style.transform = "";
      navbar.style.transition = "transform 0.28s cubic-bezier(0.34, 1.04, 0.64, 1)";
    }

    /* Never hide when menu is open */
    const navLinks = document.getElementById("navLinks");
    if (navLinks) {
      const obs = new MutationObserver(() => {
        if (navLinks.classList.contains("open")) showNav();
      });
      obs.observe(navLinks, { attributes: true, attributeFilter: ["class"] });
    }
  }

  /* ── Navigation: close menu on link tap ── */
  function initMenuAutoClose() {
    if (!IS_MOBILE()) return;

    const navLinks  = document.getElementById("navLinks");
    const hamburger = document.getElementById("hamburger");

    if (!navLinks || !hamburger) return;

    /* Close on any link tap inside the menu */
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
        document.body.classList.remove("d7-menu-open");
      });
    });

    /* Close on backdrop tap — handled via navLinks click in auth-ui.js */
    /* Reinforce with escape key */
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navLinks.classList.contains("open")) {
        navLinks.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
        document.body.classList.remove("d7-menu-open");
        hamburger.focus();
      }
    });
  }

  /* ── Visual hierarchy: ensure no text overflow ── */
  function initTextOverflowGuard() {
    if (!IS_MOBILE()) return;

    /* Product names in cards: clamp gracefully */
    document.querySelectorAll(
      ".product-name, .lux-product-name, .cart-item-name"
    ).forEach((el) => {
      el.style.overflow      = "hidden";
      el.style.textOverflow  = "ellipsis";
      el.style.display       = "-webkit-box";
      el.style.webkitLineClamp = "2";
      el.style.webkitBoxOrient = "vertical";
    });
  }

  /* ── CTA balance: section view-all link prominence ── */
  function initCTABalance() {
    if (!IS_MOBILE()) return;

    /* Add arrow indicator to view-all links */
    document.querySelectorAll(
      ".section-view-all:not([data-d12-arrow])"
    ).forEach((link) => {
      link.setAttribute("data-d12-arrow", "true");
      if (!link.querySelector(".d12-arrow")) {
        const arrow = document.createElement("span");
        arrow.className    = "d12-arrow";
        arrow.textContent  = "→";
        arrow.style.cssText =
          "display:inline-block;transition:transform 0.28s cubic-bezier(0.34,1.04,0.64,1);margin-left:4px;";
        link.appendChild(arrow);
      }
    });
  }

  /* ── Interaction clarity: focus ring management ── */
  function initFocusRingMode() {
    /* Only show focus rings for keyboard users */
    let usingKeyboard = false;

    document.addEventListener("keydown", (e) => {
      if (e.key === "Tab") usingKeyboard = true;
    });

    document.addEventListener("touchstart", () => {
      usingKeyboard = false;
    }, { passive: true });

    document.addEventListener("mousedown", () => {
      usingKeyboard = false;
    });

    const styleEl = document.createElement("style");
    styleEl.id = "d12-focus-style";
    document.head.appendChild(styleEl);

    function updateFocusStyle() {
      styleEl.textContent = usingKeyboard
        ? ""
        : `@media (max-width:900px) { *:focus { outline: none !important; } }`;
    }

    document.addEventListener("keydown", updateFocusStyle);
    document.addEventListener("touchstart", updateFocusStyle, { passive: true });
    document.addEventListener("mousedown", updateFocusStyle);
    updateFocusStyle();
  }

  /* ── Spacing audit: remove orphan margins ── */
  function initSpacingCleanup() {
    if (!IS_MOBILE()) return;

    /* Ensure consistent bottom padding for last sections */
    const main = document.querySelector("main, .main-content");
    if (main) {
      const lastSection = main.lastElementChild;
      if (lastSection) {
        lastSection.style.marginBottom = "0";
      }
    }
  }

  /* ── Content priority: above-fold performance ── */
  function initAboveFoldPriority() {
    if (!IS_MOBILE()) return;

    /* Hero image: eager load, never lazy */
    const heroImg = document.querySelector(".hero-img");
    if (heroImg) {
      heroImg.loading  = "eager";
      heroImg.decoding = "sync";
      heroImg.fetchPriority = "high";
    }

    /* First-viewable product images: eager */
    const firstCards = document.querySelectorAll(".product-card-lux:nth-child(-n+4) img");
    firstCards.forEach((img) => {
      img.loading = "eager";
    });
  }

  /* ── Scroll restoration: smooth page transitions ── */
  function initScrollRestoration() {
    /* On navigation back: restore gentle fade */
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    /* On new page: always start at top */
    window.scrollTo(0, 0);
  }

  /* ── Final polish: cart badge live sync ── */
  function initCartBadgeSync() {
    function updateCartBadge() {
      const badges = document.querySelectorAll(".d7-cart-count");
      if (!badges.length) return;

      try {
        const cart  = JSON.parse(localStorage.getItem("cart") || "[]");
        const count = cart.reduce((sum, item) => sum + (item.qty || item.quantity || 1), 0);

        badges.forEach((badge) => {
          const prev = badge.textContent;
          badge.textContent = count > 0 ? (count > 99 ? "99+" : String(count)) : "";

          /* Bump animation on change */
          if (prev !== badge.textContent && badge.textContent) {
            badge.style.transform = "scale(1.4)";
            setTimeout(() => {
              badge.style.transform = "";
              badge.style.transition = "transform 0.38s cubic-bezier(0.34, 1.04, 0.64, 1)";
            }, 10);
          }
        });
      } catch (e) {
        /* Silent — cart may not exist */
      }
    }

    updateCartBadge();

    /* Sync on storage changes (other tabs / cart updates) */
    window.addEventListener("storage", (e) => {
      if (e.key === "cart") updateCartBadge();
    });

    /* Sync when cart is modified in same tab */
    document.addEventListener("cartUpdated", updateCartBadge);
  }

  /* ── Safe-area: ensure sticky bars respect notch ── */
  function initSafeAreaAwareness() {
    if (!IS_MOBILE()) return;

    /* Verify CSS env() support */
    const safeBottom = getComputedStyle(document.documentElement)
      .getPropertyValue("--safe-area-inset-bottom");

    if (safeBottom !== undefined) {
      document.documentElement.style.setProperty(
        "--d12-safe-bottom",
        "env(safe-area-inset-bottom, 0px)"
      );
    }
  }

  /* ── Final: lazy-observe all remaining d10 targets ── */
  function initFinalRevealCoverage() {
    if (!IS_MOBILE()) return;

    const missed = document.querySelectorAll(
      "[class*='d10-reveal']:not(.d10-visible), " +
      ".why-us-card:not(.d10-visible), " +
      ".feature-card:not(.d10-visible), " +
      ".newsletter-inner:not(.d10-visible)"
    );

    if (!missed.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("d10-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -20px 0px", threshold: 0.04 }
    );

    missed.forEach((el) => obs.observe(el));
  }

  /* ============================================================
     INIT — Sequenced boot
     ============================================================ */

  function init() {
    /* Part 11: Storytelling */
    initStoryReveals();
    initSectionSequencer();
    initHeroParallax();
    initMarqueePacing();
    initStoryImageReveal();

    /* Part 12: Gesture UX */
    initScrollJitterFix();
    initGalleryGestureRefinement();
    initButtonGestures();
    initScrollMomentumIndicators();
    initGhostClickPrevention();

    /* Part 13: Navigation Psychology & Polish */
    initSmartNavbar();
    initMenuAutoClose();
    initTextOverflowGuard();
    initCTABalance();
    initFocusRingMode();
    initSpacingCleanup();
    initAboveFoldPriority();
    initScrollRestoration();
    initCartBadgeSync();
    initSafeAreaAwareness();

    /* Final coverage sweep */
    setTimeout(initFinalRevealCoverage, 300);
  }

  /* Boot */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Re-evaluate on resize (orientation change) */
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (IS_MOBILE()) {
        initStoryReveals();
        initFinalRevealCoverage();
        initScrollMomentumIndicators();
      }
    }, 220);
  }, { passive: true });

})();
