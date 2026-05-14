/* ============================================================
   CHIC CHARMS - script.js
   Lightweight vanilla JS  No dependencies
   ============================================================ */

(function () {
  'use strict';

  /*  Sticky Navbar Shadow  */
  const navbar = document.getElementById('navbar');

  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });

    /*  Mobile Hamburger Menu  */
    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.getElementById('navLinks');

    if (hamburger && navLinks) {
      hamburger.addEventListener('click', function () {
        const isOpen = navLinks.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', isOpen);
      });

      navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          navLinks.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        });
      });

      document.addEventListener('click', function (e) {
        if (!navbar.contains(e.target)) {
          navLinks.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  /*  Global image error fallback  */
  if (!window.__chicLocalImageFallbackReady) {
    window.__chicLocalImageFallbackReady = true;

  const localImageExts = ['jpg', 'jpeg', 'png', 'webp'];
  const imageFallbackSvg = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23fef2f5%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2240%22%3ECC%3C/text%3E%3C/svg%3E';

  function localImageCandidates(src) {
    const cleanSrc = String(src || '').split('#')[0].split('?')[0];
    if (!cleanSrc.includes('images/')) return [];

    const baseSrc = cleanSrc.replace(/\.(jpe?g|png|webp)$/i, '');
    const extMatch = cleanSrc.match(/\.(jpe?g|png|webp)$/i);
    if (!extMatch || baseSrc === cleanSrc) return [];

    const currentExt = extMatch[1].toLowerCase();
    return localImageExts
      .filter(function (ext) { return ext !== currentExt; })
      .map(function (ext) { return baseSrc + '.' + ext; });
  }

  document.addEventListener('error', function (e) {
    const img = e.target;
    if (!img || img.tagName !== 'IMG') return;

    const tried = (img.dataset.triedLocalExts || '').split('|').filter(Boolean);
    const nextSrc = localImageCandidates(img.getAttribute('src')).find(function (candidate) {
      return !tried.includes(candidate);
    });

    if (nextSrc) {
      tried.push(nextSrc);
      img.dataset.triedLocalExts = tried.join('|');
      img.src = nextSrc;
      e.stopImmediatePropagation();
      return;
    }

    if (!img.dataset.errored) {
      img.dataset.errored = '1';
      img.src = imageFallbackSvg;
      e.stopImmediatePropagation();
    }
  }, true);
  }

  /*  Cart System (localStorage)  */
  let toastTimer = null;

  /*  Show toast helper (shared by both cart functions)  */
  function showCartToast(productName, price, existing) {
    const cartToast = document.getElementById('cartToast');
    if (!cartToast) return;
    if (toastTimer) clearTimeout(toastTimer);
    const label = existing ? 'Now ' + existing.quantity + ' in cart' : 'Added to cart';
    cartToast.textContent = productName + ' - ' + label + '! (Rs.' + price + ')';
    cartToast.classList.add('show');

    /* D7: Animate cart badge on add */
    const badge = document.querySelector('.cart-badge, .nav-badge, [class*="cart-count"]');
    if (badge) {
      badge.classList.remove('updated');
      void badge.offsetWidth; /* reflow to restart animation */
      badge.classList.add('updated');
    }

    toastTimer = setTimeout(function () {
      cartToast.classList.remove('show');
    }, 2800);
  }

  /*  addToCart (name + price + optional productId) 
     Used by index.html product cards.
     Fetches live stock from Firestore when productId is provided.
   */
  /* addToCart - called from product card onclicks.
     Accepts an optional `cardStock` value that was baked into the button at render time.
     This gives an immediate local guard (no Firestore round-trip needed) so EVERY
     product card uses its OWN stock, never a previous product's value.          */
  window.addToCart = function (productName, price, productId, cardStock) {
    /* Local guard: if the card already told us stock == 0, block immediately */
    if (cardStock !== undefined && Number(cardStock) <= 0) {
      alert('Product is out of stock');
      return;
    }
    /* If we have a productId, do a live Firestore check (also re-guards quantity) */
    if (productId) {
      window.addToCartWithId(productName, price, productId);
      return;
    }
    /* No productId - add directly (stock validated at checkout) */
    const cart     = JSON.parse(localStorage.getItem('cart')) || [];
    const existing = cart.find(function (item) { return item.name === productName; });
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ name: productName, price: Number(price), quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    showCartToast(productName, price, existing);
  };

  /*  addToCartWithId (name + price + productId) 
     Used by product.html and index.html cards that have a Firestore doc ID.
     Validates live stock before adding; shows inline message if at limit.
   */
  window.addToCartWithId = function (productName, price, productId) {
    /* Fetch live stock, then decide */
    var FIREBASE_CONFIG = {
      apiKey:    "AIzaSyA5Bh77_4HE3yQF0hi5ddvbFLZC7rEerxg",
      projectId: "chic-charms-store"
    };

    var firestoreUrl =
      'https://firestore.googleapis.com/v1/projects/' + FIREBASE_CONFIG.projectId +
      '/databases/(default)/documents/products/' + productId +
      '?key=' + FIREBASE_CONFIG.apiKey;

    fetch(firestoreUrl)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        // P1+P5: Resilient REST stock extraction - mirrors the SDK normalization.
        // Handles: integerValue (string), doubleValue, stringValue, missing field, wrong case.
        var stockField = data && data.fields
          ? (data.fields.stock || data.fields.Stock || null)  // P1b: 'Stock' case fallback
          : null;
        var rawVal  = stockField
          ? (stockField.integerValue ?? stockField.doubleValue ?? stockField.stringValue ?? null)
          : null; // P1a: missing field -> null, NOT 999 (was wrongly permissive before)
        var parsed  = Number(rawVal ?? 0);
        var stockVal = isNaN(parsed) ? 0 : parsed;  // P5: NaN failsafe

        console.log('[ChicCharms] addToCartWithId live stock check:', stockVal, 'for', productName);

        /* P6: Hard gate - stock must be > 0 */
        if (stockVal <= 0) {
          alert('Product is out of stock');
          return;
        }

        var cart     = JSON.parse(localStorage.getItem('cart')) || [];
        var existing = cart.find(function (item) { return item.name === productName; });
        var currentQty = existing ? existing.quantity : 0;

        if (currentQty >= stockVal) {
          /*  Show generic "out of stock" toast - never reveal stock numbers  */
          var cartToast = document.getElementById('cartToast');
          if (cartToast) {
            if (window._toastTimer) clearTimeout(window._toastTimer);
            cartToast.textContent = '"' + productName + '" is out of stock';
            cartToast.classList.add('show');
            window._toastTimer = setTimeout(function () {
              cartToast.classList.remove('show');
            }, 3000);
          }
          return;
        }

        /* Stock OK - add to cart */
        if (existing) {
          existing.quantity += 1;
          if (!existing.productId) existing.productId = productId;
        } else {
          cart.push({ name: productName, price: Number(price), quantity: 1, productId: productId });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        showCartToast(productName, price, existing);
      })
      .catch(function () {
        /* Network failure - add anyway, checkout will re-validate */
        var cart     = JSON.parse(localStorage.getItem('cart')) || [];
        var existing = cart.find(function (item) { return item.name === productName; });
        if (existing) {
          existing.quantity += 1;
          if (!existing.productId) existing.productId = productId;
        } else {
          cart.push({ name: productName, price: Number(price), quantity: 1, productId: productId });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        showCartToast(productName, price, existing);
      });
  };

  /*  D7: Luxury button press feedback (replaces inline style approach)  */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('button:not(:disabled), .btn:not(:disabled)');
    if (!btn) return;
    /* Let CSS handle the transition; just toggle a class */
    btn.classList.add('d7-pressed');
    setTimeout(function () {
      btn.classList.remove('d7-pressed');
    }, 200);
  }, { passive: true });

  /* ============================================================
     D7  SCROLL-IN REVEAL - Unified observer
     Handles both legacy classes AND new d7-reveal classes
     ============================================================ */
  if ('IntersectionObserver' in window) {

    /* Respect reduced motion */
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /*  Legacy cards reveal (preserve existing behaviour)  */
    var revealEls = document.querySelectorAll(
      '.product-card, .cat-card, .why-card, .testi-card'
    );

    if (revealEls.length && !prefersReduced) {
      revealEls.forEach(function (el) {
        el.style.opacity   = '0';
        el.style.transform = 'translateY(18px)';
        el.style.transition = 'opacity 0.65s cubic-bezier(0.19,1,0.22,1), transform 0.65s cubic-bezier(0.19,1,0.22,1)';
      });

      var cardObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry, i) {
            if (entry.isIntersecting) {
              /* Staggered delay for grid cards */
              var delay = i * 55;
              setTimeout(function () {
                entry.target.style.opacity   = '1';
                entry.target.style.transform = 'translateY(0)';
              }, delay);
              cardObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.06, rootMargin: '0px 0px -30px 0px' }
      );

      revealEls.forEach(function (el) { cardObserver.observe(el); });
    }

    /*  Legacy luxury reveals  */
    var luxEls = document.querySelectorAll('.lux-reveal, .lux-reveal-delay');

    if (luxEls.length) {
      var luxObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              luxObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -50px 0px' }
      );
      luxEls.forEach(function (el) { luxObserver.observe(el); });
    }

    /*  D6 reveals  */
    var d6Els = document.querySelectorAll(
      '.d6-reveal, .d6-reveal-left, .d6-reveal-right, .d6-reveal-scale'
    );

    if (d6Els.length) {
      var d6Observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              d6Observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.07, rootMargin: '0px 0px -40px 0px' }
      );
      d6Els.forEach(function (el) { d6Observer.observe(el); });
    }

    /*  D7 reveals - cinematic entrance  */
    if (!prefersReduced) {
      var d7Els = document.querySelectorAll(
        '.d7-reveal, .d7-reveal-up, .d7-reveal-left, .d7-reveal-right, .d7-reveal-scale'
      );

      if (d7Els.length) {
        var d7Observer = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add('d7-visible');
                d7Observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.07, rootMargin: '0px 0px -36px 0px' }
        );
        d7Els.forEach(function (el) { d7Observer.observe(el); });
      }

      /*  D7 Section-level stagger  */
      var sectionEls = document.querySelectorAll('.section, .d6-brand-story, .collection-header');

      if (sectionEls.length) {
        var sectionObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add('d7-section-ready');
                sectionObserver.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
        );
        sectionEls.forEach(function (el) { sectionObserver.observe(el); });
      }
    }
  }

  /* ============================================================
     D7  GALLERY IMAGE SWAP - Smooth transition
     ============================================================ */
  document.addEventListener('click', function (e) {
    var thumb = e.target.closest('.gallery-thumb, .product-thumb, [data-gallery-thumb]');
    if (!thumb) return;

    var wrap = document.querySelector('.product-gallery-main, [data-gallery-main]');
    var mainImg = wrap && wrap.querySelector('img');
    var src = thumb.dataset.src || (thumb.querySelector('img') && thumb.querySelector('img').src);

    if (mainImg && src && src !== mainImg.src) {
      wrap.classList.add('changing');
      mainImg.src = src;
      mainImg.addEventListener('load', function () {
        wrap.classList.remove('changing');
      }, { once: true });
    }

    /* Active thumb */
    var siblings = document.querySelectorAll('.gallery-thumb, .product-thumb');
    siblings.forEach(function (s) { s.classList.remove('active'); });
    thumb.classList.add('active');
  }, { passive: true });

  /* ============================================================
     D7  WISHLIST HEART INTERACTION
     ============================================================ */
  document.addEventListener('click', function (e) {
    var heart = e.target.closest('.wishlist-btn, .heart-btn, [data-wishlist]');
    if (!heart) return;
    var wasLiked = heart.classList.contains('active') || heart.classList.contains('liked');
    heart.classList.toggle('active', !wasLiked);
    heart.classList.toggle('liked', !wasLiked);
    /* Re-trigger animation by reflow */
    if (!wasLiked) {
      void heart.offsetWidth;
    }
  }, { passive: true });

  /* ============================================================
     D7  LUXURY ACCORDION (product details)
     ============================================================ */
  document.addEventListener('click', function (e) {
    var header = e.target.closest('.accordion-header, [data-accordion-trigger]');
    if (!header) return;

    var panel = header.nextElementSibling;
    if (!panel || !panel.classList.contains('accordion-body')) return;

    var isOpen = header.classList.contains('open');

    /* Close all others in same group */
    var group = header.closest('.accordion-group, [data-accordion-group]');
    if (group) {
      group.querySelectorAll('.accordion-header.open').forEach(function (openHeader) {
        if (openHeader !== header) {
          openHeader.classList.remove('open');
          var openPanel = openHeader.nextElementSibling;
          if (openPanel) {
            openPanel.style.height = openPanel.scrollHeight + 'px';
            requestAnimationFrame(function () {
              openPanel.style.height = '0';
              openPanel.style.opacity = '0';
            });
          }
        }
      });
    }

    header.classList.toggle('open', !isOpen);

    if (!isOpen) {
      panel.style.height = '0';
      panel.style.opacity = '0';
      panel.style.overflow = 'hidden';
      panel.style.display = 'block';
      requestAnimationFrame(function () {
        panel.style.transition = 'height 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.4s cubic-bezier(0.19,1,0.22,1)';
        panel.style.height = panel.scrollHeight + 'px';
        panel.style.opacity = '1';
      });
      panel.addEventListener('transitionend', function () {
        panel.style.height = 'auto';
      }, { once: true });
    } else {
      panel.style.height = panel.scrollHeight + 'px';
      requestAnimationFrame(function () {
        panel.style.transition = 'height 0.4s cubic-bezier(0.4,0,0.8,0.2), opacity 0.3s ease';
        panel.style.height = '0';
        panel.style.opacity = '0';
      });
    }
  }, { passive: true });

  /* ============================================================
     D7  SMOOTH CURSOR TRAIL (desktop only, subtle)
     Single trailing dot - extremely lightweight
     ============================================================ */
  (function () {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var dot = document.createElement('div');
    dot.style.cssText = [
      'position:fixed',
      'pointer-events:none',
      'z-index:99999',
      'width:5px',
      'height:5px',
      'border-radius:50%',
      'background:rgba(212,135,156,0.55)',
      'transform:translate(-50%,-50%)',
      'transition:transform 0.12s cubic-bezier(0.19,1,0.22,1), opacity 0.3s ease',
      'opacity:0',
      'mix-blend-mode:multiply'
    ].join(';');
    document.body.appendChild(dot);

    var mx = 0, my = 0;
    var dotX = 0, dotY = 0;
    var raf;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.opacity = '1';
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      dot.style.opacity = '0';
    });

    function animateDot() {
      dotX += (mx - dotX) * 0.18;
      dotY += (my - dotY) * 0.18;
      dot.style.left = dotX + 'px';
      dot.style.top  = dotY + 'px';
      raf = requestAnimationFrame(animateDot);
    }
    animateDot();

    /* Scale up dot over interactive elements */
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest('button, a, .product-card, .lux-card, .cat-card')) {
        dot.style.transform = 'translate(-50%,-50%) scale(2.8)';
        dot.style.background = 'rgba(181,101,122,0.35)';
      }
    }, { passive: true });

    document.addEventListener('mouseout', function (e) {
      if (e.target.closest('button, a, .product-card, .lux-card, .cat-card')) {
        dot.style.transform = 'translate(-50%,-50%) scale(1)';
        dot.style.background = 'rgba(212,135,156,0.55)';
      }
    }, { passive: true });
  })();

  /* ============================================================
     D7  LUXURY SCROLL PROGRESS (thin top bar)
     ============================================================ */
  (function () {
    var bar = document.createElement('div');
    bar.setAttribute('aria-hidden', 'true');
    bar.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:0%',
      'height:1px',
      'background:linear-gradient(90deg,var(--rose-light),var(--rose-dark),var(--gold))',
      'z-index:9999',
      'pointer-events:none',
      'transition:width 0.1s linear',
      'transform-origin:left'
    ].join(';');
    document.body.appendChild(bar);

    window.addEventListener('scroll', function () {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + '%';
    }, { passive: true });
  })();

})();
