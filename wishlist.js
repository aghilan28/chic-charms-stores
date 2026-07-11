/* Chic Charms Wishlist — shared local-first store and UI synchronisation */
(function (window, document) {
  'use strict';
  var KEY = 'cc_wishlist';
  var EVENT = 'cc:wishlist-change';

  function text(value, fallback) { return value == null || value === '' ? (fallback || '') : String(value); }
  function number(value, fallback) { var n = Number(value); return Number.isFinite(n) ? n : (fallback || 0); }
  function normalise(raw) {
    if (typeof raw === 'string' || typeof raw === 'number') return { id: String(raw) };
    raw = raw || {};
    var image = raw.image || raw.img || raw.imageUrl || (raw.images && raw.images.productImage) || '';
    return {
      id: text(raw.id || raw.productId || raw.docId), name: text(raw.name, 'Chic Charms Jewellery'),
      price: number(raw.price), oldPrice: number(raw.oldPrice || raw.old || raw.mrp || raw.compareAtPrice),
      image: text(image), rating: number(raw.rating), stock: raw.stock == null ? null : number(raw.stock),
      category: text(raw.category || raw.categorySlug), url: text(raw.url), savedAt: number(raw.savedAt, Date.now())
    };
  }
  function get() {
    try {
      var parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      var seen = Object.create(null);
      return parsed.map(normalise).filter(function (item) { return item.id && !seen[item.id] && (seen[item.id] = true); });
    } catch (error) { return []; }
  }
  function commit(items, detail) {
    var unique = []; var seen = Object.create(null);
    items.map(normalise).forEach(function (item) { if (item.id && !seen[item.id]) { seen[item.id] = true; unique.push(item); } });
    try { localStorage.setItem(KEY, JSON.stringify(unique)); } catch (error) { console.warn('[Chic Charms] Wishlist could not be saved.', error); }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: detail || { items: unique } }));
    sync(); return unique;
  }
  function has(id) { return get().some(function (item) { return item.id === String(id); }); }
  function add(product) {
    product = normalise(product); if (!product.id) return false;
    var items = get(); if (items.some(function (item) { return item.id === product.id; })) return false;
    items.unshift(product); commit(items, { action: 'add', product: product }); toast(product.name + ' saved to your wishlist'); return true;
  }
  function remove(id) {
    id = String(id); var items = get(); var removed = items.find(function (item) { return item.id === id; });
    if (!removed) return false; commit(items.filter(function (item) { return item.id !== id; }), { action: 'remove', product: removed });
    toast('Removed from your wishlist'); return true;
  }
  function toggle(product) { product = normalise(product); return has(product.id) ? (remove(product.id), false) : (add(product), true); }
  function toast(message) {
    var node = document.getElementById('cc-wishlist-toast');
    if (!node) { node = document.createElement('div'); node.id = 'cc-wishlist-toast'; node.className = 'cc-wishlist-toast'; node.setAttribute('role', 'status'); node.setAttribute('aria-live', 'polite'); document.body.appendChild(node); }
    node.textContent = message; node.classList.remove('is-visible'); void node.offsetWidth; node.classList.add('is-visible');
    clearTimeout(toast.timer); toast.timer = setTimeout(function () { node.classList.remove('is-visible'); }, 2600);
  }
  function productFromButton(button) {
    var d = button.dataset;
    return normalise({ id: d.wishlistId || d.wish || d.productId, name: d.wishlistName, price: d.wishlistPrice,
      oldPrice: d.wishlistOldPrice, image: d.wishlistImage, rating: d.wishlistRating, stock: d.wishlistStock,
      category: d.wishlistCategory, url: d.wishlistUrl });
  }
  function sync() {
    var count = get().length;
    document.querySelectorAll('[data-wishlist-id], [data-wish]').forEach(function (button) {
      var id = button.dataset.wishlistId || button.dataset.wish; var active = has(id);
      button.classList.toggle('is-wishlisted', active); button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.setAttribute('aria-label', (active ? 'Remove from wishlist' : 'Add to wishlist') + (button.dataset.wishlistName ? ': ' + button.dataset.wishlistName : ''));
    });
    document.querySelectorAll('[data-wishlist-count]').forEach(function (badge) { badge.textContent = count > 99 ? '99+' : String(count); badge.hidden = count === 0; });
  }
  function moveToCart(product) {
    product = normalise(product); if (product.stock !== null && product.stock <= 0) { toast('This piece is currently unavailable'); return false; }
    var cart; try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch (e) { cart = []; }
    if (!Array.isArray(cart)) cart = [];
    var existing = cart.find(function (item) { return String(item.productId || item.id || '') === product.id; });
    if (existing) existing.quantity = number(existing.quantity, 1) + 1;
    else cart.push({ productId: product.id, id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
    localStorage.setItem('cart', JSON.stringify(cart)); remove(product.id); toast(product.name + ' moved to your bag');
    window.dispatchEvent(new CustomEvent('cc:cart-change')); return true;
  }
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-wishlist-id], [data-wish]'); if (!button) return;
    event.preventDefault(); event.stopPropagation(); toggle(productFromButton(button));
  }, true);
  window.addEventListener('storage', function (event) { if (event.key === KEY) sync(); });
  window.addEventListener(EVENT, sync);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync); else sync();
  new MutationObserver(function () { sync(); }).observe(document.documentElement, { childList: true, subtree: true });
  window.CCWishlist = { get: get, save: commit, has: has, add: add, remove: remove, toggle: toggle, sync: sync, toast: toast, normalise: normalise, moveToCart: moveToCart, key: KEY };
})(window, document);
