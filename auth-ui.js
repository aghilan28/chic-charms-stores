/* ============================================================
   auth-ui.js - Chic Charms
   Provides:
     - setupAuthUI()  -> called by auth-nav.js to inject Login /
                        My Account / Logout into #navActions
     - isAdmin(user)  -> called by account.html to show the
                        Operations sidebar section

     Replace ADMIN_EMAILS below with your real admin address(es).
============================================================ */

import {
  auth,
  onAuthStateChanged,
  signOut,
} from "./auth.js";

/* -- Admin allow-list --------------------------------------
   Add every email that should see the admin panel.
   Comparison is lowercased so casing never matters.
------------------------------------------------------------ */
const ADMIN_EMAILS = [
  "admin@chiccharms.com",   // <- replace with your real admin email
];
const DISPLAY_NAME_MAX = 12;

function normalizeDisplayName(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * isAdmin(user) -> boolean
 * Returns true when the signed-in Firebase user is in the allow-list.
 * Safe to call with null/undefined (returns false).
 */
export function isAdmin(user) {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase().trim());
}

/**
 * setupAuthUI()
 * Watches Firebase auth state and injects the correct controls
 * into #navActions on whichever page loads auth-nav.js.
 */
export function setupAuthUI() {
  onAuthStateChanged(auth, (user) => {
    const nav = document.getElementById("navActions");
    if (!nav) return;

    if (user) {
      const displayName = normalizeDisplayName(
        user.displayName || user.email.split("@")[0],
      );
      const shortName =
        displayName.length > DISPLAY_NAME_MAX
          ? displayName.slice(0, DISPLAY_NAME_MAX) + "..."
          : displayName;
      const safeEmail = escapeHtml(user.email);
      const safeName = escapeHtml(shortName);
      const initial = (user.displayName || user.email || "?")[0].toUpperCase();
      const adminLink = isAdmin(user)
        ? `<a href="admin.html" class="nav-auth-admin" title="Admin Panel">Admin</a>`
        : "";
      nav.innerHTML =
        `<a href="account.html" class="nav-auth-identity" title="${safeEmail}" aria-label="My Account">
           <span class="nav-auth-avatar" aria-hidden="true">${escapeHtml(initial)}</span>
           <span class="nav-auth-meta">
             <span class="nav-auth-name">${safeName}</span>
             <span class="nav-auth-greeting">Welcome back</span>
           </span>
         </a>
         ${adminLink}
         <a href="cart.html" class="d7-icon-btn d7-cart-btn" aria-label="Cart" title="Cart">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
             <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
             <line x1="3" y1="6" x2="21" y2="6"/>
             <path d="M16 10a4 4 0 0 1-8 0"/>
           </svg>
           <span class="d7-cart-count" aria-hidden="true"></span>
         </a>
         <a href="account.html" class="d7-icon-btn d7-avatar-btn" aria-label="My Account" title="${safeEmail}">
           <span class="d7-avatar-initial" aria-hidden="true">${escapeHtml(initial)}</span>
         </a>
         <button type="button" class="nav-auth-logout" id="navLogoutBtn" aria-label="Logout" title="Logout">
           <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
             <path d="M4.5 2H2a.5.5 0 0 0-.5.5v7A.5.5 0 0 0 2 10h2.5M8 8.5 10.5 6 8 3.5M4.5 6h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
           </svg>
         </button>
         <button type="button" class="hamburger" id="hamburger" aria-expanded="false" aria-label="Open menu">
           <span></span><span></span>
         </button>`;
    } else {
      nav.innerHTML =
        `<a href="cart.html" class="d7-icon-btn d7-cart-btn" aria-label="Cart" title="Cart">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
             <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
             <line x1="3" y1="6" x2="21" y2="6"/>
             <path d="M16 10a4 4 0 0 1-8 0"/>
           </svg>
           <span class="d7-cart-count" aria-hidden="true"></span>
         </a>
         <a href="auth.html" class="btn btn-nav">Login</a>
         <button type="button" class="hamburger" id="hamburger" aria-expanded="false" aria-label="Open menu">
           <span></span><span></span>
         </button>`;
    }

    /* Hamburger toggle */
    const hamburger = document.getElementById("hamburger");
    const navLinks  = document.getElementById("navLinks");
    if (hamburger && navLinks) {
      hamburger.addEventListener("click", () => {
        const open = navLinks.classList.toggle("open");
        hamburger.setAttribute("aria-expanded", String(open));
        document.body.classList.toggle("d7-menu-open", open);
      });

      /* Tap on overlay backdrop (::before) closes menu */
      navLinks.addEventListener("click", (e) => {
        /* Only close when clicking the backdrop area, not the panel links */
        const panelWidth = Math.min(320, window.innerWidth * 0.88);
        if (e.clientX < window.innerWidth - panelWidth) {
          navLinks.classList.remove("open");
          hamburger.setAttribute("aria-expanded", "false");
          document.body.classList.remove("d7-menu-open");
        }
      });
    }

    /* Logout button */
    const logoutBtn = document.getElementById("navLogoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userId");
        window.location.href = "index.html";
      });
    }
  });
}
