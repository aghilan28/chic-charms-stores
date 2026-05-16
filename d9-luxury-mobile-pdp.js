/* ============================================================
   d9-luxury-mobile-pdp.js
   Stage 2 · Luxury Mobile Product Cards + PDP Interactions
   Mobile-only — all logic gated to max-width 900px
   ============================================================ */

(function () {
  "use strict";

  const IS_MOBILE = () => window.innerWidth <= 900;

  /* ============================================================
     PART 1 — PRODUCT CARD REVEAL SYSTEM
     Intersection Observer for luxury staggered card entrances
     ============================================================ */
  function initCardReveals() {
    if (!IS_MOBILE()) return;

    const cards = document.querySelectorAll(".product-card-lux");
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("lux-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -48px 0px",
        threshold: 0.08,
      }
    );

    cards.forEach((card) => observer.observe(card));
  }

  /* Re-run reveals whenever new cards are injected (Firestore load) */
  function watchForNewCards() {
    if (!IS_MOBILE()) return;

    const container = document.getElementById("products-container");
    if (!container) return;

    const mut = new MutationObserver(() => {
      // Small delay to let CSS paint first
      requestAnimationFrame(() => {
        setTimeout(initCardReveals, 60);
      });
    });

    mut.observe(container, { childList: true, subtree: false });
  }

  /* ============================================================
     PART 2 — PDP MOBILE GALLERY SWIPE SYSTEM
     Touch-swipe between product images on mobile
     ============================================================ */
  function initPDPGallery() {
    if (!IS_MOBILE()) return;

    const frame = document.querySelector(".product-img-frame");
    if (!frame) return;

    const thumbs = Array.from(
      document.querySelectorAll(".product-gallery-thumb")
    );
    if (thumbs.length < 2) return;

    /* Build swipe track */
    const mainImg = frame.querySelector("img");
    if (!mainImg) return;

    /* Collect all images from thumbs */
    const images = thumbs.map((t) => {
      const img = t.querySelector("img");
      return img ? img.src : null;
    }).filter(Boolean);

    if (images.length < 2) return;

    let currentIndex = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let isDragging = false;

    /* Create dot indicators */
    let dotsContainer = document.querySelector(".product-gallery-dots");
    if (!dotsContainer) {
      dotsContainer = document.createElement("div");
      dotsContainer.className = "product-gallery-dots";
      frame.appendChild(dotsContainer);
    }

    dotsContainer.innerHTML = images
      .map(
        (_, i) =>
          `<button class="gallery-dot${i === 0 ? " active" : ""}" aria-label="Image ${i + 1}" data-index="${i}"></button>`
      )
      .join("");

    const dots = Array.from(dotsContainer.querySelectorAll(".gallery-dot"));

    /* ── Navigate to image by index ── */
    function goTo(index) {
      if (index < 0 || index >= images.length) return;
      if (index === currentIndex) return;
      currentIndex = index;

      /* Luxury cross-fade: out → src swap → in */
      mainImg.style.transition = "opacity 0.18s ease, transform 0.18s ease";
      mainImg.style.opacity    = "0";
      mainImg.style.transform  = "scale(1.015)";

      setTimeout(() => {
        mainImg.src = images[currentIndex];
        mainImg.style.transition = "opacity 0.34s ease, transform 0.34s cubic-bezier(0.16,1,0.3,1)";
        mainImg.style.opacity    = "1";
        mainImg.style.transform  = "scale(1)";
      }, 180);

      /* Update thumbs */
      thumbs.forEach((t, i) => {
        t.classList.toggle("is-active", i === currentIndex);
      });

      /* Update dots */
      dots.forEach((d, i) => {
        d.classList.toggle("active", i === currentIndex);
      });
    }

    /* ── Touch swipe on the frame ── */
    let touchStartTime = 0;

    frame.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        isDragging = true;
      },
      { passive: true }
    );

    frame.addEventListener(
      "touchend",
      (e) => {
        if (!isDragging) return;
        isDragging = false;

        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const dt = Date.now() - touchStartTime;

        /* Velocity-aware: fast flick or slow deliberate drag */
        const velocity = Math.abs(dx) / dt;
        const isFlick = velocity > 0.22 && Math.abs(dx) > 20;
        const isDrag  = Math.abs(dx) > 44;

        if ((!isFlick && !isDrag) || Math.abs(dx) < Math.abs(dy) * 1.1) return;

        if (dx < 0) {
          goTo(currentIndex + 1);
        } else {
          goTo(currentIndex - 1);
        }
      },
      { passive: true }
    );

    /* ── Thumb click navigation ── */
    thumbs.forEach((thumb, i) => {
      thumb.addEventListener("click", () => goTo(i));
    });

    /* ── Dot click navigation ── */
    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const idx = parseInt(dot.dataset.index, 10);
        goTo(idx);
      });
    });

    /* Mark first thumb active */
    if (thumbs[0]) thumbs[0].classList.add("is-active");
  }

  /* ============================================================
     PART 3 — PDP ACCORDION SYSTEM
     Mobile-optimized accordion with smooth height animation
     ============================================================ */
  function initPDPAccordions() {
    if (!IS_MOBILE()) return;

    const headers = document.querySelectorAll(
      ".product-accordion-header, .accordion-header"
    );

    headers.forEach((header) => {
      const item = header.closest(
        ".product-accordion-item, .accordion-item"
      );
      if (!item) return;

      /* Pre-measure body height for smooth transition */
      const body = item.querySelector(
        ".product-accordion-body, .accordion-body"
      );

      header.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");

        /* Close all with measured collapse */
        document
          .querySelectorAll(".product-accordion-item, .accordion-item")
          .forEach((el) => {
            if (el !== item && el.classList.contains("open")) {
              const b = el.querySelector(".product-accordion-body, .accordion-body");
              if (b) {
                b.style.maxHeight = b.scrollHeight + "px";
                requestAnimationFrame(() => {
                  b.style.maxHeight = "0";
                  b.style.opacity   = "0";
                });
              }
              el.classList.remove("open");
            }
          });

        /* Toggle current */
        if (!isOpen) {
          item.classList.add("open");
          if (body) {
            body.style.maxHeight = "0";
            body.style.opacity   = "0";
            requestAnimationFrame(() => {
              body.style.maxHeight = body.scrollHeight + "px";
              body.style.opacity   = "1";
            });
          }
        } else {
          if (body) {
            body.style.maxHeight = body.scrollHeight + "px";
            requestAnimationFrame(() => {
              body.style.maxHeight = "0";
              body.style.opacity   = "0";
            });
          }
          item.classList.remove("open");
        }

        header.setAttribute("aria-expanded", !isOpen);
      });

      /* Ensure correct ARIA attributes */
      header.setAttribute("aria-expanded", item.classList.contains("open"));
    });
  }

  /* ============================================================
     PART 4 — STICKY CTA SCROLL BEHAVIOR
     Show/hide sticky bar based on add-to-cart button visibility
     ============================================================ */
  function initStickyBar() {
    if (!IS_MOBILE()) return;

    const stickyBar = document.querySelector(
      ".product-sticky-cta, .pdp-sticky-bar"
    );
    const inlineBtn = document.querySelector(".btn-add-cart, .product-actions");
    if (!stickyBar || !inlineBtn) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        /* Show sticky bar when inline button is NOT visible */
        stickyBar.style.display = entry.isIntersecting ? "none" : "flex";
      },
      { threshold: 0.1 }
    );

    obs.observe(inlineBtn);
  }

  /* ============================================================
     PART 5 — CARD PREMIUM TOUCH FEEDBACK
     Adds .lux-pressing class for CSS-driven press state
     ============================================================ */
  function initCardTouchFeedback() {
    if (!IS_MOBILE()) return;

    document.querySelectorAll(".product-card-lux").forEach((card) => {
      card.addEventListener("touchstart", () => {
        card.classList.add("lux-pressing");
      }, { passive: true });

      card.addEventListener("touchend", () => {
        setTimeout(() => card.classList.remove("lux-pressing"), 180);
      }, { passive: true });

      card.addEventListener("touchcancel", () => {
        card.classList.remove("lux-pressing");
      }, { passive: true });
    });
  }

  /* ============================================================
     PART 6 — VARIANT OPTION SELECTION FEEDBACK
     ============================================================ */
  function initVariantOptions() {
    if (!IS_MOBILE()) return;

    const options = document.querySelectorAll(".variant-option");
    if (!options.length) return;

    options.forEach((opt) => {
      opt.addEventListener("click", () => {
        /* Update sibling active states */
        const siblings = opt
          .closest(".variant-options")
          ?.querySelectorAll(".variant-option");

        siblings?.forEach((s) => s.classList.remove("is-active"));
        opt.classList.add("is-active");

        /* Update variant label selected name if element exists */
        const label = opt
          .closest(".variant-selector")
          ?.querySelector(".variant-selected-name");

        if (label) {
          label.textContent = opt.textContent.trim();
        }
      });
    });
  }

  /* ============================================================
     PART 7 — D10 SCROLL REVEAL SYSTEM
     Drives .d10-reveal / .d10-reveal-up / .d10-visible classes
     ============================================================ */
  function initScrollReveals() {
    if (!IS_MOBILE()) return;

    const revealTargets = document.querySelectorAll(
      ".d10-reveal, .d10-reveal-up, .d10-reveal-fade, .d10-reveal-scale, " +
      ".collections-section, .products-section, .featured-section, " +
      ".editorial-section, .testimonials-section, " +
      ".section-header, .products-header, .products-filter-bar, .sort-bar, " +
      ".product-category-tag, .section-eyebrow"
    );

    if (!revealTargets.length) return;

    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("d10-visible");
            revealObs.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -36px 0px",
        threshold: 0.06,
      }
    );

    revealTargets.forEach((el) => revealObs.observe(el));
  }

  /* ============================================================
     PART 8 — PDP SCROLL PROGRESS BAR
     Thin rose line tracking scroll depth on product page
     ============================================================ */
  function initScrollProgress() {
    if (!IS_MOBILE()) return;
    if (!document.querySelector(".product-page, .pdp-page")) return;

    const bar = document.querySelector(".pdp-scroll-progress");
    if (!bar) return;

    let ticking = false;

    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        if (total <= 0) { ticking = false; return; }

        const pct = Math.min(100, (window.scrollY / total) * 100);
        bar.style.width = pct + "%";
        ticking = false;
      });
    }, { passive: true });
  }

  /* ============================================================
     PART 9 — IMAGE LOAD REVEAL
     Adds .d10-loading / .d10-loaded for soft image entrances
     ============================================================ */
  function initImageLoadReveal() {
    if (!IS_MOBILE()) return;

    document.querySelectorAll(".lux-img-container img, .product-img-frame img").forEach((img) => {
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
     INIT — Sequenced boot
     ============================================================ */
  function init() {
    /* Cards: run immediately if DOM ready */
    initCardReveals();
    watchForNewCards();
    initCardTouchFeedback();

    /* D10 motion system */
    initScrollReveals();
    initImageLoadReveal();

    /* PDP: needs the product to have loaded */
    if (document.querySelector(".product-img-frame")) {
      initPDPGallery();
      initPDPAccordions();
      initStickyBar();
      initVariantOptions();
      initScrollProgress();
    } else {
      /* Wait for product page JS to populate */
      const pdpObs = new MutationObserver(() => {
        if (document.querySelector(".product-img-frame")) {
          pdpObs.disconnect();
          initPDPGallery();
          initPDPAccordions();
          initStickyBar();
          initVariantOptions();
          initScrollProgress();
        }
      });
      pdpObs.observe(document.body, { childList: true, subtree: true });
    }
  }

  /* Boot on DOM ready */
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
        initCardReveals();
        initScrollReveals();
      }
    }, 200);
  });
})();
