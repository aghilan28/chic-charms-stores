# Chic Charms – Approved Mobile Commerce Integration
## Visual Fidelity Enforcement Protocol v1.0

ZERO-BACKEND-DAMAGE • VISUALLY IDENTICAL TO code.html

### Files (drop into repo root)
```
index.html
chic-charms-mobile-approved.css
chic-charms-mobile-approved.js
```

index.html has exactly 2 insertion blocks, marked:
`<!-- CHIC CHARMS APPROVED MOBILE COMMERCE – VISUAL FIDELITY ENFORCEMENT v1.0 -->`

### Visual Fidelity – 100% code.html

- Typography: Playfair Display (headlines/logo), Inter (body/labels) – exact Google Fonts load as code.html
- Font sizes: display-lg 40/48px, label-md 11/14px .05em, headline-lg 30/36px, body-md 14/22px, label-lg 12/16px .1em – all preserved
- Colors: background #FFF9F7, primary #B5657A, deep-rose #9F4C67, charcoal #2F2A2A, menu-text #6B4A58, soft-blush #FDF2F5, surface #F6F1EF, outline rgba(181,101,122,.15)
- Spacing: margin-horizontal 24px, grid-gap-x 28px, grid-gap-y 48px, stack-sm 8px, stack-md 16px, stack-lg 32px, touch-target 44px
- Header: 80px, sticky top 40px, border-header-border
- Announcement bar: 40px, bg-primary
- Product grid: 2 cols, gap-x 28px, gap-y 48px
- Product card: aspect-square 1/1, image object-fit: contain, wishlist top-4 right-4 40px white/95 rounded-full shadow, name 14/22px Inter center, price 12/16px .1em deep-rose
- NO Add to Cart buttons in cards – faithful to code.html
- NO stock labels, ratings, discount badges – faithful to code.html
- Drawer: 85% / 400px max, 64px menu rows, menu-text / deep-rose active
- Filter modal: 707px, accordions, Product Type / Collection / Price Range
- Sort modal: Best Sellers / Newest First / Popularity / Low-High / High-Low
- Editorial block: 450px, -mx full-bleed, "The Eternal Pearl Collection"
- Bottom bar: 60px fixed, Filters | Sort By

### Backend Wiring

- Firebase: chic-charms-store / products collection, onSnapshot live
- Product image: productImage || image || imageUrl || images/product-placeholder-jewelry.jpg
- Categories: everyday-elegance / modern-romance / after-dark / heritage-muse – same slugs as repo
- Product links: product.html?id=<docId>&category=<slug> – existing PDP
- Wishlist: localStorage key "wishlist" – same as d15-luxury-stage4-final.js, toggles .is-saved, toast feedback
- Cart: via product.html PDP (existing D9 luxury mobile PDP – untouched per constitution)
- Search: header search icon – toast "Search coming soon" (code.html has decorative search, no overlay)
- Filters / Sort: client-side over live Firestore array
- Admin / Orders / Auth / Inventory: untouched, zero backend changes

### Desktop Protection

All mobile UI is wrapped in `@media (max-width: 1024px) { … }`
Desktop ≥1025px: 0 changes, byte-identical

### Rollback

Remove the two `CHIC CHARMS APPROVED MOBILE COMMERCE` blocks from index.html, delete the two `chic-charms-mobile-approved.*` files.

---
Built 2026-06-19 – Visual Fidelity Enforcement Protocol v1.0
Repo: https://github.com/aghilan28/chic-charms-stores
