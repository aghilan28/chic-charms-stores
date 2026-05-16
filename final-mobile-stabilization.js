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
    return [
      '<a class="cc-final-product" href="' + product.url + '">',
      '<img src="' + product.img + '" alt="' + escapeAttr(product.name) + '" loading="lazy" decoding="async">',
      '<span>' + product.name + '</span>',
      '<strong>' + product.price + '</strong>',
      '</a>'
    ].join("");
  }

  function rail(title, kicker, products) {
    return [
      '<section class="cc-final-section">',
      '<div class="cc-final-head"><div><p class="cc-final-kicker">' + kicker + '</p><h2 class="cc-final-title">' + title + '</h2></div><a class="cc-final-link" href="#bestsellers">View all</a></div>',
      '<div class="cc-final-rail">',
      products.map(productCard).join(""),
      '</div></section>'
    ].join("");
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
    var home = document.createElement("section");
    home.id = HOME_ID;
    home.className = "cc-final-home";
    home.setAttribute("aria-label", "ChicCharms mobile luxury storefront");
    home.innerHTML = [
      '<button class="cc-final-search-button" type="button" data-final-search><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.8-3.8"></path></svg><span>Search pearls, hoops, Korean edits</span><strong>Search</strong></button>',
      '<nav class="cc-final-category-rail" aria-label="Quick categories">',
      categoryLink("New", "all", "images/editorial-light-meets-gold.png"),
      categoryLink("Daily", "everyday-elegance", "images/style-everyday-elegance.png"),
      categoryLink("Pearls", "heritage-muse", "images/story-soft-pearl-drop.png"),
      categoryLink("Romance", "modern-romance", "images/style-modern-romance.jpg"),
      categoryLink("Evening", "after-dark", "images/style-after-dark.png"),
      categoryLink("Under 299", "all", "images/editorial-korean-morning-coffee.png"),
      '</nav>',
      '<section class="cc-final-hero"><a class="cc-final-hero-card" href="#bestsellers"><img src="images/hero-quiet-luxury-main.png" alt="ChicCharms quiet luxury jewelry editorial" decoding="async"><div class="cc-final-hero-content"><p class="cc-final-kicker">Quiet luxury, easy checkout</p><h1>ChicCharms</h1><p>Jewelry edits that look considered, feel light, and stay under Rs.299.</p><span class="cc-final-cta">Shop the edit</span></div></a></section>',
      '<section class="cc-final-trust" aria-label="Shopping promises"><span>COD available pan-India</span><span>Ships within 24 hours</span><span>Skin-friendly lightweight finish</span></section>',
      rail("Trending Pieces", "Trending now", products),
      rail("New Arrivals", "Just dropped", rotated),
      '<section class="cc-final-section cc-final-section--break"><article class="cc-final-editorial"><p class="cc-final-kicker">Editorial story</p><h2 class="cc-final-title">Jewelry that finishes the mood.</h2><p class="cc-final-copy">A tighter, calmer way to browse: fewer distractions, stronger imagery, and product paths that move naturally toward checkout.</p><img src="images/editorial-soft-date-night.png" alt="Editorial jewelry styling" loading="lazy" decoding="async"></article></section>',
      '<section class="cc-final-section"><div class="cc-final-head"><div><p class="cc-final-kicker">Collections</p><h2 class="cc-final-title">Shop by feeling</h2></div></div><div class="cc-final-collection-grid">',
      collectionCard("Everyday Elegance", "Light pieces for repeat wear", "everyday-elegance", "images/editorial-everyday-hoops.png"),
      collectionCard("Modern Romance", "Pearls, bows, and softer shine", "modern-romance", "images/style-modern-romance.jpg"),
      collectionCard("After Dark", "Statement sparkle without weight", "after-dark", "images/style-after-dark.png"),
      '</div></section>',
      '<section class="cc-final-section cc-final-section--break"><div class="cc-final-head"><div><p class="cc-final-kicker">Social proof</p><h2 class="cc-final-title">Loved in daily rotation</h2></div></div><div class="cc-final-proof"><blockquote>"The finish looks premium, the pieces feel light, and the styling works from coffee runs to functions."</blockquote></div></section>',
      '<section class="cc-final-section"><div class="cc-final-head"><div><p class="cc-final-kicker">Community</p><h2 class="cc-final-title">Styled by you</h2></div></div><div class="cc-final-gallery-rail"><img src="images/avatar-sahana-cafe-edit.png" alt="" loading="lazy" decoding="async"><img src="images/avatar-ritu-weekend-edit.jpg" alt="" loading="lazy" decoding="async"><img src="images/avatar-subashree-event-edit.jpeg" alt="" loading="lazy" decoding="async"><img src="images/newsletter-inner-circle-portrait.png" alt="" loading="lazy" decoding="async"></div></section>',
      '<section class="cc-final-section"><div class="cc-final-head"><div><p class="cc-final-kicker">Reviews</p><h2 class="cc-final-title">Customer notes</h2></div></div><div class="cc-final-review-grid"><article class="cc-final-review"><strong>4.8 stars from repeat shoppers</strong><p>Delicate, polished, and easy to pair with Indian and western outfits.</p></article><article class="cc-final-review"><strong>Gift-ready packaging</strong><p>Small pieces arrive feeling thoughtful without slowing checkout.</p></article></div></section>',
      '<section class="cc-final-section"><div class="cc-final-head"><div><p class="cc-final-kicker">FAQ</p><h2 class="cc-final-title">Before you order</h2></div><a class="cc-final-link" href="faq.html">All FAQ</a></div><div class="cc-final-faq"><details><summary>Is COD available?</summary><p>Yes, COD is available on eligible orders across India.</p></details><details><summary>When will my order ship?</summary><p>Most orders are packed quickly and usually ship within 24 hours.</p></details></div></section>',
      '<section class="cc-final-section cc-final-section--break"><article class="cc-final-newsletter"><p class="cc-final-kicker">Inner circle</p><h2 class="cc-final-title">Get first access</h2><p class="cc-final-copy">New edits, limited drops, and styling notes without clutter.</p><form><input type="email" placeholder="Email address" aria-label="Email address"><button type="submit">Join</button></form></article></section>',
      '<footer class="cc-final-footer" id="footer"><div class="cc-final-footer-brand">ChicCharms</div><p class="cc-final-copy">Premium jewelry shopping with COD, fast shipping, and handpicked weekly edits.</p><nav aria-label="Footer links"><a href="about.html">About</a><a href="index.html#bestsellers">Collections</a><a href="shipping.html">Shipping</a><a href="returns.html">Returns</a><a href="contact.html">Contact</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="faq.html">FAQ</a></nav></footer>'
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
  }

  function hardenImagesAndRails() {
    if (!isMobile()) return;
    $all("img").forEach(function (img) {
      img.decoding = "async";
      if (!img.hasAttribute("loading") && !img.closest(".cc-final-hero-card, .product-img-frame")) {
        img.loading = "lazy";
      }
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
