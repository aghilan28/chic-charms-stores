/* ============================================================
   Chic Charms — Approved Mobile Cart Implementation
   Renders the approved supplied cart page on mobile only and wires it
   into the existing localStorage cart + checkout validation backend.
   ============================================================ */
(function () {
  "use strict";

  var CART_KEY = "cart";
  var FIREBASE_PROJECT = "chic-charms-store";
  var FIREBASE_KEY = "AIzaSyA5Bh77_4HE3yQF0hi5ddvbFLZC7rEerxg";
  var toastTimer = null;
  var hydrated = false;
  var backendProductsCache = null;
  var recommendationsLoading = false;

  function byId(id) { return document.getElementById(id); }
  function isMobile() { return window.matchMedia && window.matchMedia("(max-width: 767px)").matches; }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatINR(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
  }

  function fallbackImage(label) {
    var text = encodeURIComponent((String(label || "CC").trim().charAt(0) || "C").toUpperCase());
    return "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22320%22 height=%22380%22 viewBox=%220 0 320 380%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 x2=%221%22 y1=%220%22 y2=%221%22%3E%3Cstop stop-color=%22%23fff8f7%22/%3E%3Cstop offset=%221%22 stop-color=%22%23f0e6e5%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22320%22 height=%22380%22 rx=%2222%22 fill=%22url(%23g)%22/%3E%3Ccircle cx=%22160%22 cy=%22174%22 r=%2262%22 fill=%22%23ffd9e0%22/%3E%3Ctext x=%22160%22 y=%22195%22 text-anchor=%22middle%22 font-family=%22Georgia,serif%22 font-size=%2258%22 fill=%22%238e4559%22%3E" + text + "%3C/text%3E%3Ctext x=%22160%22 y=%22268%22 text-anchor=%22middle%22 font-family=%22Arial,sans-serif%22 font-size=%2220%22 fill=%22%23534346%22 letter-spacing=%224%22%3ECHIC CHARMS%3C/text%3E%3C/svg%3E";
  }

  function isImage(src) {
    if (!src) return false;
    src = String(src).trim();
    return /^https?:\/\//i.test(src) || /^data:image\//i.test(src) || /^\.?\/?images\//i.test(src);
  }

  function getImage(item) {
    var src = item && (item.image || item.productImage || item.imageUrl || item.imageURL || item.photo || item.thumbnail);
    return isImage(src) ? String(src).trim() : fallbackImage(item && item.name);
  }

  function loadCart() {
    try {
      var raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(raw)) return [];
      return raw.filter(function (item) { return item && item.name; }).map(function (item) {
        return {
          name: String(item.name || "Chic Charms Piece"),
          price: Number(item.price) || 0,
          quantity: Math.max(1, Number(item.quantity) || 1),
          productId: item.productId || item.id || null,
          stock: item.stock != null ? Number(item.stock) : null,
          image: item.image || item.productImage || item.imageUrl || item.imageURL || item.photo || item.thumbnail || "",
          variant: item.variant || item.finish || item.color || item.category || "Gold Finish"
        };
      });
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart || []));
  }

  function totalUnits(cart) {
    return cart.reduce(function (sum, item) { return sum + (Number(item.quantity) || 1); }, 0);
  }

  function subtotal(cart) {
    return cart.reduce(function (sum, item) {
      return sum + (Number(item.price) || 0) * (Number(item.quantity) || 1);
    }, 0);
  }

  function totals(cart) {
    var sub = subtotal(cart);
    // Delivery and coupons are intentionally NOT priced in cart.
    // They are decided later in checkout/payment.
    return { subtotal: sub, total: sub };
  }

  function showToast(message) {
    var el = byId("ccapToast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("is-visible"); }, 2400);
  }

  function fieldValue(field) {
    if (!field) return "";
    if (field.stringValue != null) return field.stringValue;
    if (field.integerValue != null) return Number(field.integerValue);
    if (field.doubleValue != null) return Number(field.doubleValue);
    if (field.booleanValue != null) return Boolean(field.booleanValue);
    return "";
  }

  function productFromFirestore(doc) {
    var f = doc && doc.fields ? doc.fields : {};
    return {
      stock: fieldValue(f.stock || f.Stock),
      image: fieldValue(f.image || f.productImage || f.imageUrl || f.imageURL || f.photo || f.thumbnail),
      variant: fieldValue(f.variant || f.finish || f.color || f.category)
    };
  }

  function fetchProduct(productId) {
    if (!productId) return Promise.resolve(null);
    var url = "https://firestore.googleapis.com/v1/projects/" + FIREBASE_PROJECT +
      "/databases/(default)/documents/products/" + encodeURIComponent(productId) +
      "?key=" + FIREBASE_KEY;
    return fetch(url)
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(productFromFirestore)
      .catch(function () { return null; });
  }



  function firestoreDocId(doc) {
    var name = doc && doc.name ? String(doc.name) : "";
    return name.split("/").pop();
  }

  function imageFromFields(f) {
    var direct = fieldValue(f.image || f.productImage || f.imageUrl || f.imageURL || f.photo || f.thumbnail);
    if (isImage(direct)) return direct;
    var images = f.images && f.images.mapValue && f.images.mapValue.fields ? f.images.mapValue.fields : null;
    if (images) {
      var nested = fieldValue(images.productImage || images.main || images.primary || images.image || images.imageUrl || images.imageURL);
      if (isImage(nested)) return nested;
    }
    return "";
  }

  function normalizeBackendProduct(doc) {
    var f = doc && doc.fields ? doc.fields : {};
    var id = firestoreDocId(doc);
    var name = fieldValue(f.name || f.productName || f.title);
    var price = Number(fieldValue(f.price || f.salePrice || f.mrp)) || 0;
    var stockRaw = fieldValue(f.stock || f.Stock);
    var stock = stockRaw === "" || stockRaw == null ? null : Number(stockRaw);
    return {
      id: id,
      name: name || "Chic Charms Piece",
      price: price,
      stock: isNaN(stock) ? null : stock,
      image: imageFromFields(f),
      category: fieldValue(f.category || f.categorySlug || f.tag) || ""
    };
  }

  function fetchBackendProducts() {
    if (backendProductsCache) return Promise.resolve(backendProductsCache);
    if (recommendationsLoading) return Promise.resolve([]);
    recommendationsLoading = true;
    var url = "https://firestore.googleapis.com/v1/projects/" + FIREBASE_PROJECT +
      "/databases/(default)/documents/products?pageSize=24&key=" + FIREBASE_KEY;
    return fetch(url)
      .then(function (response) { return response.ok ? response.json() : { documents: [] }; })
      .then(function (data) {
        backendProductsCache = (data.documents || [])
          .map(normalizeBackendProduct)
          .filter(function (product) { return product.id && product.name && (product.stock === null || product.stock > 0); });
        recommendationsLoading = false;
        return backendProductsCache;
      })
      .catch(function () {
        recommendationsLoading = false;
        backendProductsCache = [];
        return [];
      });
  }

  function renderRecommendationsFromProducts(products) {
    var wrap = byId("ccapRecommendations");
    var section = wrap ? wrap.closest(".ccap-look") : null;
    if (!wrap || !section) return;

    var cart = loadCart();
    var cartIds = cart.map(function (item) { return String(item.productId || item.id || ""); });
    var cartNames = cart.map(function (item) { return String(item.name || "").toLowerCase(); });

    var list = (products || []).filter(function (product) {
      return cartIds.indexOf(String(product.id)) === -1 && cartNames.indexOf(String(product.name || "").toLowerCase()) === -1;
    }).slice(0, 8);

    if (!list.length) {
      section.style.display = "none";
      return;
    }

    section.style.display = "block";
    wrap.innerHTML = list.map(function (product) {
      var url = "product.html?id=" + encodeURIComponent(product.id) + (product.category ? "&category=" + encodeURIComponent(product.category) : "");
      var img = product.image && isImage(product.image) ? product.image : fallbackImage(product.name);
      return [
        '<a class="ccap-look-card" href="' + escapeHTML(url) + '">',
          '<div class="ccap-look-image">',
            '<img src="' + escapeHTML(img) + '" alt="' + escapeHTML(product.name) + '" loading="lazy" decoding="async" onerror="this.src=\'' + fallbackImage(product.name) + '\'">',
            '<span class="ccap-fav">♡</span>',
          '</div>',
          '<h3>' + escapeHTML(product.name) + '</h3>',
          '<p>' + formatINR(product.price) + '</p>',
        '</a>'
      ].join("");
    }).join("");
  }

  function loadAndRenderRecommendations() {
    var wrap = byId("ccapRecommendations");
    if (!wrap || !isMobile()) return;
    if (backendProductsCache) {
      renderRecommendationsFromProducts(backendProductsCache);
      return;
    }
    if (recommendationsLoading) return;
    wrap.innerHTML = '<div class="ccap-reco-loading">Loading pieces from your store…</div>';
    fetchBackendProducts().then(renderRecommendationsFromProducts);
  }

  function hydrateFromBackendOnce() {
    if (hydrated) return;
    hydrated = true;
    var cart = loadCart();
    if (!cart.length) return;

    Promise.all(cart.map(function (item, index) {
      if (!item.productId) return Promise.resolve(false);
      return fetchProduct(item.productId).then(function (product) {
        if (!product) return false;
        var changed = false;
        if (product.stock !== "" && product.stock != null && !isNaN(Number(product.stock))) {
          cart[index].stock = Number(product.stock);
          changed = true;
        }
        if (!cart[index].image && product.image && isImage(product.image)) {
          cart[index].image = product.image;
          changed = true;
        }
        if ((!cart[index].variant || cart[index].variant === "Gold Finish") && product.variant) {
          cart[index].variant = product.variant;
          changed = true;
        }
        return changed;
      });
    })).then(function (changes) {
      if (changes.some(Boolean)) {
        saveCart(cart);
        renderApprovedCart();
      }
    });
  }

  function renderApprovedCart() {
    var root = byId("ccApprovedCartMobile");
    if (!root) return;
    if (!isMobile()) return;

    var cart = loadCart();
    var empty = cart.length === 0;
    var t = totals(cart);

    var bagCount = byId("ccapBagCount");
    if (bagCount) bagCount.textContent = String(totalUnits(cart));

    var titleCount = byId("ccapTitleCount");
    if (titleCount) titleCount.textContent = empty ? "Your cart is ready for a new favourite." : totalUnits(cart) + " item" + (totalUnits(cart) === 1 ? "" : "s") + " selected for you.";

    var emptyEl = byId("ccapEmpty");
    if (emptyEl) emptyEl.classList.toggle("is-visible", empty);

    Array.prototype.slice.call(document.querySelectorAll(".ccap-hide-when-empty, .ccap-sticky")).forEach(function (el) {
      el.classList.toggle("is-empty", empty);
    });

    var items = byId("ccapItems");
    if (items) {
      items.innerHTML = cart.map(function (item, index) {
        var qty = Number(item.quantity) || 1;
        var atStockMax = item.stock != null && !isNaN(Number(item.stock)) && qty >= Number(item.stock);
        var stock = atStockMax ? '<span class="ccap-stock-note">Out of stock</span>' : '';
        return [
          '<article class="ccap-item" style="animation-delay:' + (index * 45) + 'ms">',
            '<div class="ccap-item-image">',
              '<img src="' + escapeHTML(getImage(item)) + '" alt="' + escapeHTML(item.name) + '" loading="lazy" decoding="async" onerror="this.src=\'' + fallbackImage(item.name) + '\'">',
            '</div>',
            '<div class="ccap-item-body">',
              '<div>',
                '<h2 class="ccap-item-name">' + escapeHTML(item.name) + '</h2>',
                '<p class="ccap-item-variant">' + escapeHTML(item.variant || "Gold Finish") + '</p>',
                '<p class="ccap-item-price">' + formatINR(item.price) + '</p>',
                stock,
              '</div>',
              '<div class="ccap-item-actions">',
                '<div class="ccap-qty" role="group" aria-label="Quantity for ' + escapeHTML(item.name) + '">',
                  '<button type="button" data-ccap-qty="' + index + '" data-delta="-1" aria-label="Decrease quantity">−</button>',
                  '<span aria-live="polite">' + qty + '</span>',
                  '<button type="button" data-ccap-qty="' + index + '" data-delta="1" aria-label="Increase quantity"' + (atStockMax ? ' disabled' : '') + '>+</button>',
                '</div>',
                '<button type="button" class="ccap-remove" data-ccap-remove="' + index + '">Remove</button>',
              '</div>',
            '</div>',
          '</article>'
        ].join("");
      }).join("");
    }

    var subtotalEl = byId("ccapSubtotal");
    var deliveryEl = byId("ccapDeliveryNote");
    var totalEl = byId("ccapFinalTotal");
    var stickyEl = byId("ccapStickyTotal");

    if (subtotalEl) subtotalEl.textContent = formatINR(t.subtotal);
    if (deliveryEl) deliveryEl.textContent = "Calculated at checkout";
    if (totalEl) totalEl.textContent = formatINR(t.total);
    if (stickyEl) stickyEl.textContent = formatINR(t.total);


    loadAndRenderRecommendations();
  }

  function renderBoth() {
    if (window.__ccapSyncing) return;
    window.__ccapSyncing = true;
    try {
      if (typeof window.__ccapOriginalRenderCart === "function") window.__ccapOriginalRenderCart();
    } catch (e) {}
    window.__ccapSyncing = false;
    renderApprovedCart();
  }

  function updateQty(index, delta) {
    var cart = loadCart();
    var item = cart[index];
    if (!item) return;
    var next = (Number(item.quantity) || 1) + delta;

    if (next <= 0) {
      cart.splice(index, 1);
      saveCart(cart);
      renderBoth();
      return;
    }

    if (delta > 0 && item.stock != null && !isNaN(Number(item.stock)) && next > Number(item.stock)) {
      showToast("This item is out of stock");
      return;
    }

    item.quantity = next;
    saveCart(cart);
    renderBoth();
  }

  function removeItem(index) {
    var cart = loadCart();
    if (!cart[index]) return;
    var name = cart[index].name;
    cart.splice(index, 1);
    saveCart(cart);
    showToast(name + " removed");
    renderBoth();
  }

  function goCheckout() {
    if (!loadCart().length) {
      showToast("Your cart is empty");
      return;
    }
    if (typeof window.handleCheckout === "function") window.handleCheckout();
    else window.location.href = "checkout.html";
  }

  function installEvents() {
    document.addEventListener("click", function (event) {
      var qty = event.target.closest("[data-ccap-qty]");
      if (qty) {
        event.preventDefault();
        updateQty(Number(qty.getAttribute("data-ccap-qty")), Number(qty.getAttribute("data-delta")) || 0);
        return;
      }
      var rem = event.target.closest("[data-ccap-remove]");
      if (rem) {
        event.preventDefault();
        removeItem(Number(rem.getAttribute("data-ccap-remove")));
        return;
      }
      if (event.target.closest("[data-ccap-checkout]")) {
        event.preventDefault();
        goCheckout();
        return;
      }
      if (event.target.closest("[data-ccap-back]")) {
        event.preventDefault();
        if (history.length > 1) history.back();
        else window.location.href = "index.html";
      }
    });

    window.addEventListener("storage", renderApprovedCart);
    window.addEventListener("resize", renderApprovedCart, { passive: true });
  }

  function patchRenderCart() {
    if (typeof window.renderCart === "function" && !window.__ccapOriginalRenderCart) {
      window.__ccapOriginalRenderCart = window.renderCart;
      window.renderCart = function () {
        var result = window.__ccapOriginalRenderCart.apply(this, arguments);
        renderApprovedCart();
        return result;
      };
    }
  }

  function init() {
    patchRenderCart();
    installEvents();
    renderApprovedCart();
    hydrateFromBackendOnce();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
