/* ═══════════════════════════════════════════════════════════════════
   CHIC CHARMS — Global Reusable Header Component
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function injectHeader() {
    document.querySelectorAll('header, .navbar, .ccap-header').forEach(el => el.remove());
    document.querySelectorAll('.announcement-bar, .ccap-announcement').forEach(el => el.remove());
    document.querySelectorAll('div').forEach(el => {
      if (el.className && typeof el.className === 'string' && el.className.includes('sticky top-0 z-[60] bg-primary')) {
        el.remove();
      }
    });

    const headerCSS = `
      :root {
        --cc-brand-pink: #B5657A;
        --cc-header-bg: #FFF9F7;
        --cc-header-border: rgba(181, 101, 122, 0.12);
        --cc-text-rose: #9F4C67;
      }
      
      #cc-global-header-wrapper {
        position: relative;
        width: 100%;
        z-index: 1000;
        font-family: 'Inter', sans-serif;
      }
      
      #cc-announcement-bar {
        position: sticky;
        top: 0;
        z-index: 60;
        background-color: var(--cc-brand-pink);
        color: #ffffff;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      #cc-announcement-bar span {
        font-size: 11px;
        letter-spacing: 0.12em;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      #cc-main-header {
        position: sticky;
        top: 40px;
        z-index: 50;
        background-color: var(--cc-header-bg);
        border-bottom: 1px solid var(--cc-header-border);
        height: 80px;
        padding: 0 16px;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        width: 100%;
        box-sizing: border-box;
      }
      
      #cc-main-header button,
      #cc-main-header a {
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        text-decoration: none;
      }
      
      #cc-main-header .cc-menu-btn {
        grid-column: 1;
        grid-row: 1;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }
      
      #cc-main-header .cc-menu-btn span {
        color: var(--cc-text-rose);
      }
      
      #cc-main-header .cc-logo-container {
        grid-column: 1 / -1;
        grid-row: 1;
        justify-self: center;
        display: flex;
        align-items: center;
        pointer-events: none; /* allow clicks to pass through if they overlap icons */
      }
      
      #cc-main-header .cc-logo {
        pointer-events: auto; /* make the link clickable */
        font-family: 'Playfair Display', Georgia, serif;
        font-weight: 500;
        font-size: clamp(2.05rem, 5.2vw, 2.6rem);
        letter-spacing: -0.01em;
        color: var(--cc-brand-pink);
        line-height: 1;
        margin: 0;
        white-space: nowrap;
      }
      
      #cc-main-header .cc-right-icons {
        grid-column: 3;
        grid-row: 1;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
      }
      
      #cc-main-header .cc-icon-link {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        position: relative;
      }
      
      #cc-main-header .cc-icon-link span.material-symbols-outlined {
        color: var(--cc-text-rose);
      }
      
      #cc-main-header .cc-cart-badge {
        position: absolute;
        top: 2px;
        right: 0px;
        background-color: var(--cc-text-rose);
        color: white;
        font-size: 10px;
        font-weight: bold;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }
      
      @media (min-width: 768px) {
        #cc-main-header {
          padding: 0 40px;
        }
      }
    `;

    const html = `
      <div id="cc-announcement-bar">
        <span>Free Shipping Across India</span>
      </div>
      <header id="cc-main-header">
        <button aria-label="Menu" class="cc-menu-btn" onclick="if(typeof toggleDrawer === 'function') { toggleDrawer(true); } else { document.body.classList.toggle('d7-menu-open'); }">
          <span class="material-symbols-outlined">menu</span>
        </button>
        
        <div class="cc-logo-container">
          <a href="index.html" class="cc-logo">ChicCharms</a>
        </div>
        
        <div class="cc-right-icons">
          <a href="search.html" aria-label="Search" class="cc-icon-link" style="justify-content: center; margin-right: -8px;">
            <span class="material-symbols-outlined">search</span>
          </a>
          <a href="cart.html" aria-label="Cart" class="cc-icon-link" style="justify-content: center;">
            <span class="material-symbols-outlined">shopping_bag</span>
            <span class="cc-cart-badge hidden" id="global-cart-badge" style="display:none;">0</span>
          </a>
        </div>
      </header>
    `;

    const style = document.createElement('style');
    style.innerHTML = headerCSS;
    document.head.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.id = 'cc-global-header-wrapper';
    wrapper.innerHTML = html;
    
    if (document.body.firstChild) {
      document.body.insertBefore(wrapper, document.body.firstChild);
    } else {
      document.body.appendChild(wrapper);
    }

    const pageName = window.location.pathname.split('/').pop().toLowerCase();
    if (pageName === 'category.html' || pageName === 'shop.html') {
      const searchIcon = wrapper.querySelector('a[aria-label="Search"]');
      if (searchIcon) searchIcon.remove();
    }

    
    if (!document.querySelector('link[href*="Material+Symbols+Outlined"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
      document.head.appendChild(link);
    }
    if (!document.querySelector('link[href*="Playfair+Display"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@100..900&display=swap';
      document.head.appendChild(link);
    }
  }

  function wireCartBadge() {
    function updateCount() {
      let count = 0;
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || localStorage.getItem('cc_cart') || '[]');
        count = cart.reduce((sum, item) => sum + (Number(item.quantity) || Number(item.qty) || 1), 0);
      } catch (e) {}
      
      const badge = document.getElementById('global-cart-badge');
      if (badge) {
        if (count > 0) {
          badge.textContent = count > 9 ? '9+' : String(count);
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      }
    }

    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener('cartUpdated', updateCount);
    setInterval(updateCount, 1500);
  }

  function boot() {
    injectHeader();
    wireCartBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
