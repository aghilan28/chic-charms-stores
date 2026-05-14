# Auth UX Integration Guide — Chic Charms

## FILES DELIVERED
- `auth-nav.js`   → Drop-in replacement for your existing auth-nav.js
- `account.html`  → New account page (Part 3 + Part 7)

---

## 1. NAVBAR HTML SNIPPET
Add this to every page's `<div class="nav-actions" id="navActions">`.
Leave it empty — auth-nav.js fills it automatically:

```html
<div class="nav-actions" id="navActions">
  <!-- auth-nav.js injects: [Login] OR [My Account] [Logout] -->
</div>
```

When NOT logged in, the navbar shows:
  → [Login]

When logged in, the navbar shows:
  → [My Account]  [Logout]

---

## 2. AUTH STATE JS (for every page)
Just include auth-nav.js at the bottom of every page:

```html
<script type="module" src="auth-nav.js"></script>
```

This handles everything: onAuthStateChanged, navbar update, logout.
No extra JS needed on individual pages.

---

## 3. ACCOUNT PAGE
`account.html` is self-contained. It:
- Shows an auth-checking overlay while Firebase resolves
- Redirects to auth.html if the user is NOT logged in (Part 7 guard)
- Displays the user's email, UID, member since date
- Lists orders stored in localStorage under `allOrders`
- Has a working Logout button

---

## 4. LOGOUT FUNCTION
Defined inside auth-nav.js (for navbar) and account.html (for page button).
Both do the same thing:

```js
async function logoutUser() {
  await signOut(auth);
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userId');
  window.location.href = 'index.html';
}
```

---

## 5. AUTH PAGE REDIRECT FIX (auth.html)
After successful login or signup, make sure you redirect to index.html:

```js
// After signInWithEmailAndPassword or createUserWithEmailAndPassword:
window.location.href = 'index.html';
```

---

## 6. ORDER HISTORY (optional — to enable on account page)
On checkout.html, after a successful order, ALSO save to allOrders array:

```js
// After saving lastOrder, also push to allOrders:
const allOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');
allOrders.push(orderObject);
localStorage.setItem('allOrders', JSON.stringify(allOrders));
```

account.html already reads from `allOrders` — no other changes needed.

---

## PAGES THAT NEED auth-nav.js
All of these already have `id="navActions"` and `auth-nav.js` imported:
- index.html       ✓ (already included)
- product.html     ✓ (already included)
- cart.html        ✓ (already included)
- checkout.html    ✓ (already included)
- confirmation.html → add `<script type="module" src="auth-nav.js"></script>`
- account.html     ✓ (included in the new file)
