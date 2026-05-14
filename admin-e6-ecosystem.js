/* ============================================================
   admin-e6-ecosystem.js — Chic Charms
   Phase E6 — Unified Luxury Operational Ecosystem

   This module is the final integration layer binding:
     ✔ storefront → admin continuity
     ✔ unified motion language
     ✔ cross-system navigation rhythm
     ✔ operational brand consistency
     ✔ production-ready admin UX flow

   Exports:
     initE6Ecosystem()           — call once per admin page
     E6Nav                       — operational navigation manager
     E6RevealOrchestrator        — coordinated reveal system
     E6OperationalSearch         — admin search/filter UX
     E6KeyboardShortcuts         — admin power-user shortcuts
     E6PageTransition            — admin page transitions
     initStorefrontEcosystem()   — call on storefront pages
     E6ScrollReveal              — unified scroll reveal system

   ZERO Firebase imports — pure UX/integration layer.
   Import alongside admin-e5-integration.js on admin pages.
============================================================ */

/* ─────────────────────────────────────────────────────────────
   E6 PAGE TRANSITION
   Smooth brand-coherent transitions between admin pages.
───────────────────────────────────────────────────────────── */
export const E6PageTransition = (() => {
  const DURATION = 240;
  let _ready = false;

  function _inject() {
    if (document.getElementById("e6-page-transition-style")) return;
    const s = document.createElement("style");
    s.id = "e6-page-transition-style";
    s.textContent = `
      body.e6-page-exit {
        opacity: 0;
        transform: translateY(-4px);
        transition: opacity ${DURATION}ms cubic-bezier(0.45,0,0.75,0.2),
                    transform ${DURATION}ms cubic-bezier(0.45,0,0.75,0.2);
        pointer-events: none;
      }
    `;
    document.head.appendChild(s);
  }

  /**
   * Navigate with a luxury exit transition.
   * @param {string} url — destination URL
   * @param {number} [delay] — ms before navigation fires
   */
  function navigate(url, delay = 0) {
    _inject();
    const go = () => {
      document.body.classList.add("e6-page-exit");
      setTimeout(() => {
        window.location.href = url;
      }, DURATION + 20);
    };
    delay > 0 ? setTimeout(go, delay) : go();
  }

  /**
   * Wire all internal admin links for transition.
   * Call once per admin page after DOM ready.
   */
  function wireLinks() {
    _inject();
    if (_ready) return;
    _ready = true;

    document.addEventListener("click", (e) => {
      const anchor = e.target.closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
      if (anchor.target === "_blank") return;

      // Only wire same-origin, html page links
      const isSamePage = href === window.location.pathname ||
                         href === window.location.href;
      if (isSamePage) return;

      const isExternal = href.startsWith("http") &&
                         !href.includes(window.location.hostname);
      if (isExternal) return;

      e.preventDefault();
      navigate(href);
    }, { capture: false });
  }

  return { navigate, wireLinks };
})();

/* ─────────────────────────────────────────────────────────────
   E6 REVEAL ORCHESTRATOR
   Coordinates reveal animations for the admin dashboard.
   Extends adminReveal() from admin-session-ux.js.
───────────────────────────────────────────────────────────── */
export const E6RevealOrchestrator = (() => {
  const STAGGER = 55;
  const DURATION_CLASS = "admin-reveal";

  /**
   * Reveal elements with staggered animation.
   * @param {string[]} selectors
   * @param {number}   [baseDelay=0]
   */
  function reveal(selectors = [], baseDelay = 0) {
    let delay = baseDelay;

    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (el.id === "adminAuthOverlay") return;
        el.classList.add(DURATION_CLASS);
        el.style.animationDelay = `${delay}ms`;
        el.style.animationFillMode = "both";
        delay += STAGGER;
      });
    });
  }

  /**
   * Default admin dashboard reveal sequence.
   */
  function revealDashboard() {
    reveal([
      ".admin-sidebar",
      ".admin-bar",
      ".topbar",
    ], 0);

    reveal([
      ".metrics-grid .metric-card",
      ".stats-grid .stat-card",
      ".analytics-card",
    ], 180);

    reveal([
      ".admin-main > section",
      ".admin-main > .card",
      ".page > section",
      ".page > .card",
      ".product-grid .product-card",
    ], 280);
  }

  /**
   * E6 scroll-based reveal for elements below the fold.
   */
  function initScrollReveal() {
    const els = document.querySelectorAll("[data-e6-reveal]");
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("e6-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach((el) => {
      el.classList.add("e6-reveal");
      obs.observe(el);
    });

    return obs;
  }

  return { reveal, revealDashboard, initScrollReveal };
})();

/* ─────────────────────────────────────────────────────────────
   E6 NAV — Operational Navigation Manager
   Manages active states, breadcrumbs, and sidebar state.
───────────────────────────────────────────────────────────── */
export const E6Nav = (() => {
  let _sidebarOpen = false;

  /**
   * Mark the current page active in sidebar navigation.
   */
  function setActiveNav() {
    const path = window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".admin-sidebar a, .topbar-nav a").forEach((a) => {
      const href = a.getAttribute("href") || "";
      const linkPage = href.split("/").pop();

      if (linkPage === path || (path === "" && linkPage === "index.html")) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      } else {
        a.classList.remove("active");
        a.removeAttribute("aria-current");
      }
    });
  }

  /**
   * Wire mobile sidebar toggle (hamburger or menu button).
   * @param {string} [triggerSel] — selector for toggle button
   * @param {string} [sidebarSel] — selector for sidebar
   */
  function wireSidebarToggle(
    triggerSel = ".sidebar-toggle, [data-sidebar-toggle]",
    sidebarSel = ".admin-sidebar"
  ) {
    const trigger  = document.querySelector(triggerSel);
    const sidebar  = document.querySelector(sidebarSel);
    const overlay  = _getOrCreateSidebarOverlay();

    if (!trigger || !sidebar) return;

    trigger.addEventListener("click", () => _toggleSidebar(sidebar, overlay, trigger));
    overlay.addEventListener("click", () => _closeSidebar(sidebar, overlay, trigger));

    // Escape key closes sidebar
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && _sidebarOpen) {
        _closeSidebar(sidebar, overlay, trigger);
      }
    });
  }

  function _toggleSidebar(sidebar, overlay, trigger) {
    _sidebarOpen ? _closeSidebar(sidebar, overlay, trigger)
                 : _openSidebar(sidebar, overlay, trigger);
  }

  function _openSidebar(sidebar, overlay, trigger) {
    _sidebarOpen = true;
    sidebar.classList.add("open");
    overlay.classList.add("visible");
    trigger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function _closeSidebar(sidebar, overlay, trigger) {
    _sidebarOpen = false;
    sidebar.classList.remove("open");
    overlay.classList.remove("visible");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  function _getOrCreateSidebarOverlay() {
    let overlay = document.getElementById("e6SidebarOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "e6SidebarOverlay";
      const style = document.createElement("style");
      style.textContent = `
        #e6SidebarOverlay {
          position: fixed;
          inset: 0;
          z-index: 290;
          background: rgba(28, 25, 23, 0.38);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.28s ease, visibility 0.28s ease;
        }
        #e6SidebarOverlay.visible {
          opacity: 1;
          visibility: visible;
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  /**
   * Inject a back-to-storefront link into the sidebar footer.
   * @param {string} [containerSel]
   */
  function injectStorefrontLink(containerSel = ".admin-side-footer") {
    const container = document.querySelector(containerSel);
    if (!container || container.querySelector(".storefront-link")) return;

    const link = document.createElement("a");
    link.href = "index.html";
    link.className = "storefront-link";
    link.setAttribute("aria-label", "Return to Chic Charms storefront");
    link.innerHTML = `<span aria-hidden="true" style="opacity:0.5;margin-right:6px;">←</span> View Storefront`;
    container.insertBefore(link, container.firstChild);
  }

  return { setActiveNav, wireSidebarToggle, injectStorefrontLink };
})();

/* ─────────────────────────────────────────────────────────────
   E6 OPERATIONAL SEARCH
   Unified search/filter UX for admin product + order lists.
───────────────────────────────────────────────────────────── */
export const E6OperationalSearch = (() => {

  /**
   * Wire a live search input to filter a list of rows.
   * @param {object} opts
   * @param {string}   opts.inputId       — search input element id
   * @param {string}   opts.itemSelector  — CSS selector for filterable items
   * @param {string}   opts.textSelector  — CSS selector within items to match text
   * @param {Function} [opts.onFilter]    — callback(matchCount) after each filter
   */
  function wire({ inputId, itemSelector, textSelector, onFilter }) {
    const input = document.getElementById(inputId);
    if (!input) return;

    let _debounce = null;

    input.addEventListener("input", () => {
      clearTimeout(_debounce);
      _debounce = setTimeout(() => _filter(
        input.value, itemSelector, textSelector, onFilter
      ), 160);
    });

    // Clear on Escape
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        input.value = "";
        _filter("", itemSelector, textSelector, onFilter);
      }
    });
  }

  function _filter(query, itemSelector, textSelector, onFilter) {
    const q = query.trim().toLowerCase();
    const items = document.querySelectorAll(itemSelector);
    let matches = 0;

    items.forEach((item) => {
      const textEl = textSelector ? item.querySelector(textSelector) : item;
      const text   = (textEl?.textContent || "").toLowerCase();
      const visible = !q || text.includes(q);

      item.style.display   = visible ? "" : "none";
      item.style.opacity   = visible ? "1" : "0";
      if (visible) matches++;
    });

    if (typeof onFilter === "function") onFilter(matches);
  }

  /**
   * Wire a select dropdown filter.
   * @param {string}   selectId
   * @param {string}   itemSelector
   * @param {string}   itemAttr     — data-attribute on items to match against
   * @param {Function} [onFilter]
   */
  function wireSelect(selectId, itemSelector, itemAttr, onFilter) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.addEventListener("change", () => {
      const val = select.value;
      const items = document.querySelectorAll(itemSelector);
      let matches = 0;

      items.forEach((item) => {
        const match = !val || item.dataset[itemAttr] === val;
        item.style.display = match ? "" : "none";
        if (match) matches++;
      });

      if (typeof onFilter === "function") onFilter(matches);
    });
  }

  return { wire, wireSelect };
})();

/* ─────────────────────────────────────────────────────────────
   E6 KEYBOARD SHORTCUTS
   Admin power-user keyboard navigation.
───────────────────────────────────────────────────────────── */
export const E6KeyboardShortcuts = (() => {
  const _shortcuts = [];
  let _active = false;

  /**
   * Register and activate keyboard shortcuts.
   * @param {Array<{key: string, meta?: boolean, ctrl?: boolean, shift?: boolean, action: Function, label?: string}>} shortcuts
   */
  function register(shortcuts = []) {
    _shortcuts.push(...shortcuts);
    if (_active) return;
    _active = true;

    document.addEventListener("keydown", (e) => {
      // Skip when typing in inputs
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (document.activeElement?.isContentEditable) return;

      for (const s of _shortcuts) {
        const keyMatch   = e.key.toLowerCase() === s.key.toLowerCase();
        const metaMatch  = !s.meta  || (e.metaKey  || e.ctrlKey);
        const ctrlMatch  = !s.ctrl  || e.ctrlKey;
        const shiftMatch = !s.shift || e.shiftKey;

        if (keyMatch && metaMatch && ctrlMatch && shiftMatch) {
          e.preventDefault();
          s.action(e);
          return;
        }
      }
    });
  }

  /**
   * Default admin shortcuts.
   * Overridable by passing custom shortcuts to register().
   */
  function registerDefaults() {
    register([
      {
        key: "/",
        label: "Focus search",
        action: () => {
          const search = document.querySelector("input[type='search'], .op-search input, #searchInput, #orderSearch, #productSearch");
          search?.focus();
        },
      },
      {
        key: "Escape",
        label: "Close modal / banner",
        action: () => {
          const dismissBtn = document.querySelector(".session-banner-dismiss");
          dismissBtn?.click();
        },
      },
      {
        key: "h",
        label: "Go to dashboard",
        action: () => {
          if (window.location.pathname.includes("admin.html")) return;
          E6PageTransition.navigate("admin.html");
        },
      },
      {
        key: "o",
        label: "Go to orders",
        action: () => {
          if (window.location.pathname.includes("admin-orders.html")) return;
          E6PageTransition.navigate("admin-orders.html");
        },
      },
    ]);
  }

  return { register, registerDefaults };
})();

/* ─────────────────────────────────────────────────────────────
   E6 SCROLL REVEAL
   Storefront-compatible scroll-based animation system.
   Works alongside D7 .d7-reveal system — additive.
───────────────────────────────────────────────────────────── */
export const E6ScrollReveal = (() => {
  let _observer = null;

  /**
   * Initialise scroll reveal observation.
   * Watches elements with [data-e6-reveal] or .e6-reveal classes.
   */
  function init() {
    if (!("IntersectionObserver" in window)) {
      // Degrade gracefully
      document.querySelectorAll(".e6-reveal").forEach((el) => {
        el.classList.add("e6-visible");
      });
      return;
    }

    _observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("e6-visible");
          _observer.unobserve(entry.target);
        });
      },
      { threshold: 0.10, rootMargin: "0px 0px -32px 0px" }
    );

    document.querySelectorAll(
      ".e6-reveal, [data-e6-reveal]"
    ).forEach((el) => {
      _observer.observe(el);
    });
  }

  function destroy() {
    _observer?.disconnect();
    _observer = null;
  }

  return { init, destroy };
})();

/* ─────────────────────────────────────────────────────────────
   E6 OPERATIONAL UX HELPERS
   Shared micro-helpers for admin operational flow.
───────────────────────────────────────────────────────────── */

/**
 * Set data-page attribute on body for E6 token bridge.
 * Call at top of admin page scripts.
 * @param {"admin"|"admin-orders"|"storefront"} page
 */
export function setPageContext(page) {
  document.body.dataset.page = page;
}

/**
 * Wire an export button with processing state.
 * Enhanced version of wireExportButtons from E5.
 * @param {string}   btnId        — button element id
 * @param {Function} exportFn     — async function that performs the export
 * @param {string}   [label]      — default button label
 */
export async function wireExportButton(btnId, exportFn, label) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  const defaultLabel = label || btn.textContent || "Export";

  btn.addEventListener("click", async function () {
    if (btn.classList.contains("exporting")) return;
    btn.classList.add("exporting");
    btn.textContent = "Exporting…";
    btn.disabled = true;

    try {
      await exportFn();
    } catch (err) {
      console.error("[E6] Export failed:", err);
    } finally {
      btn.classList.remove("exporting");
      btn.textContent = defaultLabel;
      btn.disabled = false;
    }
  });
}

/**
 * Inject luxury breadcrumb trail into a container.
 * @param {string}               containerSel — container to inject into
 * @param {Array<{label, href}>} crumbs
 */
export function injectBreadcrumb(containerSel, crumbs = []) {
  const container = document.querySelector(containerSel);
  if (!container) return;

  const existing = container.querySelector(".e6-breadcrumb");
  if (existing) existing.remove();

  const nav = document.createElement("nav");
  nav.className = "e6-breadcrumb";
  nav.setAttribute("aria-label", "Breadcrumb");

  const STYLE_ID = "e6-breadcrumb-style";
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      .e6-breadcrumb {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.74rem;
        color: var(--e6-muted, #8A7F79);
        letter-spacing: 0.01em;
      }
      .e6-breadcrumb a {
        color: var(--e6-muted, #8A7F79);
        text-decoration: none;
        transition: color 0.18s ease;
      }
      .e6-breadcrumb a:hover { color: var(--e6-charcoal, #1C1917); }
      .e6-breadcrumb-sep {
        opacity: 0.35;
        font-size: 0.60rem;
        user-select: none;
      }
      .e6-breadcrumb-current {
        color: var(--e6-charcoal, #1C1917);
        font-weight: 500;
      }
    `;
    document.head.appendChild(s);
  }

  const parts = crumbs.map((c, i) => {
    if (i === crumbs.length - 1) {
      return `<span class="e6-breadcrumb-current" aria-current="page">${_esc(c.label)}</span>`;
    }
    return `<a href="${_esc(c.href)}">${_esc(c.label)}</a><span class="e6-breadcrumb-sep" aria-hidden="true">›</span>`;
  });

  nav.innerHTML = parts.join("");
  container.appendChild(nav);
}

/* ─────────────────────────────────────────────────────────────
   INIT — ADMIN ECOSYSTEM
   Single call to boot the full E6 admin integration layer.
───────────────────────────────────────────────────────────── */

/**
 * Initialize the E6 admin ecosystem.
 * Call once from within onGranted() after admin auth resolves.
 *
 * @param {object} [opts]
 * @param {string}    [opts.page]              — "admin" | "admin-orders"
 * @param {boolean}   [opts.pageTransitions]   — wire link transitions (default: true)
 * @param {boolean}   [opts.keyboardShortcuts] — register shortcuts (default: true)
 * @param {boolean}   [opts.scrollReveal]      — init scroll reveal (default: true)
 * @param {boolean}   [opts.sidebarToggle]     — wire mobile sidebar (default: true)
 * @param {string}    [opts.breadcrumbSel]     — container for breadcrumb injection
 * @param {Array}     [opts.breadcrumbs]       — breadcrumb crumbs array
 */
export function initE6Ecosystem({
  page            = "admin",
  pageTransitions = true,
  keyboardShortcuts = true,
  scrollReveal    = true,
  sidebarToggle   = true,
  breadcrumbSel   = null,
  breadcrumbs     = null,
} = {}) {
  // 1. Set page context token
  setPageContext(page);

  // 2. Reveal dashboard with coordinated choreography
  E6RevealOrchestrator.revealDashboard();

  // 3. Set active nav item
  E6Nav.setActiveNav();

  // 4. Inject storefront link in sidebar footer
  E6Nav.injectStorefrontLink();

  // 5. Wire sidebar mobile toggle
  if (sidebarToggle) {
    E6Nav.wireSidebarToggle();
  }

  // 6. Wire page transitions
  if (pageTransitions) {
    E6PageTransition.wireLinks();
  }

  // 7. Register keyboard shortcuts
  if (keyboardShortcuts) {
    E6KeyboardShortcuts.registerDefaults();
  }

  // 8. Init scroll reveal for below-fold elements
  if (scrollReveal) {
    E6ScrollReveal.init();
  }

  // 9. Inject breadcrumb if configured
  if (breadcrumbSel && breadcrumbs) {
    injectBreadcrumb(breadcrumbSel, breadcrumbs);
  }

  console.info(`[ChicCharms E6] Unified ecosystem initialized (page: ${page}).`);
}

/* ─────────────────────────────────────────────────────────────
   INIT — STOREFRONT ECOSYSTEM
   Lightweight version for public storefront pages.
   Call in script.js or auth-nav.js AFTER auth resolves.
───────────────────────────────────────────────────────────── */

/**
 * Initialize storefront-side E6 integration.
 * Adds scroll reveal + link transitions on storefront pages.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.scrollReveal]
 * @param {boolean} [opts.pageTransitions]
 */
export function initStorefrontEcosystem({
  scrollReveal    = true,
  pageTransitions = false,  // storefront uses its own D7 system
} = {}) {
  setPageContext("storefront");

  if (scrollReveal) {
    E6ScrollReveal.init();
  }

  if (pageTransitions) {
    E6PageTransition.wireLinks();
  }

  console.info("[ChicCharms E6] Storefront ecosystem initialized.");
}

/* ─────────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────────── */
function _esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
