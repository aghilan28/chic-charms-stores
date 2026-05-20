/**
 * mobile-phase2.js  — CHIC CHARMS Phase 2
 * Homepage Luxury Experience Enhancer
 *
 * What this does (ONLY on mobile ≤ 767px):
 *  1. Injects luxury search pill below hero
 *  2. Injects premium category rail
 *  3. Injects refined trust strip
 *  4. Wires category rail to the product filter
 *  5. Bridges search pill to existing globalSearch logic
 *
 * STRICT RULES:
 *  - Only runs on mobile ≤ 767px
 *  - Does NOT replace mobile architecture (Phase 1)
 *  - Does NOT duplicate any system
 *  - Does NOT touch desktop
 *  - Idempotent: safe to call multiple times
 */

(function () {
  'use strict';

  /* ── Desktop guard ── */
  if (window.innerWidth > 767) return;

  /* ── Helpers ── */
  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) {
      Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    }
    return e;
  }

  function svgIcon(paths) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
  }

  /* ── Find the hero section ── */
  function heroSection() {
    return document.querySelector('.hero');
  }

  /* ── Find the bestsellers / products section ── */
  function productsSection() {
    return (
      document.getElementById('bestsellers') ||
      document.querySelector('.bestsellers.section') ||
      document.querySelector('.section#bestsellers')
    );
  }

  /* ══════════════════════════════════════════════════
     1. LUXURY SEARCH PILL
     Injected between hero and categories.
     Bridges to the existing #globalSearch or #searchInput.
  ══════════════════════════════════════════════════ */
  function injectSearchPill() {
    if (document.querySelector('.m2-search-wrap')) return; /* idempotent */

    var hero = heroSection();
    if (!hero) return;

    var wrap = el('div', 'm2-search-wrap');
    wrap.innerHTML =
      '<div class="m2-search-pill">' +
        '<span class="m2-search-icon">' +
          svgIcon('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/>') +
        '</span>' +
        '<input class="m2-search-input" id="m2SearchInput" type="search" ' +
               'placeholder="Search earrings, studs, hoops…" ' +
               'autocomplete="off" autocorrect="off" spellcheck="false">' +
      '</div>';

    /* Insert after the hero */
    if (hero.nextSibling) {
      hero.parentNode.insertBefore(wrap, hero.nextSibling);
    } else {
      hero.parentNode.appendChild(wrap);
    }

    /* Wire to existing search infrastructure */
    var m2Input = document.getElementById('m2SearchInput');
    if (!m2Input) return;

    m2Input.addEventListener('input', function () {
      var val = m2Input.value;

      /* Bridge to desktop globalSearch if present */
      var globalSearch = document.getElementById('globalSearch');
      if (globalSearch) {
        globalSearch.value = val;
        globalSearch.dispatchEvent(new Event('input', { bubbles: true }));
      }

      /* Bridge to section searchInput if present */
      var sectionSearch = document.getElementById('searchInput');
      if (sectionSearch) {
        sectionSearch.value = val;
        sectionSearch.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    m2Input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        /* Scroll to products and trigger filter */
        var target = document.getElementById('shopControls') ||
                     document.getElementById('bestsellers');
        if (target) {
          var navH = 56;
          var navEl = document.querySelector('#navbar, .navbar');
          if (navEl) navH = navEl.offsetHeight;
          window.scrollTo({
            top: target.getBoundingClientRect().top + window.pageYOffset - navH - 16,
            behavior: 'smooth'
          });
        }
        m2Input.blur();
      }
      if (e.key === 'Escape') {
        m2Input.value = '';
        m2Input.dispatchEvent(new Event('input', { bubbles: true }));
        m2Input.blur();
      }
    });

    /* Keep m2 input in sync if existing search changes (desktop widget) */
    var globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
      globalSearch.addEventListener('input', function () {
        if (m2Input !== document.activeElement) {
          m2Input.value = globalSearch.value;
        }
      });
    }
  }

  /* ══════════════════════════════════════════════════
     2. PREMIUM CATEGORY RAIL
     Horizontal scroll with circular category thumbnails.
  ══════════════════════════════════════════════════ */
  var CATEGORIES = [
    { label: 'Earrings',   slug: 'everyday-elegance',  img: 'images/editorial-everyday-hoops.png',           emoji: '💎' },
    { label: 'Studs',      slug: 'everyday-elegance',  img: 'images/product-gold-star-studs.jpg',            emoji: '✨' },
    { label: 'Hoops',      slug: 'modern-romance',     img: 'images/product-silver-hoops.jpg',               emoji: '⭕' },
    { label: 'Korean',     slug: 'after-dark',         img: 'images/editorial-korean-morning-coffee.png',    emoji: '🎀' },
    { label: 'Pearl',      slug: 'heritage-muse',      img: 'images/story-soft-pearl-drop.png',              emoji: '🪷' },
    { label: 'Minimal',    slug: 'everyday-elegance',  img: 'images/editorial-minimal-soul-closeup.png',     emoji: '🌿' },
    { label: 'Bridal',     slug: 'heritage-muse',      img: 'images/style-heritage-muse.png',                emoji: '💍' },
    { label: 'Daily Wear', slug: 'everyday-elegance',  img: 'images/editorial-light-meets-gold.png',         emoji: '☀️' }
  ];

  function injectCategoryRail() {
    if (document.querySelector('.m2-cat-section')) return; /* idempotent */

    /* Find insertion point: after search wrap, or after hero */
    var searchWrap = document.querySelector('.m2-search-wrap');
    var insertAfter = searchWrap || heroSection();
    if (!insertAfter) return;

    var section = el('div', 'm2-cat-section');

    var label = el('span', 'm2-cat-label');
    label.textContent = 'Shop by style';
    section.appendChild(label);

    var rail = el('nav', 'm2-cat-rail', { 'aria-label': 'Category quick-select' });

    CATEGORIES.forEach(function (cat) {
      var link = el('a', 'm2-cat-item', {
        href: 'index.html?category=' + encodeURIComponent(cat.slug) + '#bestsellers',
        'data-m2-cat': cat.slug
      });

      /* Circular thumb */
      var thumb = el('span', 'm2-cat-thumb');
      var img = el('img', '', {
        src: cat.img,
        alt: '',
        loading: 'lazy',
        decoding: 'async'
      });
      /* Emoji fallback if image fails */
      img.addEventListener('error', function () {
        thumb.innerHTML = '<span class="m2-cat-thumb-emoji">' + cat.emoji + '</span>';
      });
      thumb.appendChild(img);
      link.appendChild(thumb);

      var name = el('span', 'm2-cat-name');
      name.textContent = cat.label;
      link.appendChild(name);

      /* Click: wire to category filter + scroll to products */
      link.addEventListener('click', function (e) {
        e.preventDefault();

        /* Highlight selected */
        rail.querySelectorAll('.m2-cat-item').forEach(function (it) {
          it.classList.remove('is-selected');
        });
        link.classList.add('is-selected');

        /* Push to URL */
        if (window.history && window.history.pushState) {
          window.history.pushState(null, '',
            'index.html?category=' + encodeURIComponent(cat.slug) + '#bestsellers');
        }

        /* Use window.activateCollection if available (index.html bridge) */
        if (typeof window.activateCollection === 'function') {
          window.activateCollection(cat.slug);
          return;
        }

        /* Fallback: set the filter dropdown and scroll */
        var filterEl = document.getElementById('categoryFilter');
        if (filterEl) {
          filterEl.value = cat.slug;
          filterEl.dispatchEvent(new Event('change', { bubbles: true }));
        }

        /* Scroll to products */
        var target = document.getElementById('shopControls') ||
                     document.getElementById('bestsellers');
        if (target) {
          var navH = 56;
          var navEl = document.querySelector('#navbar, .navbar');
          if (navEl) navH = navEl.offsetHeight;
          window.scrollTo({
            top: target.getBoundingClientRect().top + window.pageYOffset - navH - 16,
            behavior: 'smooth'
          });
        }
      });

      rail.appendChild(link);
    });

    section.appendChild(rail);

    /* Insert after search or hero */
    if (insertAfter.nextSibling) {
      insertAfter.parentNode.insertBefore(section, insertAfter.nextSibling);
    } else {
      insertAfter.parentNode.appendChild(section);
    }
  }

  /* ══════════════════════════════════════════════════
     3. TRUST STRIP
     Horizontal scrolling trust signals below category rail.
  ══════════════════════════════════════════════════ */
  var TRUST_ITEMS = [
    { icon: '💧', text: 'Waterproof' },
    { icon: '✦',  text: 'Tarnish Resistant' },
    { icon: '🌿', text: 'Hypoallergenic' },
    { icon: '🪶', text: 'Lightweight' },
    { icon: '👑', text: 'Everyday Luxury' },
    { icon: '🚚', text: 'Ships in 24h' },
    { icon: '📦', text: 'COD Available' }
  ];

  function injectTrustStrip() {
    if (document.querySelector('.m2-trust-strip')) return; /* idempotent */

    var catSection = document.querySelector('.m2-cat-section');
    var insertAfter = catSection || document.querySelector('.m2-search-wrap') || heroSection();
    if (!insertAfter) return;

    var strip = el('div', 'm2-trust-strip', { 'aria-label': 'Shopping promises', role: 'list' });

    TRUST_ITEMS.forEach(function (item) {
      var div = el('div', 'm2-trust-item', { role: 'listitem' });
      var ico = el('span', 'm2-trust-icon');
      ico.textContent = item.icon;
      var txt = el('span', 'm2-trust-text');
      txt.textContent = item.text;
      div.appendChild(ico);
      div.appendChild(txt);
      strip.appendChild(div);
    });

    if (insertAfter.nextSibling) {
      insertAfter.parentNode.insertBefore(strip, insertAfter.nextSibling);
    } else {
      insertAfter.parentNode.appendChild(strip);
    }
  }

  /* ══════════════════════════════════════════════════
     4. INIT — wait for DOM to be ready enough
  ══════════════════════════════════════════════════ */
  function init() {
    if (!heroSection()) return; /* hero not in DOM yet; will retry */
    injectSearchPill();
    injectCategoryRail();
    injectTrustStrip();
  }

  /* Run after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      /* Short delay so final-mobile-stabilization.js settles */
      setTimeout(init, 60);
    });
  } else {
    setTimeout(init, 60);
  }

  /* ── Sync category rail highlight when URL category changes ── */
  window.addEventListener('popstate', function () {
    var params = new URLSearchParams(window.location.search);
    var cat = params.get('category');
    document.querySelectorAll('.m2-cat-item').forEach(function (item) {
      var isCurrent = cat && item.dataset.m2Cat === cat;
      item.classList.toggle('is-selected', !!isCurrent);
    });
  });

})();
