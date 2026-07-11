/**
 * CHIC CHARMS — Wishlist System
 * Production-quality wishlist implementation with persistence, 
 * UI synchronization, and Move to Cart functionality.
 */

(function () {
  "use strict";

  const WISH_KEY = "cc_wishlist";
  const CART_KEY = "cart"; // Existing cart key used in script.js

  window.CCWishlist = {
    /**
     * Get all wishlist items
     */
    get() {
      try {
        return JSON.parse(localStorage.getItem(WISH_KEY) || "[]");
      } catch (e) {
        console.error("Wishlist retrieval error:", e);
        return [];
      }
    },

    /**
     * Save wishlist items
     */
    save(items) {
      localStorage.setItem(WISH_KEY, JSON.stringify(items));
      this.syncUI();
      // Dispatch custom event for real-time updates across components
      window.dispatchEvent(new CustomEvent("wishlistUpdated", { detail: items }));
    },

    /**
     * Add product to wishlist
     */
    add(product) {
      if (!product || !product.id) return;
      let items = this.get();
      if (items.some((item) => item.id === product.id)) return;

      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category || "",
        stock: product.stock || 0,
        addedAt: new Date().getTime(),
      });

      this.save(items);
      this.showToast(`"${product.name}" saved to wishlist!`);
    },

    /**
     * Remove product from wishlist
     */
    remove(id) {
      let items = this.get();
      const itemToRemove = items.find((item) => item.id === id);
      items = items.filter((item) => item.id !== id);
      this.save(items);
      if (itemToRemove) {
        this.showToast(`"${itemToRemove.name}" removed from wishlist`);
      }
    },

    /**
     * Toggle wishlist state
     */
    toggle(product) {
      if (this.has(product.id)) {
        this.remove(product.id);
        return false;
      } else {
        this.add(product);
        return true;
      }
    },

    /**
     * Check if product is in wishlist
     */
    has(id) {
      return this.get().some((item) => item.id === id);
    },

    /**
     * Get wishlist count
     */
    count() {
      return this.get().length;
    },

    /**
     * Move item from wishlist to cart
     */
    moveToCart(id) {
      const items = this.get();
      const item = items.find((i) => i.id === id);
      if (!item) return;

      // Integration with existing addToCartWithId if available
      if (window.addToCartWithId) {
        window.addToCartWithId(item.name, item.price, item.id);
      } else {
        // Fallback to direct cart manipulation
        try {
          const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
          const existing = cart.find((i) => i.productId === id || i.name === item.name);
          if (existing) {
            existing.quantity += 1;
          } else {
            cart.push({
              name: item.name,
              price: Number(item.price),
              quantity: 1,
              productId: item.id,
              image: item.image,
            });
          }
          localStorage.setItem(CART_KEY, JSON.stringify(cart));
          
          // Trigger cart count update if function exists
          if (window.updateCartBadges) window.updateCartBadges();
          
          // Custom event for cart updates
          window.dispatchEvent(new CustomEvent("cartUpdated"));
        } catch (e) {
          console.error("Cart move error:", e);
        }
      }

      this.remove(id);
    },

    /**
     * Synchronize all heart icons and badges on the page
     */
    syncUI() {
      const items = this.get();
      const count = items.length;

      // Update all heart buttons
      document.querySelectorAll("[data-wishlist-id]").forEach((btn) => {
        const id = btn.getAttribute("data-wishlist-id");
        const isActive = items.some((item) => item.id === id);
        btn.classList.toggle("active", isActive);
        
        const icon = btn.querySelector(".wishlist-icon");
        if (icon) {
          icon.textContent = isActive ? "favorite" : "favorite_border";
          if (isActive) {
            btn.setAttribute("aria-label", "Remove from wishlist");
          } else {
            btn.setAttribute("aria-label", "Add to wishlist");
          }
        }

        // SVG version
        const svg = btn.querySelector("svg path");
        if (svg) {
          if (isActive) {
            svg.setAttribute("fill", "currentColor");
            btn.classList.add("is-active");
          } else {
            svg.setAttribute("fill", "none");
            btn.classList.remove("is-active");
          }
        }
      });

      // Update wishlist count badges
      document.querySelectorAll(".wishlist-count").forEach((badge) => {
        badge.textContent = count;
        badge.style.display = count > 0 ? "flex" : "none";
      });

      // Handle empty state on wishlist page
      const emptyState = document.getElementById("wishlist-empty-state");
      const wishlistGrid = document.getElementById("wishlist-grid");
      const wishlistHeader = document.getElementById("wishlist-header-count");

      if (wishlistHeader) {
        wishlistHeader.textContent = `(${count})`;
      }

      if (window.location.pathname.includes("wishlist.html")) {
        if (count === 0) {
          if (emptyState) emptyState.style.display = "flex";
          if (wishlistGrid) wishlistGrid.style.display = "none";
        } else {
          if (emptyState) emptyState.style.display = "none";
          if (wishlistGrid) wishlistGrid.style.display = "grid";
        }
      }
    },

    /**
     * Show feedback toast
     */
    showToast(message) {
      // Re-use existing cart-toast if possible, otherwise create one
      let toast = document.getElementById("cartToast") || document.getElementById("wishlistToast");
      
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "wishlistToast";
        toast.className = "cart-toast";
        document.body.appendChild(toast);
      }

      if (this.toastTimer) clearTimeout(this.toastTimer);
      
      toast.textContent = message;
      toast.classList.add("show");
      
      this.toastTimer = setTimeout(() => {
        toast.classList.remove("show");
      }, 3000);
    },
  };

  // Initialize on load
  document.addEventListener("DOMContentLoaded", () => {
    window.CCWishlist.syncUI();
    
    // Global click listener for wishlist buttons
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-wishlist-action]");
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const action = btn.getAttribute("data-wishlist-action");
      const id = btn.getAttribute("data-wishlist-id");

      if (action === "toggle") {
        const product = {
          id: id,
          name: btn.getAttribute("data-wishlist-name"),
          price: btn.getAttribute("data-wishlist-price"),
          image: btn.getAttribute("data-wishlist-image"),
          category: btn.getAttribute("data-wishlist-category"),
        };
        window.CCWishlist.toggle(product);
      } else if (action === "remove") {
        window.CCWishlist.remove(id);
      } else if (action === "move-to-cart") {
        window.CCWishlist.moveToCart(id);
      }
    });
  });
})();
