/* Chic Charms account navigation
 * A single, dependency-free mobile bottom-navigation controller.
 * The markup is rendered once and uses semantic links and inline SVG icons.
 */
(function () {
  "use strict";

  const MOBILE_QUERY = window.matchMedia("(max-width: 767px)");
  const NAV_ID = "accountBottomNav";

  const icons = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3Z"/></svg>',
    shop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>',
    account: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.2-6 8-6s6.5 2 8 6"/></svg>',
    cart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 1.9-1.5L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>'
  };

  const items = [
    ["index.html", "Home", "home"],
    ["shop.html", "Shop", "shop"],
    ["search.html", "Search", "search"],
    ["account.html", "Account", "account"],
    ["cart.html", "Cart", "cart"]
  ];

  function createNav() {
    if (document.getElementById(NAV_ID)) return;
    const nav = document.createElement("nav");
    nav.id = NAV_ID;
    nav.className = "account-bottom-nav";
    nav.setAttribute("aria-label", "Mobile navigation");
    nav.innerHTML = items.map(([href, label, icon]) =>
      `<a href="${href}" class="account-bottom-nav__item${label === "Account" ? " is-active" : ""}"${label === "Account" ? ' aria-current="page"' : ""}>${icons[icon]}<span>${label}</span></a>`
    ).join("");
    document.body.appendChild(nav);
  }

  function sync() {
    if (MOBILE_QUERY.matches) createNav();
    else document.getElementById(NAV_ID)?.remove();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sync, { once: true });
  } else {
    sync();
  }

  if (MOBILE_QUERY.addEventListener) MOBILE_QUERY.addEventListener("change", sync);
  else MOBILE_QUERY.addListener(sync);
})();
