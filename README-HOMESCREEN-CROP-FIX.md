# Chic Charms — homescreen product auto-crop fix

## Root cause

On mobile (`max-width: 767px`), `index.html` does not display the desktop `.lux-img-container` product cards. `chic-charms-mobile-approved.js` dynamically creates a separate mobile storefront using `.cc-product-img`.

The previous fix targeted `.lux-img-container`, so it only affected the hidden desktop card structure. The visible mobile homescreen still used a square `1:1` frame and `object-fit: contain`, which leaves empty space rather than cropping.

## Fixed file

- `chic-charms-mobile-approved.css` (project-root file)

## What changed

The actual mobile homescreen card structure now:

- uses a stable `4:5` product frame;
- makes the generated product link fill the complete frame;
- uses `object-fit: cover` so any source-image dimensions are automatically cropped without distortion;
- uses `object-position: center top` to preserve faces/jewellery near the top of portrait images;
- clips overflow correctly;
- leaves the desktop homescreen unchanged.

No HTML or JavaScript wiring change is required. The existing `index.html` already loads both `chic-charms-mobile-approved.css` and `chic-charms-mobile-approved.js`.

## Integration

Copy `chic-charms-mobile-approved.css` from this ZIP to the root of the existing project and replace the old file with it. Preserve the filename and location.

After deployment, perform a hard refresh or clear the hosting/CDN/browser cache so the updated CSS is downloaded.

## Verification completed

- CSS parsed with zero syntax/token errors.
- JavaScript syntax checks passed for the existing mobile renderer and shared script.
- Browser integration test ran against the real local `index.html` at `390 × 844`.
- A dynamically rendered Firebase product card measured `157 × 196.25` pixels, exactly `4:5`.
- Its link and image matched the complete frame dimensions.
- Computed `object-fit` was `cover`.
- Computed `object-position` was `50% 0%` (`center top`).
- Desktop test at `1440 × 900` confirmed the existing desktop homepage remains active and the mobile injected UI is not mounted.
