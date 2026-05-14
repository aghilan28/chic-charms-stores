# PATCH — admin.html
## Color Variant Architecture Fix
### Scope: Add Form · Edit Modal · `variantRowTemplate` · `collectVariants` · `openEditModal`

---

## ❶ REMOVE: Standalone "Product Image URL" + "Model Image URL" fields from the Add Form
## ADD: Main Color entry as the FIRST variant row (same shape as additional color rows)

The conceptual fix: the "main" product image pair is no longer a special top-level field.
It is simply the **first color row** — identical in data shape to every other color row.

### 1a — Add Form HTML change

**FIND (admin.html ~line 3265):**
```html
              <hr class="form-divider" />
              <div class="form-group full">
                <label for="pImage">Product Image URL <span class="req">*</span></label>
                <input
                  type="url"
                  id="pImage"
                  placeholder="https://res.cloudinary.com/..."
                  required
                />
              </div>
              <div class="form-group">
                <label for="pModelImage">Model Image URL <span class="req">*</span></label>
                <input type="url" id="pModelImage" placeholder="https://res.cloudinary.com/..." required />
              </div>
              <div class="img-preview-wrap" id="imgPreview">
                <img
                  id="imgPreviewEl"
                  src=""
                  alt="Preview"
                  onerror="if(this.dataset.fallback!=='1'){this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\' viewBox=\'0 0 80 80\'%3E%3Crect width=\'80\' height=\'80\' rx=\'10\' fill=\'%23fce8ef\'/%3E%3Crect x=\'18\' y=\'22\' width=\'44\' height=\'36\' rx=\'5\' fill=\'none\' stroke=\'%23e8a0b0\' stroke-width=\'2\'/%3E%3Ccircle cx=\'30\' cy=\'34\' r=\'4\' fill=\'%23e8a0b0\'/%3E%3Cpolyline points=\'18,50 30,38 40,46 52,34 62,50\' fill=\'none\' stroke=\'%23e8a0b0\' stroke-width=\'2\' stroke-linejoin=\'round\'/%3E%3C/svg%3E';this.dataset.fallback='1';this.alt='Image failed to load';}"
                />
                <span
                  >Product image preview</span
                >
              </div>
              <div class="img-preview-wrap" id="modelImgPreview">
                <img id="modelImgPreviewEl" src="" alt="Model image preview" />
                <span>Model image preview</span>
              </div>
```

**REPLACE WITH:**
```html
              <hr class="form-divider" />
              <!-- Color variant system: every color (including "main") is a variant row -->
              <div class="variant-builder" style="margin-bottom:0;">
                <div class="variant-builder-head" style="margin-bottom:8px;">
                  <p class="variant-builder-title">Color Variants</p>
                  <p style="font-size:0.72rem;color:var(--muted);margin-left:auto;margin-right:16px;">
                    First row = primary color shown on page load
                  </p>
                  <button type="button" class="variant-add-btn" id="addVariantBtn">+ Add Color</button>
                </div>
                <div id="variantRows"></div>
              </div>
```

> **Note:** The old `<div class="variant-builder">` block that previously appeared *below* the image
> fields (containing `id="addVariantBtn"` and `id="variantRows"`) **must be removed** since it is now
> merged into the block above. Search for and delete this stale block:
> ```html
>               <div class="variant-builder">
>                 <div class="variant-builder-head">
>                   <p class="variant-builder-title">Color Variants</p>
>                   <button type="button" class="variant-add-btn" id="addVariantBtn">Add Variant</button>
>                 </div>
>                 <div id="variantRows"></div>
>               </div>
> ```

---

### 1b — Edit Modal HTML change (same principle)

**FIND (admin.html ~line 3453):**
```html
            <hr class="form-divider" />
            <div class="form-group full">
              <label for="eImage">Product Image URL <span class="req">*</span></label>
              <input type="url" id="eImage" required />
            </div>
            <div class="form-group">
              <label for="eModelImage">Model Image URL <span class="req">*</span></label>
              <input type="url" id="eModelImage" required />
            </div>
            <div class="img-preview-wrap visible" id="eImgPreviewWrap">
              <img
                id="eImgPreviewEl"
                src=""
                alt="Preview"
                onerror="if(this.dataset.fallback!=='1'){this.src='data:image/svg+xml,...';this.dataset.fallback='1';}"
              />
              <span>Current product image</span>
            </div>
            <div class="img-preview-wrap visible" id="eModelImgPreviewWrap">
              <img id="eModelImgPreviewEl" src="" alt="Current model image preview" />
              <span>Current model image</span>
            </div>
```

**REPLACE WITH:**
```html
            <hr class="form-divider" />
            <!-- Color variants drive all images — first row is the primary color -->
            <div class="variant-builder" style="margin-bottom:0;">
              <div class="variant-builder-head" style="margin-bottom:8px;">
                <p class="variant-builder-title">Color Variants</p>
                <p style="font-size:0.72rem;color:var(--muted);margin-left:auto;margin-right:16px;">
                  First row = primary color shown on page load
                </p>
                <button type="button" class="variant-add-btn" id="editAddVariantBtn">+ Add Color</button>
              </div>
              <div id="editVariantRows"></div>
            </div>
```

> **Note:** Remove the stale `<div class="variant-builder">` block below that previously held
> `id="editAddVariantBtn"` and `id="editVariantRows"`.

---

## ❷ REPLACE: `variantRowTemplate`

Add a visual "Primary" badge on the first row. Make color field required.
Improve labels to reinforce the unified mental model.

**FIND (admin.html ~line 5927):**
```js
      function variantRowTemplate(variant = {}) {
        const images = variant.images || {};
        return `
          <div class="variant-row">
            <div class="form-group">
              <label>Color <span class="opt">(optional)</span></label>
              <input type="text" data-variant-field="color" value="${esc(variant.color || "")}" placeholder="Gold, Silver, Rose Gold" />
            </div>
            <div class="form-group">
              <label>Variant Stock <span class="opt">(optional)</span></label>
              <input type="number" min="0" data-variant-field="stock" value="${esc(variant.stock ?? "")}" placeholder="e.g. 5" />
            </div>
            <div class="form-group">
              <label>Variant Product Image URL <span class="req">*</span></label>
              <input type="url" data-variant-field="productImage" value="${esc(images.productImage || "")}" placeholder="https://res.cloudinary.com/..." />
            </div>
            <div class="form-group">
              <label>Variant Model Image URL <span class="req">*</span></label>
              <input type="url" data-variant-field="modelImage" value="${esc(images.modelImage || "")}" placeholder="https://res.cloudinary.com/..." />
            </div>
            <div class="variant-preview-grid">
              <div class="img-preview-wrap">
                <img data-variant-preview="productImage" src="" alt="Variant product image preview" />
                <span>Variant product image preview</span>
              </div>
              <div class="img-preview-wrap">
                <img data-variant-preview="modelImage" src="" alt="Variant model image preview" />
                <span>Variant model image preview</span>
              </div>
            </div>
            <button type="button" class="variant-remove-btn">Remove Variant</button>
          </div>
        `;
      }
```

**REPLACE WITH:**
```js
      /*
       * variantRowTemplate — unified color row
       *
       * isPrimary: marks the first row as the "main" color (shown on page load).
       * Every row is structurally identical — color name + stock + 2 images.
       */
      function variantRowTemplate(variant = {}, isPrimary = false) {
        const images = variant.images || {};
        const primaryBadge = isPrimary
          ? `<span style="font-size:0.6rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;
               background:var(--rose-dark,#e8809a);color:#fff;padding:2px 8px;border-radius:2px;
               margin-left:8px;">Primary</span>`
          : "";
        const removeBtn = isPrimary
          ? "" // cannot remove the primary row
          : `<button type="button" class="variant-remove-btn">Remove Color</button>`;
        return `
          <div class="variant-row" data-is-primary="${isPrimary ? "1" : "0"}">
            <div class="form-group">
              <label>
                Color Name <span class="req">*</span>${primaryBadge}
              </label>
              <input
                type="text"
                data-variant-field="color"
                value="${esc(variant.color || "")}"
                placeholder="${isPrimary ? "e.g. Rose Gold (primary display color)" : "e.g. Silver, Gold, Black"}"
                ${isPrimary ? 'required' : ''}
              />
            </div>
            <div class="form-group">
              <label>Stock for this color <span class="req">*</span></label>
              <input
                type="number"
                min="0"
                data-variant-field="stock"
                value="${esc(variant.stock ?? "")}"
                placeholder="e.g. 10"
                required
              />
            </div>
            <div class="form-group">
              <label>Product Image URL <span class="req">*</span></label>
              <input
                type="url"
                data-variant-field="productImage"
                value="${esc(images.productImage || "")}"
                placeholder="https://res.cloudinary.com/..."
                required
              />
            </div>
            <div class="form-group">
              <label>On-Model Image URL <span class="req">*</span></label>
              <input
                type="url"
                data-variant-field="modelImage"
                value="${esc(images.modelImage || "")}"
                placeholder="https://res.cloudinary.com/..."
                required
              />
            </div>
            <div class="variant-preview-grid">
              <div class="img-preview-wrap">
                <img data-variant-preview="productImage" src="" alt="Product image preview" />
                <span>Product</span>
              </div>
              <div class="img-preview-wrap">
                <img data-variant-preview="modelImage" src="" alt="Model image preview" />
                <span>On Model</span>
              </div>
            </div>
            ${removeBtn}
          </div>
        `;
      }
```

---

## ❸ REPLACE: `addVariantRow`

Pass `isPrimary` flag for the first row detection.

**FIND (admin.html ~line 6009):**
```js
      function addVariantRow(container, variant = {}) {
        if (!container) return;
        const wrap = document.createElement("div");
        wrap.innerHTML = variantRowTemplate(variant).trim();
        const row = wrap.firstElementChild;
        row.querySelector(".variant-remove-btn").addEventListener("click", () => row.remove());
        wireVariantPreviews(row);
        container.appendChild(row);
      }
```

**REPLACE WITH:**
```js
      function addVariantRow(container, variant = {}, isPrimary = false) {
        if (!container) return;
        const wrap = document.createElement("div");
        wrap.innerHTML = variantRowTemplate(variant, isPrimary).trim();
        const row = wrap.firstElementChild;
        // Primary row has no remove button — guard against null
        row.querySelector(".variant-remove-btn")?.addEventListener("click", () => row.remove());
        wireVariantPreviews(row);
        container.appendChild(row);
      }
```

---

## ❹ REPLACE: `validateVariantRows`

Primary row (first) must have color + stock + both images.

**FIND (admin.html ~line 5994):**
```js
      function validateVariantRows(container) {
        if (!container) return "";
        const rows = Array.from(container.querySelectorAll(".variant-row"));
        for (const row of rows) {
          const get = (field) => row.querySelector(`[data-variant-field="${field}"]`)?.value?.trim() || "";
          const values = ["color", "stock", "productImage", "modelImage"].map(get);
          if (!values.some(Boolean)) continue;
          const productImage = get("productImage");
          const modelImage = get("modelImage");
          if (!productImage || !modelImage) return "Each variant needs both Variant Product Image URL and Variant Model Image URL.";
          if (!isHttpUrl(productImage) || !isHttpUrl(modelImage)) return "Variant image URLs must start with http:// or https://.";
        }
        return "";
      }
```

**REPLACE WITH:**
```js
      function validateVariantRows(container) {
        if (!container) return "";
        const rows = Array.from(container.querySelectorAll(".variant-row"));
        if (!rows.length) return "At least one color variant is required.";

        for (const [index, row] of rows.entries()) {
          const get = (field) => row.querySelector(`[data-variant-field="${field}"]`)?.value?.trim() || "";
          const isPrimary = row.dataset.isPrimary === "1" || index === 0;
          const color = get("color");
          const productImage = get("productImage");
          const modelImage = get("modelImage");

          // Skip entirely empty non-primary rows
          if (!isPrimary && !color && !productImage && !modelImage) continue;

          if (!color) return `${isPrimary ? "Primary color" : `Color row ${index + 1}`} requires a color name.`;
          if (!productImage || !modelImage) {
            return `${isPrimary ? "Primary color" : `"${color}"`} needs both a Product Image URL and a Model Image URL.`;
          }
          if (!isHttpUrl(productImage) || !isHttpUrl(modelImage)) {
            return `Image URLs in ${isPrimary ? "the primary color row" : `"${color}"`} must start with http:// or https://.`;
          }
        }
        return "";
      }
```

---

## ❺ REPLACE: `collectVariants`

Now collects all rows including the primary one.
Returns a flat array — first entry is the primary color.

**FIND (admin.html ~line 6019):**
```js
      function collectVariants(container) {
        if (!container) return [];
        return Array.from(container.querySelectorAll(".variant-row"))
          .map((row) => {
            const get = (field) => row.querySelector(`[data-variant-field="${field}"]`)?.value?.trim() || "";
            const color = get("color");
            const stockRaw = get("stock");
            const productImage = get("productImage");
            const modelImage = get("modelImage");
            if (!color && !stockRaw && !productImage && !modelImage) return null;
            return {
              color,
              stock: Number(stockRaw || 0),
              images: {
                productImage,
                modelImage: modelImage || productImage,
              },
            };
          })
          .filter(Boolean);
      }
```

**REPLACE WITH:**
```js
      /*
       * collectVariants — gathers all color rows including primary.
       * Returns array where index 0 is the primary (page-load) color.
       * Each entry: { color, stock, images: { productImage, modelImage } }
       */
      function collectVariants(container) {
        if (!container) return [];
        return Array.from(container.querySelectorAll(".variant-row"))
          .map((row, index) => {
            const get = (field) => row.querySelector(`[data-variant-field="${field}"]`)?.value?.trim() || "";
            const isPrimary = row.dataset.isPrimary === "1" || index === 0;
            const color = get("color");
            const stockRaw = get("stock");
            const productImage = get("productImage");
            const modelImage = get("modelImage");
            // Skip rows that are completely empty (non-primary only)
            if (!isPrimary && !color && !stockRaw && !productImage && !modelImage) return null;
            return {
              color,
              stock: Number(stockRaw || 0),
              images: {
                productImage,
                modelImage: modelImage || productImage,
              },
            };
          })
          .filter(Boolean);
      }
```

---

## ❻ REPLACE: Add Form — `addVariantBtn` click listener
## + initial primary row seeded on page load

**FIND (admin.html ~line 6041):**
```js
      addVariantBtn?.addEventListener("click", () => addVariantRow(variantRowsEl));
      editAddVariantBtn?.addEventListener("click", () => addVariantRow(editVariantRowsEl));
```

**REPLACE WITH:**
```js
      // Seed the primary color row immediately (Add Form)
      if (variantRowsEl && variantRowsEl.children.length === 0) {
        addVariantRow(variantRowsEl, {}, true); // isPrimary = true
      }

      addVariantBtn?.addEventListener("click", () => addVariantRow(variantRowsEl, {}, false));
      editAddVariantBtn?.addEventListener("click", () => addVariantRow(editVariantRowsEl, {}, false));
```

---

## ❼ REPLACE: `openEditModal` — populate variant rows correctly

When editing, the first stored variant (index 0) is always the primary color.
Existing products that have `image` + `modelImage` but no variants must be
migrated on-the-fly so the form pre-fills correctly.

**FIND (admin.html ~line 6186, inside `openEditModal`):**
```js
        const imageBundle = productImagesBundle(product);
        $id("eImage").value = imageBundle.productImage;
        $id("eModelImage").value = imageBundle.modelImage;
        $id("eDesc").value = product.description || "";
        if (editVariantRowsEl) {
          editVariantRowsEl.innerHTML = "";
          (Array.isArray(product.variants) ? product.variants : []).forEach((variant) => addVariantRow(editVariantRowsEl, variant));
        }

        setPreviewImage(eImgPreviewEl, imageBundle.productImage);
        setPreviewImage(eModelImgPreviewEl, imageBundle.modelImage);
```

**REPLACE WITH:**
```js
        $id("eDesc").value = product.description || "";

        if (editVariantRowsEl) {
          editVariantRowsEl.innerHTML = "";

          // Build the edit-form variant list using the same normalizer as product.html
          // so the form always reflects the true visual model.
          const editVariants = buildEditVariantList(product);
          editVariants.forEach((v, i) => addVariantRow(editVariantRowsEl, v, i === 0));
        }
```

---

## ❽ ADD: `buildEditVariantList` helper (place near `openEditModal`)

Add this function **before** `openEditModal`:

```js
      /*
       * buildEditVariantList — mirrors normalizeVariants from product.html
       * for the admin edit form context.
       *
       * Ensures: main-product images are always represented as the first color
       * entry, regardless of whether the document has a `variants` array.
       */
      function buildEditVariantList(product) {
        const rawVariants = Array.isArray(product?.variants) ? product.variants : [];

        // Resolve main product images (top-level fields)
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

        // Normalize stored variants
        const normalized = rawVariants
          .filter((v) => v && (v.color || v.images?.productImage || v.productImage))
          .map((v) => ({
            color: String(v.color || "").trim(),
            stock: Number.isFinite(Number(v.stock)) ? Number(v.stock) : Number(product.stock || 0),
            images: {
              productImage: v.images?.productImage || v.productImage || v.image || v.imageUrl || "",
              modelImage:   v.images?.modelImage   || v.modelImage  || "",
            },
          }));

        // If main product has images not already covered, prepend as primary
        const mainColor = String(product?.color || "").trim();
        if (mainProductImage) {
          const alreadyCovered = mainColor &&
            normalized.some((v) => v.color.toLowerCase() === mainColor.toLowerCase());
          if (!alreadyCovered) {
            normalized.unshift({
              color: mainColor || (normalized.length ? "Default" : ""),
              stock: Number(product.stock || 0),
              images: { productImage: mainProductImage, modelImage: mainModelImage },
            });
          }
        }

        // Always guarantee at least one row (primary) so the form is never empty
        if (!normalized.length) {
          normalized.push({ color: "", stock: Number(product.stock || 0), images: { productImage: "", modelImage: "" } });
        }

        return normalized;
      }
```

---

## ❾ REPLACE: Add Form `submit` handler — image payload

The form no longer has standalone `pImage` / `pModelImage` fields.
The first variant row IS the main product image.

**FIND (admin.html ~line 6054 — inside the `form.addEventListener("submit", ...)` block):**
```js
        const name = $id("pName").value.trim();
        const price = $id("pPrice").value.trim();
        const stock = $id("pStock").value.trim();
        const category = $id("pCategory").value.trim();
        const piecePayload = buildPiecePayload(pPieceTypeEl, pPieceCountEl);
        const image = imgInput.value.trim();
        const modelImage = $id("pModelImage").value.trim();
        const tag = $id("pTag").value.trim();
        const desc = $id("pDesc").value.trim();
        const variantError = validateVariantRows(variantRowsEl);
        const variants = collectVariants(variantRowsEl);

        if (!name || price === "" || stock === "" || !category || !image || !modelImage) {
          showStatus(
            statusMsg,
            statusIcon,
            statusText,
            "error",
            "⚠️",
            "Please fill in all required fields (Name, Price, Stock, Category, Product Image URL, Model Image URL).",
          );
          return;
        }
        if (!isHttpUrl(image) || !isHttpUrl(modelImage)) {
          showStatus(statusMsg, statusIcon, statusText, "error", "!", "Image URLs must start with http:// or https://.");
          return;
        }
        if (variantError) {
```

**REPLACE WITH:**
```js
        const name = $id("pName").value.trim();
        const price = $id("pPrice").value.trim();
        const stock = $id("pStock").value.trim();
        const category = $id("pCategory").value.trim();
        const piecePayload = buildPiecePayload(pPieceTypeEl, pPieceCountEl);
        const tag = $id("pTag").value.trim();
        const desc = $id("pDesc").value.trim();
        const variantError = validateVariantRows(variantRowsEl);
        const variants = collectVariants(variantRowsEl);

        // Primary color (first variant row) provides the main image pair
        const primaryVariant = variants[0] || {};
        const image      = primaryVariant.images?.productImage || "";
        const modelImage = primaryVariant.images?.modelImage   || "";

        if (!name || price === "" || stock === "" || !category) {
          showStatus(statusMsg, statusIcon, statusText, "error", "⚠️",
            "Please fill in all required fields (Name, Price, Stock, Category).");
          return;
        }
        if (variantError) {
```

---

## ❿ REPLACE: Add Form — product Firestore payload

**FIND (admin.html ~line 6112):**
```js
        const product = {
          name,
          price: Number(price),
          stock: Number(stock),
          category,
          pieceType: piecePayload.pieceType,
          pieceCount: piecePayload.pieceCount,
          image,
          images: buildImagesPayload(image, modelImage),
          createdAt: new Date().toISOString(),
        };
        if (variants.length) product.variants = variants;
```

**REPLACE WITH:**
```js
        const product = {
          name,
          price:     Number(price),
          stock:     Number(stock),
          category,
          pieceType: piecePayload.pieceType,
          pieceCount:piecePayload.pieceCount,
          // top-level image fields kept for backwards-compat with existing code paths
          image,
          images: buildImagesPayload(image, modelImage),
          // variants is now the primary source of truth for all colors + images
          variants,
          createdAt: new Date().toISOString(),
        };
        // No conditional — variants is always set (minimum: primary row)
```

---

## ⓫ REPLACE: Edit Modal `editModalSave` — payload

**FIND (admin.html ~line 6285):**
```js
        const updates = {
          name,
          price: Number(price),
          stock: Number(stock),
          category,
          pieceType: piecePayload.pieceType,
          pieceCount: piecePayload.pieceCount,
          image,
          images: buildImagesPayload(image, modelImage),
          variants,
          updatedAt: new Date().toISOString(),
        };
```

Change the local variable reads at the top of the save handler to mirror the Add Form fix
(no standalone `eImage` / `eModelImage` DOM reads since those elements are now removed):

**FIND (admin.html ~line 6242):**
```js
        const name = $id("eName").value.trim();
        const price = $id("ePrice").value.trim();
        const stock = $id("eStock").value.trim();
        const category = $id("eCategory").value.trim();
        const piecePayload = buildPiecePayload(ePieceTypeEl, ePieceCountEl);
        const image = $id("eImage").value.trim();
        const modelImage = $id("eModelImage").value.trim();
        const tag = $id("eTag").value.trim();
        const desc = $id("eDesc").value.trim();
        const variantError = validateVariantRows(editVariantRowsEl);
        const variants = collectVariants(editVariantRowsEl);

        if (!name || price === "" || stock === "" || !category || !image || !modelImage) {
          showStatus(
            editStatusMsg,
            editStatusIcon,
            editStatusText,
            "error",
            "⚠️",
            "Please fill in all required fields.",
          );
          return;
        }
        if (!isHttpUrl(image) || !isHttpUrl(modelImage)) {
          showStatus(editStatusMsg, editStatusIcon, editStatusText, "error", "!", "Image URLs must start with http:// or https://.");
          return;
        }
        if (variantError) {
```

**REPLACE WITH:**
```js
        const name = $id("eName").value.trim();
        const price = $id("ePrice").value.trim();
        const stock = $id("eStock").value.trim();
        const category = $id("eCategory").value.trim();
        const piecePayload = buildPiecePayload(ePieceTypeEl, ePieceCountEl);
        const tag = $id("eTag").value.trim();
        const desc = $id("eDesc").value.trim();
        const variantError = validateVariantRows(editVariantRowsEl);
        const variants = collectVariants(editVariantRowsEl);

        // Primary color drives the top-level image fields (back-compat)
        const primaryVariant = variants[0] || {};
        const image      = primaryVariant.images?.productImage || "";
        const modelImage = primaryVariant.images?.modelImage   || "";

        if (!name || price === "" || stock === "" || !category) {
          showStatus(editStatusMsg, editStatusIcon, editStatusText, "error", "⚠️",
            "Please fill in all required fields.");
          return;
        }
        if (variantError) {
```

And update the `updates` payload:

**FIND (admin.html ~line 6285):**
```js
        const updates = {
          name,
          price: Number(price),
          stock: Number(stock),
          category,
          pieceType: piecePayload.pieceType,
          pieceCount: piecePayload.pieceCount,
          image,
          images: buildImagesPayload(image, modelImage),
          variants,
          updatedAt: new Date().toISOString(),
        };
```

**REPLACE WITH:**
```js
        const updates = {
          name,
          price:     Number(price),
          stock:     Number(stock),
          category,
          pieceType: piecePayload.pieceType,
          pieceCount:piecePayload.pieceCount,
          image,
          images:    buildImagesPayload(image, modelImage),
          variants,  // full unified color array
          updatedAt: new Date().toISOString(),
        };
```

---

## ⓬ REMOVE: stale DOM refs + wireImagePreview calls for removed fields

**FIND (admin.html ~line 3888):**
```js
      const imgInput = $id("pImage");
      const modelImgInput = $id("pModelImage");
      const imgEl = $id("imgPreviewEl");
      const modelImgEl = $id("modelImgPreviewEl");
```

**REPLACE WITH:**
```js
      // pImage / pModelImage removed — images live inside variant rows
      const imgInput = null;
      const modelImgInput = null;
      const imgEl = null;
      const modelImgEl = null;
```

**FIND (admin.html ~line 6048):**
```js
      wireImagePreview(imgInput, imgEl);
      wireImagePreview(modelImgInput, modelImgEl);
```

**DELETE** these two lines (inputs no longer exist).

**FIND (admin.html ~line 3902):**
```js
      const eImgPreviewEl = $id("eImgPreviewEl");
      const eModelImgPreviewEl = $id("eModelImgPreviewEl");
```

**REPLACE WITH:**
```js
      // eImage / eModelImage removed — images live inside variant rows
      const eImgPreviewEl = null;
      const eModelImgPreviewEl = null;
```

---

## SUMMARY — what changed in admin.html

| Area | Change |
|---|---|
| Add Form HTML | Removed standalone `pImage`/`pModelImage` fields; variant block is now the single image entry point |
| Edit Modal HTML | Same — `eImage`/`eModelImage` removed; edit variant rows cover all colors |
| `variantRowTemplate` | Accepts `isPrimary` flag; primary row has "Primary" badge, no remove button, required fields |
| `addVariantRow` | Passes `isPrimary` through |
| `validateVariantRows` | Requires ≥1 row; primary row always validated; proper per-row error messages |
| `collectVariants` | Collects all rows including primary; no `null` skip for index 0 |
| `buildEditVariantList` | New helper; mirrors product.html normalizer; ensures legacy products prefill correctly |
| `openEditModal` | Uses `buildEditVariantList` instead of `productImagesBundle` for image population |
| Add/Edit submit handlers | Derive `image`/`modelImage` from `variants[0]` for back-compat |
| Stale DOM refs | Nulled out to prevent runtime errors |

**All existing Firestore documents continue to render correctly.
`normalizeVariants` in product.html handles both old (top-level image) and new (variants array) shapes.**
