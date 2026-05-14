/* ============================================================
   admin-safe-image.js — Chic Charms
   Phase E7 — Permanent Image Rendering Stabilization

   Provides ONE reusable safe-image system used everywhere in
   the admin dashboard. Handles:

     ✔ null / undefined image fields
     ✔ empty string URLs
     ✔ broken Firebase Storage URLs (expired tokens, 404s)
     ✔ malformed / non-http URLs
     ✔ network failures mid-render
     ✔ layout collapse prevention

   Exports:
     safeSrc(url)            — sanitize a URL before setting as src
     safeImgAttrs(url, alt)  — returns HTML attribute string for inline templates
     initSafeImages()        — wire onerror globally via event delegation
     FALLBACK_SVG            — inline SVG data URI (no external dependency)

   ZERO Firebase imports — pure DOM layer.
   Import on any admin page that renders product images.
============================================================ */

/* ─────────────────────────────────────────────────────────────
   FALLBACK ASSET
   Inline SVG data URI — works offline, zero external dependency.
   Renders a soft blush placeholder with a centered image icon.
───────────────────────────────────────────────────────────── */
export const FALLBACK_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='10' fill='%23fce8ef'/%3E%3Crect x='18' y='22' width='44' height='36' rx='5' fill='none' stroke='%23e8a0b0' stroke-width='2'/%3E%3Ccircle cx='30' cy='34' r='4' fill='%23e8a0b0'/%3E%3Cpolyline points='18,50 30,38 40,46 52,34 62,50' fill='none' stroke='%23e8a0b0' stroke-width='2' stroke-linejoin='round'/%3E%3C/svg%3E`;

/* ─────────────────────────────────────────────────────────────
   safeSrc
   Returns a valid src string for an <img> element.
   If the url is falsy, empty, or clearly invalid → returns FALLBACK_SVG.
───────────────────────────────────────────────────────────── */
export function safeSrc(url) {
  if (!url) return FALLBACK_SVG;
  const s = String(url).trim();
  if (!s) return FALLBACK_SVG;
  if (
    !s ||
    s === "undefined" ||
    s === "null" ||
    s.startsWith("javascript:") ||
    s.startsWith("gs://")
  ) {
    return FALLBACK_SVG;
  }
  if (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("data:image/") ||
    s.startsWith("/") ||
    s.startsWith("./") ||
    s.startsWith("../") ||
    /^[A-Za-z0-9_\-./%]+\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(s)
  ) {
    return s;
  }
  return s;
}

/* ─────────────────────────────────────────────────────────────
   safeImgAttrs
   Returns an HTML attribute string to embed directly in template
   literals. Handles src sanitization + onerror fallback inline.

   Usage in innerHTML templates:
     `<img ${safeImgAttrs(product.image, product.name)} class="seller-img" />`
───────────────────────────────────────────────────────────── */
export function safeImgAttrs(url, alt = "") {
  const src = safeSrc(url);
  const escapedSrc = String(src).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const escapedAlt = String(alt || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
  const escapedFallback = FALLBACK_SVG.replace(/'/g, "\\'");
  return `src="${escapedSrc}" alt="${escapedAlt}" loading="lazy" decoding="async" width="320" height="180" onerror="if(this.src!=='${escapedFallback}'){this.src='${escapedFallback}';this.dataset.fallback='1';}"`;
}

/* ─────────────────────────────────────────────────────────────
   initSafeImages
   One-time setup via event delegation on document.
   Catches ANY image onerror that bubbles up — including images
   added dynamically after init. Acts as a permanent safety net.

   Also injects the shared CSS rules that prevent layout collapse.
───────────────────────────────────────────────────────────── */
export function initSafeImages() {
  _injectSafeImageCSS();

  // Global delegated error handler — catches all <img> failures
  if (document.__safeImageDelegated) return;
  document.__safeImageDelegated = true;

  document.addEventListener("error", (e) => {
    const el = e.target;
    if (el.tagName !== "IMG") return;

    // Prevent infinite loop if fallback itself fails (shouldn't happen with data URI)
    if (el.dataset.fallback === "1") return;
    if (el.src === FALLBACK_SVG) return;

    el.src = FALLBACK_SVG;
    el.dataset.fallback = "1";
  }, true /* capture phase — fires before any inline handler */);
}

/* ─────────────────────────────────────────────────────────────
   _injectSafeImageCSS
   Injects the layout-stabilization rules once per page.
   These rules enforce fixed dimensions and prevent collapse
   regardless of whether the image loads or falls back.
───────────────────────────────────────────────────────────── */
function _injectSafeImageCSS() {
  const STYLE_ID = "admin-safe-image-css";
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    /* ── Safe Image System — Layout Stabilization ──────────────
       Applied to all admin product image thumbnails.
       Enforces fixed dimensions so containers never collapse.
    ─────────────────────────────────────────────────────────── */

    /* Thumbnail images (seller-img, alert-img, timeline-img) */
    img.seller-img,
    img.alert-img,
    img.timeline-img {
      object-fit: cover;
      object-position: center;
      flex-shrink: 0;
      /* Ensure size is always enforced even when src is empty/broken */
      min-width: var(--safe-img-thumb-size, 40px);
      min-height: var(--safe-img-thumb-size, 40px);
      background: var(--blush, #fce8ef);
    }

    /* Seller image — 44×44 */
    img.seller-img {
      --safe-img-thumb-size: 44px;
      width: 44px;
      height: 44px;
    }

    /* Alert / inventory image — 40×40 */
    img.alert-img {
      --safe-img-thumb-size: 40px;
      width: 40px;
      height: 40px;
    }

    /* Timeline / activity log image — 42×42 */
    img.timeline-img {
      --safe-img-thumb-size: 42px;
      width: 42px;
      height: 42px;
    }

    /* Product card hero image — full width, fixed height */
    img.product-card-img {
      width: 100%;
      height: 180px;
      object-fit: cover;
      object-position: center;
      display: block;
      background: var(--blush, #fce8ef);
      /* Prevent height collapse when src is empty */
      min-height: 180px;
    }

    /* Fallback state — subtle visual cue without ugly broken icon */
    img[data-fallback="1"] {
      object-fit: contain;
      padding: 6px;
      background: var(--blush, #fce8ef);
    }

    /* Product card fallback — more padding for larger image */
    img.product-card-img[data-fallback="1"] {
      padding: 24px;
    }

    /* Inline image preview (Add / Edit modal) — keep consistent */
    .img-preview-wrap img {
      object-fit: contain;
      background: var(--blush, #fce8ef);
    }
  `;
  document.head.appendChild(style);
}
