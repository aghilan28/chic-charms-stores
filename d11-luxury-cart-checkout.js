/* ============================================================
   d11-luxury-cart-checkout.js
   Stage 3 · Parts 8–10: Luxury Mobile Cart + Checkout + Performance
   Mobile-only — all logic gated to max-width 900px
   ============================================================ */

(function () {
  "use strict";

  const IS_MOBILE = () => window.innerWidth <= 900;

  /* ============================================================
     PART 8 — LUXURY MOBILE CART EXPERIENCE
     ============================================================ */

  /* ── Sticky checkout CTA bar ── */
  function initStickyCartCTA() {
    if (!IS_MOBILE()) return;
    if (!document.querySelector(".cart-page")) return;

    /* Build sticky bar if not already in DOM */
    let bar = document.querySelector(".d11-sticky-cart-cta");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "d11-sticky-cart-cta d11-hidden";
      bar.setAttribute("aria-label", "Checkout");
      bar.innerHTML = `
        <div class="d11-sticky-total-row">
          <span class="d11-sticky-total-label">Total</span>
          <span class="d11-sticky-total-price" id="d11StickyTotal">₹0</span>
        </div>
        <button class="d11-sticky-cta-btn" id="d11StickyCheckoutBtn" aria-label="Proceed to checkout">
          Proceed to Checkout
        </button>
        <div class="d11-sticky-trust">
          <span class="d11-sticky-trust-item">🔒 Secure</span>
          <span class="d11-sticky-trust-item">↩️ 7-Day Returns</span>
          <span class="d11-sticky-trust-item">🚚 Free ₹399+</span>
        </div>
      `;
      document.body.appendChild(bar);
    }

    const stickyBtn   = document.getElementById("d11StickyCheckoutBtn");
    const stickyTotal = document.getElementById("d11StickyTotal");

    /* Sync total from summary panel */
    function syncTotal() {
      const totalEl = document.getElementById("summaryTotal");
      if (totalEl && stickyTotal) {
        stickyTotal.textContent = totalEl.textContent;
      }
    }

    /* Show/hide based on cart summary visibility */
    const summaryEl = document.querySelector(".cart-summary");
    if (summaryEl) {
      const obs = new IntersectionObserver(
        ([entry]) => {
          bar.classList.toggle("d11-hidden", entry.isIntersecting);
          syncTotal();
        },
        { threshold: 0.1 }
      );
      obs.observe(summaryEl);
    }

    /* Sync total after renders */
    const totalObs = new MutationObserver(syncTotal);
    const summaryTotalEl = document.getElementById("summaryTotal");
    if (summaryTotalEl) {
      totalObs.observe(summaryTotalEl, { childList: true, characterData: true, subtree: true });
    }

    syncTotal();

    /* Wire button to existing handleCheckout if available */
    if (stickyBtn) {
      stickyBtn.addEventListener("click", () => {
        if (typeof window.handleCheckout === "function") {
          window.handleCheckout();
        } else {
          window.location.href = "checkout.html";
        }
      });
    }
  }

  /* ── Quantity button pulse feedback ── */
  function initQtyFeedback() {
    if (!IS_MOBILE()) return;

    /* Delegate: listen for qty value changes */
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".qty-btn");
      if (!btn) return;

      const controls = btn.closest(".qty-controls");
      if (!controls) return;

      const val = controls.querySelector(".qty-value");
      if (!val) return;

      /* Pulse the value display */
      val.classList.remove("d11-pulse");
      void val.offsetWidth; /* force reflow to re-trigger */
      val.classList.add("d11-pulse");
      val.addEventListener("animationend", () => val.classList.remove("d11-pulse"), { once: true });
    });
  }

  /* ── Cart item stagger entrance ── */
  function initCartItemStagger() {
    if (!IS_MOBILE()) return;

    const items = document.querySelectorAll(".cart-item");
    items.forEach((item, i) => {
      item.style.animationDelay = (i * 0.055) + "s";
    });
  }

  /* Re-stagger whenever cart re-renders */
  function watchCartRenders() {
    if (!IS_MOBILE()) return;

    const list = document.getElementById("cartItemsList");
    if (!list) return;

    const mut = new MutationObserver(() => {
      requestAnimationFrame(initCartItemStagger);
    });

    mut.observe(list, { childList: true });
  }

  /* ── Remove button: convert text to icon ── */
  function upgradeRemoveButtons() {
    if (!IS_MOBILE()) return;

    document.querySelectorAll(".btn-remove").forEach((btn) => {
      /* Replace text label — CSS ::before draws the × */
      if (btn.textContent.trim() === "Remove") {
        btn.setAttribute("aria-label", btn.getAttribute("aria-label") || "Remove item");
        btn.textContent = "";
      }
    });
  }

  /* Watch for new remove buttons after re-render */
  function watchRemoveButtons() {
    if (!IS_MOBILE()) return;

    const list = document.getElementById("cartItemsList");
    if (!list) return;

    const mut = new MutationObserver(() => {
      requestAnimationFrame(upgradeRemoveButtons);
    });

    mut.observe(list, { childList: true, subtree: true });
  }

  /* ============================================================
     PART 9 — LUXURY MOBILE CHECKOUT
     ============================================================ */

  /* ── Input focus: scroll field into view above keyboard ── */
  function initInputKeyboardAwareness() {
    if (!IS_MOBILE()) return;
    if (!document.querySelector(".checkout-page")) return;

    const inputs = document.querySelectorAll(
      ".form-group input, .form-group textarea"
    );

    inputs.forEach((input) => {
      input.addEventListener("focus", () => {
        /* Delay to let keyboard appear */
        setTimeout(() => {
          input.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 320);
      }, { passive: true });
    });
  }

  /* ── Payment method selection: animated transition ── */
  function initPaymentMethodAnimation() {
    if (!IS_MOBILE()) return;
    if (!document.querySelector(".checkout-page")) return;

    const options = document.querySelectorAll(".payment-method-option");
    options.forEach((opt) => {
      const radio = opt.querySelector("input[type='radio']");
      if (!radio) return;

      radio.addEventListener("change", () => {
        options.forEach((o) => {
          o.style.transition = "border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease";
        });
      });
    });
  }

  /* ── Form validation: luxury error reveal ── */
  function initFormValidationEnhancement() {
    if (!IS_MOBILE()) return;
    if (!document.querySelector(".form-card")) return;

    /* Smooth scroll to first error */
    const observer = new MutationObserver(() => {
      const firstError = document.querySelector(".field-error.visible");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    const globalError = document.getElementById("globalError");
    if (globalError) {
      observer.observe(globalError, { attributes: true, attributeFilter: ["class"] });
    }

    /* Input: clear error on type */
    document.querySelectorAll(".form-group input, .form-group textarea").forEach((input) => {
      input.addEventListener("input", () => {
        input.classList.remove("error");
        const errorEl = document.getElementById(input.id + "Error");
        if (errorEl) errorEl.classList.remove("visible");
      }, { passive: true });
    });
  }

  /* ── Order summary: collapsible on mobile ── */
  function initCheckoutSummaryCollapse() {
    if (!IS_MOBILE()) return;

    const summary = document.querySelector(".checkout-summary");
    if (!summary) return;

    const h2 = summary.querySelector("h2");
    if (!h2) return;

    const itemsList = summary.querySelector(".summary-items");
    if (!itemsList) return;

    /* Add toggle indicator */
    let isCollapsed = true;
    h2.style.cursor = "pointer";
    h2.style.userSelect = "none";
    h2.style.display = "flex";
    h2.style.justifyContent = "space-between";
    h2.style.alignItems = "center";

    const chevron = document.createElement("span");
    chevron.textContent = "›";
    chevron.style.cssText = `
      font-size: 1.2rem;
      color: var(--muted);
      transform: rotate(90deg);
      transition: transform 0.22s cubic-bezier(0.16,1,0.3,1);
      display: inline-block;
      font-weight: 300;
    `;
    h2.appendChild(chevron);

    /* Initially collapse item list */
    itemsList.style.overflow = "hidden";
    itemsList.style.maxHeight = "0";
    itemsList.style.opacity = "0";
    itemsList.style.transition = "max-height 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.22s ease";

    h2.addEventListener("click", () => {
      isCollapsed = !isCollapsed;

      if (!isCollapsed) {
        itemsList.style.maxHeight = itemsList.scrollHeight + "px";
        itemsList.style.opacity = "1";
        chevron.style.transform = "rotate(-90deg)";
      } else {
        itemsList.style.maxHeight = "0";
        itemsList.style.opacity = "0";
        chevron.style.transform = "rotate(90deg)";
      }
    });
  }

  /* ============================================================
     PART 10 — LUXURY MOBILE PERFORMANCE
     ============================================================ */

  /* ── Passive scroll handler for navbar ── */
  function initPassiveScrollOptimization() {
    /* Remove and re-attach any existing non-passive scroll listeners
       by using passive:true on our own scroll registration */

    /* Navbar shadow: passive scroll */
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    let lastScrollY = 0;
    let scrollTicking = false;

    window.addEventListener("scroll", () => {
      lastScrollY = window.scrollY;
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(() => {
          navbar.classList.toggle("scrolled", lastScrollY > 20);
          scrollTicking = false;
        });
      }
    }, { passive: true });
  }

  /* ── Image: async decode + lazy loading ── */
  function initImageOptimization() {
    if (!IS_MOBILE()) return;

    /* Set decoding=async on all images not yet loaded */
    document.querySelectorAll("img:not([decoding])").forEach((img) => {
      img.decoding = "async";
    });

    /* Set loading=lazy on below-fold images */
    document.querySelectorAll("img:not([loading])").forEach((img) => {
      const rect = img.getBoundingClientRect();
      if (rect.top > window.innerHeight) {
        img.loading = "lazy";
      }
    });
  }

  /* ── Prevent layout shifts: reserve space for dynamic content ── */
  function initLayoutStability() {
    if (!IS_MOBILE()) return;

    /* Cart item list: set explicit min-height to prevent jump */
    const list = document.getElementById("cartItemsList");
    if (list && list.children.length > 0) {
      /* Already rendered — no action needed */
      return;
    }

    /* Pre-measure: set placeholder height until JS renders cart */
    if (list) {
      list.style.minHeight = "180px";

      const releaseHeight = () => {
        list.style.minHeight = "";
      };

      const mut = new MutationObserver(() => {
        if (list.children.length > 0) {
          releaseHeight();
          mut.disconnect();
        }
      });

      mut.observe(list, { childList: true });
    }
  }

  /* ── Resize handler: debounced, only runs if breakpoint changes ── */
  let lastWasMobile = IS_MOBILE();
  let resizeRaf = null;

  function onResize() {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = null;
      const nowMobile = IS_MOBILE();
      if (nowMobile !== lastWasMobile) {
        lastWasMobile = nowMobile;
        if (nowMobile) {
          initCartItemStagger();
          upgradeRemoveButtons();
        }
      }
    });
  }

  window.addEventListener("resize", onResize, { passive: true });

  /* ── Reduce motion: respect user preference ── */
  function applyReducedMotion() {
    const pref = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (pref.matches) {
      document.documentElement.style.setProperty("--d11-dur-fast", "0.01s");
      document.documentElement.style.setProperty("--d11-dur-med", "0.01s");
      document.documentElement.style.setProperty("--d11-dur-slow", "0.01s");
    }
  }

  /* ── Prefetch checkout.html when cart has items ── */
  function prefetchCheckout() {
    if (!document.querySelector(".cart-page")) return;
    const cart = localStorage.getItem("cart");
    if (!cart) return;
    try {
      const items = JSON.parse(cart);
      if (!items || items.length === 0) return;
    } catch (e) { return; }

    if (document.querySelector("link[rel='prefetch'][href='checkout.html']")) return;

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = "checkout.html";
    document.head.appendChild(link);
  }

  /* ── Cart page: reduce expensive re-renders ── */
  function patchCartRenderDebounce() {
    if (!document.querySelector(".cart-page")) return;
    if (typeof window.renderCart !== "function") return;

    const original = window.renderCart;
    let renderPending = false;

    window.renderCart = function (...args) {
      if (renderPending) return;
      renderPending = true;
      requestAnimationFrame(() => {
        original.apply(this, args);
        renderPending = false;
      });
    };
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    /* Performance first */
    applyReducedMotion();
    initPassiveScrollOptimization();
    initImageOptimization();
    initLayoutStability();

    /* Cart */
    initStickyCartCTA();
    initQtyFeedback();
    initCartItemStagger();
    watchCartRenders();
    upgradeRemoveButtons();
    watchRemoveButtons();
    prefetchCheckout();

    /* Checkout */
    initInputKeyboardAwareness();
    initPaymentMethodAnimation();
    initFormValidationEnhancement();
    initCheckoutSummaryCollapse();

    /* Patch render after a tick to ensure window.renderCart is defined */
    setTimeout(patchCartRenderDebounce, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
