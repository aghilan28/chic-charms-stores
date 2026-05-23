# HOW TO APPLY mobile-fixes.css + mobile-fixes.js

Drop both files into your project root (same folder as index.html).
Then add exactly these lines to each file listed below.

---

## index.html
Add BOTH lines at the very bottom of <head>, AFTER all existing CSS links:

    <link rel="stylesheet" href="mobile-fixes.css" media="(max-width: 767px)" />

Add the JS line just BEFORE the closing </body> tag:

    <script src="mobile-fixes.js" defer></script>

---

## shop.html
Add BOTH lines at the very bottom of <head>, AFTER:
    <link rel="stylesheet" href="mobile-phase3.css" ...>

    <link rel="stylesheet" href="mobile-fixes.css" media="(max-width: 767px)" />

Add the JS line just BEFORE the closing </body> tag:

    <script src="mobile-fixes.js" defer></script>

---

## cart.html
Add BOTH lines at the very bottom of <head>:

    <link rel="stylesheet" href="mobile-fixes.css" media="(max-width: 767px)" />

Add the JS line BEFORE the existing:
    <script src="final-mobile-stabilization.js" defer></script>
    ^^ place mobile-fixes.js BEFORE this line

    <script src="mobile-fixes.js" defer></script>

---

## account.html
Add BOTH lines at the very bottom of <head>:

    <link rel="stylesheet" href="mobile-fixes.css" media="(max-width: 767px)" />

Add the JS line just BEFORE the closing </body> tag:

    <script src="mobile-fixes.js" defer></script>

---

## What each fix does

| Bug                         | Fix                                              | File         |
|-----------------------------|--------------------------------------------------|--------------|
| Home page blank             | Force d6-reveal elements visible on mobile       | CSS + JS     |
| Shop page dead space        | Align sticky header exactly below announcement   | CSS          |
| Products scroll freeze      | Fix touch-action on card overlays + grid         | CSS + JS     |
| Product card layout broken  | Rebuild card layout with correct sizing/stacking | CSS          |
| Cart total bar misplaced    | Fixed position above bottom nav (64px gap)       | CSS + JS     |
| Account page not impressive | Single-column layout, horizontal tab nav         | CSS          |

## Desktop safety
Every single rule in mobile-fixes.css is wrapped in:
  @media (max-width: 767px) { ... }
Desktop (≥ 768px) is completely untouched.
