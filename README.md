# Chic Charms – Search Discovery + Search Results (Mobile)

For https://github.com/aghilan28/chic-charms-stores

## Files
- `search.html` – Search Discovery (mobile UI)
  Popular searches, Shop By Category, Trending Now (Firestore)
- `search-results.html` – **NEW** Search Results (mobile UI)
  1. Matching Categories
  2. Matching Collections
  3. Matching Products
  Live debounce search, wired to Firestore `chic-charms-store`
- `index.html` – patched: header search icon → search.html, bottom nav Search → search.html, nav-links Search added
- `product.html` – patched: header search icon → search.html, bottomNav search → search.html, footer category links fixed to real shop categories
- `shop.html` – patched: header search icon → search-results.html, search input tap → search-results.html, bottom nav includes Search tab

Copy all 5 files to repo root.

## Flow
1. Home / Product / Shop → tap Search icon → `search.html`
2. `search.html`:
   - Type query → Enter → `search-results.html?q=pearl`
   - Popular chips → `search-results.html?q=...`
   - Category cards → `shop.html?category=everyday-elegance|modern-romance|heritage-muse|after-dark`
   - Trending product → `product.html?id=...` → Add to Bag (uses `addToCartWithId` from `script.js`)
3. `search-results.html?q=pearl`:
   - Live Firestore search – debounced 320ms
   - Categories: Pearl Collection, Stud Earrings, etc. → `shop.html?category=...`
   - Collections: The Pearl Edit / Korean Morning / Everyday Gold / After Dark → `shop.html?category=...`
   - Products: list with 72px thumb → `product.html?id=...`
   - View All N Results → `shop.html?q=pearl`
4. `product.html?id=...` → standard add to cart, checkout

All product links use Firestore doc IDs, cart uses your existing `script.js` / `addToCartWithId()` with live stock checking.

## Tech
- Mobile-first, 390–440px editorial shell, centered on desktop
- Playfair Display + Jost, Luminous Editorial tokens from DESIGN.md
- Tailwind CDN, Material Symbols Outlined
- Firestore REST: `https://firestore.googleapis.com/v1/projects/chic-charms-store/...`
- Offline fallback products included
- Bottom nav on all pages: Home / Search / Wishlist / Bag / Account
- `script.js` loaded deferred – cart, auth, image fallback all work

Place at repo root, commit, push.
