(function () {
  "use strict";

  var mobileQuery = window.matchMedia("(max-width: 1023px)");
  var HOME_ID = "ccFinalHome";
  var ANNOUNCEMENT_ID = "ccFinalAnnouncement";

  function isMobile() {
    return mobileQuery.matches;
  }

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function escapeAttr(value) {
    return String(value || "").replace(/"/g, "&quot;");
  }

  function productFallbacks() {
    return [
      { name: "Everyday Gold Hoops", price: "Rs.199", img: "images/editorial-everyday-hoops.png", url: "index.html#bestsellers" },
      { name: "Pearl Drop Earrings", price: "Rs.249", img: "images/story-soft-pearl-drop.png", url: "index.html#bestsellers" },
      { name: "Korean Bow Studs", price: "Rs.299", img: "images/editorial-korean-morning-coffee.png", url: "index.html#bestsellers" },
      { name: "Minimal Luxe Studs", price: "Rs.179", img: "images/editorial-minimal-soul-closeup.png", url: "index.html#bestsellers" },
      { name: "Heritage Muse Drops", price: "Rs.299", img: "images/style-heritage-muse.png", url: "index.html#bestsellers" },
      { name: "Golden Hour Hoops", price: "Rs.229", img: "images/editorial-light-meets-gold.png", url: "index.html#bestsellers" }
    ];
  }

  function getProducts(limit) {
    var cards = $all(".product-card-lux").map(function (card, index) {
      var image = $(".lux-img-container img", card);
      var name = $(".lux-product-name", card);
      var price = $(".lux-price", card);
      var link = $(".lux-img-link, .lux-product-name", card);
      return {
        img: image ? image.getAttribute("src") : "",
        name: name ? name.textContent.trim() : "ChicCharms Piece " + (index + 1),
        price: price ? price.textContent.trim().replace("â‚¹", "Rs.") : "Rs.299",
        url: link ? link.getAttribute("href") || "index.html#bestsellers" : "index.html#bestsellers"
      };
    }).filter(function (item) {
      return item.name && item.img;
    });

    if (!cards.length) cards = productFallbacks();
    return cards.slice(0, limit || 10);
  }

  function productCard(product) {
    var numeric = Number(String(product.price || "").replace(/[^\d.]/g, "")) || 299;
    var oldPrice = Math.max(numeric + 80, Math.ceil(numeric * 1.45));
    var discount = Math.max(15, Math.round(((oldPrice - numeric) / oldPrice) * 100));
    return [
      '<a class="cc-final-product" href="' + product.url + '">',
      '<span class="cc-final-product-media">',
      '<img src="' + product.img + '" alt="' + escapeAttr(product.name) + '" loading="lazy" decoding="async">',
      '<i class="cc-final-badge">' + (discount > 35 ? "Viral" : "Hot") + '</i>',
      '<button class="cc-final-heart" type="button" aria-label="Wishlist" data-final-card-action>♡</button>',
      '<button class="cc-final-quick" type="button" aria-label="Quick add" data-final-card-action>+</button>',
      '</span>',
      '<span class="cc-final-product-name">' + product.name + '</span>',
      '<span class="cc-final-price-row"><strong>' + product.price + '</strong><s>Rs.' + oldPrice + '</s><em>' + discount + '% off</em></span>',
      '</a>'
    ].join("");
  }

  function rail(title, kicker, products, modifier) {
    return [
      '<section class="cc-final-section ' + (modifier || "") + '">',
      '<div class="cc-final-head"><div><p class="cc-final-kicker">' + kicker + '</p><h2 class="cc-final-title">' + title + '</h2></div><a class="cc-final-link" href="#bestsellers">View all</a></div>',
      '<div class="cc-final-rail">',
      products.map(productCard).join(""),
      '</div></section>'
    ].join("");
  }

  function promoCard(title, copy, tag, slug, img) {
    return '<a class="cc-final-promo-card" href="#bestsellers" data-final-category="' + slug + '">' +
      '<img src="' + img + '" alt="" loading="eager" decoding="async" fetchpriority="high">' +
      '<span>' + tag + '</span><strong>' + title + '</strong><em>' + copy + '</em></a>';
  }

  function buildAnnouncement() {
    if ($("#" + ANNOUNCEMENT_ID)) return;
    var items = ["COD available", "Ships in 24 hours", "Skin-friendly finish", "Free shipping above Rs.399", "Weekly new drops", "Secure checkout"];
    var bar = document.createElement("div");
    bar.id = ANNOUNCEMENT_ID;
    bar.className = "cc-final-announcement";
    bar.innerHTML = '<div class="cc-final-announcement-track">' + items.concat(items).map(function (item) {
      return "<span>" + item + "</span>";
    }).join("") + "</div>";
    var navbar = $("#navbar");
    if (navbar && navbar.parentNode) navbar.parentNode.insertBefore(bar, navbar);
  }

  function categoryLink(label, slug, img) {
    return '<a class="cc-final-category" href="#bestsellers" data-final-category="' + slug + '">' +
      '<img src="' + img + '" alt="" loading="lazy" decoding="async"><b>' + label + '</b></a>';
  }

  function collectionCard(label, copy, slug, img) {
    return '<a class="cc-final-collection" href="#bestsellers" data-final-category="' + slug + '">' +
      '<img src="' + img + '" alt="" loading="lazy" decoding="async"><div><strong>' + label + '</strong><span>' + copy + '</span></div></a>';
  }

  function buildHome() {
    if (!isMobile() || $("#" + HOME_ID) || !$("#bestsellers")) return;
    buildAnnouncement();

    var products = getProducts(12);
    var rotated = products.slice(3).concat(products.slice(0, 3));
    var viral = products.slice(1).concat(products.slice(0, 1));
    var under = products.slice(2).concat(products.slice(0, 2));
    var home = document.createElement("section");
    home.id = HOME_ID;
    home.className = "cc-final-home";
    home.setAttribute("aria-label", "ChicCharms mobile luxury storefront");
    home.innerHTML = [
      '<button class="cc-final-search-button" type="button" data-final-search><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.8-3.8"></path></svg><span>Search pearls, hoops, Korean edits</span><strong>Search</strong></button>',
      '<nav class="cc-final-category-rail" aria-label="Quick categories">',
      categoryLink("Earrings", "everyday-elegance", "images/editorial-everyday-hoops.png"),
      categoryLink("Korean", "after-dark", "images/editorial-korean-morning-coffee.png"),
      categoryLink("Bridal", "heritage-muse", "images/style-heritage-muse.png"),
      categoryLink("Pearl", "heritage-muse", "images/story-soft-pearl-drop.png"),
      categoryLink("Daily Wear", "everyday-elegance", "images/style-everyday-elegance.png"),
      categoryLink("Minimal", "everyday-elegance", "images/editorial-minimal-soul-closeup.png"),
      categoryLink("Gold", "modern-romance", "images/editorial-light-meets-gold.png"),
      categoryLink("Party", "after-dark", "images/style-after-dark.png"),
      '</nav>',
      '<section class="cc-final-promo-rail" aria-label="Featured offers">',
      promoCard("New Arrivals", "Fresh drops under Rs.299", "Just In", "all", "images/editorial-light-meets-gold.png"),
      promoCard("Under Rs.299", "Cute picks, easy checkout", "Offer", "all", "images/editorial-everyday-hoops.png"),
      promoCard("Korean Edit", "Soft bows, pearls, shine", "Viral", "after-dark", "images/editorial-korean-morning-coffee.png"),
      promoCard("Bridal Picks", "Festive glow without weight", "Wedding", "heritage-muse", "images/style-heritage-muse.png"),
      '</section>',
      '<section class="cc-final-trust" aria-label="Shopping promises"><span>COD</span><span>Ships 24h</span><span>Under Rs.299</span></section>',
      rail("Trending Products", "Everyone's adding", products, "cc-final-section--tight"),
      rail("Viral Picks", "Instagram-loved", viral, "cc-final-section--tight"),
      rail("New Arrivals", "Fresh drops", rotated, "cc-final-section--tight"),
      rail("Under Rs.299", "Budget cute", under, "cc-final-section--tight"),
      rail("Korean Collection", "Soft-girl sparkle", rotated.slice(1).concat(rotated.slice(0, 1)), "cc-final-section--tight"),
      rail("Bridal Picks", "Festive ready", products.slice(4).concat(products.slice(0, 4)), "cc-final-section--tight"),
      '<section class="cc-final-section"><div class="cc-final-head"><div><p class="cc-final-kicker">Collections</p><h2 class="cc-final-title">Shop by feeling</h2></div></div><div class="cc-final-collection-grid">',
      collectionCard("Everyday Elegance", "Light pieces for repeat wear", "everyday-elegance", "images/editorial-everyday-hoops.png"),
      collectionCard("Modern Romance", "Pearls, bows, and softer shine", "modern-romance", "images/style-modern-romance.jpg"),
      collectionCard("After Dark", "Statement sparkle without weight", "after-dark", "images/style-after-dark.png"),
      '</div></section>',
      '<section class="cc-final-section"><div class="cc-final-head"><div><p class="cc-final-kicker">Community Looks</p><h2 class="cc-final-title">Styled by the girls</h2></div></div><div class="cc-final-gallery-rail"><img src="images/avatar-sahana-cafe-edit.png" alt="" loading="lazy" decoding="async"><img src="images/avatar-ritu-weekend-edit.jpg" alt="" loading="lazy" decoding="async"><img src="images/avatar-subashree-event-edit.jpeg" alt="" loading="lazy" decoding="async"><img src="images/newsletter-inner-circle-portrait.png" alt="" loading="lazy" decoding="async"></div></section>',
      '<section class="cc-final-section"><div class="cc-final-head"><div><p class="cc-final-kicker">Reviews</p><h2 class="cc-final-title">Real shopper notes</h2></div></div><div class="cc-final-review-grid"><article class="cc-final-review"><strong>4.8 stars</strong><p>Looks cute in selfies and feels light for full-day wear.</p></article><article class="cc-final-review"><strong>Gift-ready</strong><p>Packaging feels sweet and premium without slowing checkout.</p></article></div></section>',
      '<footer class="cc-final-footer" id="footer"><div class="cc-final-footer-brand">ChicCharms</div><p class="cc-final-copy">Trendy Indian accessories, COD, fast shipping, and weekly viral drops.</p><nav aria-label="Footer links"><a href="about.html">About</a><a href="shop.html">Shop</a><a href="shipping.html">Shipping</a><a href="returns.html">Returns</a><a href="contact.html">Contact</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="faq.html">FAQ</a></nav></footer>'
    ].join("");

    var bestsellers = $("#bestsellers");
    bestsellers.parentNode.insertBefore(home, bestsellers);
  }

  function removeDuplicateGeneratedShells() {
    if (!isMobile()) return;
    $all(".cc-mobile-brand, .mobile-commerce-rails, .cc-mobile-footer, .cc-loading-screen, .cc-onboarding-toast, .cc-recent-purchase, .cc-mini-cart").forEach(function (node) {
      node.remove();
    });
    var navs = $all(".mobile-bottom-nav");
    navs.forEach(function (nav, index) {
      if (index > 0) nav.remove();
    });
  }

  function activateCategory(slug) {
    var filter = $("#categoryFilter");
    if (filter) {
      filter.value = slug || "all";
      filter.dispatchEvent(new Event("change", { bubbles: true }));
    }
    var target = $("#shopControls") || $("#bestsellers");
    if (target) {
      var header = $("#navbar");
      var offset = (header ? header.offsetHeight : 72) + 44;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  }

  function openSearchOverlay() {
    var overlay = $(".lux-search-overlay");
    var input = $("#luxSearchOverlayInput");
    if (!overlay) {
      var trigger = $("#mobileCommerceSearch");
      if (trigger) {
        trigger.focus();
        trigger.click();
      }
      overlay = $(".lux-search-overlay");
      input = $("#luxSearchOverlayInput");
    }
    if (!overlay) return;
    overlay.classList.add("is-open");
    document.body.classList.add("lux-search-open");
    window.setTimeout(function () {
      input = input || $("#luxSearchOverlayInput");
      if (input) input.focus({ preventScroll: true });
    }, 80);
  }

  function closeSearchOverlay() {
    var overlay = $(".lux-search-overlay");
    if (overlay) overlay.classList.remove("is-open");
    document.body.classList.remove("lux-search-open");
    stabilizeScrollState();
  }

  function closeDrawer() {
    var drawer = $(".lux-mobile-drawer");
    var backdrop = $(".lux-mobile-drawer-backdrop");
    if (drawer) drawer.classList.remove("is-open");
    if (backdrop) backdrop.classList.remove("is-open");
    var menu = $("#mobileCommerceMenu");
    if (menu) menu.setAttribute("aria-expanded", "false");
    document.body.classList.remove("lux-drawer-open", "d7-menu-open");
    stabilizeScrollState();
  }

  function bindFinalInteractions() {
    if (window.__ccFinalInteractionsBound) return;
    window.__ccFinalInteractionsBound = true;

    document.addEventListener("click", function (event) {
      if (event.target.closest(".lux-drawer-close, .lux-mobile-drawer-backdrop")) {
        event.preventDefault();
        event.stopPropagation();
        closeDrawer();
      }
    }, true);

    document.addEventListener("click", function (event) {
      var cardAction = event.target.closest("[data-final-card-action]");
      if (cardAction) {
        event.preventDefault();
        event.stopPropagation();
        cardAction.classList.toggle("is-active");
        return;
      }

      var search = event.target.closest("[data-final-search]");
      if (search) {
        openSearchOverlay();
        return;
      }

      if (event.target.closest(".lux-search-close")) {
        closeSearchOverlay();
        return;
      }

      if (event.target.closest(".lux-drawer-close, .lux-mobile-drawer-backdrop")) {
        closeDrawer();
        return;
      }

      var category = event.target.closest("[data-final-category]");
      if (category) {
        event.preventDefault();
        activateCategory(category.getAttribute("data-final-category") || "all");
      }

      if (event.target.closest(".lux-mobile-drawer a")) {
        closeDrawer();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      closeSearchOverlay();
      closeDrawer();
    });

    document.addEventListener("submit", function (event) {
      if (event.target.closest(".cc-final-newsletter")) {
        event.preventDefault();
        event.target.reset();
      }
    });
  }

  function stabilizeScrollState() {
    if (!isMobile()) return;
    var modalOpen = $(".lux-mobile-drawer.is-open, .lux-search-overlay.is-open, .cc-filter-sheet.is-open, .cc-bottom-sheet.is-open, .cc-newsletter-modal.is-open, .pdp-image-modal.is-open");
    if (!modalOpen) {
      document.body.classList.remove("lux-drawer-open", "lux-search-open", "cc-modal-open", "d7-menu-open");
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.touchAction = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.filter = "";
      document.body.style.filter = "";
    }
    document.documentElement.style.overflowX = "hidden";
    document.body.style.overflowX = "hidden";
    if (!document.body.style.minHeight) document.body.style.minHeight = "100dvh";
    $all(".lux-search-panel, .lux-drawer-scroll, .cc-filter-sheet, .cc-bottom-sheet, .cc-newsletter-modal").forEach(function (node) {
      node.style.webkitOverflowScrolling = "touch";
    });
  }

  function hardenImagesAndRails() {
    if (!isMobile()) return;
    $all("img").forEach(function (img) {
      img.decoding = "async";
      if (!img.hasAttribute("loading") && !img.closest(".cc-final-hero-card, .product-img-frame")) {
        img.loading = "lazy";
      }
    });
    $all(".cc-final-category-rail, .cc-final-promo-rail, .cc-final-rail, .cc-final-gallery-rail, .product-gallery-thumbs, .related-grid, .pdp-review-rail").forEach(function (rail) {
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

  function bindGeneratedOverlayControls() {
    $all(".lux-drawer-close, .lux-mobile-drawer-backdrop").forEach(function (control) {
      if (control.dataset.ccFinalCloseBound) return;
      control.dataset.ccFinalCloseBound = "1";
      control.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        closeDrawer();
      }, true);
      control.addEventListener("pointerup", function (event) {
        event.preventDefault();
        event.stopPropagation();
        closeDrawer();
      }, true);
    });

    $all(".lux-search-close").forEach(function (control) {
      if (control.dataset.ccFinalCloseBound) return;
      control.dataset.ccFinalCloseBound = "1";
      control.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        closeSearchOverlay();
      }, true);
    });
  }

  function syncHomeRails() {
    var home = $("#" + HOME_ID);
    if (!home) return;
    var products = getProducts(12);
    var rails = $all(".cc-final-rail", home);
    if (rails[0]) rails[0].innerHTML = products.slice(0, 8).map(productCard).join("");
    if (rails[1]) rails[1].innerHTML = products.slice(3).concat(products.slice(0, 3)).slice(0, 8).map(productCard).join("");
  }

  function init() {
    if (!isMobile()) return;
    removeDuplicateGeneratedShells();
    buildHome();
    bindFinalInteractions();
    bindGeneratedOverlayControls();
    hardenImagesAndRails();
    stabilizeScrollState();

    var products = $("#products-container");
    if (products && !window.__ccFinalProductObserver) {
      window.__ccFinalProductObserver = true;
      var timer;
      new MutationObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          removeDuplicateGeneratedShells();
          bindGeneratedOverlayControls();
          syncHomeRails();
          hardenImagesAndRails();
          stabilizeScrollState();
        }, 120);
      }).observe(products, { childList: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("load", init);
  window.addEventListener("pageshow", init);
  window.addEventListener("resize", function () {
    clearTimeout(window.__ccFinalResizeTimer);
    window.__ccFinalResizeTimer = setTimeout(init, 120);
  }, { passive: true });
  window.setTimeout(init, 450);
  window.setTimeout(stabilizeScrollState, 1200);
})();
