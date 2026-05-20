/**
 * mobile-app.js  v3.0  — CHIC CHARMS Mobile Layer
 *
 * What this does (only on mobile ≤ 767px):
 *  1. Injects bottom navigation bar
 *  2. Injects cart icon into navbar right column
 *  3. Injects drawer backdrop (uses existing .nav-links as drawer)
 *  4. Wires hamburger ↔ drawer
 *  5. Smart navbar hide/show on scroll
 *  6. Marks active bottom nav tab by current page
 *  7. Updates cart badge from script.js cart state
 *
 * NO DOM injection of massive overlays — keeps it clean and conflict-free.
 */

(function () {
  'use strict';

  /* Only run on mobile */
  if (window.innerWidth > 767) return;

  /* ── Helpers ── */
  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function svg(paths, viewBox) {
    var ns = 'http://www.w3.org/2000/svg';
    var s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', viewBox || '0 0 24 24');
    s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '1.6');
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = paths;
    return s;
  }

  /* ── Current page detection ── */
  var page = window.location.pathname.split('/').pop() || 'index.html';
  var isIndex = page === 'index.html' || page === '';
  var isShop  = page === 'shop.html';
  var isCart  = page === 'cart.html';
  var isAcct  = page === 'account.html';

  /* ══════════════════════════════════════════════════
     1. BOTTOM NAV — inject once
  ══════════════════════════════════════════════════ */
  if (!document.querySelector('.ma-bottom-nav')) {
    var nav = el('nav', 'ma-bottom-nav', { 'aria-label': 'Mobile navigation' });

    var tabs = [
      {
        href: 'index.html',
        label: 'Home',
        active: isIndex,
        icon: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>'
      },
      {
        href: 'shop.html',
        label: 'Shop',
        active: isShop,
        icon: '<path d="M6 2h12l3 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/><path d="M3 9h18M9 13a3 3 0 0 0 6 0"/>'
      },
      {
        href: 'index.html#bestsellers',
        label: 'Discover',
        active: false,
        icon: '<path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/>'
      },
      {
        href: 'account.html',
        label: 'Account',
        active: isAcct,
        icon: '<circle cx="12" cy="8" r="4"/><path d="M4 22c1.6-4 4.2-6 8-6s6.4 2 8 6"/>'
      },
      {
        href: 'cart.html',
        label: 'Cart',
        active: isCart,
        badge: true,
        icon: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>'
      }
    ];

    tabs.forEach(function (tab) {
      var a = el('a', 'ma-nav-tab' + (tab.active ? ' is-active' : ''), {
        href: tab.href,
        'aria-label': tab.label
      });
      a.appendChild(svg(tab.icon));

      if (tab.badge) {
        var badge = el('span', 'ma-nav-badge');
        badge.id = 'maNavCartBadge';
        a.appendChild(badge);
      }

      var label = el('span');
      label.textContent = tab.label;
      a.appendChild(label);
      nav.appendChild(a);
    });

    document.body.appendChild(nav);
  }

  /* ══════════════════════════════════════════════════
     2. CART ICON in navbar right column
  ══════════════════════════════════════════════════ */
  var navbar = document.querySelector('.navbar, #navbar');
  var navInner = navbar && navbar.querySelector('.nav-inner, .container');

  if (navInner && !navInner.querySelector('.ma-header-cart')) {
    var cartWrap = el('div', 'ma-header-cart');
    var cartLink = el('a', '', { href: 'cart.html', 'aria-label': 'Cart' });
    cartLink.appendChild(svg('<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>'));
    var hdrBadge = el('span', 'ma-cart-badge');
    hdrBadge.id = 'maHdrCartBadge';
    cartLink.appendChild(hdrBadge);
    cartWrap.appendChild(cartLink);
    navInner.appendChild(cartWrap);
  }

  /* ══════════════════════════════════════════════════
     3. DRAWER BACKDROP
  ══════════════════════════════════════════════════ */
  var backdrop = document.querySelector('.ma-drawer-backdrop');
  if (!backdrop) {
    backdrop = el('div', 'ma-drawer-backdrop', { 'aria-hidden': 'true' });
    document.body.appendChild(backdrop);
  }

  /* ══════════════════════════════════════════════════
     4. HAMBURGER ↔ DRAWER wiring
  ══════════════════════════════════════════════════ */
  var hamburger  = document.querySelector('.hamburger, #hamburger');
  var navLinks   = document.querySelector('.nav-links, #navLinks');

  function openDrawer() {
    if (navLinks)   navLinks.classList.add('open');
    if (hamburger)  hamburger.setAttribute('aria-expanded', 'true');
    if (backdrop)   backdrop.classList.add('is-open');
    document.body.classList.add('ma-menu-open');
  }

  function closeDrawer() {
    if (navLinks)   navLinks.classList.remove('open');
    if (hamburger)  hamburger.setAttribute('aria-expanded', 'false');
    if (backdrop)   backdrop.classList.remove('is-open');
    document.body.classList.remove('ma-menu-open');
  }

  if (hamburger) {
    hamburger.addEventListener('click', function () {
      var isOpen = navLinks && navLinks.classList.contains('open');
      isOpen ? closeDrawer() : openDrawer();
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeDrawer);
  }

  /* Close on nav link tap */
  if (navLinks) {
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        /* brief delay so the link navigates before closing */
        setTimeout(closeDrawer, 120);
      });
    });
  }

  /* ══════════════════════════════════════════════════
     5. SMART NAVBAR — hide on scroll down, show on up
  ══════════════════════════════════════════════════ */
  var lastScroll  = 0;
  var scrollTicking = false;
  var navbarEl    = document.querySelector('.navbar, #navbar');

  window.addEventListener('scroll', function () {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function () {
      var current = window.pageYOffset;
      if (navbarEl) {
        if (current > lastScroll && current > 80) {
          navbarEl.style.transform = 'translateY(-100%)';
        } else {
          navbarEl.style.transform = 'translateY(0)';
        }
        navbarEl.classList.toggle('scrolled', current > 10);
      }
      lastScroll = Math.max(0, current);
      scrollTicking = false;
    });
  }, { passive: true });

  /* ══════════════════════════════════════════════════
     6. CART BADGE — sync with script.js getCart()
  ══════════════════════════════════════════════════ */
  function updateCartBadges() {
    var count = 0;
    try {
      var cart = typeof getCart === 'function' ? getCart() :
                 JSON.parse(localStorage.getItem('chic_cart') || '[]');
      count = Array.isArray(cart) ? cart.reduce(function (s, i) { return s + (i.qty || 1); }, 0) : 0;
    } catch (e) { count = 0; }

    var badges = document.querySelectorAll('#maNavCartBadge, #maHdrCartBadge');
    badges.forEach(function (b) {
      b.textContent = count > 0 ? (count > 9 ? '9+' : count) : '';
    });
  }

  /* Run now and after cart events */
  updateCartBadges();
  window.addEventListener('cart-updated', updateCartBadges);
  document.addEventListener('click', function (e) {
    if (e.target && (e.target.classList.contains('lux-cart-btn') ||
                     e.target.classList.contains('btn-cart') ||
                     e.target.dataset.add)) {
      setTimeout(updateCartBadges, 300);
    }
  });

  /* ══════════════════════════════════════════════════
     7. HERO IMAGE STRIP — inject below hero text
     Uses images already in the /images/ folder
  ══════════════════════════════════════════════════ */
  var heroText = document.querySelector('.hero-text');
  if (heroText && !document.querySelector('.ma-hero-strip')) {
    var strip = el('div', 'ma-hero-strip');
    var imgs = [
      'images/editorial-everyday-hoops.png',
      'images/editorial-light-meets-gold.png',
      'images/style-after-dark.png'
    ];
    imgs.forEach(function (src) {
      var img = el('img', '', { src: src, alt: '', loading: 'lazy', decoding: 'async' });
      strip.appendChild(img);
    });
    heroText.appendChild(strip);
  }

  /* ══════════════════════════════════════════════════
     8. CATEGORY SECTION — make desktop .categories
     visible if mobile-app previously hid it
  ══════════════════════════════════════════════════ */
  /* Restore categories section (old CSS hid it entirely) */
  var catSection = document.querySelector('.categories.section');
  if (catSection) {
    catSection.style.removeProperty('display');
  }

})();
