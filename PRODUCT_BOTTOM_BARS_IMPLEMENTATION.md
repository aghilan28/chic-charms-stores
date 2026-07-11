# Product Page Stacked Bottom Bars

## Integration target

Repository: `aghilan28/chic-charms-stores`  
Base commit used: `3121d44dc920d7695c566866782d9025ba640a7e`

Extract the supplied update folder over the repository root, preserving the file names and paths.

## Updated files

- `product.html`
  - Keeps the Product CTA only on the Product Page.
  - Removes the Product Page's obsolete hidden/locally rendered bottom navigation.
  - Continues to load the existing global `cc-bottom-nav.js` component exactly once.
  - Activates the CTA only after valid product data has rendered.
  - Preserves the existing `handleAddToCart()` integration.
  - Adds `viewport-fit=cover` for iPhone safe areas.
- `mobile-product.css`
  - Removes the obsolete hard-coded `bottom: 60px` CTA positioning and old generic bottom padding.
- `cc-bottom-nav.css`
  - Defines the shared 72px navigation geometry and safe-area variables.
  - Keeps the global navigation fixed at `bottom: 0`.
  - Prevents horizontal overflow at 320px.
- `cc-bottom-nav.js`
  - Keeps the existing shared global component.
  - Includes 768px in the mobile/tablet navigation range.

## New runtime file

- `product-sticky-cta.css`
  - Product-only stacked-bar implementation.
  - Positions the 80px Product CTA at `bottom: 72px + safe-area-inset-bottom`.
  - Gives the CTA a higher stacking layer than the global navigation.
  - Adds product content clearance for CTA + navigation + 24px spacing.
  - Keeps toast feedback above both bars.
  - Hides the Product CTA at 769px and wider, matching the global navigation breakpoint.

## Resulting mobile stack

1. Product content
2. Product CTA: 80px
3. Global Bottom Navigation: 72px + `env(safe-area-inset-bottom)`

The CTA and navigation share an exact edge: there is no overlap and no positioning gap.

## Verification completed

Browser runtime verification passed at:

- 320px
- 375px
- 390px
- 414px
- 480px
- 768px

The checks covered:

- one global navigation instance only
- Product CTA only on `product.html`
- exact CTA/navigation edge alignment
- CTA stacking priority
- no horizontal overflow
- final-content bottom clearance
- simulated 34px iPhone safe area
- existing Add to Cart handler/local cart wiring
- global-navigation-only behavior on Home, Shop, Category, Wishlist, Search, Account, and Cart
- hidden CTA on invalid/missing product data
- JavaScript syntax and browser runtime errors
