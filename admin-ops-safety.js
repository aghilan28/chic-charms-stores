/* ============================================================
   admin-ops-safety.js — Chic Charms
   Phase E5 — Production Security Hardening + Operational Safety

   Exports:
     AdminConfirm          — premium confirmation dialog system
     AdminValidator        — centralized input validation
     AdminSafeOps          — safe wrapper for dangerous operations
     AdminRetry            — async retry + error recovery
     AdminRenderGuard      — duplicate render prevention
     AdminOpLock           — concurrent operation prevention
     safeStock()           — validated stock boundary helper
     validateProductInput()— product form validation
     validatePriceInput()  — price validation
     validateStockInput()  — stock validation

   None of these functions touch Firebase directly.
   They wrap operations with safety, validation, and UX feedback.
============================================================ */

import { AdminToast } from "./admin-session-ux.js";

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const MAX_STOCK        = 99999;
const MAX_PRICE        = 999999;
const MIN_STOCK        = 0;
const MIN_PRICE        = 0;
const MAX_NAME_LEN     = 120;
const MAX_CATEGORY_LEN = 60;
const MAX_TAG_LEN      = 40;
const MAX_DESC_LEN     = 600;
const MAX_IMAGE_LEN    = 1000;
const PRODUCT_CATEGORIES = [
  "Everyday Elegance",
  "Modern Romance",
  "After Dark",
  "Heritage Muse",
];

/* ─────────────────────────────────────────────────────────────
   INTERNAL ESCAPE HELPER
───────────────────────────────────────────────────────────── */
function _esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ─────────────────────────────────────────────────────────────
   AdminConfirm — Premium confirmation dialog
   Replaces browser confirm() for all destructive admin actions.
   Returns a Promise<boolean>.
───────────────────────────────────────────────────────────── */
export const AdminConfirm = (() => {
  const DIALOG_ID = "adminOpsConfirmDialog";
  let _resolvePromise = null;

  function _injectStyles() {
    const STYLE_ID = "admin-ops-confirm-styles";
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = /* css */ `
      /* ── Confirm Dialog Backdrop ── */
      #adminOpsConfirmDialog {
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: rgba(45, 32, 32, 0.45);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.22s ease, visibility 0.22s ease;
      }
      #adminOpsConfirmDialog.open {
        opacity: 1;
        visibility: visible;
      }
      .ops-confirm-card {
        background: var(--white, #fff);
        border-radius: var(--radius-lg, 20px);
        border: 1px solid var(--border, #f0dde5);
        box-shadow: 0 28px 80px rgba(45, 32, 32, 0.22);
        padding: 40px 36px 32px;
        width: min(460px, 100%);
        text-align: center;
        transform: translateY(16px) scale(0.97);
        transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      #adminOpsConfirmDialog.open .ops-confirm-card {
        transform: translateY(0) scale(1);
      }

      /* Danger variant */
      #adminOpsConfirmDialog[data-intent="danger"] .ops-confirm-card {
        border-color: var(--red-bd, #f5c6cb);
      }
      #adminOpsConfirmDialog[data-intent="warning"] .ops-confirm-card {
        border-color: var(--amber-bd, #fcd34d);
      }

      .ops-confirm-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        margin: 0 auto 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.4rem;
      }
      #adminOpsConfirmDialog[data-intent="danger"] .ops-confirm-icon {
        background: var(--red-bg, #fff5f5);
        border: 2px solid var(--red-bd, #f5c6cb);
        color: var(--red, #c0392b);
      }
      #adminOpsConfirmDialog[data-intent="warning"] .ops-confirm-icon {
        background: var(--amber-bg, #fffbeb);
        border: 2px solid var(--amber-bd, #fcd34d);
        color: var(--amber, #b45309);
      }
      #adminOpsConfirmDialog[data-intent="info"] .ops-confirm-icon {
        background: var(--blush, #fef0f4);
        border: 2px solid var(--border, #f0dde5);
        color: var(--rose-dark, #e8809a);
      }

      .ops-confirm-title {
        font-family: var(--font-head, "Cormorant Garamond", Georgia, serif);
        font-size: 1.55rem;
        font-weight: 600;
        color: var(--text, #2d2020);
        margin-bottom: 10px;
        line-height: 1.2;
      }
      #adminOpsConfirmDialog[data-intent="danger"] .ops-confirm-title {
        color: var(--red, #c0392b);
      }
      #adminOpsConfirmDialog[data-intent="warning"] .ops-confirm-title {
        color: var(--amber, #b45309);
      }

      .ops-confirm-body {
        font-size: 0.88rem;
        color: var(--muted, #9b7b85);
        line-height: 1.65;
        margin-bottom: 28px;
      }
      .ops-confirm-highlight {
        font-weight: 700;
        color: var(--text, #2d2020);
      }

      .ops-confirm-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      .ops-btn-confirm {
        font-family: var(--font-body, "DM Sans", sans-serif);
        font-size: 0.9rem;
        font-weight: 700;
        padding: 12px 28px;
        border-radius: 999px;
        border: none;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        letter-spacing: 0.01em;
        min-width: 120px;
      }
      #adminOpsConfirmDialog[data-intent="danger"] .ops-btn-confirm {
        background: var(--red, #c0392b);
        color: #fff;
        box-shadow: 0 4px 16px rgba(192, 57, 43, 0.32);
      }
      #adminOpsConfirmDialog[data-intent="danger"] .ops-btn-confirm:hover {
        background: #a8291f;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(192, 57, 43, 0.4);
      }
      #adminOpsConfirmDialog[data-intent="warning"] .ops-btn-confirm {
        background: var(--amber, #b45309);
        color: #fff;
        box-shadow: 0 4px 16px rgba(180, 83, 9, 0.32);
      }
      #adminOpsConfirmDialog[data-intent="warning"] .ops-btn-confirm:hover {
        background: #9a4508;
        transform: translateY(-1px);
      }
      #adminOpsConfirmDialog[data-intent="info"] .ops-btn-confirm {
        background: var(--rose-dark, #e8809a);
        color: #fff;
        box-shadow: 0 4px 16px rgba(232, 128, 154, 0.32);
      }
      #adminOpsConfirmDialog[data-intent="info"] .ops-btn-confirm:hover {
        background: var(--rose-deep, #d4607a);
        transform: translateY(-1px);
      }

      .ops-btn-cancel {
        font-family: var(--font-body, "DM Sans", sans-serif);
        font-size: 0.9rem;
        font-weight: 500;
        padding: 12px 28px;
        border-radius: 999px;
        border: 1.5px solid var(--border, #f0dde5);
        background: var(--cream, #faf8f5);
        color: var(--muted, #9b7b85);
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        min-width: 100px;
      }
      .ops-btn-cancel:hover {
        border-color: var(--rose, #f4a7b9);
        color: var(--rose-dark, #e8809a);
        background: var(--blush, #fef0f4);
      }

      /* Mobile: stack buttons */
      @media (max-width: 400px) {
        .ops-confirm-actions { flex-direction: column-reverse; }
        .ops-btn-confirm, .ops-btn-cancel { width: 100%; }
      }
    `;
    document.head.appendChild(style);
  }

  function _getOrCreate() {
    let dialog = document.getElementById(DIALOG_ID);
    if (dialog) return dialog;

    _injectStyles();

    dialog = document.createElement("div");
    dialog.id = DIALOG_ID;
    dialog.setAttribute("role", "alertdialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "ops-confirm-title");
    dialog.setAttribute("aria-describedby", "ops-confirm-body");

    dialog.innerHTML = `
      <div class="ops-confirm-card">
        <div class="ops-confirm-icon" id="ops-confirm-icon" aria-hidden="true"></div>
        <h2 class="ops-confirm-title" id="ops-confirm-title"></h2>
        <p class="ops-confirm-body" id="ops-confirm-body"></p>
        <div class="ops-confirm-actions">
          <button class="ops-btn-cancel" id="ops-confirm-cancel">Cancel</button>
          <button class="ops-btn-confirm" id="ops-confirm-ok"></button>
        </div>
      </div>
    `;

    dialog.querySelector("#ops-confirm-cancel").addEventListener("click", () => _resolve(false));
    dialog.querySelector("#ops-confirm-ok").addEventListener("click", () => _resolve(true));
    dialog.addEventListener("click", (e) => { if (e.target === dialog) _resolve(false); });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && dialog.classList.contains("open")) _resolve(false);
    });

    document.body.appendChild(dialog);
    return dialog;
  }

  function _resolve(confirmed) {
    const dialog = document.getElementById(DIALOG_ID);
    if (dialog) dialog.classList.remove("open");
    document.body.style.overflow = "";
    if (_resolvePromise) {
      _resolvePromise(confirmed);
      _resolvePromise = null;
    }
  }

  /**
   * Show a confirmation dialog.
   * @param {object} opts
   * @param {string} opts.title         — Dialog title
   * @param {string} opts.body          — Body message (supports HTML via opts.bodyHtml)
   * @param {string} [opts.bodyHtml]    — Raw HTML body (takes precedence over body)
   * @param {string} [opts.confirmText] — Confirm button label (default: "Confirm")
   * @param {"danger"|"warning"|"info"} [opts.intent]  — Visual intent
   * @param {string} [opts.icon]        — Icon character/emoji
   * @returns {Promise<boolean>}        — true if confirmed, false if cancelled
   */
  function ask({
    title = "Are you sure?",
    body = "",
    bodyHtml = null,
    confirmText = "Confirm",
    intent = "danger",
    icon = null,
  } = {}) {
    return new Promise((resolve) => {
      const dialog = _getOrCreate();
      _resolvePromise = resolve;

      dialog.dataset.intent = intent;
      dialog.querySelector("#ops-confirm-title").textContent = title;

      const bodyEl = dialog.querySelector("#ops-confirm-body");
      if (bodyHtml) {
        bodyEl.innerHTML = bodyHtml;
      } else {
        bodyEl.textContent = body;
      }

      const iconEl = dialog.querySelector("#ops-confirm-icon");
      const defaultIcons = { danger: "🗑", warning: "⚠", info: "✦" };
      iconEl.textContent = icon || defaultIcons[intent] || "✦";

      const okBtn = dialog.querySelector("#ops-confirm-ok");
      okBtn.textContent = confirmText;

      dialog.classList.add("open");
      document.body.style.overflow = "hidden";

      // Focus confirm button for keyboard users
      requestAnimationFrame(() => okBtn.focus());
    });
  }

  /**
   * Quick delete confirmation with product name highlighted.
   */
  function confirmDelete(productName) {
    return ask({
      title: "Delete Product?",
      bodyHtml: `You're permanently deleting <span class="ops-confirm-highlight">"${_esc(productName)}"</span>. This cannot be undone and will remove all inventory records.`,
      confirmText: "Delete Permanently",
      intent: "danger",
      icon: "🗑",
    });
  }

  /**
   * Quick stock adjustment confirmation.
   */
  function confirmStockReset(productName, currentStock) {
    return ask({
      title: "Reset Stock?",
      bodyHtml: `You're resetting <span class="ops-confirm-highlight">"${_esc(productName)}"</span> stock from <strong>${currentStock}</strong> to <strong>0</strong>. This will mark it as out of stock.`,
      confirmText: "Reset Stock",
      intent: "warning",
      icon: "⚠",
    });
  }

  /**
   * Confirm a large stock reduction.
   */
  function confirmLargeStockDrop(productName, from, to) {
    const drop = from - to;
    return ask({
      title: "Large Stock Reduction",
      bodyHtml: `Reducing <span class="ops-confirm-highlight">"${_esc(productName)}"</span> by <strong>${drop} units</strong> (${from} → ${to}). Please confirm this is intentional.`,
      confirmText: "Reduce Stock",
      intent: "warning",
      icon: "📉",
    });
  }

  /**
   * Confirm order status change.
   */
  function confirmOrderStatusChange(orderId, from, to) {
    return ask({
      title: "Change Order Status?",
      bodyHtml: `Update order <span class="ops-confirm-highlight">#${_esc(String(orderId || "").slice(-8))}</span> from <strong>${_esc(from)}</strong> to <strong>${_esc(to)}</strong>. This action is visible to customers.`,
      confirmText: "Update Status",
      intent: to.toLowerCase() === "cancelled" ? "danger" : "warning",
      icon: to.toLowerCase() === "cancelled" ? "✕" : "📦",
    });
  }

  return { ask, confirmDelete, confirmStockReset, confirmLargeStockDrop, confirmOrderStatusChange };
})();

/* ─────────────────────────────────────────────────────────────
   AdminValidator — Centralized input validation
   Returns { valid: boolean, errors: string[], sanitized: object }
───────────────────────────────────────────────────────────── */
export const AdminValidator = (() => {

  /**
   * Validate + sanitize a product form submission.
   * @param {object} raw  — raw form values (all strings from inputs)
   * @returns {{ valid: boolean, errors: string[], sanitized: object|null }}
   */
  function validateProduct(raw = {}) {
    const errors = [];
    const s = {};

    /* Name */
    const name = String(raw.name || "").trim();
    if (!name) errors.push("Product name is required.");
    else if (name.length > MAX_NAME_LEN) errors.push(`Product name must be under ${MAX_NAME_LEN} characters.`);
    else s.name = name;

    /* Price */
    const priceRaw = String(raw.price || "").trim();
    const price = Number(priceRaw);
    if (priceRaw === "") errors.push("Price is required.");
    else if (!Number.isFinite(price)) errors.push("Price must be a valid number.");
    else if (price < MIN_PRICE) errors.push("Price cannot be negative.");
    else if (price > MAX_PRICE) errors.push(`Price cannot exceed ₹${MAX_PRICE.toLocaleString("en-IN")}.`);
    else if (price !== Math.round(price * 100) / 100) errors.push("Price can have at most 2 decimal places.");
    else s.price = Math.round(price * 100) / 100;

    /* Stock */
    const stockRaw = String(raw.stock || "").trim();
    const stock = Number(stockRaw);
    if (stockRaw === "") errors.push("Stock count is required.");
    else if (!Number.isFinite(stock)) errors.push("Stock must be a valid whole number.");
    else if (stock < MIN_STOCK) errors.push("Stock cannot be negative.");
    else if (stock > MAX_STOCK) errors.push(`Stock cannot exceed ${MAX_STOCK.toLocaleString()}.`);
    else if (!Number.isInteger(stock)) errors.push("Stock must be a whole number (no decimals).");
    else s.stock = stock;

    /* Category */
    const category = String(raw.category || "").trim();
    if (!category) errors.push("Category is required.");
    else if (!PRODUCT_CATEGORIES.includes(category)) errors.push("Choose one of the approved product categories.");
    else if (category.length > MAX_CATEGORY_LEN) errors.push(`Category must be under ${MAX_CATEGORY_LEN} characters.`);
    else s.category = category;

    /* Image URL */
    const image = String(raw.image || "").trim();
    if (!image) errors.push("Image URL is required.");
    else if (!image.startsWith("http")) errors.push("Image URL must start with http:// or https://.");
    else if (image.length > MAX_IMAGE_LEN) errors.push("Image URL is too long.");
    else s.image = image;

    /* Tag (optional) */
    const tag = String(raw.tag || "").trim();
    if (tag && tag.length > MAX_TAG_LEN) errors.push(`Tag must be under ${MAX_TAG_LEN} characters.`);
    else if (tag) s.tag = tag;

    /* Description (optional) */
    const desc = String(raw.description || raw.desc || "").trim();
    if (desc && desc.length > MAX_DESC_LEN) errors.push(`Description must be under ${MAX_DESC_LEN} characters.`);
    else if (desc) s.description = desc;

    return { valid: errors.length === 0, errors, sanitized: errors.length === 0 ? s : null };
  }

  /**
   * Validate a stock adjustment.
   * @param {number|string} newStock
   * @param {number} currentStock  — current product stock
   * @returns {{ valid: boolean, errors: string[], value: number|null }}
   */
  function validateStockAdjustment(newStock, currentStock = 0) {
    const errors = [];
    const val = Number(newStock);

    if (newStock === "" || newStock === null || newStock === undefined) {
      errors.push("Stock value is required.");
    } else if (!Number.isFinite(val)) {
      errors.push("Stock must be a valid number.");
    } else if (!Number.isInteger(val)) {
      errors.push("Stock must be a whole number.");
    } else if (val < MIN_STOCK) {
      errors.push("Stock cannot be negative.");
    } else if (val > MAX_STOCK) {
      errors.push(`Stock cannot exceed ${MAX_STOCK.toLocaleString()}.`);
    }

    return { valid: errors.length === 0, errors, value: errors.length === 0 ? val : null };
  }

  /**
   * Validate a price value.
   * @param {number|string} price
   * @returns {{ valid: boolean, errors: string[], value: number|null }}
   */
  function validatePrice(price) {
    const errors = [];
    const val = Number(price);

    if (price === "" || price === null || price === undefined) {
      errors.push("Price is required.");
    } else if (!Number.isFinite(val)) {
      errors.push("Price must be a valid number.");
    } else if (val < MIN_PRICE) {
      errors.push("Price cannot be negative.");
    } else if (val > MAX_PRICE) {
      errors.push(`Price cannot exceed ₹${MAX_PRICE.toLocaleString("en-IN")}.`);
    }

    return { valid: errors.length === 0, errors, value: errors.length === 0 ? Math.round(val * 100) / 100 : null };
  }

  /**
   * Show inline validation error on a form input.
   * @param {HTMLElement} inputEl
   * @param {string} message
   */
  function markInvalid(inputEl, message) {
    if (!inputEl) return;
    inputEl.style.borderColor = "var(--red, #c0392b)";
    inputEl.style.boxShadow = "0 0 0 3px rgba(192, 57, 43, 0.12)";
    inputEl.setAttribute("aria-invalid", "true");
    inputEl.setAttribute("aria-describedby", inputEl.id + "-error");

    let errorEl = document.getElementById(inputEl.id + "-error");
    if (!errorEl) {
      errorEl = document.createElement("span");
      errorEl.id = inputEl.id + "-error";
      errorEl.className = "input-error-hint";
      errorEl.setAttribute("role", "alert");
      errorEl.style.cssText = "display:block;font-size:0.74rem;color:var(--red,#c0392b);margin-top:4px;font-weight:500;";
      inputEl.parentNode?.appendChild(errorEl);
    }
    errorEl.textContent = message;
  }

  /**
   * Clear validation error on a form input.
   * @param {HTMLElement} inputEl
   */
  function clearInvalid(inputEl) {
    if (!inputEl) return;
    inputEl.style.borderColor = "";
    inputEl.style.boxShadow = "";
    inputEl.removeAttribute("aria-invalid");
    inputEl.removeAttribute("aria-describedby");
    const errorEl = document.getElementById(inputEl.id + "-error");
    if (errorEl) errorEl.remove();
  }

  /**
   * Clear all validation errors in a form.
   * @param {HTMLElement} formEl
   */
  function clearAllInvalid(formEl) {
    if (!formEl) return;
    formEl.querySelectorAll("[aria-invalid]").forEach(clearInvalid);
    formEl.querySelectorAll(".input-error-hint").forEach(el => el.remove());
  }

  return { validateProduct, validateStockAdjustment, validatePrice, markInvalid, clearInvalid, clearAllInvalid };
})();

/* ─────────────────────────────────────────────────────────────
   AdminOpLock — Prevent concurrent operations on same entity
   Ensures only one async operation runs per product/order at a time.
───────────────────────────────────────────────────────────── */
export const AdminOpLock = (() => {
  const _locks = new Set();

  /**
   * Attempt to acquire lock on an entity.
   * @param {string} entityId
   * @returns {boolean} — true if lock acquired, false if already locked
   */
  function acquire(entityId) {
    if (_locks.has(entityId)) return false;
    _locks.add(entityId);
    return true;
  }

  /**
   * Release lock on an entity.
   * @param {string} entityId
   */
  function release(entityId) {
    _locks.delete(entityId);
  }

  /**
   * Check if entity is locked.
   * @param {string} entityId
   * @returns {boolean}
   */
  function isLocked(entityId) {
    return _locks.has(entityId);
  }

  /**
   * Execute fn with exclusive lock, auto-releasing on completion.
   * @param {string} entityId
   * @param {Function} fn — async function
   * @param {string} [busyMessage]
   * @returns {Promise<any>}
   */
  async function withLock(entityId, fn, busyMessage = "Another operation is in progress.") {
    if (!acquire(entityId)) {
      AdminToast.warning(busyMessage);
      throw new Error("LOCK_BUSY: " + entityId);
    }
    try {
      return await fn();
    } finally {
      release(entityId);
    }
  }

  return { acquire, release, isLocked, withLock };
})();

/* ─────────────────────────────────────────────────────────────
   AdminRetry — Graceful async retry with exponential backoff
───────────────────────────────────────────────────────────── */
export const AdminRetry = (() => {

  /**
   * Retry an async operation with exponential backoff.
   * @param {Function} fn         — async function to retry
   * @param {object}   [opts]
   * @param {number}   [opts.maxAttempts=3]
   * @param {number}   [opts.baseDelayMs=800]
   * @param {string}   [opts.operationName]  — used in error messaging
   * @param {Function} [opts.onRetry]        — called on each retry attempt
   * @returns {Promise<any>}
   */
  async function withRetry(fn, {
    maxAttempts = 3,
    baseDelayMs = 800,
    operationName = "Operation",
    onRetry = null,
  } = {}) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;

        // Don't retry on permission errors — they won't be resolved by retrying
        if (err?.code === "permission-denied" || err?.code === "unauthenticated") {
          throw err;
        }

        // Don't retry on the last attempt
        if (attempt === maxAttempts) break;

        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[AdminRetry] ${operationName} attempt ${attempt} failed, retrying in ${delay}ms:`, err.message);

        if (typeof onRetry === "function") onRetry(attempt, delay);

        await new Promise(r => setTimeout(r, delay));
      }
    }

    throw lastError;
  }

  /**
   * Execute fn with retry and show toast feedback on failure.
   */
  async function withRetryToast(fn, opts = {}) {
    const { operationName = "Operation", successMessage = null, errorMessage = null } = opts;
    try {
      const result = await withRetry(fn, opts);
      if (successMessage) AdminToast.success(successMessage);
      return result;
    } catch (err) {
      const msg = errorMessage || `${operationName} failed. Please try again.`;
      AdminToast.error(msg);
      throw err;
    }
  }

  return { withRetry, withRetryToast };
})();

/* ─────────────────────────────────────────────────────────────
   AdminRenderGuard — Prevent duplicate/stale renders
   Debounces rapid Firestore snapshot bursts into single renders.
───────────────────────────────────────────────────────────── */
export const AdminRenderGuard = (() => {
  const _timers = new Map();
  const _versions = new Map();

  /**
   * Schedule a debounced render.
   * @param {string}   key      — unique render key
   * @param {Function} fn       — render function
   * @param {number}   [delayMs=16] — debounce delay (default: next frame)
   */
  function schedule(key, fn, delayMs = 16) {
    if (_timers.has(key)) {
      clearTimeout(_timers.get(key));
    }
    const timer = setTimeout(() => {
      _timers.delete(key);
      fn();
    }, delayMs);
    _timers.set(key, timer);
  }

  /**
   * Version-guarded render — only renders if version is newer.
   * @param {string}   key
   * @param {number}   version  — monotonically increasing version (e.g. Date.now())
   * @param {Function} fn
   */
  function scheduleVersioned(key, version, fn) {
    const current = _versions.get(key) || 0;
    if (version <= current) return; // stale update — skip
    _versions.set(key, version);
    schedule(key, () => {
      // Double-check version is still current after debounce
      if (_versions.get(key) === version) fn();
    });
  }

  /**
   * Cancel a scheduled render.
   * @param {string} key
   */
  function cancel(key) {
    if (_timers.has(key)) {
      clearTimeout(_timers.get(key));
      _timers.delete(key);
    }
  }

  return { schedule, scheduleVersioned, cancel };
})();

/* ─────────────────────────────────────────────────────────────
   AdminSafeOps — Safe wrappers for dangerous admin operations
   Adds confirmation, locking, and error recovery to Firebase ops.
───────────────────────────────────────────────────────────── */
export const AdminSafeOps = (() => {

  /**
   * Safely delete a product with confirmation gate.
   * @param {object}   product    — product object with id and name
   * @param {Function} deleteFn   — async (productId) => void
   * @returns {Promise<boolean>}  — true if deleted, false if cancelled
   */
  async function safeDeleteProduct(product, deleteFn) {
    if (!product?.id) return false;

    const confirmed = await AdminConfirm.confirmDelete(product.name || "this product");
    if (!confirmed) return false;

    return await AdminOpLock.withLock(
      product.id,
      async () => {
        await AdminRetry.withRetry(() => deleteFn(product.id), {
          operationName: "Delete product",
          maxAttempts: 2,
        });
        AdminToast.success(`"${product.name}" deleted.`);
        return true;
      },
      "Delete already in progress."
    ).catch(err => {
      if (err.message?.startsWith("LOCK_BUSY")) return false;
      console.error("[AdminSafeOps] Delete failed:", err);
      AdminToast.error("Delete failed. Check Firestore permissions.");
      return false;
    });
  }

  /**
   * Safely update stock with large-drop confirmation gate.
   * @param {object}   product    — product object
   * @param {number}   newStock   — new stock value
   * @param {Function} updateFn   — async (product, newStock) => void
   * @param {string}   actionType — RESTOCK | MANUAL_EDIT | etc.
   * @returns {Promise<boolean>}
   */
  async function safeUpdateStock(product, newStock, updateFn, actionType = "MANUAL_EDIT") {
    if (!product?.id) return false;

    const validation = AdminValidator.validateStockAdjustment(newStock, product.stock);
    if (!validation.valid) {
      AdminToast.error(validation.errors[0]);
      return false;
    }

    const safeNew = validation.value;
    const current = Math.max(0, Number(product.stock || 0));

    // Large stock drop: >50% reduction AND >10 units absolute drop → require confirmation
    const drop = current - safeNew;
    const pctDrop = current > 0 ? (drop / current) * 100 : 0;
    if (drop > 10 && pctDrop > 50 && safeNew > 0) {
      const confirmed = await AdminConfirm.confirmLargeStockDrop(product.name, current, safeNew);
      if (!confirmed) return false;
    }

    // Stock reset to zero → require confirmation
    if (safeNew === 0 && current > 0) {
      const confirmed = await AdminConfirm.confirmStockReset(product.name, current);
      if (!confirmed) return false;
    }

    return await AdminOpLock.withLock(
      product.id,
      async () => {
        await AdminRetry.withRetry(() => updateFn(product, safeNew, actionType), {
          operationName: "Stock update",
          maxAttempts: 3,
        });
        const direction = safeNew > current ? `+${safeNew - current}` : `${safeNew - current}`;
        AdminToast.success(`Stock updated: ${current} → ${safeNew} (${direction})`);
        return true;
      },
      "Stock update already in progress."
    ).catch(err => {
      if (err.message?.startsWith("LOCK_BUSY")) return false;
      console.error("[AdminSafeOps] Stock update failed:", err);
      AdminToast.error("Stock update failed. Please try again.");
      return false;
    });
  }

  /**
   * Safely prompt for restock amount with inline validation.
   * @param {object}   product
   * @param {Function} updateFn
   * @returns {Promise<boolean>}
   */
  async function safeRestockPrompt(product, updateFn) {
    if (!product?.id) return false;

    // Use premium inline restock dialog instead of browser prompt
    const newStock = await _showRestockDialog(product);
    if (newStock === null) return false;

    return safeUpdateStock(product, newStock, updateFn, "RESTOCK");
  }

  /**
   * Safely change order status with confirmation.
   * @param {object}   order
   * @param {string}   newStatus
   * @param {Function} updateFn
   * @returns {Promise<boolean>}
   */
  async function safeUpdateOrderStatus(order, newStatus, updateFn) {
    if (!order?.id) return false;

    const currentStatus = order.status || "pending";
    if (currentStatus === newStatus) return false;

    const confirmed = await AdminConfirm.confirmOrderStatusChange(order.id, currentStatus, newStatus);
    if (!confirmed) return false;

    return await AdminOpLock.withLock(
      "order-" + order.id,
      async () => {
        await AdminRetry.withRetry(() => updateFn(order.id, newStatus), {
          operationName: "Order status update",
          maxAttempts: 3,
        });
        AdminToast.success(`Order status updated to: ${newStatus}`);
        return true;
      },
      "Order update already in progress."
    ).catch(err => {
      if (err.message?.startsWith("LOCK_BUSY")) return false;
      console.error("[AdminSafeOps] Order update failed:", err);
      AdminToast.error("Order status update failed.");
      return false;
    });
  }

  return { safeDeleteProduct, safeUpdateStock, safeRestockPrompt, safeUpdateOrderStatus };
})();

/* ─────────────────────────────────────────────────────────────
   PREMIUM RESTOCK DIALOG
   Inline restock dialog — replaces browser prompt().
───────────────────────────────────────────────────────────── */
const RESTOCK_DIALOG_ID = "adminRestockDialog";

function _showRestockDialog(product) {
  return new Promise((resolve) => {
    _injectRestockStyles();

    let dialog = document.getElementById(RESTOCK_DIALOG_ID);
    if (!dialog) {
      dialog = document.createElement("div");
      dialog.id = RESTOCK_DIALOG_ID;
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-label", "Set Restock Amount");
      document.body.appendChild(dialog);
    }

    const currentStock = Math.max(0, Number(product.stock || 0));
    dialog.innerHTML = `
      <div class="restock-card">
        <div class="restock-header">
          <span class="restock-eyebrow">✦ Inventory Management</span>
          <h2 class="restock-title">Set Restock Amount</h2>
          <p class="restock-sub">${_esc(product.name || "Product")}</p>
        </div>
        <div class="restock-body">
          <div class="restock-current">
            <span class="restock-current-label">Current stock</span>
            <span class="restock-current-val">${currentStock}</span>
          </div>
          <div class="restock-input-group">
            <label class="restock-label" for="restockInput">New stock amount</label>
            <input
              type="number"
              id="restockInput"
              class="restock-input"
              value="${currentStock}"
              min="0"
              max="99999"
              step="1"
              autocomplete="off"
              inputmode="numeric"
            />
            <span class="restock-input-hint" id="restockHint"></span>
          </div>
          <div class="restock-quick-btns">
            <button class="restock-quick-btn" data-add="10">+10</button>
            <button class="restock-quick-btn" data-add="25">+25</button>
            <button class="restock-quick-btn" data-add="50">+50</button>
            <button class="restock-quick-btn" data-add="100">+100</button>
            <button class="restock-quick-btn restock-quick-zero" data-set="0">Set 0</button>
          </div>
        </div>
        <div class="restock-footer">
          <button class="restock-btn-cancel" id="restockCancel">Cancel</button>
          <button class="restock-btn-confirm" id="restockConfirm">Update Stock →</button>
        </div>
      </div>
    `;

    dialog.classList.add("open");
    document.body.style.overflow = "hidden";

    const input = dialog.querySelector("#restockInput");
    const hint = dialog.querySelector("#restockHint");
    const confirmBtn = dialog.querySelector("#restockConfirm");
    const cancelBtn = dialog.querySelector("#restockCancel");

    function _validateInput() {
      const val = Number(input.value);
      const validation = AdminValidator.validateStockAdjustment(input.value, currentStock);

      if (!validation.valid) {
        input.style.borderColor = "var(--red, #c0392b)";
        hint.textContent = validation.errors[0];
        hint.style.color = "var(--red, #c0392b)";
        confirmBtn.disabled = true;
      } else {
        input.style.borderColor = "";
        const diff = val - currentStock;
        if (diff !== 0) {
          hint.textContent = diff > 0 ? `+${diff} units` : `${diff} units`;
          hint.style.color = diff > 0 ? "var(--green, #2e7d32)" : "var(--amber, #b45309)";
        } else {
          hint.textContent = "No change";
          hint.style.color = "var(--muted, #9b7b85)";
        }
        confirmBtn.disabled = false;
      }
    }

    input.addEventListener("input", _validateInput);
    _validateInput();

    // Quick-add buttons
    dialog.querySelectorAll(".restock-quick-btn[data-add]").forEach(btn => {
      btn.addEventListener("click", () => {
        const add = parseInt(btn.dataset.add, 10);
        input.value = Math.min(99999, Math.max(0, Number(input.value || currentStock) + add));
        _validateInput();
      });
    });
    dialog.querySelector(".restock-quick-zero")?.addEventListener("click", () => {
      input.value = 0;
      _validateInput();
    });

    function _close(value) {
      dialog.classList.remove("open");
      document.body.style.overflow = "";
      resolve(value);
    }

    confirmBtn.addEventListener("click", () => {
      const validation = AdminValidator.validateStockAdjustment(input.value, currentStock);
      if (!validation.valid) {
        AdminToast.error(validation.errors[0]);
        return;
      }
      _close(validation.value);
    });

    cancelBtn.addEventListener("click", () => _close(null));
    dialog.addEventListener("click", e => { if (e.target === dialog) _close(null); });
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape") { _close(null); document.removeEventListener("keydown", onKey); }
      if (e.key === "Enter" && !confirmBtn.disabled) { _close(Number(input.value)); document.removeEventListener("keydown", onKey); }
    });

    requestAnimationFrame(() => { input.focus(); input.select(); });
  });
}

function _injectRestockStyles() {
  const STYLE_ID = "admin-restock-dialog-styles";
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = /* css */ `
    #adminRestockDialog {
      position: fixed;
      inset: 0;
      z-index: 10001;
      background: rgba(45, 32, 32, 0.45);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.22s ease, visibility 0.22s ease;
    }
    #adminRestockDialog.open {
      opacity: 1;
      visibility: visible;
    }
    .restock-card {
      background: var(--white, #fff);
      border-radius: var(--radius-lg, 20px);
      border: 1px solid var(--border, #f0dde5);
      box-shadow: 0 28px 80px rgba(45, 32, 32, 0.2);
      width: min(420px, 100%);
      overflow: hidden;
      transform: translateY(16px) scale(0.97);
      transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    #adminRestockDialog.open .restock-card {
      transform: translateY(0) scale(1);
    }
    .restock-header {
      background: linear-gradient(135deg, var(--blush, #fef0f4) 0%, #fce8ef 100%);
      border-bottom: 1px solid var(--border, #f0dde5);
      padding: 24px 28px 20px;
    }
    .restock-eyebrow {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--rose-dark, #e8809a);
      display: block;
      margin-bottom: 6px;
    }
    .restock-title {
      font-family: var(--font-head, "Cormorant Garamond", Georgia, serif);
      font-size: 1.45rem;
      font-weight: 600;
      color: var(--text, #2d2020);
      margin-bottom: 4px;
    }
    .restock-sub {
      font-size: 0.82rem;
      color: var(--muted, #9b7b85);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .restock-body {
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .restock-current {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--cream, #faf8f5);
      border: 1px solid var(--border, #f0dde5);
      border-radius: 10px;
      padding: 12px 16px;
    }
    .restock-current-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--muted, #9b7b85);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .restock-current-val {
      font-family: var(--font-head, "Cormorant Garamond", Georgia, serif);
      font-size: 1.6rem;
      font-weight: 600;
      color: var(--text, #2d2020);
    }
    .restock-input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .restock-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text, #2d2020);
      letter-spacing: 0.04em;
    }
    .restock-input {
      font-family: var(--font-body, "DM Sans", sans-serif);
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text, #2d2020);
      background: var(--cream, #faf8f5);
      border: 1.5px solid var(--border, #f0dde5);
      border-radius: 10px;
      padding: 12px 16px;
      outline: none;
      width: 100%;
      transition: border-color 0.18s ease, box-shadow 0.18s ease;
      -moz-appearance: textfield;
    }
    .restock-input::-webkit-outer-spin-button,
    .restock-input::-webkit-inner-spin-button { -webkit-appearance: none; }
    .restock-input:focus {
      border-color: var(--rose, #f4a7b9);
      background: var(--white, #fff);
      box-shadow: 0 0 0 3px rgba(244, 167, 185, 0.18);
    }
    .restock-input-hint {
      font-size: 0.75rem;
      font-weight: 600;
      min-height: 16px;
      transition: color 0.18s ease;
    }
    .restock-quick-btns {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .restock-quick-btn {
      font-family: var(--font-body, "DM Sans", sans-serif);
      font-size: 0.78rem;
      font-weight: 700;
      padding: 7px 14px;
      border-radius: 999px;
      border: 1.5px solid var(--green-bd, #a5d6a7);
      background: var(--green-bg, #e8f5e9);
      color: var(--green, #2e7d32);
      cursor: pointer;
      transition: background 0.15s ease, transform 0.15s ease;
    }
    .restock-quick-btn:hover {
      background: var(--green, #2e7d32);
      color: var(--white, #fff);
      border-color: var(--green, #2e7d32);
      transform: translateY(-1px);
    }
    .restock-quick-zero {
      border-color: var(--amber-bd, #fcd34d);
      background: var(--amber-bg, #fffbeb);
      color: var(--amber, #b45309);
      margin-left: auto;
    }
    .restock-quick-zero:hover {
      background: var(--amber, #b45309);
      color: var(--white, #fff);
      border-color: var(--amber, #b45309);
    }
    .restock-footer {
      padding: 0 28px 24px;
      display: flex;
      gap: 12px;
    }
    .restock-btn-confirm {
      flex: 1;
      font-family: var(--font-body, "DM Sans", sans-serif);
      font-size: 0.9rem;
      font-weight: 700;
      padding: 13px 20px;
      border-radius: 999px;
      border: none;
      background: var(--rose-dark, #e8809a);
      color: var(--white, #fff);
      cursor: pointer;
      transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
      box-shadow: 0 4px 16px rgba(232, 128, 154, 0.32);
    }
    .restock-btn-confirm:hover:not(:disabled) {
      background: var(--rose-deep, #d4607a);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(232, 128, 154, 0.42);
    }
    .restock-btn-confirm:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    .restock-btn-cancel {
      font-family: var(--font-body, "DM Sans", sans-serif);
      font-size: 0.9rem;
      font-weight: 500;
      padding: 13px 20px;
      border-radius: 999px;
      border: 1.5px solid var(--border, #f0dde5);
      background: var(--cream, #faf8f5);
      color: var(--muted, #9b7b85);
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .restock-btn-cancel:hover {
      border-color: var(--rose, #f4a7b9);
      color: var(--rose-dark, #e8809a);
    }
  `;
  document.head.appendChild(style);
}

/* ─────────────────────────────────────────────────────────────
   CONVENIENCE EXPORTS — standalone helpers for inline use
───────────────────────────────────────────────────────────── */

/**
 * Normalize and clamp a stock value.
 * @param {any} val
 * @returns {number} — safe, non-negative integer
 */
export function safeStock(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return 0;
  return Math.max(MIN_STOCK, Math.min(MAX_STOCK, Math.floor(n)));
}

/**
 * Normalize a price value.
 * @param {any} val
 * @returns {number}
 */
export function safePrice(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return 0;
  return Math.max(MIN_PRICE, Math.min(MAX_PRICE, Math.round(n * 100) / 100));
}

/**
 * Check if a stock change is a "large drop" requiring confirmation.
 * @param {number} from
 * @param {number} to
 * @returns {boolean}
 */
export function isLargeStockDrop(from, to) {
  const drop = from - to;
  const pct = from > 0 ? (drop / from) * 100 : 0;
  return drop > 10 && pct > 50 && to > 0;
}
