# Auth System V2 — Chic Charms Integration Guide

## FILES DELIVERED

| File | Role |
|------|------|
| `auth.js` | **Single Firebase init** — import `auth` from here only |
| `auth-ui.js` | **Global auth controller** — call `setupAuthUI()` on every page |
| `auth-nav.js` | **Shim** — existing pages that import this still work (it delegates to auth-ui.js) |
| `auth.html` | **Fixed** — no listener redirect, no duplicate init, clean login/signup |

---

## 1. NAVBAR HTML (every page)

Replace your existing `<div class="nav-actions">` block with this empty version.
`auth-ui.js` fills it automatically based on login state:

```html
<div class="nav-actions" id="navActions">
  <!-- auth-ui.js injects auth buttons here -->
</div>
```

When **logged out**, navActions shows:
```
[Login]  [☰]
```

When **logged in**, navActions shows:
```
[👤 My Account]  [Logout]  [☰]
```

---

## 2. SCRIPT TAG (every page except auth.html)

Add this at the **bottom of `<body>`** on every page:

```html
<script type="module">
  import { setupAuthUI } from "./auth-ui.js";
  setupAuthUI();
</script>
```

**Pages that still use the old `auth-nav.js` tag don't need to change** —
the new `auth-nav.js` shim delegates to `auth-ui.js` automatically.

---

## 3. auth.html — NO changes needed to the form

The rebuilt `auth.html`:
- ✅ Imports `signInWithEmailAndPassword` + `createUserWithEmailAndPassword` from `auth.js`
- ✅ Does **NOT** call `onAuthStateChanged` (no redirect loop)
- ✅ Redirects to `index.html` only after **explicit** login/signup success
- ✅ All buttons are `type="button"` (no accidental form submits)
- ✅ Password strength bar, show/hide toggle, error messages — all preserved

---

## 4. PAGES CHECKLIST

| Page | navActions id | Script to add |
|------|--------------|---------------|
| `index.html` | ✅ exists | keep `auth-nav.js` OR switch to `auth-ui.js` import |
| `product.html` | ✅ exists | keep `auth-nav.js` OR switch to `auth-ui.js` import |
| `cart.html` | ✅ exists | keep `auth-nav.js` OR switch to `auth-ui.js` import |
| `checkout.html` | ✅ exists | keep `auth-nav.js` OR switch to `auth-ui.js` import |
| `confirmation.html` | ❌ missing | add `<div class="nav-actions" id="navActions"></div>` + `auth-ui.js` import |
| `account.html` | ✅ exists | keep `auth-nav.js` OR switch to `auth-ui.js` import |
| `auth.html` | ❌ intentionally absent | **DO NOT add setupAuthUI** — auth page manages its own navbar |

---

## 5. ACCOUNT PAGE GUARD

`account.html` already has its own `onAuthStateChanged` guard. Keep it, but
**change its Firebase import** from the old inline init to:

```js
import { auth, onAuthStateChanged, signOut } from "./auth.js";
```

Remove the `initializeApp`, `getAuth`, and `firebaseConfig` blocks from `account.html`.

---

## 6. CHECKOUT PAGE — same fix

In `checkout.html`, replace:
```js
import { initializeApp, getApps } from "...firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "...firebase-auth.js";
const firebaseConfig = { ... };
const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
```
With:
```js
import { auth, onAuthStateChanged, signOut } from "./auth.js";
```

---

## 7. ORDER HISTORY (optional)

On `checkout.html`, after a successful order, push to `allOrders`:

```js
const allOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');
allOrders.push(orderObject);
localStorage.setItem('allOrders', JSON.stringify(allOrders));
```

`account.html` already reads from `allOrders`.

---

## 8. LOGOUT

Logout is handled in two places:
- **Navbar** → `auth-ui.js` attaches the listener to `#logoutBtn` automatically
- **Account page** → import and call `logoutUser` from `auth-ui.js`:

```js
import { logoutUser } from "./auth-ui.js";
document.getElementById('accountLogoutBtn').addEventListener('click', logoutUser);
```

---

## 9. ARCHITECTURE SUMMARY

```
auth.js          ← Firebase init (ONE place)
    ↓ exports auth, onAuthStateChanged, signOut, ...
auth-ui.js       ← Global controller (imports from auth.js)
    ↓ exports setupAuthUI(), logoutUser()
auth-nav.js      ← Shim (delegates to auth-ui.js for backward compat)

Every page:
  └─ import { setupAuthUI } from "./auth-ui.js"   → updates navbar

auth.html:
  └─ import { auth, signInWith..., createUserWith... } from "./auth.js"
     (no onAuthStateChanged → no redirect loop)

account.html / checkout.html:
  └─ import { auth, onAuthStateChanged } from "./auth.js"
     (remove all inline firebaseConfig / initializeApp / getAuth)
```

---

## 10. CONSOLE DEBUGGING

Every auth event logs to console:
```
[auth-ui] Auth state: user@email.com   ← logged in
[auth-ui] Auth state: signed out       ← logged out
[auth]    Login success: user@email.com
[auth]    Signup success: user@email.com
[auth]    Login error: auth/invalid-credential
[auth-ui] Signed out successfully.
```

Open DevTools → Console to trace the full auth flow.
