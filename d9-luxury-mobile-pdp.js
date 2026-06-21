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

  function iconSVG(name) {
    const icons = {
      heart: '<svg viewBox="0 0 24 24"><path d="M20.8 4.6c-1.8-1.7-4.6-1.6-6.3.2L12 7.3 9.5 4.8C7.8 3 5 2.9 3.2 4.6 1.3 6.4 1.3 9.4 3.1 11.2L12 20l8.9-8.8c1.8-1.8 1.8-4.8-.1-6.6Z"/></svg>',
      zoom: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8M11 8v6M8 11h6"/></svg>',
      share: '<svg viewBox="0 0 24 24"><path d="M18 8a3 3 0 1 0-2.8-4M6 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm12-1a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/><path d="m8.7 15.4 6.6-3.8M8.7 18.6l6.6 3.8"/></svg>'
    };
    return icons[name] || icons.heart;
  }

  function ensureZoomOverlay() {
    let overlay = document.querySelector(".pdp-zoom-overlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "pdp-zoom-overlay";
    overlay.innerHTML = '<button type="button" class="pdp-zoom-close" aria-label="Close image zoom">×</button><img alt="Product zoom" />';
    document.body.appendChild(overlay);
    overlay.querySelector(".pdp-zoom-close").addEventListener("click", () => overlay.classList.remove("is-open"));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) overlay.classList.remove("is-open");
    });
    return overlay;
  }

  function enhancePremiumPDP() {
    if (!IS_MOBILE()) return;
    const layout = document.querySelector(".product-layout");
    const frame = document.querySelector(".product-img-frame");
    const info = document.querySelector(".product-info-col");
    const addBtn = document.querySelector("#addToCartBtn, .btn-add-cart:not(:disabled)");
    if (!layout || !frame || !info) return;

    if (!frame.querySelector(".pdp-floating-actions")) {
      const actions = document.createElement("div");
      actions.className = "pdp-floating-actions";
      actions.innerHTML =
        '<button type="button" class="pdp-float-btn pdp-wishlist-float" aria-label="Add to wishlist">' + iconSVG("heart") + '</button>' +
        '<button type="button" class="pdp-float-btn pdp-zoom-float" aria-label="Zoom product image">' + iconSVG("zoom") + '</button>' +
        '<button type="button" class="pdp-float-btn pdp-share-float" aria-label="Share product">' + iconSVG("share") + '</button>';
      frame.appendChild(actions);

      actions.querySelector(".pdp-wishlist-float").addEventListener("click", (event) => {
        const btn = event.currentTarget;
        btn.classList.toggle("is-loved");
        btn.classList.remove("lux-heart-pop");
        void btn.offsetWidth;
        btn.classList.add("lux-heart-pop");
      });

      actions.querySelector(".pdp-zoom-float").addEventListener("click", () => {
        const img = frame.querySelector("img");
        const overlay = ensureZoomOverlay();
        if (img) overlay.querySelector("img").src = img.currentSrc || img.src;
        overlay.classList.add("is-open");
      });

      actions.querySelector(".pdp-share-float").addEventListener("click", async () => {
        try {
          if (navigator.share) await navigator.share({ title: document.title, url: location.href });
        } catch (err) {}
      });
    }

    if (!info.querySelector(".pdp-delivery-card")) {
      const delivery = document.createElement("div");
      delivery.className = "pdp-delivery-card";
      delivery.innerHTML = '<span class="pdp-delivery-icon">✓</span><span><strong>Delivery in 3-5 days</strong><span>Free shipping above ₹399 · COD available</span></span>';
      const meta = info.querySelector(".product-meta-grid");
      if (meta) meta.parentNode.insertBefore(delivery, meta);
      else info.appendChild(delivery);
    }

    if (!info.querySelector(".pdp-premium-accordions")) {
      const accordions = document.createElement("div");
      accordions.className = "pdp-premium-accordions";
      accordions.innerHTML = [
        ["Details", "Skin-friendly finish, lightweight feel, and curated styling for everyday luxury."],
        ["Delivery & Returns", "Ships quickly across India. COD available and easy 7-day returns on eligible orders."],
        ["Care Guide", "Keep away from perfumes and moisture. Store in a soft pouch after every wear."]
      ].map((item, index) =>
        '<div class="pdp-premium-accordion' + (index === 0 ? " is-open" : "") + '">' +
          '<button type="button" aria-expanded="' + (index === 0 ? "true" : "false") + '"><span>' + item[0] + '</span><span>›</span></button>' +
          '<div class="pdp-premium-panel"><div class="pdp-premium-panel-inner">' + item[1] + '</div></div>' +
        '</div>'
      ).join("");
      const actions = info.querySelector(".product-actions");
      if (actions) actions.parentNode.insertBefore(accordions, actions);
      else info.appendChild(accordions);
      accordions.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
          const item = btn.closest(".pdp-premium-accordion");
          const open = item.classList.toggle("is-open");
          btn.setAttribute("aria-expanded", open ? "true" : "false");
        });
      });
    }

    if (!info.querySelector(".pdp-review-strip")) {
      const reviews = document.createElement("div");
      reviews.className = "pdp-review-strip";
      reviews.innerHTML =
        '<div class="pdp-review-card"><strong>4.8 ★ · Verified</strong><span>Looks premium and feels light enough for full-day wear.</span></div>' +
        '<div class="pdp-review-card"><strong>Loved for gifting</strong><span>The finish photographs beautifully and the packaging feels special.</span></div>';
      const trust = info.querySelector(".trust-pillars");
      if (trust) trust.parentNode.insertBefore(reviews, trust);
      else info.appendChild(reviews);
    }

    let sticky = document.querySelector(".pdp-sticky-buy");
    if (!sticky) {
      sticky = document.createElement("div");
      sticky.className = "pdp-sticky-buy";
      sticky.innerHTML = '<button type="button" class="pdp-sticky-add">Add to Cart</button><button type="button" class="pdp-sticky-buy-now">Buy Now</button>';
      document.body.appendChild(sticky);
      sticky.querySelector(".pdp-sticky-add").addEventListener("click", () => {
        const current = document.querySelector("#addToCartBtn, .btn-add-cart:not(:disabled)");
        if (current) current.click();
      });
      sticky.querySelector(".pdp-sticky-buy-now").addEventListener("click", () => {
        const current = document.querySelector("#addToCartBtn, .btn-add-cart:not(:disabled)");
        if (current) current.click();
        setTimeout(() => { window.location.href = "delivery-information.html"; }, 220);
      });
    }

    if (addBtn && !sticky.dataset.observing) {
      sticky.dataset.observing = "1";
      const obs = new IntersectionObserver(([entry]) => {
        sticky.classList.toggle("is-visible", !entry.isIntersecting);
      }, { threshold: 0.12 });
      obs.observe(addBtn);
    } else if (!addBtn) {
      sticky.classList.add("is-visible");
    }

    document.querySelectorAll(".product-img-frame img, .related-card img").forEach((img) => {
      img.decoding = "async";
      if (!img.closest(".product-img-frame")) img.loading = "lazy";
      img.style.filter = "none";
    });
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
          enhancePremiumPDP();
        }
      });
      pdpObs.observe(document.body, { childList: true, subtree: true });
    }

    enhancePremiumPDP();

    const productContent = document.getElementById("productContent");
    if (productContent) {
      let premiumTimer;
      new MutationObserver(() => {
        clearTimeout(premiumTimer);
        premiumTimer = setTimeout(() => {
          initPDPGallery();
          initImageLoadReveal();
          enhancePremiumPDP();
        }, 90);
      }).observe(productContent, { childList: true, subtree: true });
    }
  }

  /* Boot on DOM ready */
  function initFinalPDPInteractions() {
    if (!IS_MOBILE() || window.__ccFinalPdpInteractions) return;
    window.__ccFinalPdpInteractions = true;

    let qty = 1;
    const setQty = (next) => {
      qty = Math.max(1, Math.min(9, next));
      const label = document.getElementById("pdpStickyQty");
      if (label) label.textContent = String(qty);
    };

    document.addEventListener("click", (event) => {
      const qtyBtn = event.target.closest("[data-pdp-qty]");
      if (qtyBtn) {
        setQty(qty + Number(qtyBtn.getAttribute("data-pdp-qty") || 0));
        return;
      }

      const zoom = event.target.closest(".pdp-zoom-trigger");
      if (zoom) {
        const frame = zoom.closest(".product-img-frame");
        const img = frame ? frame.querySelector("img") : null;
        if (!img || !img.src) return;
        let modal = document.querySelector(".pdp-image-modal");
        if (!modal) {
          modal = document.createElement("div");
          modal.className = "pdp-image-modal";
          modal.innerHTML = '<button type="button" aria-label="Close image zoom">x</button><img alt="" />';
          document.body.appendChild(modal);
        }
        modal.querySelector("img").src = img.src;
        modal.querySelector("img").alt = img.alt || "Product image";
        modal.classList.add("is-open");
        document.body.classList.add("cc-modal-open");
        return;
      }

      const closeModal = event.target.closest(".pdp-image-modal button, .pdp-image-modal");
      if (closeModal && event.target === closeModal) {
        const modal = document.querySelector(".pdp-image-modal");
        if (modal) modal.classList.remove("is-open");
        document.body.classList.remove("cc-modal-open");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const modal = document.querySelector(".pdp-image-modal.is-open");
      if (modal) {
        modal.classList.remove("is-open");
        document.body.classList.remove("cc-modal-open");
      }
    });

    const content = document.getElementById("productContent");
    if (content && !window.__ccFinalPdpObserver) {
      window.__ccFinalPdpObserver = true;
      new MutationObserver(() => setQty(1)).observe(content, { childList: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFinalPDPInteractions);
  } else {
    initFinalPDPInteractions();
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
