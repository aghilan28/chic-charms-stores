/* ============================================================
   FIX: Auto-crop images on homescreen v2.0 - JavaScript Helper
   ============================================================
   
   Uses MutationObserver to detect when Firebase loads product
   cards, then applies the CSS fix by ensuring the container
   structure is correct. Unlike the old approach, this doesn't
   set inline styles (CSS handles that via fix-homescreen-crop.css),
   it just ensures the DOM mutation observer triggers a re-layout.
   ============================================================ */

(function() {
  'use strict';
  
  /**
   * Forces a layout reflow on all product card image containers.
   * This ensures the browser recalculates aspect-ratio after
   * Firebase dynamically inserts new cards.
   */
  function forceReflow() {
    var containers = document.querySelectorAll('.lux-img-container');
    if (!containers.length) return;
    
    // Force a style recalculation by toggling a no-op property
    // This is needed because some browsers don't recalculate
    // aspect-ratio when content changes dynamically
    var count = containers.length;
    for (var i = 0; i < count; i++) {
      var c = containers[i];
      // Toggle contain property to force re-layout
      c.style.contain = '';
      // Force a micro reflow
      void c.offsetHeight;
    }
    
    console.log('[ChicCharms] Crop fix reflow triggered for', count, 'containers');
  }

  /**
   * Observes the product grid for dynamically added cards
   * and triggers CSS re-calculation.
   */
  function observeProductChanges() {
    var productContainer = document.getElementById('products-container');
    
    if (!productContainer) {
      // Retry after a short delay if container not found yet
      setTimeout(observeProductChanges, 500);
      return;
    }
    
    // Apply fix immediately for any existing cards
    forceReflow();
    
    // Observe for new cards being added
    var observer = new MutationObserver(function(mutations) {
      var hasAddedNodes = false;
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes.length > 0) {
          hasAddedNodes = true;
          break;
        }
      }
      if (hasAddedNodes) {
        // Use requestAnimationFrame to ensure DOM is fully painted
        requestAnimationFrame(function() {
          requestAnimationFrame(forceReflow);
        });
      }
    });
    
    observer.observe(productContainer, {
      childList: true,
      subtree: true
    });
    
    console.log('[ChicCharms] MutationObserver watching products container');
    
    // Store observer globally for cleanup
    window.__chicCropObserver = observer;
  }
  
  // Start observation when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeProductChanges);
  } else {
    observeProductChanges();
  }
  
  // Also re-fire after full page load (catches late-loading assets)
  window.addEventListener('load', function() {
    setTimeout(forceReflow, 300);
    setTimeout(forceReflow, 1000);
    setTimeout(forceReflow, 3000);
  });
  
  // Expose for manual debugging
  window.__chicCropReflow = forceReflow;
  
})();
