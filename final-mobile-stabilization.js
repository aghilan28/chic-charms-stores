(function () {
  "use strict";

  /* DESKTOP SAFETY LOCK */
  if (window.innerWidth > 768) {
    document.documentElement.classList.remove('mobile-home', 'cc-mobile', 'app-shell-active');
    return;
  }

  var mobileQuery = window.matchMedia("(max-width: 768px)");
  var HOME_ID = "ccFinalHome";
  var ANNOUNCEMENT_ID = "ccFinalAnnouncement";
  var RECENT_SEARCHES_KEY = "ccRecentSearches";

  function isMobile() {
    return mobileQuery.matches;
  }

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function escapeHTML(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function money(value) {
    var numeric = Number(String(value || "").replace(/[^\d.]/g, ""));
    if (!numeric) return "Rs.299";
    return "Rs." + numeric.toLocaleString("en-IN");
  }

  function icon(name) {
    var icons = {
      account: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.7-4 4.3-6 8-6s6.3 2 8 6"/></svg>',
      arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
      bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h12l3 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9l3-7Z"/><path d="M3 9h18M9 13a3 3 0 0 0 6 0"/></svg>',
      close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
      heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.8c-1.7-1.8-4.5-1.7-6.2.1L12 7.6 9.4 4.9C7.7 3.1 4.9 3 3.2 4.8c-1.8 1.9-1.7 4.8.1 6.7L12 20l8.7-8.5c1.8-1.9 1.9-4.8.1-6.7Z"/></svg>',
      home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.8 12 3l9 7.8V21h-6v-6H9v6H3Z"/></svg>',
      menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h14M4 17h10"/></svg>',
      minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
      plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
      search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></svg>',
      shop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16l-1 11H5L4 9Z"/><path d="M8 9a4 4 0 0 1 8 0"/></svg>'
    };
    return icons[name] || icons.arrow;
  }

  function productFallbacks() {
    return [
      { name: "Everyday Gold Hoops", price: "Rs.199", img: "images/editorial-everyday-hoops.png", url: "index.html#bestsellers", tag: "Bestseller" },
      { name: "Pearl Drop Earrings", price: "Rs.249", img: "images/story-soft-pearl-drop.png", url: "index.html#bestsellers", tag: "New" },
      { name: "Korean Bow Studs", price: "Rs.299", img: "images/editorial-korean-morning-coffee.png", url: "index.html#bestsellers", tag: "Viral" },
      { name: "Minimal Luxe Studs", price: "Rs.179", img: "images/editorial-minimal-soul-closeup.png", url: "index.html#bestsellers", tag: "Everyday" },
      { name: "Heritage Muse Drops", price: "Rs.299", img: "images/style-heritage-muse.png", url: "index.html#bestsellers", tag: "Gift" },
      { name: "Golden Hour Hoops", price: "Rs.229", img: "images/editorial-light-meets-gold.png", url: "index.html#bestsellers", tag: "Under Rs.299" }
    ];
  }

  function getProducts(limit) {
    var cards = $all(".product-card-lux").map(function (card, index) {
      var image = $(".lux-img-container img", card);
      var name = $(".lux-product-name", card);
      var price = $(".lux-price", card);
      var link = $(".lux-img-link, .lux-product-name", card);
      var badge = $(".mobile-product-badge, .lux-badge", card);
      return {
        img: image ? image.getAttribute("src") : "",
        name: name ? name.textContent.trim() : "ChicCharms Piece " + (index + 1),
        price: money(price ? price.textContent : 299),
        rawPrice: Number(String(price ? price.textContent : 299).replace(/[^\d.]/g, "")) || 299,
        url: link ? link.getAttribute("href") || "index.html#bestsellers" : "index.html#bestsellers",
        tag: badge ? badge.textContent.trim() : index % 2 ? "New" : "Bestseller"
      };
    }).filter(function (item) {
      return item.name && item.img;
    });

    if (!cards.length) cards = productFallbacks();
    return cards.slice(0, limit || 12);
  }

  function cartItems() {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch (err) {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem("cart", JSON.stringify(items));
    syncCartBadges();
    syncCartDrawer();
    window.dispatchEvent(new Event("storage"));
  }

  function cartTotal(items) {
    return items.reduce(function (sum, item) {
      return sum + (Number(item.price) || 0) * (Number(item.quantity) || 1);
    }, 0);
  }

  function addGeneratedProductToCart(productName, price, image) {
    var cart = cartItems();
    var existing = cart.find(function (item) {
      return item.name === productName;
    });
    if (existing) {
      existing.quantity = (Number(existing.quantity) || 1) + 1;
      if (image && !existing.image) existing.image = image;
    } else {
      cart.push({ name: productName, price: Number(price) || 299, quantity: 1, image: image || "" });
    }
    saveCart(cart);
    var toast = $("#cartToast");
    if (toast) {
      toast.textContent = productName + " added to your bag";
      toast.classList.add("show");
      window.clearTimeout(window.__ccCartToastTimer);
      window.__ccCartToastTimer = window.setTimeout(function () {
        toast.classList.remove("show");
      }, 1800);
    }
  }

  function updateCartQuantity(index, delta) {
    var cart = cartItems();
    if (!cart[index]) return;
    cart[index].quantity = (Number(cart[index].quantity) || 1) + delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    saveCart(cart);
  }

  /* ─── EARRINGS ONLY: single category for homepage ─── */
  function categoryLink(label, slug, img) {
    return [
      '<a class="cc-final-category cc-cat-earrings" href="index.html#bestsellers" data-final-category="' + slug + '">',
      '<span><img src="' + img + '" alt="" loading="lazy" decoding="async"></span>',
      '<b>' + label + '</b>',
      '</a>'
    ].join("");
  }

  function productCard(product, index) {
    var numeric = product.rawPrice || Number(String(product.price || "").replace(/[^\d.]/g, "")) || 299;
    var oldPrice = Math.max(numeric + 70, Math.ceil(numeric * 1.38));
    var discount = Math.max(12, Math.round(((oldPrice - numeric) / oldPrice) * 100));
    return [
      '<article class="cc-final-product" style="--delay:' + (index || 0) + '">',
      '<span class="cc-final-product-media">',
      '<a class="cc-final-product-link" href="' + product.url + '" aria-label="View ' + escapeHTML(product.name) + '">',
      '<img src="' + product.img + '" alt="' + escapeHTML(product.name) + '" loading="lazy" decoding="async">',
      '</a>',
      '<i class="cc-final-badge">' + escapeHTML(product.tag || (index % 2 ? "New" : "Bestseller")) + '</i>',
      '<button class="cc-final-heart" type="button" aria-label="Add to wishlist" data-final-card-action>' + icon("heart") + '</button>',
      '<button class="cc-final-quick" type="button" aria-label="Quick add ' + escapeHTML(product.name) + '" data-final-quick-add data-name="' + escapeHTML(product.name) + '" data-price="' + numeric + '" data-image="' + escapeHTML(product.img) + '">' + icon("plus") + '</button>',
      '</span>',
      '<div class="cc-final-product-info">',
      '<a class="cc-final-product-name" href="' + product.url + '">' + escapeHTML(product.name) + '</a>',
      '<span class="cc-final-price-row"><strong>' + product.price + '</strong><s>Rs.' + oldPrice + '</s><em>' + discount + '%</em></span>',
      '<button class="cc-final-card-cta" type="button" data-final-quick-add data-name="' + escapeHTML(product.name) + '" data-price="' + numeric + '" data-image="' + escapeHTML(product.img) + '">Add to bag</button>',
      '</div>',
      '</article>'
    ].join("");
  }

  function productGrid(title, kicker, products) {
    return [
      '<section class="cc-final-section">',
      '<div class="cc-final-head"><div><p class="cc-final-kicker">' + kicker + '</p><h2 class="cc-final-title">' + title + '</h2></div><a class="cc-final-link" href="index.html#bestsellers">View all</a></div>',
      '<div class="cc-app-product-grid">',
      products.map(productCard).join(""),
      '</div>',
      '</section>'
    ].join("");
  }

  function promoCard(title, copy, tag, slug, img) {
    return [
      '<a class="cc-final-promo-card" href="index.html#bestsellers" data-final-category="' + slug + '">',
      '<img src="' + img + '" alt="" loading="lazy" decoding="async">',
      '<span>' + tag + '</span><strong>' + title + '</strong><em>' + copy + '</em>',
      '</a>'
    ].join("");
  }

  function moodCard(label, copy, img, slug) {
    return [
      '<a class="cc-app-mood" href="index.html#bestsellers" data-final-category="' + slug + '">',
      '<img src="' + img + '" alt="" loading="lazy" decoding="async"><span>' + label + '</span><strong>' + copy + '</strong>',
      '</a>'
    ].join("");
  }

  function storyTile(label, copy, img) {
    return [
      '<article class="cc-app-story">',
      '<img src="' + img + '" alt="" loading="lazy" decoding="async"><div><span>' + label + '</span><strong>' + copy + '</strong></div>',
      '</article>'
    ].join("");
  }

  function collectionCard(label, copy, slug, img) {
    return [
      '<a class="cc-final-collection" href="index.html#bestsellers" data-final-category="' + slug + '">',
      '<img src="' + img + '" alt="" loading="lazy" decoding="async"><div><strong>' + label + '</strong><span>' + copy + '</span></div>',
      '</a>'
    ].join("");
  }

  function buildAnnouncement() {
    /* PHASE 1 DISABLED — announcement bar injection is out of Phase 1 scope */
    return;
    if ($("#" + ANNOUNCEMENT_ID)) return;
    var items = ["COD available", "Ships in 24 hours", "Skin-friendly finish", "Free shipping above Rs.399", "New drops weekly"];
    var bar = document.createElement("div");
    bar.id = ANNOUNCEMENT_ID;
    bar.className = "cc-final-announcement";
    bar.setAttribute("data-cc-injected", "1");
    bar.innerHTML = '<div class="cc-final-announcement-track">' + items.concat(items).map(function (item) {
      return "<span>" + item + "</span>";
    }).join("") + "</div>";
    var navbar = $("#navbar");
    if (navbar && navbar.parentNode) navbar.parentNode.insertBefore(bar, navbar);
  }

  function buildHome() {
    /* PHASE 1 DISABLED — homepage feed injection is out of Phase 1 scope */
    return;
    if (!isMobile() || $("#" + HOME_ID) || !$("#bestsellers")) return;
    document.body.classList.add("cc-mobile-home-ready");
    buildAnnouncement();

    var products = getProducts(12);
    var rotated = products.slice(3).concat(products.slice(0, 3));
    var bridal = products.slice(4).concat(products.slice(0, 4));
    var home = document.createElement("section");
    home.id = HOME_ID;
    home.className = "cc-final-home cc-app-home";
    home.setAttribute("data-cc-injected", "1");
    home.setAttribute("aria-label", "ChicCharms mobile luxury storefront");

    /* ── Category rail: EARRINGS ONLY ── */
    home.innerHTML = [
      '<button class="cc-final-search-button cc-app-search-pill" type="button" data-final-search>' + icon("search") + '<span>Search earrings, pearls, gift sets</span><strong>Search</strong></button>',
      '<nav class="cc-final-category-rail" aria-label="Quick categories">',
      /* Only earrings — single focused category */
      categoryLink("Earrings", "everyday-elegance", "images/editorial-everyday-hoops.png"),
      '</nav>',
      '<section class="cc-app-hero" aria-label="Luxury campaign">',
      '<a class="cc-app-hero-card" href="index.html#bestsellers">',
      '<img src="images/hero-quiet-luxury-main.jpg" alt="Quiet luxury jewellery campaign" loading="eager" decoding="async" fetchpriority="high">',
      '<div class="cc-app-hero-glass"><span>New drop</span><b>Under Rs.299</b></div>',
      '<div class="cc-app-offer">COD<br><b>Available</b></div>',
      '<div class="cc-app-hero-copy"><span>ChicCharms edit</span><h1>Soft sparkle, styled like a love note.</h1><p>Lightweight pieces with a champagne glow for dates, weddings, selfies, and everyday rituals.</p><strong>Shop the edit</strong></div>',
      '</a>',
      '</section>',
      '<section class="cc-final-promo-rail" aria-label="Featured collections">',
      promoCard("New Arrivals", "Fresh drops under Rs.299", "Just in", "all", "images/editorial-light-meets-gold.png"),
      promoCard("Bestsellers", "The pieces everyone saves", "Loved", "everyday-elegance", "images/editorial-everyday-hoops.png"),
      promoCard("Gift Store", "Sweet sparkle, ready to send", "Gifting", "heritage-muse", "images/story-intimate-jewelry-detail.png"),
      promoCard("Korean Edit", "Bows, pearls, soft shine", "Viral", "after-dark", "images/editorial-korean-morning-coffee.png"),
      '</section>',
      '<section class="cc-final-trust cc-app-trust" aria-label="Shopping promises"><span>COD</span><span>Ships 24h</span><span>Free ship Rs.399+</span></section>',
      productGrid("Trending Products", "Everyone is adding", products.slice(0, 8)),
      '<section class="cc-final-section cc-app-mood-section"><div class="cc-final-head"><div><p class="cc-final-kicker">Shop by mood</p><h2 class="cc-final-title">Pick your sparkle story</h2></div></div><div class="cc-app-mood-grid">' +
        moodCard("Date night", "Pearls with soft romance", "images/editorial-soft-date-night.png", "modern-romance") +
        moodCard("Coffee run", "Tiny shine, easy outfits", "images/editorial-korean-morning-coffee.png", "everyday-elegance") +
        moodCard("Wedding guest", "Gold glow without weight", "images/style-heritage-muse.png", "heritage-muse") +
      '</div></section>',
      productGrid("New Arrivals", "Fresh drops", rotated.slice(0, 6)),
      productGrid("Bridal Picks", "Festive ready", bridal.slice(0, 6)),
      '<section class="cc-final-section"><div class="cc-final-head"><div><p class="cc-final-kicker">Editorial notes</p><h2 class="cc-final-title">Luxury made wearable</h2></div></div><div class="cc-app-story-grid">' +
        storyTile("Light finish", "Comfortable for all-day wear", "images/story-soft-pearl-drop.png") +
        storyTile("Gift energy", "Premium packing for tiny surprises", "images/story-intimate-jewelry-detail.png") +
      '</div></section>',
      '<section class="cc-final-section"><div class="cc-final-head"><div><p class="cc-final-kicker">Collections</p><h2 class="cc-final-title">Shop by feeling</h2></div></div><div class="cc-final-collection-grid">' +
        collectionCard("Everyday Elegance", "Light pieces for repeat wear", "everyday-elegance", "images/editorial-everyday-hoops.png") +
        collectionCard("Modern Romance", "Pearls, bows, and softer shine", "modern-romance", "images/style-modern-romance.jpg") +
        collectionCard("After Dark", "Statement sparkle without weight", "after-dark", "images/style-after-dark.png") +
      '</div></section>',
      '<footer class="cc-final-footer"><div class="cc-final-footer-brand">ChicCharms</div><p class="cc-final-copy">Trendy Indian accessories, COD, fast shipping, and weekly viral drops.</p><nav aria-label="Footer links"><a href="about.html">About</a><a href="shop.html">Shop</a><a href="shipping.html">Shipping</a><a href="returns.html">Returns</a><a href="contact.html">Contact</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="faq.html">FAQ</a></nav></footer>'
    ].join("");

    var main = $("main");
    if (main) main.insertBefore(home, main.firstElementChild);
  }

  function removeDuplicateGeneratedShells() {
    if (!isMobile()) return;
    $all([
      ".cc-mobile-brand",
      ".mobile-commerce-rails",
      ".cc-mobile-footer",
      ".cc-loading-screen",
      ".cc-onboarding-toast",
      ".cc-recent-purchase",
      ".cc-mini-cart",
      ".ma-drawer",
      ".ma-drawer-backdrop",
      ".ma-search-overlay",
      ".ma-cart-sheet",
      ".ma-cart-backdrop",
      ".lux-mobile-drawer",
      ".lux-mobile-drawer-backdrop",
      ".lux-search-overlay",
      ".pdp-zoom-overlay",
      ".lux-pdp-sticky-cta"
    ].join(", ")).forEach(function (node) {
      node.remove();
    });
    $all(".mobile-bottom-nav").forEach(function (nav) {
      if (!nav.classList.contains("cc-app-bottom-nav")) nav.remove();
    });
    var headers = $all(".cc-app-header");
    headers.slice(1).forEach(function (header) { header.remove(); });
    var heroes = $all("#ccFinalHome, .cc-final-home");
    heroes.slice(1).forEach(function (hero) { hero.remove(); });
    $all(".cc-app-search-overlay").slice(1).forEach(function (overlay) { overlay.remove(); });
    $all(".cc-app-drawer").slice(1).forEach(function (drawer) { drawer.remove(); });
    $all(".cc-app-cart-drawer").slice(1).forEach(function (drawer) { drawer.remove(); });
  }

  function createMobileChrome() {
    /* PHASE 1 DISABLED — mobile.css + mobile-app.js handle the header */
    return;
    if (!isMobile()) return;
    var navbar = $("#navbar");
    if (navbar && !navbar.dataset.ccAppHeader) {
      navbar.__ccOriginalClassName = navbar.className;
      navbar.__ccOriginalHTML = navbar.innerHTML;
      navbar.dataset.ccAppHeader = "1";
      navbar.className = "navbar cc-app-header";
      navbar.innerHTML = [
        '<div class="cc-app-header-inner">',
        '<button class="cc-app-icon-btn" type="button" data-cc-app-menu aria-label="Open menu">' + icon("menu") + '</button>',
        '<a class="cc-app-logo" href="index.html" aria-label="ChicCharms home">Chic<span>Charms</span></a>',
        '<div class="cc-app-header-actions">',
        '<button class="cc-app-icon-btn" type="button" data-cc-app-cart aria-label="Open cart">' + icon("bag") + '<em data-cc-cart-count hidden>0</em></button>',
        '<a class="cc-app-icon-btn" href="account.html" aria-label="Account">' + icon("account") + '</a>',
        '</div>',
        '</div>'
      ].join("");
    }

    $all(".mobile-bottom-nav").forEach(function (nav) { nav.remove(); });
    var current = location.pathname.split("/").pop() || "index.html";
    function active(files) {
      return files.indexOf(current) !== -1 ? " is-active" : "";
    }
    var nav = document.createElement("nav");
    nav.className = "mobile-bottom-nav cc-global-bottom-nav cc-app-bottom-nav";
    nav.setAttribute("data-cc-injected", "1");
    nav.setAttribute("aria-label", "Mobile bottom navigation");
    nav.innerHTML =
      '<a class="mobile-bottom-tab' + active(["index.html", ""]) + '" href="index.html" aria-label="Home">' + icon("home") + '<span>Home</span></a>' +
      '<a class="mobile-bottom-tab' + active(["shop.html"]) + '" href="index.html#bestsellers" data-bottom-category aria-label="Categories">' + icon("shop") + '<span>Shop</span></a>' +
      '<button class="mobile-bottom-tab cc-app-nav-button" type="button" data-final-search aria-label="Search">' + icon("search") + '<span>Search</span></button>' +
      '<a class="mobile-bottom-tab" href="index.html#bestsellers" aria-label="Wishlist">' + icon("heart") + '<span>Wishlist</span></a>' +
      '<a class="mobile-bottom-tab' + active(["account.html", "auth.html"]) + '" href="account.html" aria-label="Account">' + icon("account") + '<span>Account</span></a>';
    document.body.appendChild(nav);
    syncCartBadges();
  }

  function recentSearches() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
    } catch (err) {
      return [];
    }
  }

  function saveRecentSearch(term) {
    term = String(term || "").trim();
    if (!term) return;
    var list = recentSearches().filter(function (item) {
      return item.toLowerCase() !== term.toLowerCase();
    });
    list.unshift(term);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list.slice(0, 5)));
  }

  function renderSearchResults(term) {
    var results = $(".cc-app-search-results");
    if (!results) return;
    var products = getProducts(10);
    var query = String(term || "").trim().toLowerCase();
    var filtered = query
      ? products.filter(function (product) { return product.name.toLowerCase().indexOf(query) !== -1; })
      : products.slice(0, 4);
    if (!filtered.length) filtered = products.slice(0, 4);
    results.innerHTML = filtered.map(function (p) {
      return '<a href="' + p.url + '"><img src="' + p.img + '" alt="" loading="lazy" decoding="async"><span>' + escapeHTML(p.name) + '</span><strong>' + p.price + '</strong></a>';
    }).join("");
  }

  function createSearchExperience() {
    /* PHASE 1 DISABLED — search overlay is out of Phase 1 scope */
    return;
    if (!isMobile() || $(".cc-app-search-overlay")) return;
    var overlay = document.createElement("section");
    overlay.className = "cc-app-search-overlay";
    overlay.setAttribute("data-cc-injected", "1");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Search ChicCharms");
    var recent = recentSearches();
    overlay.innerHTML = [
      '<div class="cc-app-search-top"><button type="button" class="cc-app-icon-btn" data-cc-search-close aria-label="Close search">' + icon("close") + '</button><label class="cc-app-search-input">' + icon("search") + '<input id="ccAppSearchInput" type="search" placeholder="Search earrings, pearls, gift sets" autocomplete="off"></label></div>',
      '<div class="cc-app-search-body">',
      '<p class="cc-app-overline">Trending now</p><div class="cc-app-chip-row"><button type="button" data-search-chip>pearl drops</button><button type="button" data-search-chip>daily hoops</button><button type="button" data-search-chip>bridal gold</button><button type="button" data-search-chip>Korean bows</button></div>',
      '<p class="cc-app-overline">Recent searches</p><div class="cc-app-chip-row cc-app-recent-row">' + (recent.length ? recent.map(function (item) { return '<button type="button" data-search-chip>' + escapeHTML(item) + '</button>'; }).join("") : '<button type="button" data-search-chip>new arrivals</button><button type="button" data-search-chip>gift store</button>') + '</div>',
      '<p class="cc-app-overline">Quick categories</p><div class="cc-app-search-cats"><a href="index.html#bestsellers" data-final-category="everyday-elegance">Earrings</a><a href="index.html#bestsellers" data-final-category="modern-romance">Rings</a><a href="index.html#bestsellers" data-final-category="heritage-muse">Gift Store</a><a href="index.html#bestsellers" data-final-category="after-dark">Partywear</a></div>',
      '<p class="cc-app-overline">Recommended for you</p><div class="cc-app-search-products cc-app-search-results"></div>',
      '</div>'
    ].join("");
    document.body.appendChild(overlay);
    renderSearchResults("");
  }

  function openSearchOverlay() {
    createSearchExperience();
    var overlay = $(".cc-app-search-overlay");
    if (!overlay) return;
    overlay.classList.add("is-open");
    document.body.classList.add("lux-search-open");
    window.setTimeout(function () {
      var input = $("#ccAppSearchInput");
      if (input) input.focus({ preventScroll: true });
    }, 120);
  }

  function closeSearchOverlay() {
    var overlay = $(".cc-app-search-overlay");
    if (overlay) overlay.classList.remove("is-open");
    document.body.classList.remove("lux-search-open");
    stabilizeScrollState();
  }

  function createPremiumDrawer() {
    /* PHASE 1 DISABLED — mobile.css drawer uses .nav-links.open; mobile-app.js wires it */
    return;
    if (!isMobile() || $(".cc-app-drawer")) return;
    var backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "cc-app-backdrop";
    backdrop.setAttribute("aria-label", "Close menu");
    backdrop.setAttribute("data-cc-injected", "1");
    var drawer = document.createElement("aside");
    drawer.className = "cc-app-drawer";
    drawer.setAttribute("data-cc-injected", "1");
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-label", "Mobile menu");
    var rows = [
      ["New Arrivals", "Just dropped", "all", "images/editorial-light-meets-gold.png"],
      ["Bestsellers", "Most loved pieces", "everyday-elegance", "images/editorial-everyday-hoops.png"],
      ["Gift Store", "Ready to surprise", "heritage-muse", "images/story-intimate-jewelry-detail.png"],
      ["Earrings", "Daily sparkle", "everyday-elegance", "images/style-everyday-elegance.png"],
      ["Pearls", "Soft romance", "modern-romance", "images/story-soft-pearl-drop.png"],
      ["Partywear", "After-dark shine", "after-dark", "images/style-after-dark.png"]
    ];
    drawer.innerHTML = [
      '<div class="cc-app-drawer-head"><div><span>ChicCharms</span><strong>Luxury edits for every mood</strong></div><button type="button" class="cc-app-icon-btn" data-cc-drawer-close aria-label="Close menu">' + icon("close") + '</button></div>',
      '<div class="cc-app-drawer-feature"><img src="images/style-modern-romance.jpg" alt="" loading="lazy" decoding="async"><div><span>Featured collection</span><strong>Modern Romance</strong><a href="index.html#bestsellers" data-final-category="modern-romance">Explore now</a></div></div>',
      '<nav class="cc-app-menu-list">' + rows.map(function (row) {
        return '<a href="index.html#bestsellers" data-final-category="' + row[2] + '"><img src="' + row[3] + '" alt="" loading="lazy" decoding="async"><span><b>' + row[0] + '</b><em>' + row[1] + '</em></span>' + icon("arrow") + '</a>';
      }).join("") + '</nav>',
      '<div class="cc-app-menu-foot"><a href="account.html">' + icon("account") + '<span>My Account</span></a><a href="cart.html">' + icon("bag") + '<span>Cart</span></a><a href="contact.html"><span>Support</span></a></div>'
    ].join("");
    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
  }

  function openDrawer() {
    var drawer = $(".cc-app-drawer");
    var backdrop = $(".cc-app-backdrop");
    if (drawer) drawer.classList.add("is-open");
    if (backdrop) backdrop.classList.add("is-open");
    document.body.classList.add("lux-drawer-open");
  }

  function closeDrawer() {
    var drawer = $(".cc-app-drawer");
    var backdrop = $(".cc-app-backdrop");
    if (drawer) drawer.classList.remove("is-open");
    if (backdrop) backdrop.classList.remove("is-open");
    document.body.classList.remove("lux-drawer-open", "d7-menu-open");
    stabilizeScrollState();
  }

  function syncCartBadges() {
    var units = cartItems().reduce(function (sum, item) {
      return sum + (Number(item.quantity) || 1);
    }, 0);
    $all("[data-cc-cart-count], .mobile-cart-count").forEach(function (badge) {
      badge.textContent = units;
      badge.hidden = !units;
    });
  }

  /* ──────────────────────────────────────────────
     CART DRAWER — FIXED IMPLEMENTATION
     - Flex column layout: header + scrollable area + sticky footer
     - body overflow restored correctly on close
     - No z-index conflicts with bottom nav
  ─────────────────────────────────────────────── */
  function createCartDrawer() {
    /* PHASE 1 DISABLED — cart drawer is out of Phase 1 scope */
    return;
    if (!isMobile() || $(".cc-app-cart-drawer")) return;
    var backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "cc-app-cart-backdrop";
    backdrop.setAttribute("aria-label", "Close cart");
    backdrop.setAttribute("data-cc-injected", "1");
    var drawer = document.createElement("aside");
    drawer.className = "cc-app-cart-drawer";
    drawer.setAttribute("data-cc-injected", "1");
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-label", "Cart drawer");
    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
    syncCartDrawer();
  }

  function syncCartDrawer() {
    var drawer = $(".cc-app-cart-drawer");
    if (!drawer) return;
    var items = cartItems();
    var subtotal = cartTotal(items);
    var left = Math.max(0, 399 - subtotal);
    var progress = Math.min(100, Math.round((subtotal / 399) * 100));

    /* Build inner HTML using flex column structure */
    drawer.innerHTML = [
      /* Grabber */
      '<div class="cc-app-cart-grabber" aria-hidden="true"></div>',
      /* Head — fixed top */
      '<div class="cc-app-cart-head">',
        '<div>',
          '<span>Your bag</span>',
          '<strong>' + (items.length ? items.length + " style" + (items.length > 1 ? "s" : "") + " selected" : "Ready for a new favourite") + '</strong>',
        '</div>',
        '<button type="button" class="cc-app-icon-btn" data-cc-cart-close aria-label="Close cart">' + icon("close") + '</button>',
      '</div>',
      /* Shipping bar */
      '<div class="cc-app-ship" style="margin: 0 16px 2px;">',
        '<div>',
          '<span>' + (left ? "Add Rs." + left + " for free shipping" : "Free shipping unlocked ✓") + '</span>',
          '<b>' + progress + '%</b>',
        '</div>',
        '<i style="--p:' + progress + '%"></i>',
      '</div>',
      /* Scrollable items area */
      '<div class="cc-app-cart-items" style="overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;flex:1;min-height:0;padding:0 16px;gap:10px;display:grid;">',
        (items.length
          ? items.map(function (item, index) {
              return [
                '<article>',
                  '<div class="cc-app-cart-img">' + (item.image ? '<img src="' + escapeHTML(item.image) + '" alt="">' : 'CC') + '</div>',
                  '<div>',
                    '<strong>' + escapeHTML(item.name || "ChicCharms piece") + '</strong>',
                    '<span>Rs.' + (Number(item.price) || 0) + '</span>',
                    '<div class="cc-app-cart-qty">',
                      '<button type="button" data-cart-qty="' + index + '" data-delta="-1" aria-label="Decrease">' + icon("minus") + '</button>',
                      '<em>' + (item.quantity || 1) + '</em>',
                      '<button type="button" data-cart-qty="' + index + '" data-delta="1" aria-label="Increase">' + icon("plus") + '</button>',
                    '</div>',
                  '</div>',
                  '<b>Rs.' + ((Number(item.price) || 0) * (Number(item.quantity) || 1)) + '</b>',
                '</article>'
              ].join("");
            }).join("")
          : '<div class="cc-app-empty-cart"><strong>Your cart is waiting</strong><span>Save your favourite sparkle and checkout in a few taps.</span><a href="index.html#bestsellers">Explore bestsellers</a></div>'
        ),
      '</div>',
      /* Trust strip */
      '<div class="cc-app-cart-trust" style="padding:8px 16px;flex:0 0 auto;"><span>Secure checkout</span><span>COD available</span><span>7-day returns</span></div>',
      /* Checkout button — sticky footer */
      '<a class="cc-app-checkout" href="checkout.html"><span>Checkout</span><strong>Rs.' + subtotal + '</strong></a>'
    ].join("");
  }

  /* ─── openCartDrawer: clean, no scroll-position side-effects ─── */
  function openCartDrawer() {
    createCartDrawer();
    syncCartDrawer();
    var drawer = $(".cc-app-cart-drawer");
    var backdrop = $(".cc-app-cart-backdrop");
    if (!drawer || !backdrop) return;

    /* Capture current scroll position so we don't jump */
    window.__ccScrollY = window.scrollY;

    drawer.classList.add("is-open");
    backdrop.classList.add("is-open");

    /* Lock body scroll without position:fixed (avoids scroll jump) */
    document.body.classList.add("cc-modal-open");
    document.body.style.overscrollBehavior = "none";
  }

  /* ─── closeCartDrawer: full cleanup, scroll restoration ─── */
  function closeCartDrawer() {
    var drawer = $(".cc-app-cart-drawer");
    var backdrop = $(".cc-app-cart-backdrop");

    if (drawer) drawer.classList.remove("is-open");
    if (backdrop) backdrop.classList.remove("is-open");

    /* Remove body lock */
    document.body.classList.remove("cc-modal-open");
    document.body.style.overscrollBehavior = "";

    stabilizeScrollState();
  }

  function activateCategory(slug) {
    closeDrawer();
    closeSearchOverlay();
    var filter = $("#categoryFilter");
    if (filter) {
      filter.value = slug || "all";
      filter.dispatchEvent(new Event("change", { bubbles: true }));
    }
    var target = $("#ccFinalHome") || $("#bestsellers");
    if (target) window.scrollTo({ top: Math.max(0, target.offsetTop - 74), behavior: "smooth" });
  }

  function enhanceMobileAccount() {
    if (!isMobile() || !$(".acc-page") || $(".cc-app-account-hero")) return;
    var page = $(".acc-page");
    page.classList.add("cc-app-account-page");
    var hero = document.createElement("section");
    hero.className = "cc-app-account-hero";
    hero.innerHTML = '<div class="cc-app-account-avatar">CC</div><div><span>Welcome back</span><h1>Your ChicCharms world</h1><p>Track orders, save addresses, and keep your sparkle profile polished.</p></div>';
    page.insertBefore(hero, page.firstElementChild);
  }

  function tuneMobileCommercePages() {
    if (!isMobile()) return;
    if ($(".cart-page")) document.body.classList.add("cc-mobile-cart-page");
    if ($(".checkout-page")) document.body.classList.add("cc-mobile-checkout-page");
    if ($(".auth-page")) document.body.classList.add("cc-mobile-auth-page");
    var sticky = $(".d11-sticky-cart-cta");
    if (sticky && !cartItems().length) sticky.classList.add("d11-hidden");
  }

  function hardenImagesAndRails() {
    if (!isMobile()) return;
    $all("img").forEach(function (img) {
      img.decoding = "async";
      if (!img.hasAttribute("loading") && !img.closest(".cc-app-hero-card, .product-img-frame")) img.loading = "lazy";
    });
    $all(".cc-final-category-rail, .cc-final-promo-rail, .product-gallery-thumbs, .related-grid, .pdp-review-rail").forEach(function (rail) {
      rail.style.webkitOverflowScrolling = "touch";
      rail.style.overflowX = "auto";
      rail.style.overflowY = "hidden";
      rail.style.scrollSnapType = "x mandatory";
      rail.style.scrollPaddingInline = "16px";
    });
    $all(".product-card-lux").forEach(function (card) {
      card.classList.add("lux-visible", "revealed");
    });
  }

  /* ─── stabilizeScrollState: the authoritative scroll cleanup ─── */
  function stabilizeScrollState() {
    if (!isMobile()) return;

    /* Check if any overlay is still open */
    var anyOpen = !!$(".cc-app-drawer.is-open, .cc-app-search-overlay.is-open, .cc-app-cart-drawer.is-open, .lux-mobile-drawer.is-open, .lux-search-overlay.is-open");

    if (!anyOpen) {
      /* Remove all modal-open classes */
      document.body.classList.remove("lux-drawer-open", "lux-search-open", "cc-modal-open", "d7-menu-open");

      /* Restore body scroll — clear inline overrides */
      document.body.style.overflow = "";
      document.body.style.overflowX = "hidden";
      document.body.style.overflowY = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overscrollBehavior = "";

      /* Restore html */
      document.documentElement.style.overflow = "";
      document.documentElement.style.overflowX = "hidden";
      document.documentElement.style.overflowY = "";

      /* Restore scroll position if we saved it */
      if (window.__ccScrollY !== undefined) {
        window.scrollTo(0, window.__ccScrollY);
        window.__ccScrollY = undefined;
      }
    }

    /* Always ensure x-overflow is hidden */
    document.documentElement.style.overflowX = "hidden";
    document.body.style.overflowX = "hidden";
    document.body.style.minHeight = "100dvh";
  }

  function syncHomeProducts() {
    var home = $("#" + HOME_ID);
    if (!home) return;
    var grids = $all(".cc-app-product-grid", home);
    var products = getProducts(12);
    if (grids[0]) grids[0].innerHTML = products.slice(0, 8).map(productCard).join("");
    if (grids[1]) grids[1].innerHTML = products.slice(3).concat(products.slice(0, 3)).slice(0, 6).map(productCard).join("");
  }

  function bindInteractions() {
    if (window.__ccFinalInteractionsBound) return;
    window.__ccFinalInteractionsBound = true;

    document.addEventListener("click", function (event) {
      var menu = event.target.closest("[data-cc-app-menu]");
      if (menu) {
        event.preventDefault();
        openDrawer();
        return;
      }

      if (event.target.closest(".cc-app-backdrop, [data-cc-drawer-close]")) {
        event.preventDefault();
        closeDrawer();
        return;
      }

      if (event.target.closest("[data-cc-app-cart]")) {
        event.preventDefault();
        openCartDrawer();
        return;
      }

      /* Close cart: backdrop click OR close button */
      if (event.target.closest(".cc-app-cart-backdrop, [data-cc-cart-close]")) {
        event.preventDefault();
        closeCartDrawer();
        return;
      }

      if (event.target.closest("[data-final-search]")) {
        event.preventDefault();
        openSearchOverlay();
        return;
      }

      if (event.target.closest("[data-cc-search-close]")) {
        event.preventDefault();
        closeSearchOverlay();
        return;
      }

      var quick = event.target.closest("[data-final-quick-add]");
      if (quick) {
        event.preventDefault();
        event.stopPropagation();
        quick.classList.add("is-active");
        addGeneratedProductToCart(quick.dataset.name, quick.dataset.price, quick.dataset.image);
        window.setTimeout(function () { quick.classList.remove("is-active"); }, 650);
        return;
      }

      var cardAction = event.target.closest("[data-final-card-action]");
      if (cardAction) {
        event.preventDefault();
        event.stopPropagation();
        cardAction.classList.toggle("is-active");
        return;
      }

      var qty = event.target.closest("[data-cart-qty]");
      if (qty) {
        event.preventDefault();
        updateCartQuantity(Number(qty.dataset.cartQty), Number(qty.dataset.delta));
        return;
      }

      var chip = event.target.closest("[data-search-chip]");
      if (chip) {
        event.preventDefault();
        var input = $("#ccAppSearchInput");
        if (input) {
          input.value = chip.textContent.trim();
          saveRecentSearch(input.value);
          renderSearchResults(input.value);
        }
        return;
      }

      var category = event.target.closest("[data-final-category]");
      if (category) {
        event.preventDefault();
        activateCategory(category.getAttribute("data-final-category") || "all");
      }
    }, true); /* Use capture phase so backdrop clicks are caught even inside modals */

    document.addEventListener("input", function (event) {
      if (event.target && event.target.id === "ccAppSearchInput") renderSearchResults(event.target.value);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeSearchOverlay();
        closeDrawer();
        closeCartDrawer();
      }
      if (event.key === "Enter" && event.target && event.target.id === "ccAppSearchInput") {
        saveRecentSearch(event.target.value);
        renderSearchResults(event.target.value);
      }
    });

    /* Swipe-down to close cart drawer */
    (function () {
      var startY = 0;
      var isDraggingCart = false;

      document.addEventListener("touchstart", function (e) {
        var drawer = $(".cc-app-cart-drawer.is-open");
        if (!drawer) return;
        var grabber = drawer.querySelector(".cc-app-cart-grabber");
        if (!grabber) return;
        var touch = e.touches[0];
        /* Only start drag if touching the grabber or cart head */
        if (touch.clientY < drawer.getBoundingClientRect().top + 60) {
          startY = touch.clientY;
          isDraggingCart = true;
        }
      }, { passive: true });

      document.addEventListener("touchmove", function (e) {
        if (!isDraggingCart) return;
        var delta = e.touches[0].clientY - startY;
        var drawer = $(".cc-app-cart-drawer.is-open");
        if (drawer && delta > 0) {
          drawer.style.transition = "none";
          drawer.style.transform = "translateY(" + delta + "px)";
        }
      }, { passive: true });

      document.addEventListener("touchend", function (e) {
        if (!isDraggingCart) return;
        isDraggingCart = false;
        var delta = e.changedTouches[0].clientY - startY;
        var drawer = $(".cc-app-cart-drawer.is-open");
        if (!drawer) return;
        drawer.style.transition = "";
        drawer.style.transform = "";
        /* If swiped down 90px+, close cart */
        if (delta > 90) {
          closeCartDrawer();
        }
      }, { passive: true });
    })();
  }

  function init() {
    if (!isMobile()) return;
    removeDuplicateGeneratedShells();
    createMobileChrome();
    createSearchExperience();
    createPremiumDrawer();
    createCartDrawer();
    buildHome();
    enhanceMobileAccount();
    tuneMobileCommercePages();
    bindInteractions();
    hardenImagesAndRails();
    stabilizeScrollState();

    var products = $("#products-container");
    if (products && !window.__ccFinalProductObserver) {
      window.__ccFinalProductObserver = true;
      var timer;
      new MutationObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          syncHomeProducts();
          renderSearchResults($("#ccAppSearchInput") ? $("#ccAppSearchInput").value : "");
          syncCartDrawer();
          hardenImagesAndRails();
        }, 120);
      }).observe(products, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { if (isMobile()) init(); });
  } else {
    if (isMobile()) init();
  }

  /* DESKTOP SAFE: Only run deferred inits when confirmed mobile */
  window.addEventListener("load", function () { if (isMobile()) init(); });
  window.addEventListener("pageshow", function () { if (isMobile()) init(); });
  window.addEventListener("storage", function () {
    if (!isMobile()) return;
    syncCartBadges();
    syncCartDrawer();
  });
  function cleanupForDesktop() {
    if (isMobile()) return;
    var navbar = $("#navbar");
    if (navbar && navbar.dataset.ccAppHeader) {
      navbar.className = navbar.__ccOriginalClassName || "navbar";
      if (typeof navbar.__ccOriginalHTML === "string") {
        navbar.innerHTML = navbar.__ccOriginalHTML;
      }
      delete navbar.dataset.ccAppHeader;
    }
    // Remove all injected mobile DOM elements when viewport expands to desktop
    var mobileNodes = [
      "#ccFinalHome", ".cc-app-bottom-nav", ".cc-app-drawer",
      ".cc-app-backdrop", ".cc-app-cart-drawer", ".cc-app-cart-backdrop",
      ".cc-app-search-overlay"
    ];
    mobileNodes.forEach(function(sel) {
      var el = document.querySelector(sel);
      // Remove if injected by mobile JS (has data-cc-injected) OR is a known mobile-only node
      if (el) {
        el.parentNode && el.parentNode.removeChild(el);
      }
    });
    // Restore body scroll
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
    document.body.classList.remove("cc-modal-open", "lux-drawer-open", "lux-search-open");
    // Reset init flags so mobile can re-init if resized back
    window.__ccFinalChromeBuilt = false;
    window.__ccFinalHomeBuilt = false;
    window.__ccFinalSearchBuilt = false;
    window.__ccFinalDrawerBuilt = false;
    window.__ccFinalCartBuilt = false;
  }
  window.addEventListener("resize", function () {
    clearTimeout(window.__ccFinalResizeTimer);
    window.__ccFinalResizeTimer = setTimeout(function() {
      if (isMobile()) {
        init();
      } else {
        cleanupForDesktop();
      }
    }, 120);
  }, { passive: true });
  window.addEventListener("scroll", function () {
    if (!isMobile()) return;
    var header = $(".cc-app-header");
    if (header) header.classList.toggle("is-glass", window.scrollY > 12);
  }, { passive: true });
  /* DESKTOP SAFE: Only fire delayed init on mobile */
  window.setTimeout(function () { if (isMobile()) init(); }, 450);
})();
