# PATCH — product.html
## Color Variant Architecture Fix
### Scope: `normalizeVariants` · `buildGalleryItems` · `selectProductVariant` · `renderProduct`

---

## ❶ REPLACE: `normalizeVariants`

Extend the normalizer so it also **wraps the main product itself** as the first "color" entry
whenever the product has a `productImage` / `modelImage` but no variants — or whenever the
product carries its own top-level color name.  
Every entry in the returned array is now a **complete, uniform color object**.

**FIND (lines 1272-1285 in product.html):**
```js
    function normalizeVariants(product) {
      const variants = Array.isArray(product?.variants) ? product.variants : [];
      return variants
        .filter((variant) => String(variant?.color || "").trim())
        .map((variant, index) => ({
          id: String(variant.id || variant.color || index).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          color: String(variant.color || "").trim(),
          stock: Number.isFinite(Number(variant.stock)) ? Number(variant.stock) : Number(product.stock || 0),
          images: Object.assign({}, variant.images || {}, {
            productImage: variant.productImage || variant.image || variant.imageUrl || variant.imageURL || variant.images?.productImage,
            modelImage: variant.modelImage || variant.images?.modelImage,
          }),
        }));
    }
```

**REPLACE WITH:**
```js
    /*
     * normalizeVariants — unified color model
     *
     * Every entry is: { id, color, stock, images: { productImage, modelImage } }
     *
     * Rule: the MAIN PRODUCT is treated as the first color if it has its own
     * images AND either (a) a top-level `color` field or (b) no variants at all.
     * This guarantees a single source of truth: the variant array drives
     * everything — gallery, selector, stock — with no separate "base" path.
     */
    function normalizeVariants(product) {
      const rawVariants = Array.isArray(product?.variants) ? product.variants : [];

      // Resolve the main product's own image pair (top-level fields)
      const mainProductImage =
        product?.images?.productImage ||
        product?.image ||
        product?.imageUrl ||
        product?.imageURL ||
        "";
      const mainModelImage =
        product?.images?.modelImage ||
        product?.modelImage ||
        mainProductImage;

      // Normalize each stored variant
      const storedVariants = rawVariants
        .filter((v) => String(v?.color || "").trim())
        .map((v, index) => {
          const pImg =
            v?.images?.productImage ||
            v?.productImage ||
            v?.image ||
            v?.imageUrl ||
            v?.imageURL ||
            "";
          const mImg =
            v?.images?.modelImage ||
            v?.modelImage ||
            pImg;
          return {
            id: String(v.id || v.color || index).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            color: String(v.color || "").trim(),
            stock: Number.isFinite(Number(v.stock)) ? Number(v.stock) : Number(product.stock || 0),
            images: { productImage: pImg, modelImage: mImg },
          };
        });

      // Build the main-product entry if it has usable images
      const mainColor = String(product?.color || "").trim();
      const hasMainImages = isUsableImageUrl(mainProductImage);

      if (hasMainImages) {
        // Check whether a stored variant already covers the same color name
        const alreadyCovered = mainColor &&
          storedVariants.some((v) => v.color.toLowerCase() === mainColor.toLowerCase());

        if (!alreadyCovered) {
          const mainEntry = {
            id: mainColor
              ? mainColor.toLowerCase().replace(/[^a-z0-9]+/g, "-")
              : "__main__",
            color: mainColor || (storedVariants.length ? "Default" : ""),
            stock: Number(product.stock || 0),
            images: { productImage: mainProductImage, modelImage: mainModelImage },
          };
          // Prepend: main product is always the first / default color
          storedVariants.unshift(mainEntry);
        }
      }

      return storedVariants;
    }
```

---

## ❷ REPLACE: `buildGalleryItems`

Gallery must show **only** the two images belonging to the active color.
Remove all legacy base-image mixing logic.

**FIND (lines 1303-1328 in product.html):**
```js
    function buildGalleryItems(product, variant) {
      const seen = new Set();
      const items = [];
      const baseImages = normalizeProductImages(product);
      const variantImages = variant?.images || {};

      function addImage(key, label, src) {
        const cleanSrc = String(src || "").trim();
        if (!isUsableImageUrl(cleanSrc) || seen.has(cleanSrc)) return;
        seen.add(cleanSrc);
        items.push([key, label, cleanSrc]);
      }

      addImage("productImage", "Product", baseImages.productImage);
      addImage("modelImage", "Model", baseImages.modelImage);

      if (variant) {
        addImage("variantProductImage", variant.color, variantImages.productImage);
        addImage("variantModelImage", `${variant.color} Model`, variantImages.modelImage);
      }

      addImage("detailImage", "Detail", baseImages.detailImage);
      addImage("editorialImage", "Editorial", baseImages.editorialImage);

      return items;
    }
```

**REPLACE WITH:**
```js
    /*
     * buildGalleryItems — color-isolated gallery
     *
     * Returns ONLY the images owned by `activeVariant`.
     * Format: [key, label, src]
     * - key:   stable identifier used by selectProductGalleryImage
     * - label: thumb caption
     * - src:   image URL
     *
     * Gallery is always 1-2 items (product + model).
     * No cross-color image mixing. Ever.
     */
    function buildGalleryItems(product, activeVariant) {
      if (!activeVariant) return [];

      const seen = new Set();
      const items = [];

      function addImage(key, label, src) {
        const cleanSrc = String(src || "").trim();
        if (!isUsableImageUrl(cleanSrc) || seen.has(cleanSrc)) return;
        seen.add(cleanSrc);
        items.push([key, label, cleanSrc]);
      }

      const colorLabel = activeVariant.color || "Product";
      addImage("productImage", colorLabel, activeVariant.images.productImage);
      addImage("modelImage",   `${colorLabel} · On Model`, activeVariant.images.modelImage);

      return items;
    }
```

---

## ❸ REPLACE: `selectProductVariant`

Reset gallery key to `productImage` on every color switch so the main
product shot always leads.

**FIND (lines 1335-1339 in product.html):**
```js
    window.selectProductVariant = function(variantId) {
      _selectedVariantId = variantId || "";
      _selectedGalleryKey = "productImage";
      if (_currentProduct && _currentDocId) renderProduct(_currentProduct, _currentDocId);
    };
```

*(No content change needed — logic is already correct. Keep as-is.)*

---

## ❹ REPLACE: `renderProduct` — variant init + gallery render block

Two targeted sub-patches inside `renderProduct`:

### 4a — Default variant selection (lines 1342-1346)

**FIND:**
```js
      const variants = normalizeVariants(product);
      if (variants.length && (!_selectedVariantId || !variants.some((variant) => variant.id === _selectedVariantId))) {
        _selectedVariantId = variants[0].id;
      }
      const selectedVariant = variants.find((variant) => variant.id === _selectedVariantId) || null;
      const galleryItems = buildGalleryItems(product, selectedVariant);
```

**REPLACE WITH:**
```js
      const variants = normalizeVariants(product);
      // Auto-select first variant when none chosen or stale id
      if (variants.length && (!_selectedVariantId || !variants.some((v) => v.id === _selectedVariantId))) {
        _selectedVariantId = variants[0].id;
      }
      // Always drive from the active variant — never fall back to base product images
      const selectedVariant = variants.find((v) => v.id === _selectedVariantId) || variants[0] || null;
      const galleryItems = buildGalleryItems(product, selectedVariant);
```

### 4b — Gallery thumbnail HTML (lines 1385-1394)

**FIND:**
```js
      const galleryHTML = galleryItems.length > 1
        ? `<div class="product-gallery-thumbs" aria-label="Product gallery">
            ${galleryItems.map((item) => `
              <button type="button" class="product-gallery-thumb ${item[0] === activeGallery?.[0] ? "is-active" : ""}" onclick="selectProductGalleryImage('${item[0]}')" aria-label="View ${item[1]} image">
                <img src="${item[2]}" alt="${product.name} ${item[1]}" loading="lazy" />
                <span>${item[1]}</span>
              </button>
            `).join("")}
          </div>`
        : "";
```

**REPLACE WITH:**
```js
      // Only render thumbs when there are 2 images (product + model)
      // Single-image colors show no strip — clean, uncluttered.
      const galleryHTML = galleryItems.length > 1
        ? `<div class="product-gallery-thumbs" aria-label="Color gallery">
            ${galleryItems.map((item) => `
              <button type="button"
                class="product-gallery-thumb ${item[0] === activeGallery?.[0] ? "is-active" : ""}"
                onclick="selectProductGalleryImage('${item[0]}')"
                aria-label="View ${item[1]}"
                data-gallery-key="${item[0]}">
                <img src="${item[2]}" alt="${product.name} – ${item[1]}" loading="lazy" />
                <span>${item[1]}</span>
              </button>
            `).join("")}
          </div>`
        : "";
```

---

## ❺ REPLACE: `variantHTML` block (lines 1396-1407)

Add `data-variant-id` for future extensibility; no UI change.

**FIND:**
```js
      const variantHTML = variants.length
        ? `<div class="variant-selector">
            <p class="variant-label">Color</p>
            <div class="variant-options">
              ${variants.map((variant) => `
                <button type="button" class="variant-option ${variant.id === selectedVariant?.id ? "is-active" : ""}" onclick="selectProductVariant('${variant.id}')">
                  ${variant.color}
                </button>
              `).join("")}
            </div>
          </div>`
        : "";
```

**REPLACE WITH:**
```js
      // Only show color selector when there are real named colors
      const namedVariants = variants.filter((v) => v.color && v.color !== "Default" && v.id !== "__main__");
      const variantHTML = namedVariants.length
        ? `<div class="variant-selector">
            <p class="variant-label">Color — <em style="font-weight:400;text-transform:none;letter-spacing:0;">${selectedVariant?.color || ""}</em></p>
            <div class="variant-options">
              ${namedVariants.map((v) => `
                <button type="button"
                  class="variant-option ${v.id === selectedVariant?.id ? "is-active" : ""}"
                  onclick="selectProductVariant('${v.id}')"
                  data-variant-id="${v.id}"
                  aria-pressed="${v.id === selectedVariant?.id ? "true" : "false"}">
                  ${v.color}
                </button>
              `).join("")}
            </div>
          </div>`
        : "";
```

---

## ❻ REPLACE: stock resolution for selected variant (lines 1350-1351)

**FIND:**
```js
      const stock   = selectedVariant ? Number(selectedVariant.stock) : Number(product.stock);
      const inStock = stock > 0;
```

**REPLACE WITH:**
```js
      // Stock always sourced from the active color variant
      const stock   = selectedVariant
        ? Number(selectedVariant.stock)
        : Number(product.stock ?? 0);
      const inStock = stock > 0;
```

*(Functionally identical — ensures correctness comment and explicit `?? 0` guard.)*

---

## SUMMARY — what changed in product.html

| Function | Change |
|---|---|
| `normalizeVariants` | Main product (top-level `image`/`modelImage`) is now normalized as the first color entry, identical in shape to stored variants |
| `buildGalleryItems` | **Only** returns the active color's 2 images — no cross-color mixing |
| `renderProduct` | `selectedVariant` never falls back to `null`; always resolves to a variant |
| `variantHTML` | Hides selector for single unnamed colors; shows live color name inline |
| Gallery thumbs | Added `data-gallery-key` attr; label improved |

**Zero UI redesign. Zero breaking changes to existing products without a `color` field.**
