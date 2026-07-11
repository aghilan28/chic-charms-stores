/* ═══════════════════════════════════════════════════════════════════
   CHIC CHARMS — Global Material Symbols Runtime Fallback
   Prevents Material icon ligature names (arrow_back, visibility, etc.)
   from ever being displayed as plain text if the webfont is unavailable.
   
   v2.0 — Expanded icon set covers ALL icons used across the site.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var ICONS = {
    // ── Navigation ──
    add: '<path d="M12 5v14M5 12h14"/>',
    remove: '<path d="M5 12h14"/>',
    arrow_back: '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
    arrow_forward: '<path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    chevron_right: '<path d="M9 18l6-6-6-6"/>',
    chevron_left: '<path d="M15 18l-6-6 6-6"/>',
    close: '<path d="M18 6L6 18M6 6l12 12"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    expand_more: '<path d="M6 9l6 6 6-6"/>',
    expand_less: '<path d="M6 15l6-6 6 6"/>',

    // ── Search & Filter ──
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4.2-4.2"/>',
    tune: '<path d="M4 6h10M18 6h2M4 18h10M18 18h2M4 12h2M10 12h10"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
    sort: '<path d="M4 7h16M7 12h10M10 17h4"/>',
    filter_list: '<path d="M4 6h16M6 12h12M10 18h4"/>',

    // ── Visibility ──
    visibility: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="3"/>',
    visibility_off: '<path d="M3 3l18 18"/><path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6"/><path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a18.7 18.7 0 0 1-3 4.1"/><path d="M6.6 6.6C3.6 8.5 2 12 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.8-.8"/>',

    // ── Heart / Wishlist ──
    favorite: '<path fill="currentColor" stroke="none" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
    favorite_border: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>',

    // ── Shopping ──
    home: '<path d="M3 10.5L12 3l9 7.5"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    shopping_bag: '<path d="M6 7h12l1 14H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
    shopping_cart: '<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h3l3 12h10l3-8H7"/>',
    local_shipping: '<path d="M3 7h11v10H3z"/><path d="M14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    delivery_dining: '<path d="M4 17h10"/><path d="M4 17a4 4 0 0 1 4-4h6"/><path d="M15 8h4l2 3"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>',
    truck: '<path d="M3 7h11v10H3z"/><path d="M14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    inventory: '<path d="M3 3h18v4H3z"/><path d="M5 7v13h14V7"/><path d="M10 12h4"/>',

    // ── User / Account ──
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    account_circle: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 19a6 6 0 0 1 10 0"/>',
    account_balance: '<path d="M3 10h18"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8"/><path d="M2 20h20"/><path d="M12 3l9 5H3l9-5z"/>',
    account_balance_wallet: '<path d="M4 7h15a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V5a2 2 0 0 0 2 2z"/><path d="M16 13h5"/><circle cx="17" cy="13" r="1"/>',

    // ── Payment ──
    credit_card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/>',
    payments: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 9v0M18 15v0"/>',

    // ── Trust / Safety / Verification ──
    verified: '<path d="M12 2L9 5H5v4L2 12l3 3v4h4l3 3 3-3h4v-4l3-3-3-3V5h-4l-3-3z"/><path d="M9 12l2 2 4-4"/>',
    verified_user: '<path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/><path d="M9 12l2 2 4-4"/>',
    health_and_safety: '<path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/><path d="M10 10h4v4h-4z"/><path d="M12 8v8"/><path d="M8 12h8"/>',
    security: '<path d="M12 3l8 4v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V7l8-4z"/><path d="M9 12l2 2 4-4"/>',
    shield: '<path d="M12 3l8 4v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V7l8-4z"/>',
    security_good: '<path d="M12 3l8 4v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V7l8-4z"/><path d="M9 12l2 2 4-4"/>',
    eco: '<path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1.41-3.53C10.15 19.5 12 20 17 20s5-4 5-8c0-2-1-4-5-4z"/><path d="M3 12c2-2 4-3 7-3"/>',
    sustainability: '<path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1.41-3.53C10.15 19.5 12 20 17 20s5-4 5-8c0-2-1-4-5-4z"/><path d="M3 12c2-2 4-3 7-3"/>',

    // ── Jewelry / Luxury ──
    diamond: '<path d="M6 3h12l4 6-10 12L2 9l4-6z"/><path d="M2 9h20M8 3l4 18 4-18"/>',
    gem: '<path d="M6 3h12l4 6-10 12L2 9l4-6z"/><path d="M2 9h20M8 3l4 18 4-18"/>',
    auto_awesome: '<path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/><path d="M5 3l.7 2.3L8 6l-2.3.7L5 9l-.7-2.3L2 6l2.3-.7L5 3z"/><path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15z"/>',
    sparkles: '<path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/><path d="M5 3l.7 2.3L8 6l-2.3.7L5 9l-.7-2.3L2 6l2.3-.7L5 3z"/><path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15z"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    stars: '<path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z"/>',
    grade: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    trending_up: '<path d="M23 6l-9.5 9.5-5-5L1 18"/>',

    // ── Gift ──
    gift: '<path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    card_giftcard: '<path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    redeem: '<path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',

    // ── Location / Contact ──
    location_on: '<path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    email: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/>',

    // ── Info / Status ──
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    error: '<circle cx="12" cy="12" r="10"/><path d="M12 7v6"/><path d="M12 17h.01"/>',
    warning: '<path d="M12 2L2 22h20L12 2z"/><path d="M12 10v4"/><path d="M12 18h.01"/>',
    check_circle: '<circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>',
    cancel: '<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>',

    // ── Education / School ──
    school: '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',

    // ── Loading / Progress ──
    progress_activity: '<path d="M12 3a9 9 0 1 1-9 9"/>',
    refresh: '<path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>',

    // ── Settings / Misc ──
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    content_copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    delete: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    more_vert: '<circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>',
    more_horiz: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    keyboard_arrow_down: '<path d="M6 9l6 6 6-6"/>',
    keyboard_arrow_up: '<path d="M6 15l6-6 6 6"/>',
    keyboard_arrow_right: '<path d="M9 18l6-6-6-6"/>',
    keyboard_arrow_left: '<path d="M15 18l-6-6 6-6"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    open_in_new: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/>',
    campaign: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M10 8l6 4-6 4V8z"/>',
    local_offer: '<path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4a2 2 0 0 0-2 2v7c0 .55.22 1.05.59 1.41l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.58l7-7c.36-.36.58-.86.58-1.41s-.22-1.05-.58-1.41z"/><circle cx="6.5" cy="6.5" r="1.5"/>'
  };

  function normalizeName(text) {
    return String(text || '').trim().replace(/\s+/g, '');
  }

  function svgFor(name) {
    var paths = ICONS[name];
    if (!paths) return '';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + paths + '</svg>';
  }

  function elementIconName(el) {
    var directText = normalizeName(Array.prototype.filter.call(el.childNodes, function (n) {
      return n.nodeType === 3;
    }).map(function (n) { return n.nodeValue; }).join(''));

    if (directText && ICONS[directText]) return directText;

    var allText = normalizeName(el.textContent);
    if (allText && ICONS[allText]) return allText;

    return el.getAttribute('data-cc-icon') || '';
  }

  function renderIcon(el) {
    if (!el || !el.classList) return;
    var name = elementIconName(el);
    if (!name) return;

    var svg = svgFor(name);
    if (!svg) return;

    if (el.getAttribute('data-cc-icon') === name && el.classList.contains('cc-svg-icon') && el.querySelector('svg')) return;

    el.setAttribute('data-cc-icon', name);
    el.classList.add('cc-svg-icon');
    if (!el.getAttribute('aria-hidden') && !el.getAttribute('aria-label') && !el.closest('[aria-label]')) {
      el.setAttribute('aria-hidden', 'true');
    }
    el.innerHTML = svg;
  }

  function renderAll(root) {
    var scope = root && root.querySelectorAll ? root : document;
    if (scope.matches && scope.matches('.material-symbols-outlined,.material-icons,.material-icons-outlined')) renderIcon(scope);
    scope.querySelectorAll('.material-symbols-outlined,.material-icons,.material-icons-outlined').forEach(renderIcon);
  }

  function boot() {
    renderAll(document);

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) renderAll(node);
          });
          if (mutation.target && mutation.target.classList && mutation.target.matches('.material-symbols-outlined,.material-icons,.material-icons-outlined')) {
            renderIcon(mutation.target);
          }
        } else if (mutation.type === 'characterData') {
          var parent = mutation.target && mutation.target.parentElement;
          if (parent && parent.matches('.material-symbols-outlined,.material-icons,.material-icons-outlined')) renderIcon(parent);
        }
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
