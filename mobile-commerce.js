(function () {
  "use strict";

  var mobileQuery = window.matchMedia("(max-width: 1023px)");
  var navbar = document.getElementById("navbar");
  var menuBtn = document.getElementById("mobileCommerceMenu");
  var navLinks = document.getElementById("navLinks");
  var mobileSearch = document.getElementById("mobileCommerceSearch");
  var desktopSearch = document.getElementById("searchInput");
  var categoryFilter = document.getElementById("categoryFilter");
  var promoTrack = document.getElementById("mobilePromoTrack");
  var drawer;
  var drawerBackdrop;
  var searchOverlay;
  var searchInputOverlay;

  function isMobile() {
    return mobileQuery.matches;
  }

  function setCompactHeader() {
    if (!navbar || !isMobile()) return;
    navbar.classList.toggle("mobile-compact", window.scrollY > 18);
  }

  function closeMenu() {
    if (navLinks) navLinks.classList.remove("open");
    if (drawer) drawer.classList.remove("is-open");
    if (drawerBackdrop) drawerBackdrop.classList.remove("is-open");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("d7-menu-open", "lux-drawer-open");
  }

  function openMenu() {
    if (!menuBtn) return;
    if (drawer) drawer.classList.add("is-open");
    if (drawerBackdrop) drawerBackdrop.classList.add("is-open");
    menuBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("d7-menu-open", "lux-drawer-open");
  }

  function icon(name) {
    var icons = {
      spark: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></svg>',
      heart: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.8 4.6c-1.8-1.7-4.6-1.6-6.3.2L12 7.3 9.5 4.8C7.8 3 5 2.9 3.2 4.6 1.3 6.4 1.3 9.4 3.1 11.2L12 20l8.9-8.8c1.8-1.8 1.8-4.8-.1-6.6Z"/></svg>',
      bag: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg>',
      ring: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 4h6l2 4-5 5-5-5 2-4Z"/><circle cx="12" cy="15" r="6"/></svg>',
      gift: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10h16v10H4zM3 6h18v4H3zM12 6v14"/><path d="M12 6C10 2 6 3 7 6m5 0c2-4 6-3 5 0"/></svg>',
      chat: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.7 8.7 0 0 1-4-.9L3 20l1.2-4A8.4 8.4 0 1 1 21 11.5Z"/></svg>'
    };
    return icons[name] || icons.spark;
  }

  function getProductCards(limit) {
    return Array.from(document.querySelectorAll(".product-card-lux")).slice(0, limit || 10).map(function (card, index) {
      var link = card.querySelector(".lux-img-link, .lux-product-name");
      var img = card.querySelector(".lux-img-container img");
      var name = card.querySelector(".lux-product-name");
      var price = card.querySelector(".lux-price");
      return {
        url: link ? link.getAttribute("href") : "index.html#bestsellers",
        img: img ? img.getAttribute("src") : "images/editorial-everyday-hoops.png",
        name: name ? name.textContent.trim() : ["Pearl Drop Earrings", "Minimal Gold Hoops", "Korean Bow Studs"][index % 3],
        price: price ? price.textContent.trim() : "₹299"
      };
    });
  }

  function fallbackProducts() {
    return [
      { url: "index.html#bestsellers", img: "images/editorial-everyday-hoops.png", name: "Everyday Hoops", price: "₹199" },
      { url: "index.html#bestsellers", img: "images/story-soft-pearl-drop.png", name: "Pearl Drop Earrings", price: "₹249" },
      { url: "index.html#bestsellers", img: "images/editorial-korean-morning-coffee.png", name: "Korean Collection", price: "₹299" },
      { url: "index.html#bestsellers", img: "images/editorial-minimal-soul-closeup.png", name: "Minimal Luxe Studs", price: "₹179" }
    ];
  }

  function productHTML(product, className) {
    return '<a class="' + className + '" href="' + product.url + '">' +
      '<img src="' + product.img + '" alt="' + product.name.replace(/"/g, "") + '" loading="lazy" decoding="async" />' +
      '<span>' + product.name + '</span><strong>' + product.price + '</strong></a>';
  }

  function createDrawer() {
    if (drawer || !isMobile()) return;
    var quick = ["New Arrivals", "Best Sellers", "Under ₹299", "Bridal Edit", "Minimal Edit", "Korean Collection", "Daily Wear"];
    var categories = [
      ["Earrings", "spark", ["Studs", "Hoops", "Pearl drops"]],
      ["Rings", "ring", ["Minimal bands", "Statement rings", "Giftable picks"]],
      ["Necklaces", "spark", ["Layering chains", "Pendants", "Pearl pieces"]],
      ["Bracelets", "spark", ["Daily wear", "Charm bracelets", "Occasion edits"]],
      ["Anklets", "spark", ["Delicate anklets", "Festive shine", "Minimal luxe"]],
      ["Gift Sets", "gift", ["Under ₹299", "For best friends", "Bridal gifting"]]
    ];
    drawerBackdrop = document.createElement("button");
    drawerBackdrop.className = "lux-mobile-drawer-backdrop";
    drawerBackdrop.type = "button";
    drawerBackdrop.setAttribute("aria-label", "Close menu");

    drawer = document.createElement("aside");
    drawer.className = "lux-mobile-drawer";
    drawer.setAttribute("aria-label", "Mobile discovery menu");
    drawer.innerHTML =
      '<button class="lux-drawer-close" type="button" aria-label="Close menu">×</button>' +
      '<div class="lux-drawer-scroll">' +
        '<a href="account.html" class="lux-profile-card lux-drawer-animate" style="--stagger:0">' +
          '<span class="lux-profile-avatar">CC</span><span><p class="lux-profile-kicker">Welcome back</p><p class="lux-profile-title">Your jewelry edit</p><span class="lux-profile-link">Open account</span></span>' +
        '</a>' +
        '<section class="lux-drawer-section lux-drawer-animate" style="--stagger:1"><p class="lux-drawer-section-title">Featured Quick Links</p><div class="lux-drawer-list">' +
        quick.map(function (label, i) {
          return '<a class="lux-drawer-link" href="index.html#bestsellers" data-search-term="' + label + '"><span class="lux-drawer-icon">' + icon(i % 3 === 0 ? "spark" : i % 3 === 1 ? "heart" : "bag") + '</span><span class="lux-drawer-label">' + label + '</span><span class="lux-drawer-arrow">›</span></a>';
        }).join("") +
        '</div></section>' +
        '<section class="lux-drawer-section lux-drawer-animate" style="--stagger:2"><p class="lux-drawer-section-title">Shop Categories</p><div class="lux-drawer-list">' +
        categories.map(function (cat) {
          return '<div class="lux-accordion-item"><button type="button" class="lux-accordion-toggle" aria-expanded="false"><span class="lux-drawer-icon">' + icon(cat[1]) + '</span><span class="lux-drawer-label">' + cat[0] + '</span><span class="lux-accordion-chevron">›</span></button><div class="lux-accordion-panel"><div class="lux-accordion-panel-inner">' +
            cat[2].map(function (sub) { return '<a href="index.html#bestsellers" data-search-term="' + sub + '">' + sub + '</a>'; }).join("") +
          '</div></div></div>';
        }).join("") +
        '</div></section>' +
        '<section class="lux-drawer-section lux-drawer-animate" style="--stagger:3"><p class="lux-drawer-section-title">Concierge</p><div class="lux-drawer-bottom">' +
          '<a class="lux-drawer-bottom-link" href="index.html#bestsellers">' + icon("heart") + ' Wishlist</a>' +
          '<a class="lux-drawer-bottom-link" href="confirmation.html">' + icon("bag") + ' Track Order</a>' +
          '<a class="lux-drawer-bottom-link" href="#footer">' + icon("chat") + ' Contact</a>' +
          '<a class="lux-drawer-bottom-link" href="https://www.instagram.com/" target="_blank" rel="noopener">' + icon("spark") + ' Instagram</a>' +
          '<a class="lux-drawer-bottom-link" href="#footer">' + icon("chat") + ' Policies</a>' +
        '</div><p class="lux-drawer-note">COD available, secure checkout, and new drops curated for quick mobile browsing.</p></section>' +
      '</div>';

    document.body.appendChild(drawerBackdrop);
    document.body.appendChild(drawer);
    drawerBackdrop.addEventListener("click", closeMenu);
    drawer.querySelector(".lux-drawer-close").addEventListener("click", closeMenu);
    drawer.querySelectorAll(".lux-accordion-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".lux-accordion-item");
        var open = item.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
    drawer.addEventListener("click", function (event) {
      var termLink = event.target.closest("[data-search-term]");
      if (termLink) {
        var term = termLink.getAttribute("data-search-term") || "";
        if (desktopSearch) {
          desktopSearch.value = term.replace("₹", "");
          desktopSearch.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
      if (event.target.closest("a")) closeMenu();
    });
  }

  function createSearchOverlay() {
    if (searchOverlay || !isMobile()) return;
    searchOverlay = document.createElement("div");
    searchOverlay.className = "lux-search-overlay";
    searchOverlay.setAttribute("role", "dialog");
    searchOverlay.setAttribute("aria-modal", "true");
    searchOverlay.setAttribute("aria-label", "Search ChicCharms");
    searchOverlay.innerHTML =
      '<div class="lux-search-panel">' +
        '<div class="lux-search-top"><label class="lux-search-field">' + icon("spark") + '<input id="luxSearchOverlayInput" type="search" placeholder="Search Korean, pearls, bridal..." autocomplete="off" /></label><button type="button" class="lux-search-close" aria-label="Close search">×</button></div>' +
        '<div class="lux-search-block"><p class="lux-search-heading">Trending Searches</p><div class="lux-chip-row" id="luxTrendingSearches"></div></div>' +
        '<div class="lux-search-block"><p class="lux-search-heading">Recent Searches</p><div class="lux-chip-row" id="luxRecentSearches"></div></div>' +
        '<div class="lux-search-block"><p class="lux-search-heading">Quick Categories</p><div class="lux-category-chips" id="luxSearchCategories"></div></div>' +
        '<div class="lux-search-block"><p class="lux-search-heading">Live Suggestions</p><div class="lux-suggestion-list" id="luxSearchSuggestions"></div></div>' +
        '<div class="lux-search-block"><p class="lux-search-heading">Recommended for you</p><div class="lux-search-products" id="luxSearchProducts"></div></div>' +
      '</div>';
    document.body.appendChild(searchOverlay);
    searchInputOverlay = document.getElementById("luxSearchOverlayInput");
    searchOverlay.querySelector(".lux-search-close").addEventListener("click", closeSearchOverlay);
    searchOverlay.addEventListener("click", function (event) {
      var chip = event.target.closest("[data-lux-search]");
      if (chip) {
        applySearchTerm(chip.getAttribute("data-lux-search") || "");
      }
    });
    searchInputOverlay.addEventListener("input", function () {
      renderSearchOverlay(searchInputOverlay.value);
      if (desktopSearch) {
        desktopSearch.value = searchInputOverlay.value;
        desktopSearch.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    searchInputOverlay.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        storeRecent(searchInputOverlay.value);
        closeSearchOverlay();
        scrollToShop();
      }
      if (event.key === "Escape") closeSearchOverlay();
    });
    renderSearchOverlay("");
  }

  function storeRecent(term) {
    term = String(term || "").trim();
    if (!term) return;
    try {
      var recent = JSON.parse(localStorage.getItem("chicRecentSearches") || "[]");
      recent = [term].concat(recent.filter(function (item) { return item.toLowerCase() !== term.toLowerCase(); })).slice(0, 5);
      localStorage.setItem("chicRecentSearches", JSON.stringify(recent));
    } catch (err) {}
  }

  function applySearchTerm(term) {
    if (!term) return;
    if (searchInputOverlay) searchInputOverlay.value = term;
    if (desktopSearch) {
      desktopSearch.value = term;
      desktopSearch.dispatchEvent(new Event("input", { bubbles: true }));
    }
    storeRecent(term);
    renderSearchOverlay(term);
  }

  function renderSearchOverlay(query) {
    if (!searchOverlay) return;
    var trending = ["Korean earrings", "Pearl drops", "Under ₹299", "Bridal edit", "Daily wear", "Minimal hoops"];
    var categories = ["Earrings", "Rings", "Necklaces", "Bracelets", "Anklets", "Gift sets"];
    var recent = [];
    try { recent = JSON.parse(localStorage.getItem("chicRecentSearches") || "[]"); } catch (err) { recent = []; }
    if (!recent.length) recent = ["Pearl", "Gold hoops", "Minimal"];
    var products = getProductCards(8);
    if (!products.length) products = fallbackProducts();
    var q = String(query || "").trim().toLowerCase();
    var suggestions = (q ? products.filter(function (p) { return p.name.toLowerCase().includes(q); }) : products).slice(0, 5);
    if (!suggestions.length) suggestions = products.slice(0, 4);

    document.getElementById("luxTrendingSearches").innerHTML = trending.map(chipHTML).join("");
    document.getElementById("luxRecentSearches").innerHTML = recent.map(chipHTML).join("");
    document.getElementById("luxSearchCategories").innerHTML = categories.map(function (label) {
      return '<button type="button" class="lux-category-chip" data-lux-search="' + label + '">' + label + '</button>';
    }).join("");
    document.getElementById("luxSearchSuggestions").innerHTML = suggestions.map(function (p) {
      return '<a class="lux-suggestion-item" href="' + p.url + '" onclick="localStorage.setItem(\'chicRecentSearches\', JSON.stringify([\'' + p.name.replace(/'/g, "\\'") + '\']))"><span>' + p.name + '</span><strong>' + p.price + '</strong></a>';
    }).join("");
    document.getElementById("luxSearchProducts").innerHTML = products.slice(0, 6).map(function (p) {
      return productHTML(p, "lux-search-product");
    }).join("");
  }

  function chipHTML(label) {
    return '<button type="button" class="lux-search-chip" data-lux-search="' + label + '">' + label + '</button>';
  }

  function openSearchOverlay() {
    createSearchOverlay();
    if (!searchOverlay) return;
    renderSearchOverlay(mobileSearch ? mobileSearch.value : "");
    searchOverlay.classList.add("is-open");
    document.body.classList.add("lux-search-open");
    setTimeout(function () {
      if (searchInputOverlay) {
        searchInputOverlay.value = mobileSearch ? mobileSearch.value : "";
        searchInputOverlay.focus();
      }
    }, 80);
  }

  function closeSearchOverlay() {
    if (!searchOverlay) return;
    searchOverlay.classList.remove("is-open");
    document.body.classList.remove("lux-search-open");
  }

  function createCommerceRails() {
    if (!isMobile() || document.querySelector(".mobile-commerce-rails")) return;
    var products = getProductCards(10);
    if (!products.length) products = fallbackProducts();
    var rails = [
      ["Trending Now", "Most-tapped pieces this week"],
      ["Just Dropped", "Fresh arrivals for fast browsing"],
      ["Under ₹299", "Premium shine, easy checkout"],
      ["Bridal Picks", "Soft statement pieces"],
      ["Daily Wear", "Lightweight favorites"]
    ];
    var section = document.createElement("section");
    section.className = "mobile-commerce-rails";
    section.setAttribute("aria-label", "Mobile shopping collections");
    section.innerHTML =
      '<div class="mobile-proof-strip"><div class="mobile-proof-card"><strong>4.8★</strong><span>Loved by shoppers</span></div><div class="mobile-proof-card"><strong>COD</strong><span>Available</span></div><div class="mobile-proof-card"><strong>₹399+</strong><span>Free shipping</span></div></div>' +
      rails.map(function (rail, railIndex) {
        var shifted = products.slice(railIndex).concat(products.slice(0, railIndex)).slice(0, 7);
        return '<div class="mobile-rail"><div class="mobile-rail-head"><div><p class="mobile-rail-heading">' + rail[0] + '</p><h3 class="mobile-rail-title">' + rail[1] + '</h3></div><a class="mobile-rail-link" href="#bestsellers">View all</a></div><div class="mobile-rail-track">' +
          shifted.map(function (p) { return productHTML(p, "mobile-rail-card"); }).join("") +
          '</div></div>';
      }).join("");
    var bestsellers = document.getElementById("bestsellers");
    if (bestsellers && bestsellers.parentNode) bestsellers.parentNode.insertBefore(section, bestsellers);
  }

  function refreshCommerceRails() {
    var rails = document.querySelector(".mobile-commerce-rails");
    if (!rails) return;
    var products = getProductCards(10);
    if (!products.length) return;
    rails.querySelectorAll(".mobile-rail-track").forEach(function (track, index) {
      var shifted = products.slice(index).concat(products.slice(0, index)).slice(0, 7);
      track.innerHTML = shifted.map(function (p) { return productHTML(p, "mobile-rail-card"); }).join("");
    });
    renderSearchOverlay(searchInputOverlay ? searchInputOverlay.value : "");
  }

  function initRipples() {
    document.addEventListener("click", function (event) {
      var target = event.target.closest("button, .mobile-commerce-icon, .lux-drawer-link, .lux-search-chip, .lux-category-chip, .btn, .btn-add-cart");
      if (!target || !isMobile()) return;
      var rect = target.getBoundingClientRect();
      if (getComputedStyle(target).position === "static") target.style.position = "relative";
      var ripple = document.createElement("span");
      ripple.className = "lux-ripple";
      ripple.style.left = event.clientX - rect.left + "px";
      ripple.style.top = event.clientY - rect.top + "px";
      target.appendChild(ripple);
      ripple.addEventListener("animationend", function () { ripple.remove(); }, { once: true });
    });
  }

  function scrollToShop() {
    var shop = document.getElementById("bestsellers");
    if (!shop) return;
    shop.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function syncCartCount() {
    var count = 0;
    try {
      var cart = JSON.parse(localStorage.getItem("cart") || "[]");
      count = cart.reduce(function (sum, item) {
        return sum + Number(item.quantity || 1);
      }, 0);
    } catch (err) {
      count = 0;
    }

    document.querySelectorAll(".mobile-cart-count, .d7-cart-count").forEach(function (el) {
      el.textContent = count ? String(count) : "";
    });
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      createDrawer();
      if (drawer && drawer.classList.contains("is-open")) closeMenu();
      else openMenu();
    });

    if (navLinks) navLinks.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });
  }

  if (mobileSearch && desktopSearch) {
    mobileSearch.addEventListener("focus", function (event) {
      if (!isMobile()) return;
      event.preventDefault();
      openSearchOverlay();
    });

    mobileSearch.addEventListener("click", function (event) {
      if (!isMobile()) return;
      event.preventDefault();
      openSearchOverlay();
    });

    mobileSearch.addEventListener("input", function () {
      desktopSearch.value = mobileSearch.value;
      desktopSearch.dispatchEvent(new Event("input", { bubbles: true }));
    });

    mobileSearch.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        desktopSearch.value = mobileSearch.value;
        desktopSearch.dispatchEvent(new Event("input", { bubbles: true }));
        scrollToShop();
      }
    });
  }

  document.querySelectorAll("[data-mobile-category]").forEach(function (pill) {
    pill.addEventListener("click", function () {
      var category = pill.getAttribute("data-mobile-category") || "all";
      if (categoryFilter) {
        categoryFilter.value = category;
        categoryFilter.dispatchEvent(new Event("change", { bubbles: true }));
      }
      scrollToShop();
    });
  });

  document.querySelectorAll(".mobile-bottom-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".mobile-bottom-tab").forEach(function (item) {
        item.classList.remove("is-active");
      });
      tab.classList.add("is-active");
    });
  });

  if (
    promoTrack &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    window.setInterval(function () {
      if (!isMobile() || promoTrack.matches(":hover")) return;
      var firstCard = promoTrack.querySelector(".mobile-promo-card");
      if (!firstCard) return;

      var cardWidth = firstCard.getBoundingClientRect().width + 12;
      var nearEnd =
        promoTrack.scrollLeft + promoTrack.clientWidth >=
        promoTrack.scrollWidth - cardWidth;

      promoTrack.scrollTo({
        left: nearEnd ? 0 : promoTrack.scrollLeft + cardWidth,
        behavior: "smooth",
      });
    }, 4200);
  }

  window.addEventListener("scroll", setCompactHeader, { passive: true });
  window.addEventListener("storage", syncCartCount);
  document.addEventListener("DOMContentLoaded", function () {
    createDrawer();
    createSearchOverlay();
    createCommerceRails();
    initRipples();
    setCompactHeader();
    syncCartCount();
  });

  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeMenu();
      closeSearchOverlay();
    }
  });

  var productContainer = document.getElementById("products-container");
  if (productContainer) {
    var railTimer;
    new MutationObserver(function () {
      clearTimeout(railTimer);
      railTimer = setTimeout(refreshCommerceRails, 120);
    }).observe(productContainer, { childList: true });
  }

  var originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    originalSetItem.apply(this, arguments);
    if (key === "cart") syncCartCount();
  };
})();
