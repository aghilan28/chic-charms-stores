/* ============================================================
   Chic Charms - Reusable Global Header Component
   ============================================================ */

(function () {
  "use strict";

  function initGlobalHeader() {
    // 1. Find existing header or navbar
    let existingHeader = document.querySelector('header.navbar, header.global-header, header.header, header.topbar, .cc-header, header');
    
    // If not found, look for any tag named header
    if (!existingHeader) {
      existingHeader = document.querySelector('header');
    }

    // 2. Define standard unified header markup matching the source of truth desktop logo
    const headerHTML = `
      <div class="nav-inner container">
        <button
          type="button"
          class="mobile-commerce-menu"
          id="hamburger"
          aria-expanded="false"
          aria-label="Open menu"
        >
          <span></span><span></span><span></span>
        </button>
        <a href="index.html" class="logo" aria-label="Chic Charms home">
          Chic<span>Charms</span>
        </a>
        <div class="mobile-commerce-actions" aria-label="Mobile shopping actions">
          <a href="search.html" class="mobile-commerce-icon" aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.8-3.8"></path></svg>
          </a>
          <a href="wishlist.html" class="mobile-commerce-icon relative" aria-label="Wishlist">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M20.8 4.6c-1.8-1.7-4.6-1.6-6.3.2L12 7.3 9.5 4.8C7.8 3 5 2.9 3.2 4.6 1.3 6.4 1.3 9.4 3.1 11.2L12 20l8.9-8.8c1.8-1.8 1.8-4.8-.1-6.6Z" />
            </svg>
            <span class="wishlist-count absolute -top-1 -right-1 bg-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center" style="display:none">0</span>
          </a>
          <a href="cart.html" class="mobile-commerce-icon mobile-commerce-cart" aria-label="Cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6Z" />
              <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span class="mobile-cart-count" aria-hidden="true"></span>
          </a>
        </div>
        <nav class="nav-links" id="navLinks" aria-label="Main navigation">
          <a href="index.html#categories">Shop</a>
          <a href="shop.html">Best Sellers</a>
          <a href="about.html" id="navAboutLink">About</a>
          <a href="index.html#testimonials">Reviews</a>
          <a href="search.html">Search</a>
          <a href="cart.html">Cart 🛍️</a>
        </nav>
        <div class="nav-actions" id="navActions">
          <!-- Auth state injected dynamically by auth-nav.js/auth-ui.js -->
        </div>
      </div>
    `;

    // 3. Render header
    if (existingHeader) {
      existingHeader.className = "navbar";
      existingHeader.id = "navbar";
      existingHeader.innerHTML = headerHTML;
    } else {
      // Create a brand new header element and insert it at the very top of the body
      const newHeader = document.createElement('header');
      newHeader.className = "navbar";
      newHeader.id = "navbar";
      newHeader.innerHTML = headerHTML;
      document.body.insertBefore(newHeader, document.body.firstChild);
    }

    // 4. Set up mobile hamburger toggle events
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("navLinks");
    if (hamburger && navLinks) {
      hamburger.addEventListener("click", function (e) {
        e.stopPropagation();
        const open = navLinks.classList.toggle("open");
        hamburger.classList.toggle("open", open);
        hamburger.setAttribute("aria-expanded", String(open));
        document.body.classList.toggle("d7-menu-open", open);
      });

      // Close menu if clicking outside
      document.addEventListener("click", function (e) {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
          navLinks.classList.remove("open");
          hamburger.classList.remove("open");
          hamburger.setAttribute("aria-expanded", "false");
          document.body.classList.remove("d7-menu-open");
        }
      });
    }

    // 5. Update Cart Counts & Wishlist Counts from localStorage
    function syncHeaderBadges() {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const units = cart.reduce((sum, item) => sum + (Number(item.quantity) || Number(item.qty) || 1), 0);
        const cartBadges = document.querySelectorAll(".mobile-cart-count, .cc-cart-count");
        cartBadges.forEach(badge => {
          badge.textContent = units;
          badge.style.display = units > 0 ? "flex" : "none";
        });
      } catch (e) {
        console.warn("Failed to sync cart badges:", e);
      }

      try {
        const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
        const wishlistBadges = document.querySelectorAll(".wishlist-count");
        wishlistBadges.forEach(badge => {
          badge.textContent = wishlist.length;
          badge.style.display = wishlist.length > 0 ? "flex" : "none";
        });
      } catch (e) {
        console.warn("Failed to sync wishlist badges:", e);
      }
    }

    syncHeaderBadges();
    window.addEventListener("storage", syncHeaderBadges);
    window.addEventListener("wishlistUpdated", syncHeaderBadges);
    window.addEventListener("cartUpdated", syncHeaderBadges);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGlobalHeader);
  } else {
    initGlobalHeader();
  }
})();
