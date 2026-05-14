/* ============================================================
   cart-merge.js — Chic Charms
   Merges the guest (localStorage) cart when a user logs in.

   USAGE: Import and call mergeCartOnLogin(user) right after
   a successful login or onAuthStateChanged fires with a user.

   Example in auth.html after signInWithEmailAndPassword:
     import { mergeCartOnLogin } from "./cart-merge.js";
     const cred = await signInWithEmailAndPassword(auth, email, pw);
     await mergeCartOnLogin(cred.user);

   Or in auth-ui.js inside the onAuthStateChanged callback:
     import { mergeCartOnLogin } from "./cart-merge.js";
     onAuthStateChanged(auth, async (user) => {
       if (user) { await mergeCartOnLogin(user); }
     });
   ============================================================ */

/**
 * mergeCartOnLogin
 * Reads the current localStorage cart (guest cart) and merges it.
 * Same item → increments quantity. New item → appended.
 * Saves merged result back to localStorage under key "cart".
 *
 * @param {object} user - Firebase Auth user object (only used for logging)
 */
export function mergeCartOnLogin(user) {
  console.log('[cart-merge] Running merge for:', user?.email || 'unknown');

  const CART_KEY = 'cart';

  /* ── Read existing cart ── */
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch (e) {
    console.warn('[cart-merge] Could not parse cart:', e);
    cart = [];
  }

  /* ── Validate + normalise each item ── */
  cart = cart
    .filter(item => item && typeof item.name === 'string' && item.name.trim())
    .map(item => ({
      name:     String(item.name).trim(),
      price:    Number(item.price)    || 0,
      quantity: Number(item.quantity) || 1,
    }));

  /* ── Deduplicate: merge items with the same name ── */
  const merged = [];
  cart.forEach(item => {
    const existing = merged.find(m => m.name.toLowerCase() === item.name.toLowerCase());
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      merged.push({ ...item });
    }
  });

  /* ── Save back ── */
  localStorage.setItem(CART_KEY, JSON.stringify(merged));

  const total = merged.reduce((s, i) => s + i.quantity, 0);
  console.log('[cart-merge] Merge complete:', total, 'item(s) in cart.');

  return merged;
}

/**
 * getCart
 * Safe helper to read the cart from localStorage.
 * @returns {Array} cart items
 */
export function getCart() {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch {
    return [];
  }
}

/**
 * saveCart
 * Safe helper to write the cart to localStorage.
 * @param {Array} cart
 */
export function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart || []));
}
