# Complete User System — Chic Charms
## Integration Guide

---

## FILES DELIVERED

| File | What it does |
|------|-------------|
| `account.html` | Full dashboard: Profile, Orders, Addresses tabs |
| `auth.html` | Updated: Forgot Password panel added |
| `cart-merge.js` | Merges guest cart on login |
| `checkout-prefill.js` | Auto-fills checkout with saved address |
| `firestore.rules` | Security rules for orders + addresses |

---

## PART 1 — ACCOUNT DASHBOARD

`account.html` is self-contained with three tabs:

**Profile tab:**
- Shows email, UID, member since date
- Order count, address count, total spend (live from Firestore)
- Password reset button (sends email via Firebase Auth)

**My Orders tab:**
- Reads from Firestore `orders` collection (filtered by `userEmail`)
- Fallback to `localStorage.allOrders` if Firestore fails
- Shows date, items, total, payment method

**Addresses tab:**
- Reads/writes Firestore `addresses` collection
- Add / Delete / Set Default address
- Validates phone (10 digits) and pincode (6 digits)

**Auth guard:**
```js
onAuthStateChanged(auth, user => {
  if (!user) window.location.href = 'auth.html'; // redirect if not logged in
});
```

---

## PART 2 — ORDER HISTORY (Firestore structure)

Orders are saved in Firestore under the `orders` collection.
Your `checkout.html` already does `addDoc(collection(db,'orders'), orderData)`.

Make sure `orderData` includes `userEmail`:

```js
const orderData = {
  userEmail:     user?.email || '',   // ← ADD THIS
  name:          formName,
  phone:         formPhone,
  address:       formAddress,
  pincode:       formPincode,
  items:         cartItems,
  total:         grandTotal,
  paymentMethod: 'cod' | 'razorpay',
  paymentId:     razorpayId || null,
  date:          new Date().toLocaleDateString('en-IN'),
  createdAt:     serverTimestamp(),   // ← needed for ordering
};
```

The account page queries:
```js
query(collection(db,'orders'), where('userEmail','==',user.email), orderBy('createdAt','desc'))
```

**Firestore index required:** Create a composite index on `orders`:
- `userEmail` ASC + `createdAt` DESC
(Firebase will prompt you with a link the first time the query runs)

---

## PART 3 — ADDRESS SYSTEM

Firestore collection: `addresses`

Document structure:
```json
{
  "userEmail": "user@example.com",
  "name":      "Priya Sharma",
  "phone":     "9876543210",
  "address":   "Flat 4, Rose Apartments, MG Road",
  "city":      "Chennai",
  "pincode":   "600001",
  "isDefault": true,
  "createdAt": <Timestamp>
}
```

All CRUD is handled inside `account.html` — no extra files needed.

---

## PART 4 — CART MERGE

Add to your `auth-ui.js` (inside the `if (user)` block in `onAuthStateChanged`):

```js
import { mergeCartOnLogin } from "./cart-merge.js";

onAuthStateChanged(auth, (user) => {
  if (user) {
    mergeCartOnLogin(user); // ← merge guest cart
    // ... rest of your navbar logic
  }
});
```

Or call it right after login in `auth.html`:
```js
const cred = await signInWithEmailAndPassword(auth, email, password);
mergeCartOnLogin(cred.user); // ← before redirect
window.location.href = 'index.html';
```

**What it does:**
- Reads `localStorage.cart`
- Deduplicates items by name (same item → quantity added)
- Saves merged result back to `localStorage.cart`
- No server needed

---

## PART 5 — FORGOT PASSWORD

Already integrated into `auth.html`.

**How it works:**
1. "Forgot password?" link appears below the password field in the Login panel
2. Clicking it shows a dedicated panel with an email input
3. Sends `sendPasswordResetEmail(auth, email)` from Firebase Auth
4. Back to Login button returns to the login panel

**No extra config needed** — Firebase handles the email template.
You can customize the reset email in Firebase Console → Authentication → Templates.

---

## PART 6 — CHECKOUT PREFILL

Add this script tag at the bottom of `checkout.html`:

```html
<script type="module" src="checkout-prefill.js"></script>
```

Then make sure your checkout inputs have these IDs (or edit `FIELDS` in the file):

```html
<input id="checkoutEmail"   ...>   <!-- user email -->
<input id="checkoutName"    ...>   <!-- from saved address -->
<input id="checkoutPhone"   ...>
<input id="checkoutAddress" ...>
<input id="checkoutPincode" ...>
```

The script only fills **empty** fields — it won't overwrite anything the user has typed.

---

## PART 7 — FIRESTORE SECURITY RULES

Paste `firestore.rules` content into:
**Firebase Console → Firestore Database → Rules tab**

Key protections:
- Orders: anyone can create (guest checkout), only owner can read, nobody can delete
- Addresses: authenticated users can only read/write their own

---

## PART 8 — NAVBAR (every page)

Every page needs:
```html
<div class="nav-actions" id="navActions"></div>
```
And at the bottom of `<body>`:
```html
<script type="module">
  import { setupAuthUI } from "./auth-ui.js";
  setupAuthUI();
</script>
```

---

## PART 9 — COMPLETE FILE DEPENDENCY TREE

```
auth.js                ← Firebase init (one place)
  ↓
auth-ui.js             ← Navbar auth state (all pages)
  ├─ cart-merge.js     ← Call mergeCartOnLogin() on login
  └─ setupAuthUI()     ← Injected into every page

auth.html              ← Login + Signup + Forgot Password
  └─ imports from auth.js only

account.html           ← Dashboard (auth-guarded)
  ├─ imports from auth.js
  └─ reads Firestore: orders, addresses

checkout.html          ← Existing file
  ├─ imports from auth.js
  ├─ writes to Firestore: orders (with userEmail field)
  └─ checkout-prefill.js (prefills form)

firestore.rules        ← Paste into Firebase Console
```

---

## QUICK CHECKLIST

- [ ] `auth.js` exists and exports `auth`, `onAuthStateChanged`, `signOut`, etc.
- [ ] `auth-ui.js` calls `setupAuthUI()` on every page
- [ ] `account.html` replaced with the new version
- [ ] `auth.html` updated (forgot password added)
- [ ] `checkout.html` orderData includes `userEmail` and `createdAt`
- [ ] `checkout-prefill.js` added to checkout.html
- [ ] `cart-merge.js` called on login in `auth-ui.js`
- [ ] Firestore rules deployed
- [ ] Firestore composite index created (orders: userEmail + createdAt)
