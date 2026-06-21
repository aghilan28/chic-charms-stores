# Chic Charms – Search Discovery (Mobile)

Fixed mobile search page for https://github.com/aghilan28/chic-charms-stores

## Install
Copy `search.html` to the repo root (same folder as `shop.html`, `index.html`, `script.js`).

That's it – 1 file. No new dependencies.

## What was fixed
- Mobile-first, crash-free: correct viewport, overflow-x locked, safe-area insets, 390–440px editorial shell centered on desktop (desktop shop.html untouched)
- Wired to Firestore `chic-charms-store` – Trending Now loads live products, links to `product.html?id=…`, Add to Bag calls `addToCartWithId()` from your `script.js` with stock checking
- Search → `shop.html?q=…`, Categories → `shop.html?category=…`, Popular chips all wired
- Recent searches (localStorage), live suggestions, wishlist toggle
- Uses your local `/images/*` editorial assets, no broken external URLs
- Bottom nav matches shop.html: Home / Search / Wishlist / Bag / Account
- Design tokens from DESIGN.md – Playfair + Jost, rose/champagne palette
- Cart toast reuses `#cartToast` from script.js

Place search.html at repo root and push.
