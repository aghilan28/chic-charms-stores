(function () {
  "use strict";

  var mobileQuery = window.matchMedia("(max-width: 1023px)");
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function isMobile() {
    return mobileQuery.matches;
  }

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function money(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch (err) {
      return [];
    }
  }

  function getProductCards(limit) {
    var cards = $all(".product-card-lux").map(function (card, index) {
      var img = $(".lux-img-container img", card);
      var name = $(".lux-product-name", card);
      var price = $(".lux-price", card);
      var link = $(".lux-img-link, .lux-product-name", card);
      return {
        url: link ? link.getAttribute("href") || "index.html#bestsellers" : "index.html#bestsellers",
        img: img ? img.getAttribute("src") || "images/editorial-everyday-hoops.png" : "images/editorial-everyday-hoops.png",
        name: name ? name.textContent.trim() : "Curated ChicCharms Piece " + (index + 1),
        price: price ? price.textContent.trim() : "₹299",
      };
    });

    if (!cards.length) {
      cards = [
        { url: "index.html#bestsellers", img: "images/editorial-everyday-hoops.png", name: "Everyday Hoops", price: "₹199" },
        { url: "index.html#bestsellers", img: "images/story-soft-pearl-drop.png", name: "Pearl Drop Earrings", price: "₹249" },
        { url: "index.html#bestsellers", img: "images/editorial-korean-morning-coffee.png", name: "Korean Bow Studs", price: "₹299" },
        { url: "index.html#bestsellers", img: "images/editorial-minimal-soul-closeup.png", name: "Minimal Luxe Studs", price: "₹179" },
        { url: "index.html#bestsellers", img: "images/style-heritage-muse.png", name: "Bridal Muse Drops", price: "₹299" },
        { url: "index.html#bestsellers", img: "images/editorial-light-meets-gold.png", name: "Golden Hour Hoops", price: "₹229" },
      ];
    }

    return cards.slice(0, limit || 12);
  }

  function productCard(product, badge) {
    return '<a class="cc-product-card cc-magnetic" href="' + product.url + '">' +
      '<img src="' + product.img + '" alt="' + escapeAttr(product.name) + '" loading="lazy" decoding="async" />' +
      '<em>' + badge + '</em>' +
      '<span>' + product.name + '</span>' +
      '<strong>' + product.price + '</strong>' +
    '</a>';
  }

  function escapeAttr(value) {
    return String(value || "").replace(/"/g, "&quot;");
  }

  function createLoadingScreen() {
    if (!isMobile() || $(".cc-loading-screen")) return;
    var loader = document.createElement("div");
    loader.className = "cc-loading-screen";
    loader.innerHTML = '<div class="cc-loading-mark"><span class="cc-loading-gem"></span><span>ChicCharms</span></div>';
    document.body.appendChild(loader);
    window.setTimeout(function () {
      loader.classList.add("is-hidden");
      window.setTimeout(function () { loader.remove(); }, 520);
    }, prefersReduced.matches ? 120 : 720);
  }

  function cleanupStuckVisualState() {
    var activeModal =
      $(".cc-bottom-sheet.is-open") ||
      $(".cc-newsletter-modal.is-open") ||
      $(".lux-search-overlay.is-open") ||
      $(".lux-mobile-drawer.is-open");

    if (!activeModal) {
      document.body.classList.remove("cc-modal-open", "lux-search-open", "lux-drawer-open", "d7-menu-open");
      document.documentElement.style.filter = "";
      document.body.style.filter = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }

    $all(".cc-loading-screen.is-hidden").forEach(function (el) { el.remove(); });
    $all(".cc-newsletter-backdrop:not(.is-open), .cc-bottom-sheet-backdrop:not(.is-open), .lux-mobile-drawer-backdrop:not(.is-open)").forEach(function (el) {
      el.style.backdropFilter = "none";
      el.style.webkitBackdropFilter = "none";
    });
  }

  function createBrandHomepage() {
    if (!isMobile() || $(".cc-mobile-brand") || !$("#bestsellers")) return;

    var products = getProductCards(12);
    var images = [
      "images/editorial-everyday-hoops.png",
      "images/editorial-light-meets-gold.png",
      "images/editorial-korean-morning-coffee.png",
      "images/editorial-minimal-soul-closeup.png",
      "images/style-heritage-muse.png",
      "images/newsletter-inner-circle-portrait.png",
    ];

    var brand = document.createElement("section");
    brand.className = "cc-mobile-brand cc-page-enter";
    brand.setAttribute("aria-label", "ChicCharms premium mobile commerce");
    brand.innerHTML =
      '<div class="cc-announce"><div class="cc-announce-track">' +
        repeatItems(["COD Available", "Ships in 24 Hours", "Hypoallergenic", "Skin Friendly", "Lightweight Jewelry", "Anti Tarnish", "Handpicked Weekly"], 2).map(function (item) {
          return "<span>" + item + "</span>";
        }).join("") +
      '</div></div>' +
      '<section class="cc-section cc-reveal"><div class="cc-section-head"><div><p class="cc-kicker">Luxury highlights</p><h2 class="cc-title">Small pieces, big mood</h2><p class="cc-copy">Premium edits designed for fast, visual mobile browsing.</p></div><a class="cc-link" href="#bestsellers">Shop</a></div><div class="cc-rail">' +
        promoCard(images[1], "Curated under ₹299", "Fresh gold-toned favorites") +
        promoCard(images[2], "Going viral", "Korean-inspired pieces") +
        promoCard(images[4], "Bridal picks", "Soft statement jewelry") +
      '</div></section>' +
      '<section class="cc-section cc-reveal"><div class="cc-trust-rail">' +
        ["COD Available", "Ships in 24 Hours", "Hypoallergenic", "Skin Friendly", "Lightweight Jewelry", "Anti Tarnish", "Handpicked Weekly"].map(function (item) {
          return '<span class="cc-trust-badge">✓ ' + item + '</span>';
        }).join("") +
      '</div><div class="cc-proof-grid">' +
        proof("12,000+", "Loved by women across India") +
        proof("Trending", "Popular this week") +
        proof("₹299", "Curated under easy prices") +
        proof("Weekly", "Handpicked new drops") +
      '</div></section>' +
      commerceRail("Trending Now", "Most-tapped pieces this week", products, "Selling fast") +
      commerceRail("Going Viral", "Pinterest-ready jewelry moments", rotate(products, 2), "5 viewing") +
      '<section class="cc-section cc-reveal"><div class="cc-section-head"><div><p class="cc-kicker">Discovery</p><h2 class="cc-title">Jewelry moodboard</h2><p class="cc-copy">A Pinterest-style edit for browsing by feeling.</p></div></div><div class="cc-masonry">' +
        images.map(function (img, index) {
          var labels = ["Golden hour hoops", "Minimal coffee-date studs", "Heritage muse sparkle", "Pearl softness", "Daily wear shine", "Inner-circle picks"];
          var ratio = index % 2 ? "1 / 1.42" : "1 / 1.08";
          return '<a class="cc-masonry-card cc-magnetic" href="#bestsellers" style="--ratio:' + ratio + '"><img src="' + img + '" alt="' + labels[index] + '" loading="lazy" decoding="async" /><span>' + labels[index] + '</span></a>';
        }).join("") +
      '</div></section>' +
      commerceRail("Most Wishlisted", "Soft favorites saved again and again", rotate(products, 4), "Only 3 left") +
      '<section class="cc-section cc-reveal"><div class="cc-section-head"><div><p class="cc-kicker">Lookbook</p><h2 class="cc-title">Complete the look</h2><p class="cc-copy">Swipe editorial pairings for easy styling.</p></div></div><div class="cc-lookbook">' +
        lookCard(images[0], "Daily Essentials", "Hoops, studs, and light sparkle for every day.") +
        lookCard(images[3], "Minimal Luxe", "Quiet pieces that make a close-up feel expensive.") +
        lookCard(images[4], "Bridal Softness", "Romantic shine for intimate celebrations.") +
      '</div></section>' +
      '<section class="cc-section cc-reveal"><div class="cc-section-head"><div><p class="cc-kicker">Bundle psychology</p><h2 class="cc-title">Complete the set</h2><p class="cc-copy">Matching jewelry recommendations curated for checkout.</p></div></div><div class="cc-complete-look"><div class="cc-story-pill">Smart bundle offer · Save more on combos</div><div class="cc-complete-look-items">' +
        products.slice(0, 3).map(function (p) { return '<img src="' + p.img + '" alt="' + escapeAttr(p.name) + '" loading="lazy" decoding="async" />'; }).join("") +
      '</div><button type="button" class="cc-bundle-btn" data-cc-sheet="bundle">View bundle offer</button></div></section>' +
      '<section class="cc-section cc-reveal"><div class="cc-section-head"><div><p class="cc-kicker">Community</p><h2 class="cc-title">Styled by our community</h2><p class="cc-copy">Customer image rails with a soft Instagram mood.</p></div></div><div class="cc-community-rail">' +
        images.concat(images.slice(0, 2)).map(function (img, index) {
          return '<a class="cc-community-card" href="#bestsellers"><img src="' + img + '" alt="Community style ' + (index + 1) + '" loading="lazy" decoding="async" /></a>';
        }).join("") +
      '</div><div class="cc-review-snippet"><strong>4.8 ★ premium review</strong><p>“Looks delicate, feels light, and the finish makes every outfit feel more put together.”</p></div></section>' +
      '<section class="cc-section cc-reveal"><div class="cc-section-head"><div><p class="cc-kicker">Editorial stories</p><h2 class="cc-title">Jewelry that feels personal</h2></div></div><div class="cc-story-stack">' +
        storyCard(images[5], "The inner-circle drop", "New handpicked pieces released for repeat browsing.") +
        storyCard(images[1], "Trending in Chennai", "Warm gold tones and lightweight everyday styling.") +
      '</div></section>';

    var bestsellers = $("#bestsellers");
    bestsellers.parentNode.insertBefore(brand, bestsellers);
    observeReveals(brand);
    initSheetTriggers(brand);
  }

  function repeatItems(items, times) {
    var out = [];
    for (var i = 0; i < times; i += 1) out = out.concat(items);
    return out;
  }

  function rotate(items, count) {
    return items.slice(count).concat(items.slice(0, count));
  }

  function promoCard(img, kicker, title) {
    return '<a class="cc-promo-card cc-parallax-soft" href="#bestsellers"><img src="' + img + '" alt="' + escapeAttr(title) + '" loading="lazy" decoding="async" /><span>' + kicker + '</span><strong>' + title + '</strong></a>';
  }

  function proof(num, label) {
    return '<div class="cc-proof-card"><strong>' + num + '</strong><span>' + label + '</span></div>';
  }

  function commerceRail(kicker, title, products, badge) {
    return '<section class="cc-section cc-reveal"><div class="cc-section-head"><div><p class="cc-kicker">' + kicker + '</p><h2 class="cc-title">' + title + '</h2><p class="cc-copy">Smooth swipe rail with premium snap browsing.</p></div><a class="cc-link" href="#bestsellers">View all</a></div><div class="cc-trust-rail"><span class="cc-scarcity-chip">Selling Fast</span><span class="cc-scarcity-chip">Only 3 left</span><span class="cc-scarcity-chip">5 people viewing</span><span class="cc-scarcity-chip">Popular this week</span></div><div class="cc-rail">' +
      products.slice(0, 8).map(function (p) { return productCard(p, badge); }).join("") +
    '</div></section>';
  }

  function lookCard(img, title, copy) {
    return '<a class="cc-look-card cc-magnetic" href="#bestsellers"><img src="' + img + '" alt="' + escapeAttr(title) + '" loading="lazy" decoding="async" /><div><strong>' + title + '</strong><span>' + copy + '</span></div></a>';
  }

  function storyCard(img, title, copy) {
    return '<a class="cc-story-card cc-magnetic" href="#bestsellers"><div><strong>' + title + '</strong><span>' + copy + '</span></div><img src="' + img + '" alt="' + escapeAttr(title) + '" loading="lazy" decoding="async" /></a>';
  }

  function createBottomSheet() {
    if (!isMobile() || $(".cc-bottom-sheet")) return;
    var backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "cc-bottom-sheet-backdrop";
    backdrop.setAttribute("aria-label", "Close offer drawer");

    var sheet = document.createElement("div");
    sheet.className = "cc-bottom-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.innerHTML =
      '<div class="cc-sheet-handle"></div><h2 class="cc-sheet-title">Complete the set</h2>' +
      '<p class="cc-sheet-copy">Pair your favorite earrings with matching minimal pieces. Built as a premium upsell drawer, ready for product data.</p>' +
      '<div class="cc-sheet-grid">' +
        getProductCards(3).map(function (p) { return '<img src="' + p.img + '" alt="' + escapeAttr(p.name) + '" loading="lazy" decoding="async" />'; }).join("") +
      '</div><button type="button" class="cc-bundle-btn">Add curated combo</button>';

    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);
    backdrop.addEventListener("click", closeBottomSheet);
    sheet.addEventListener("touchstart", startSheetGesture, { passive: true });
    sheet.addEventListener("touchmove", moveSheetGesture, { passive: true });
    sheet.addEventListener("touchend", endSheetGesture, { passive: true });
  }

  var sheetStartY = 0;
  var sheetDeltaY = 0;

  function openBottomSheet() {
    createBottomSheet();
    $(".cc-bottom-sheet-backdrop").classList.add("is-open");
    $(".cc-bottom-sheet").classList.add("is-open");
    document.body.classList.add("cc-modal-open");
  }

  function closeBottomSheet() {
    var backdrop = $(".cc-bottom-sheet-backdrop");
    var sheet = $(".cc-bottom-sheet");
    if (backdrop) backdrop.classList.remove("is-open");
    if (sheet) {
      sheet.classList.remove("is-open");
      sheet.style.transform = "";
    }
    document.body.classList.remove("cc-modal-open");
    window.setTimeout(cleanupStuckVisualState, 280);
  }

  function startSheetGesture(event) {
    sheetStartY = event.touches[0].clientY;
    sheetDeltaY = 0;
  }

  function moveSheetGesture(event) {
    var sheet = $(".cc-bottom-sheet");
    if (!sheet) return;
    sheetDeltaY = Math.max(0, event.touches[0].clientY - sheetStartY);
    sheet.style.transform = "translateY(" + sheetDeltaY + "px)";
  }

  function endSheetGesture() {
    if (sheetDeltaY > 90) closeBottomSheet();
    else {
      var sheet = $(".cc-bottom-sheet");
      if (sheet) sheet.style.transform = "";
    }
  }

  function initSheetTriggers(root) {
    $all("[data-cc-sheet]", root || document).forEach(function (button) {
      button.addEventListener("click", openBottomSheet);
    });
  }

  function createNewsletter() {
    if (!isMobile() || $(".cc-newsletter-modal")) return;
    var backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "cc-newsletter-backdrop";
    backdrop.setAttribute("aria-label", "Close newsletter popup");

    var modal = document.createElement("div");
    modal.className = "cc-newsletter-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "ccNewsletterTitle");
    modal.innerHTML =
      '<button type="button" class="cc-newsletter-close" aria-label="Close newsletter">×</button>' +
      '<div class="cc-sheet-handle"></div><h2 class="cc-sheet-title" id="ccNewsletterTitle">Join the inner circle</h2>' +
      '<p class="cc-sheet-copy">Get first access to weekly handpicked drops and a soft welcome discount.</p>' +
      '<input type="email" inputmode="email" autocomplete="email" placeholder="Email address" aria-label="Email address" />' +
      '<button type="button" class="cc-newsletter-submit">Unlock first access</button>';

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
    backdrop.addEventListener("click", closeNewsletter);
    $(".cc-newsletter-close", modal).addEventListener("click", closeNewsletter);
    $(".cc-newsletter-submit", modal).addEventListener("click", function () {
      try { localStorage.setItem("ccNewsletterSeen", "1"); } catch (err) {}
      closeNewsletter();
    });

    if (!localStorage.getItem("ccNewsletterSeen")) {
      window.setTimeout(openNewsletter, 9000);
    }
  }

  function openNewsletter() {
    if (!isMobile()) return;
    var backdrop = $(".cc-newsletter-backdrop");
    var modal = $(".cc-newsletter-modal");
    if (!backdrop || !modal) return;
    backdrop.classList.add("is-open");
    modal.classList.add("is-open");
    modal.scrollTop = 0;
    document.body.classList.add("cc-modal-open");
    document.body.classList.add("cc-newsletter-open");
  }

  function closeNewsletter() {
    var backdrop = $(".cc-newsletter-backdrop");
    var modal = $(".cc-newsletter-modal");
    if (backdrop) backdrop.classList.remove("is-open");
    if (modal) modal.classList.remove("is-open");
    document.body.classList.remove("cc-modal-open");
    document.body.classList.remove("cc-newsletter-open");
    try { localStorage.setItem("ccNewsletterSeen", "1"); } catch (err) {}
    window.setTimeout(cleanupStuckVisualState, 280);
  }

  function createMiniCart() {
    if (!isMobile() || $(".cc-mini-cart")) return;
    var mini = document.createElement("a");
    mini.className = "cc-mini-cart";
    mini.href = "cart.html";
    mini.innerHTML = '<strong>Cart preview</strong><span id="ccMiniCartText">0 items</span>';
    document.body.appendChild(mini);
    syncMiniCart();
  }

  function syncMiniCart() {
    var mini = $(".cc-mini-cart");
    if (!mini) return;
    var cart = getCart();
    var units = cart.reduce(function (sum, item) { return sum + Number(item.quantity || 1); }, 0);
    var total = cart.reduce(function (sum, item) { return sum + Number(item.price || 0) * Number(item.quantity || 1); }, 0);
    $("#ccMiniCartText").textContent = units + " items · " + money(total);
    mini.classList.toggle("is-visible", units > 0);
  }

  function createRecentPurchase() {
    if (!isMobile() || $(".cc-recent-purchase") || !$("#bestsellers")) return;
    var products = getProductCards(4);
    var toast = document.createElement("div");
    toast.className = "cc-recent-purchase";
    toast.innerHTML = '<img alt="" loading="lazy" decoding="async" /><div><strong></strong><span></span></div>';
    document.body.appendChild(toast);

    if (prefersReduced.matches) return;
    var names = ["Aarohi in Chennai", "Maya in Pune", "Isha in Bengaluru", "Riya in Kochi"];
    var index = 0;
    window.setInterval(function () {
      if (!isMobile() || document.body.classList.contains("cc-modal-open")) return;
      var product = products[index % products.length];
      $("img", toast).src = product.img;
      $("strong", toast).textContent = names[index % names.length] + " bought " + product.name;
      $("span", toast).textContent = "Popular this week · " + product.price;
      toast.classList.add("is-visible");
      window.setTimeout(function () { toast.classList.remove("is-visible"); }, 4200);
      index += 1;
    }, 15000);
  }

  function createOnboardingToast() {
    if (!isMobile() || $(".cc-onboarding-toast") || localStorage.getItem("ccOnboardingSeen")) return;
    var toast = document.createElement("div");
    toast.className = "cc-onboarding-toast";
    toast.innerHTML = 'Swipe rails, tap hearts, and use the bottom nav like a shopping app.<button type="button" aria-label="Dismiss">×</button>';
    document.body.appendChild(toast);
    $("button", toast).addEventListener("click", function () {
      toast.classList.remove("is-visible");
      try { localStorage.setItem("ccOnboardingSeen", "1"); } catch (err) {}
    });
    window.setTimeout(function () { toast.classList.add("is-visible"); }, 1300);
    window.setTimeout(function () {
      toast.classList.remove("is-visible");
      try { localStorage.setItem("ccOnboardingSeen", "1"); } catch (err) {}
    }, 7200);
  }

  function enhanceEmptyStates() {
    if (!isMobile()) return;
    var cartEmpty = $("#cartEmpty");
    if (cartEmpty && !$(".cc-empty-state", cartEmpty)) {
      var extra = document.createElement("div");
      extra.className = "cc-empty-state";
      extra.innerHTML = '<strong>Your next favorite piece is waiting</strong><span>Browse trending, under ₹299, and daily-wear edits curated for quick checkout.</span><a href="index.html#bestsellers">Explore trending pieces</a>';
      cartEmpty.appendChild(extra);
    }
  }

  function createMobileFooter() {
    if (!isMobile() || $(".cc-mobile-footer")) return;
    var footer = document.createElement("footer");
    footer.className = "cc-mobile-footer";
    footer.setAttribute("aria-label", "Mobile footer");
    footer.innerHTML =
      '<div class="cc-mobile-footer-brand">Chic<span>Charms</span></div>' +
      '<p class="cc-copy">Premium jewelry shopping with COD, quick shipping, and handpicked weekly edits.</p>' +
      '<nav class="cc-mobile-footer-links" aria-label="Mobile policy links">' +
        '<a href="about.html">About Brand</a><a href="faq.html">FAQ</a><a href="shipping.html">Shipping</a><a href="returns.html">Returns</a><a href="contact.html">Contact</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="index.html#bestsellers">Shop</a>' +
      '</nav>';
    document.body.appendChild(footer);
  }

  function createGlobalBottomNav() {
    if (!isMobile() || $(".mobile-bottom-nav")) return;
    var nav = document.createElement("nav");
    nav.className = "mobile-bottom-nav cc-global-bottom-nav";
    nav.setAttribute("aria-label", "Mobile bottom navigation");
    var current = location.pathname.split("/").pop() || "index.html";
    function active(files) { return files.indexOf(current) !== -1 ? " is-active" : ""; }
    nav.innerHTML =
      '<a class="mobile-bottom-tab' + active(["index.html", ""]) + '" href="index.html" aria-label="Home"><svg viewBox="0 0 24 24"><path d="M3 10.8 12 3l9 7.8V21h-6v-6H9v6H3z"/></svg><span>Home</span></a>' +
      '<a class="mobile-bottom-tab' + active(["shop.html"]) + '" href="shop.html" aria-label="Shop"><svg viewBox="0 0 24 24"><path d="M6 2h12l3 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/><path d="M3 9h18M9 13a3 3 0 0 0 6 0"/></svg><span>Shop</span></a>' +
      '<a class="mobile-bottom-tab' + active(["product.html"]) + '" href="index.html#bestsellers" aria-label="Discover"><svg viewBox="0 0 24 24"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/></svg><span>Discover</span></a>' +
      '<a class="mobile-bottom-tab' + active(["account.html", "auth.html"]) + '" href="account.html" aria-label="Account"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 22c1.6-4 4.2-6 8-6s6.4 2 8 6"/></svg><span>Account</span></a>' +
      '<a class="mobile-bottom-tab' + active(["cart.html", "checkout.html"]) + '" href="cart.html" aria-label="Cart"><svg viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg><span>Cart</span></a>';
    document.body.appendChild(nav);
  }

  function rewriteFooterLinks() {
    var map = {
      "About Us": "about.html",
      "FAQs": "faq.html",
      "Shipping": "shipping.html",
      "Returns": "returns.html",
      "Contact": "contact.html",
      "Privacy": "privacy.html",
      "Terms": "terms.html",
    };
    $all("footer a, .d6-footer a").forEach(function (link) {
      var text = link.textContent.trim();
      if (map[text]) link.href = map[text];
    });
  }

  function observeReveals(root) {
    if (!isMobile()) return;
    var targets = $all(".cc-reveal", root || document);
    if (!targets.length) return;
    if (!("IntersectionObserver" in window) || prefersReduced.matches) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -42px 0px" });
    targets.forEach(function (el, index) {
      el.style.transitionDelay = Math.min(index * 40, 240) + "ms";
      obs.observe(el);
    });
  }

  function initMotionHardening() {
    if (!isMobile()) return;
    document.body.classList.add("cc-page-enter");
    $all("img:not([decoding])").forEach(function (img) {
      img.decoding = "async";
      if (!img.hasAttribute("loading") && !img.closest(".hero")) img.loading = "lazy";
    });

    if (!prefersReduced.matches) {
      var ticking = false;
      window.addEventListener("scroll", function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var y = window.scrollY * 0.015;
          $all(".cc-parallax-soft").slice(0, 8).forEach(function (el) {
            el.style.transform = "translate3d(0," + Math.min(y, 8) + "px,0)";
          });
          ticking = false;
        });
      }, { passive: true });
    }
  }

  function patchStorageForCart() {
    if (window.__ccBrandStoragePatched) return;
    window.__ccBrandStoragePatched = true;
    var original = localStorage.setItem;
    localStorage.setItem = function (key, value) {
      original.apply(this, arguments);
      if (key === "cart") window.setTimeout(syncMiniCart, 0);
    };
    window.addEventListener("storage", syncMiniCart);
  }

  function init() {
    if (!isMobile()) return;
    createLoadingScreen();
    rewriteFooterLinks();
    createBrandHomepage();
    createBottomSheet();
    createNewsletter();
    createMiniCart();
    createRecentPurchase();
    createOnboardingToast();
    enhanceEmptyStates();
    createGlobalBottomNav();
    createMobileFooter();
    observeReveals(document);
    initSheetTriggers(document);
    initMotionHardening();
    patchStorageForCart();
    cleanupStuckVisualState();

    var productContainer = $("#products-container");
    if (productContainer && !window.__ccBrandProductObserver) {
      window.__ccBrandProductObserver = true;
      var timer;
      new MutationObserver(function () {
        clearTimeout(timer);
        timer = window.setTimeout(function () {
          if (!$(".cc-mobile-brand")) createBrandHomepage();
          syncMiniCart();
        }, 160);
      }).observe(productContainer, { childList: true });
    }

    window.setInterval(syncMiniCart, 900);
    window.setTimeout(cleanupStuckVisualState, 1200);
    window.setTimeout(cleanupStuckVisualState, 2600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  mobileQuery.addEventListener ? mobileQuery.addEventListener("change", init) : mobileQuery.addListener(init);
  window.addEventListener("load", cleanupStuckVisualState);
  window.addEventListener("pageshow", cleanupStuckVisualState);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) cleanupStuckVisualState();
  });
})();
