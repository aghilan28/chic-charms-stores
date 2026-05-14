# Phase E5 — Production Security Hardening
## Chic Charms Admin — Integration Guide

---

### Files Delivered

| File | Purpose |
|------|---------|
| `admin-ops-safety.js` | Core safety module — confirm dialogs, validation, op-locking, retry |
| `admin-ops-safety.css` | Safety UI styles — toasts, validation states, feedback, D7/D8 polish |
| `admin-e5-integration.js` | Drop-in integration layer for admin.html |
| `firestore.rules` | Hardened security rules with stock/price bounds |

---

### Step 1 — Add CSS to admin.html and admin-orders.html

In `<head>`, after `admin-session.css`:

```html
<link rel="stylesheet" href="admin-ops-safety.css" />
```

---

### Step 2 — Wire admin.html imports

In the `<script type="module">` block, add to the imports at the top:

```js
import {
  AdminConfirm,
  AdminRenderGuard,
  AdminOpLock,
  safeStock,
  initE5Safety,
  safeRestock,
  safeDelete,
  safeStockDelta,
  flashCardSuccess,
  flashCardError,
  reportFirebaseError,
  reportFirebaseRecovery,
  validateAndMarkProductForm,
} from "./admin-e5-integration.js";
```

---

### Step 3 — Call initE5Safety() in onGranted

Inside `onGranted(user)`:

```js
onGranted(user) {
  adminVerified = true;
  syncAdminStateAliases();
  adminReveal([".admin-sidebar", ".admin-bar"]);
  AdminSessionTimer.start(".admin-side-footer");
  initE5Safety();   // ← Add this line
  startAnalyticsListeners();
},
```

---

### Step 4 — Replace prompt() restock calls

**Before (E4):**
```js
const val = prompt("Set new stock amount:", product.stock || 0);
if (val === null) return;
const newStock = Math.max(0, parseInt(val, 10) || 0);
await updateProductStockWithLog(product, newStock, "RESTOCK");
```

**After (E5):**
```js
await safeRestock(product, updateProductStockWithLog);
```

---

### Step 5 — Replace delete confirmation

The delete modal is already in admin.html. Optionally replace `deleteModalConfirm` handler with the premium confirm system. The existing modal is also fine — E5 adds the premium version as a drop-in alternative.

To use E5 premium confirm in the delete button listener:

```js
deleteModalConfirm.addEventListener("click", async function () {
  if (!deletingId) return;
  const product = allProducts.find(p => p.id === deletingId);
  const confirmed = await AdminConfirm.confirmDelete(product?.name || "this product");
  if (!confirmed) return;
  // ... existing delete logic
});
```

---

### Step 6 — Replace ±5 stock buttons (optional)

The stock ±5 buttons gain op-locking + retry automatically via `safeStockDelta`:

```js
// In the productsGrid click handler, replace the action === "plus"/"minus" branch:
if (action === "plus" || action === "minus") {
  const delta = action === "plus" ? 5 : -5;
  await safeStockDelta(product, delta, updateProductStockWithLog);
  return;
}
```

---

### Step 7 — Wire Firebase error reporting

In each `onSnapshot` error callback, add:

```js
function (err) {
  console.error("Products onSnapshot error:", err);
  reportFirebaseError(err, "products");  // ← Add
  // ... existing error handling
}
```

In each successful `onSnapshot` callback (inside the data handler), add on first call:

```js
// Inside the onSnapshot success callback:
reportFirebaseRecovery();  // ← Add (safe to call repeatedly)
```

---

### Step 8 — Replace product form validation

In the Add Product form submit handler, add before the existing validation block:

```js
const isValid = validateAndMarkProductForm({
  name, price, stock, category, image, tag, desc
});
if (!isValid) return;
```

This shows inline field-level errors instead of a single status message.

---

### Step 9 — Replace firestore.rules

Deploy the updated `firestore.rules` file.

```bash
firebase deploy --only firestore:rules
```

**Key changes in E5 rules:**
- Product `create` now validates required fields + value bounds
- Product `update` now enforces `0 ≤ stock ≤ 99999` and `0 ≤ price ≤ 999999`
- `adminActivityLogs` are now fully immutable (no update, no delete)
- `inventoryLogs` updates are blocked (append-only)
- Order status updates validate allowed status values
- User documents cannot have `email` field mutated after creation

---

### What E5 Does NOT Change

- Firebase architecture — untouched
- Realtime listener system — untouched
- Checkout + Razorpay flow — untouched
- Order system — untouched
- Existing admin UX — preserved and enhanced
- All existing functionality — preserved

---

### New UX Capabilities

**AdminConfirm** — Premium modal replacing browser `confirm()`:
```js
const ok = await AdminConfirm.ask({ title, body, confirmText, intent });
const ok = await AdminConfirm.confirmDelete(productName);
const ok = await AdminConfirm.confirmStockReset(productName, currentStock);
const ok = await AdminConfirm.confirmLargeStockDrop(productName, from, to);
const ok = await AdminConfirm.confirmOrderStatusChange(orderId, from, to);
```

**AdminValidator** — Centralized validation:
```js
const result = AdminValidator.validateProduct({ name, price, stock, category, image });
// result.valid, result.errors[], result.sanitized
```

**AdminOpLock** — Prevent concurrent writes:
```js
await AdminOpLock.withLock(productId, async () => { /* safe write */ });
```

**AdminRetry** — Graceful Firebase retry:
```js
await AdminRetry.withRetry(() => updateDoc(...), { maxAttempts: 3 });
```

**AdminRenderGuard** — Debounce rapid renders:
```js
AdminRenderGuard.schedule("products", renderProducts);
AdminRenderGuard.scheduleVersioned("analytics", Date.now(), renderAllAnalytics);
```
