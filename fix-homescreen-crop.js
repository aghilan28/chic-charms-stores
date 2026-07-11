/* ============================================================
   FIX: Auto-crop images on homescreen - JavaScript Helper
   ============================================================
   
   This script ensures all product images on the homescreen
   are properly cropped and contained within their aspect ratio
   containers.
   ============================================================ */

(function() {
  'use strict';
  
  // Function to fix image cropping
  function fixImageCropping() {
    // Find all product cards on the page
    const productCards = document.querySelectorAll('.product-card-lux');
    
    productCards.forEach(card => {
      const imgContainer = card.querySelector('.lux-img-container');
      const img = card.querySelector('.lux-img-container img');
      const imgLink = card.querySelector('.lux-img-link');
      
      if (!imgContainer || !img) return;
      
      // Force aspect ratio container
      imgContainer.style.position = 'relative';
      imgContainer.style.overflow = 'hidden';
      imgContainer.style.aspectRatio = '4 / 5';
      imgContainer.style.width = '100%';
      imgContainer.style.height = 'auto';
      imgContainer.style.backgroundColor = '#FAF1F4';
      
      // Force image to cover container
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.objectPosition = 'center top';
      img.style.display = 'block';
      img.style.position = 'absolute';
      img.style.top = '0';
      img.style.left = '0';
      
      // Make sure image link fills container
      if (imgLink) {
        imgLink.style.display = 'block';
        imgLink.style.width = '100%';
        imgLink.style.height = '100%';
        imgLink.style.position = 'absolute';
        imgLink.style.top = '0';
        imgLink.style.left = '0';
        imgLink.style.zIndex = '1';
      }
      
      // Fix badge positioning
      const badge = card.querySelector('.mobile-product-badge');
      const badges = card.querySelector('.lux-badges');
      
      if (badge) {
        badge.style.position = 'absolute';
        badge.style.top = '10px';
        badge.style.left = '10px';
        badge.style.zIndex = '6';
      }
      
      if (badges) {
        badges.style.position = 'absolute';
        badges.style.top = '10px';
        badges.style.left = '10px';
        badges.style.zIndex = '7';
      }
    });
    
    console.log('[ChicCharms] Image cropping fix applied to', productCards.length, 'product cards');
  }
  
  // Function to observe DOM changes and apply fix to new cards
  function observeProductGrid() {
    const productContainer = document.getElementById('products-container');
    
    if (!productContainer) {
      console.warn('[ChicCharms] Products container not found');
      return;
    }
    
    // Apply fix immediately
    fixImageCropping();
    
    // Create a MutationObserver to watch for new cards being added
    const observer = new MutationObserver(function(mutations) {
      let shouldFix = false;
      
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length > 0) {
          shouldFix = true;
        }
      });
      
      if (shouldFix) {
        // Small delay to ensure DOM is fully updated
        setTimeout(fixImageCropping, 100);
      }
    });
    
    // Start observing
    observer.observe(productContainer, {
      childList: true,
      subtree: true
    });
    
    console.log('[ChicCharms] MutationObserver attached to products container');
  }
  
  // Apply fix when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      observeProductGrid();
    });
  } else {
    observeProductGrid();
  }
  
  // Also apply fix after Firebase loads products
  window.addEventListener('load', function() {
    setTimeout(fixImageCropping, 500);
    setTimeout(fixImageCropping, 1500);
    setTimeout(fixImageCropping, 3000);
  });
  
  // Expose function globally for manual calls
  window.fixImageCropping = fixImageCropping;
  
})();
