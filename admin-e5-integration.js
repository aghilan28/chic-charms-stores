/* ============================================================
   admin-e5-integration.js — Chic Charms
   Phase E5 — Integration Layer

   This module patches the existing admin.html Firebase operations
   with E5 production safety:

   ✔ Replaces prompt() restock dialog with AdminSafeOps.safeRestockPrompt()
   ✔ Replaces direct delete with AdminSafeOps.safeDeleteProduct()
   ✔ Wraps stock ±5 with AdminOpLock to prevent race conditions
   ✔ Adds AdminRetry to stock/edit Firebase writes
   ✔ Replaces renderProducts() call throttling with AdminRenderGuard
   ✔ Adds export button processing states
   ✔ Wires AdminSessionStatus to Firestore connection state
   ✔ Adds input validation feedback to add/edit product forms
   ✔ Adds operation success/error flash to product cards

   USAGE in admin.html — import alongside existing imports:

     import { patchAdminE5 } from "./admin-e5-integration.js";

   Then call AFTER adminVerified = true, inside onGranted():

     patchAdminE5({ db, allProducts, AdminToast, updateProductStockWithLog,
                    deleteProductAndLog, getAdminEmail, Timestamp });

   This file contains ZERO Firebase imports — it wraps your
   existing functions. Pass them in via the opts object.
============================================================ */

import {
  AdminConfirm,
  AdminValidator,
  AdminOpLock,
  AdminRetry,
  AdminRenderGuard,
  AdminSafeOps,
  safeStock,
} from "./admin-ops-safety.js";

import { AdminToast, AdminSessionStatus, AdminSessionBanner } from "./admin-session-ux.js";

/* ─────────────────────────────────────────────────────────────
   Export the safety modules so admin.html can use them directly
───────────────────────────────────────────────────────────── */
export {
  AdminConfirm,
  AdminValidator,
  AdminOpLock,
  AdminRetry,
  AdminRenderGuard,
  AdminSafeOps,
  safeStock,
};

/* ─────────────────────────────────────────────────────────────
   FORM VALIDATION PATCH
   Wire real-time validation to Add Product + Edit Modal forms
───────────────────────────────────────────────────────────── */

/**
 * Wire live validation feedback to a product form.
 * @param {object} opts
 * @param {string} opts.formId      — form element id
 * @param {object} opts.fieldMap    — { fieldName: inputId }
 */
export function wireFormValidation({ formId, fieldMap } = {}) {
  const formEl = document.getElementById(formId);
  if (!formEl) return;

  const fields = fieldMap || {
    name:     "pName",
    price:    "pPrice",
    stock:    "pStock",
    color:    "pColor",
    category: "pCategory",
    image:    "pImage",
    modelImage: "pModelImage",
  };

  // Price validation
  const priceEl = document.getElementById(fields.price);
  if (priceEl) {
    priceEl.addEventListener("blur", () => {
      const result = AdminValidator.validatePrice(priceEl.value);
      if (!result.valid) AdminValidator.markInvalid(priceEl, result.errors[0]);
      else AdminValidator.clearInvalid(priceEl);
    });
    priceEl.addEventListener("input", () => {
      if (priceEl.getAttribute("aria-invalid") === "true") {
        const result = AdminValidator.validatePrice(priceEl.value);
        if (result.valid) AdminValidator.clearInvalid(priceEl);
      }
    });
  }

  // Stock validation
  const stockEl = document.getElementById(fields.stock);
  if (stockEl) {
    stockEl.addEventListener("blur", () => {
      const result = AdminValidator.validateStockAdjustment(stockEl.value, 0);
      if (!result.valid) AdminValidator.markInvalid(stockEl, result.errors[0]);
      else AdminValidator.clearInvalid(stockEl);
    });
    stockEl.addEventListener("input", () => {
      if (stockEl.getAttribute("aria-invalid") === "true") {
        const result = AdminValidator.validateStockAdjustment(stockEl.value, 0);
        if (result.valid) AdminValidator.clearInvalid(stockEl);
      }
    });
  }

  // Name character counter + validation
  const nameEl = document.getElementById(fields.name);
  if (nameEl) {
    nameEl.addEventListener("blur", () => {
      const val = nameEl.value.trim();
      if (!val) AdminValidator.markInvalid(nameEl, "Product name is required.");
      else if (val.length > 120) AdminValidator.markInvalid(nameEl, "Name must be under 120 characters.");
      else AdminValidator.clearInvalid(nameEl);
    });
    nameEl.addEventListener("input", () => {
      if (nameEl.getAttribute("aria-invalid") === "true") {
        const val = nameEl.value.trim();
        if (val && val.length <= 120) AdminValidator.clearInvalid(nameEl);
      }
    });
  }

  // Primary color validation
  const colorEl = document.getElementById(fields.color);
  if (colorEl) {
    colorEl.addEventListener("blur", () => {
      const val = colorEl.value.trim();
      if (!val) AdminValidator.markInvalid(colorEl, "Primary color is required.");
      else AdminValidator.clearInvalid(colorEl);
    });
    colorEl.addEventListener("input", () => {
      if (colorEl.getAttribute("aria-invalid") === "true" && colorEl.value.trim()) {
        AdminValidator.clearInvalid(colorEl);
      }
    });
  }

  // Category
  const catEl = document.getElementById(fields.category);
  if (catEl) {
    catEl.addEventListener("blur", () => {
      const val = catEl.value.trim();
      if (!val) AdminValidator.markInvalid(catEl, "Category is required.");
      else AdminValidator.clearInvalid(catEl);
    });
    catEl.addEventListener("input", () => {
      if (catEl.getAttribute("aria-invalid") === "true" && catEl.value.trim()) {
        AdminValidator.clearInvalid(catEl);
      }
    });
  }

  // Image URL validation
  [
    { id: fields.image, label: "Product Image URL" },
    { id: fields.modelImage, label: "Model Image URL" },
  ].forEach(({ id, label }) => {
    const imageEl = document.getElementById(id);
    if (!imageEl) return;
    imageEl.addEventListener("blur", () => {
      const url = imageEl.value.trim();
      if (!url) AdminValidator.markInvalid(imageEl, `${label} is required.`);
      else if (!/^https?:\/\//i.test(url)) AdminValidator.markInvalid(imageEl, "URL must start with http:// or https://.");
      else AdminValidator.clearInvalid(imageEl);
    });
    imageEl.addEventListener("input", () => {
      if (imageEl.getAttribute("aria-invalid") === "true") {
        const url = imageEl.value.trim();
        if (/^https?:\/\//i.test(url)) AdminValidator.clearInvalid(imageEl);
      }
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   PRODUCT CARD VISUAL FEEDBACK
   Flash success/error on product cards after operations
───────────────────────────────────────────────────────────── */

/**
 * Flash a success indicator on a product card.
 * @param {string} productId
 */
export function flashCardSuccess(productId) {
  const card = document.querySelector(`.product-card[data-id="${productId}"]`);
  if (!card) return;
  card.classList.remove("op-error-flash", "op-processing");
  card.classList.add("op-success-flash");
  setTimeout(() => card.classList.remove("op-success-flash"), 1000);
}

/**
 * Flash an error indicator on a product card.
 * @param {string} productId
 */
export function flashCardError(productId) {
  const card = document.querySelector(`.product-card[data-id="${productId}"]`);
  if (!card) return;
  card.classList.remove("op-success-flash", "op-processing");
  card.classList.add("op-error-flash");
  setTimeout(() => card.classList.remove("op-error-flash"), 1000);
}

/**
 * Set processing state on a product card.
 * @param {string}  productId
 * @param {boolean} on
 */
export function setCardProcessing(productId, on) {
  const card = document.querySelector(`.product-card[data-id="${productId}"]`);
  if (!card) return;
  card.classList.toggle("op-processing", on);
}

/* ─────────────────────────────────────────────────────────────
   STOCK VALUE VISUAL STATES
   Update stock-value pill color based on stock level
───────────────────────────────────────────────────────────── */

/**
 * Update stock value visual state attributes.
 * @param {string} productId
 * @param {number} stock
 */
export function updateStockValueState(productId, stock) {
  const el = document.querySelector(`.stock-value[data-stock="${productId}"]`);
  if (!el) return;
  el.dataset.zero = String(stock <= 0);
  el.dataset.low  = String(stock > 0 && stock <= 5);
  el.textContent  = String(stock);
}

/* ─────────────────────────────────────────────────────────────
   EXPORT BUTTON PROCESSING STATE
───────────────────────────────────────────────────────────── */

/**
 * Wire export buttons with processing feedback.
 */
export function wireExportButtons() {
  document.querySelectorAll("[data-export]").forEach(btn => {
    btn.addEventListener("click", function() {
      if (this.classList.contains("exporting")) return;
      this.classList.add("exporting");
      const label = this.textContent;
      this.textContent = "Exporting…";
      setTimeout(() => {
        this.classList.remove("exporting");
        this.textContent = label;
      }, 2200);
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   FIREBASE CONNECTION STATUS
   Wire AdminSessionStatus to Firestore listener health
───────────────────────────────────────────────────────────── */

let _connectionLostTimer = null;
let _connectionState = "live";

/**
 * Report a Firebase listener error to the session status indicator.
 * Call this from your onSnapshot error callbacks.
 * @param {Error} err
 * @param {string} [context]  — "products" | "orders" | etc.
 */
export function reportFirebaseError(err, context = "") {
  if (_connectionState === "error") return; // already in error state

  const isPermission = err?.code === "permission-denied";
  const isNetwork = !navigator.onLine || err?.code === "unavailable";

  if (isPermission) {
    _connectionState = "error";
    AdminSessionStatus.setState("error", "Access Denied");
    AdminSessionBanner.show(
      `Firestore permission denied${context ? ` (${context})` : ""}. Check security rules.`,
      "error",
      { autoDismiss: 0, dismissible: true }
    );
  } else if (isNetwork) {
    _connectionState = "reconnecting";
    AdminSessionStatus.setState("reconnecting");

    // Auto-recover banner
    _connectionLostTimer = setTimeout(() => {
      AdminSessionBanner.show(
        "Connection interrupted. Attempting to reconnect to Chic Charms operations…",
        "warning",
        { autoDismiss: 8000, dismissible: true }
      );
    }, 2000);
  }
}

/**
 * Report that a Firebase listener has recovered.
 * Call this from your successful onSnapshot callbacks after an error.
 */
export function reportFirebaseRecovery() {
  if (_connectionState === "live") return;

  _connectionState = "live";
  clearTimeout(_connectionLostTimer);
  AdminSessionStatus.setState("live");
  AdminSessionBanner.hide();

  if (_hadConnectionError) {
    AdminToast.success("Connection restored.", { title: "Back online" });
    _hadConnectionError = false;
  }
}

let _hadConnectionError = false;

/* ─────────────────────────────────────────────────────────────
   VALIDATE PRODUCT FORM BEFORE SUBMIT
   Returns true if valid, false if errors shown inline.
───────────────────────────────────────────────────────────── */

/**
 * Validate an add/edit product form and show inline errors.
 * @param {object} formFields  — { name, price, stock, category, image, tag, desc }
 * @param {object} inputIds    — { name: "pName", price: "pPrice", ... }
 * @returns {boolean}          — true if all fields valid
 */
export function validateAndMarkProductForm(formFields, inputIds = {}) {
  const result = AdminValidator.validateProduct(formFields);

  // Map errors to input fields
  const fieldIdMap = {
    name:     inputIds.name     || "pName",
    price:    inputIds.price    || "pPrice",
    stock:    inputIds.stock    || "pStock",
    color:    inputIds.color    || "pColor",
    category: inputIds.category || "pCategory",
    image:    inputIds.image    || "pImage",
    modelImage: inputIds.modelImage || "pModelImage",
  };

  // Clear all first
  Object.values(fieldIdMap).forEach(id => {
    const el = document.getElementById(id);
    if (el) AdminValidator.clearInvalid(el);
  });

  const shouldValidateModelImage = Object.prototype.hasOwnProperty.call(formFields, "modelImage") || inputIds.modelImage;
  if (result.valid && shouldValidateModelImage) {
    const modelImage = (formFields.modelImage || "").trim();
    const modelImageEl = document.getElementById(fieldIdMap.modelImage);
    if (!modelImage) {
      if (modelImageEl) AdminValidator.markInvalid(modelImageEl, "Model Image URL is required.");
      return false;
    }
    if (!/^https?:\/\//i.test(modelImage)) {
      if (modelImageEl) AdminValidator.markInvalid(modelImageEl, "URL must start with http:// or https://.");
      return false;
    }
  }

  const shouldValidateColor = Object.prototype.hasOwnProperty.call(formFields, "color") || inputIds.color;
  if (result.valid && shouldValidateColor) {
    const color = (formFields.color || "").trim();
    const colorEl = document.getElementById(fieldIdMap.color);
    if (!color) {
      if (colorEl) AdminValidator.markInvalid(colorEl, "Primary color is required.");
      return false;
    }
  }

  if (result.valid) return true;

  // Mark first error per field
  const errorText = result.errors[0];

  // Try to match error to a field
  if (errorText.toLowerCase().includes("name")) {
    const el = document.getElementById(fieldIdMap.name);
    if (el) AdminValidator.markInvalid(el, errorText);
  } else if (errorText.toLowerCase().includes("price")) {
    const el = document.getElementById(fieldIdMap.price);
    if (el) AdminValidator.markInvalid(el, errorText);
  } else if (errorText.toLowerCase().includes("stock")) {
    const el = document.getElementById(fieldIdMap.stock);
    if (el) AdminValidator.markInvalid(el, errorText);
  } else if (errorText.toLowerCase().includes("category")) {
    const el = document.getElementById(fieldIdMap.category);
    if (el) AdminValidator.markInvalid(el, errorText);
  } else if (errorText.toLowerCase().includes("image") || errorText.toLowerCase().includes("url")) {
    const el = document.getElementById(fieldIdMap.image);
    if (el) AdminValidator.markInvalid(el, errorText);
  }

  return false;
}

/* ─────────────────────────────────────────────────────────────
   SAFE RESTOCK — drop-in replacement for prompt() calls
   Use this in place of:
     const val = prompt("Set new stock amount:", product.stock || 0);
───────────────────────────────────────────────────────────── */

/**
 * Show the premium restock dialog and return the new stock value.
 * Returns null if cancelled.
 * @param {object}   product
 * @param {Function} updateFn  — existing updateProductStockWithLog function
 * @returns {Promise<boolean>} — true if updated
 */
export async function safeRestock(product, updateFn) {
  return AdminSafeOps.safeRestockPrompt(product, updateFn);
}

/* ─────────────────────────────────────────────────────────────
   SAFE DELETE — drop-in replacement for direct deleteDoc
───────────────────────────────────────────────────────────── */

/**
 * Show premium delete confirmation and execute if confirmed.
 * @param {object}   product
 * @param {Function} deleteFn  — async (productId) => void
 * @returns {Promise<boolean>}
 */
export async function safeDelete(product, deleteFn) {
  return AdminSafeOps.safeDeleteProduct(product, deleteFn);
}

/* ─────────────────────────────────────────────────────────────
   STOCK INCREMENT SAFETY WRAPPER
   Drop-in for the ±5 stock buttons — adds op-locking
───────────────────────────────────────────────────────────── */

/**
 * Safely increment/decrement stock by an amount.
 * Prevents duplicate clicks via operation lock.
 * @param {object}   product
 * @param {number}   delta       — positive or negative integer
 * @param {Function} updateFn
 * @returns {Promise<boolean>}
 */
export async function safeStockDelta(product, delta, updateFn) {
  if (!product?.id) return false;
  if (AdminOpLock.isLocked(product.id)) {
    AdminToast.warning("Update already in progress — please wait.");
    return false;
  }

  const current = safeStock(product.stock);
  const newStock = safeStock(current + delta);

  // Don't do anything if no change
  if (newStock === current) {
    if (delta < 0) AdminToast.info("Stock is already at 0.");
    return false;
  }

  return AdminOpLock.withLock(
    product.id,
    async () => {
      const actionType = delta > 0 ? "RESTOCK" : "MANUAL_EDIT";
      await AdminRetry.withRetry(() => updateFn(product, newStock, actionType), {
        operationName: "Stock adjustment",
        maxAttempts: 3,
        onRetry: (attempt) => {
          if (attempt === 2) AdminToast.info("Retrying stock update…");
        },
      });
      flashCardSuccess(product.id);
      return true;
    },
    "Stock update already in progress."
  ).catch(err => {
    if (err.message?.startsWith("LOCK_BUSY")) return false;
    console.error("[E5] Stock delta failed:", err);
    flashCardError(product.id);

    const isPermission = err?.code === "permission-denied";
    AdminToast.error(isPermission
      ? "Permission denied. Check Firestore rules."
      : "Stock update failed. Please try again."
    );
    reportFirebaseError(err, "stock update");
    return false;
  });
}

/* ─────────────────────────────────────────────────────────────
   ORDER STATUS SAFETY WRAPPER
   Replace direct status updates in admin-orders.html
───────────────────────────────────────────────────────────── */

/**
 * Safely update order status with confirmation.
 * @param {object}   order
 * @param {string}   newStatus
 * @param {Function} updateFn   — async (orderId, newStatus) => void
 * @returns {Promise<boolean>}
 */
export async function safeOrderStatusUpdate(order, newStatus, updateFn) {
  return AdminSafeOps.safeUpdateOrderStatus(order, newStatus, updateFn);
}

/* ─────────────────────────────────────────────────────────────
   INITIALIZE E5 SAFETY LAYER
   Call once after admin auth is granted.
───────────────────────────────────────────────────────────── */

/**
 * Initialize all E5 safety enhancements.
 * Call from within onGranted() callback.
 */
export function initE5Safety() {
  // Wire form validation for Add Product form
  wireFormValidation({
    formId: "productForm",
    fieldMap: {
      name:     "pName",
      price:    "pPrice",
      stock:    "pStock",
      color:    "pColor",
      category: "pCategory",
      image:    "pImage",
      modelImage: "pModelImage",
    }
  });

  // Wire form validation for Edit Modal form
  wireFormValidation({
    formId: "editModal",
    fieldMap: {
      name:     "eName",
      price:    "ePrice",
      stock:    "eStock",
      color:    "eColor",
      category: "eCategory",
      image:    "eImage",
      modelImage: "eModelImage",
    }
  });

  // Wire export buttons
  wireExportButtons();

  // Online/offline status integration
  window.addEventListener("online", () => reportFirebaseRecovery());
  window.addEventListener("offline", () => {
    _connectionState = "reconnecting";
    AdminSessionStatus.setState("reconnecting", "Offline");
    AdminSessionBanner.show(
      "You appear to be offline. Changes will sync when connection is restored.",
      "warning",
      { autoDismiss: 0, dismissible: true }
    );
  });

  console.info("[ChicCharms E5] Operational safety layer initialized.");
}
