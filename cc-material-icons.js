/* ═══════════════════════════════════════════════════════════════════
   CHIC CHARMS — Global Material Symbols Runtime Fallback
   Prevents Material icon ligature names (arrow_back, visibility, etc.)
   from ever being displayed as plain text if the webfont is unavailable.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var ICONS = {
    add: '<path d="M12 5v14M5 12h14"/>',
    remove: '<path d="M5 12h14"/>',
    arrow_back: '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
    arrow_forward: '<path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    chevron_right: '<path d="M9 18l6-6-6-6"/>',
    close: '<path d="M18 6L6 18M6 6l12 12"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4.2-4.2"/>',
    tune: '<path d="M4 6h10M18 6h2M4 18h10M18 18h2M4 12h2M10 12h10"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
    sort: '<path d="M4 7h16M7 12h10M10 17h4"/>',
    expand_more: '<path d="M6 9l6 6 6-6"/>',
    visibility: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="3"/>',
    visibility_off: '<path d="M3 3l18 18"/><path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6"/><path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a18.7 18.7 0 0 1-3 4.1"/><path d="M6.6 6.6C3.6 8.5 2 12 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.8-.8"/>',
    favorite: '<path fill="currentColor" stroke="none" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
    favorite_border: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>',
    home: '<path d="M3 10.5L12 3l9 7.5"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    shopping_bag: '<path d="M6 7h12l1 14H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
    shopping_cart: '<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h3l3 12h10l3-8H7"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    account_circle: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 19a6 6 0 0 1 10 0"/>',
    account_balance: '<path d="M3 10h18"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8"/><path d="M2 20h20"/><path d="M12 3l9 5H3l9-5z"/>',
    account_balance_wallet: '<path d="M4 7h15a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V5a2 2 0 0 0 2 2z"/><path d="M16 13h5"/><circle cx="17" cy="13" r="1"/>',
    credit_card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/>',
    payments: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 9v0M18 15v0"/>',
    local_shipping: '<path d="M3 7h11v10H3z"/><path d="M14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    delivery_dining: '<path d="M4 17h10"/><path d="M4 17a4 4 0 0 1 4-4h6"/><path d="M15 8h4l2 3"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>',
    security: '<path d="M12 3l8 4v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V7l8-4z"/><path d="M9 12l2 2 4-4"/>',
    diamond: '<path d="M6 3h12l4 6-10 12L2 9l4-6z"/><path d="M2 9h20M8 3l4 18 4-18"/>',
    location_on: '<path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    error: '<circle cx="12" cy="12" r="10"/><path d="M12 7v6"/><path d="M12 17h.01"/>',
    school: '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
    progress_activity: '<path d="M12 3a9 9 0 1 1-9 9"/>'
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
