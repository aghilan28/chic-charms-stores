/* ============================================================
   auth-ui.js — Chic Charms
   Provides:
     - setupAuthUI()  → injects Login / My Account / Logout into #navActions
     - isAdmin(user)  → async Firestore check (replaces hardcoded ADMIN_EMAILS)

   RULES FOLLOWED:
   ✓ Desktop nav HTML structure is byte-for-byte identical to original
   ✓ Exact same CSS classes as original (nav-auth-identity, nav-auth-avatar, etc.)
   ✓ No extra Cart button injected (cart already exists in nav HTML)
   ✓ No hardcoded email lists
   ✓ Role read from Firestore admins/{uid} — backend is source of truth
   ============================================================ */

import { auth, onAuthStateChanged, signOut } from "./auth.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();
const DISPLAY_NAME_MAX = 12;

/* ── Helpers ──────────────────────────────────────────────────── */
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

/* ── Session role cache (same strategy as admin-guard.js) ────────
   Cached per UID for the browser session only.
   Cleared on sign-out, denial, or error.                     ── */
const CACHE_KEY = uid => `cc_admin_verified_${uid}`;
function setCached(uid)   { try { sessionStorage.setItem(CACHE_KEY(uid), "1"); } catch (_) {} }
function hasCached(uid)   { try { return sessionStorage.getItem(CACHE_KEY(uid)) === "1"; } catch (_) { return false; } }
function clearCached(uid) { try { sessionStorage.removeItem(CACHE_KEY(uid)); } catch (_) {} }

/* ── Firestore admin check ───────────────────────────────────────
   Reads admins/{uid} — same collection used by admin-guard.js
   and the Firestore security rules.
   Returns true if the doc exists and is active.              ── */
async function checkAdminInFirestore(uid) {
  if (!uid) return false;
  if (hasCached(uid)) return true;          // fast path: already verified
  try {
    const snap = await getDoc(doc(db, "admins", uid));
    if (snap.exists()) {
      const d      = snap.data() || {};
      const active = !("active" in d) || d.active === true;
      if (active) { setCached(uid); return true; }
    }
    return false;
  } catch (err) {
    console.warn("[auth-ui] Admin check error:", err.message);
    return false;   // fail-safe — never grant admin on error
  }
}

/* ── Public: async isAdmin(user) ─────────────────────────────── */
export async function isAdmin(user) {
  if (!user?.uid) return false;
  return checkAdminInFirestore(user.uid);
}

/* ── setupAuthUI() ───────────────────────────────────────────────
   Injects nav controls into #navActions.
   HTML structure and CSS classes are IDENTICAL to the original.
   Only difference: admin link is shown/hidden based on Firestore
   admins/{uid} lookup instead of a hardcoded email list.
   ── */
export function setupAuthUI() {
  onAuthStateChanged(auth, async (user) => {
    const nav = document.getElementById("navActions");
    if (!nav) return;

    if (user) {
      const displayName = normalizeDisplayName(
        user.displayName || user.email.split("@")[0]
      );
      const shortName =
        displayName.length > DISPLAY_NAME_MAX
          ? displayName.slice(0, DISPLAY_NAME_MAX) + "..."
          : displayName;
      const safeEmail = escapeHtml(user.email);
      const safeName  = escapeHtml(shortName);
      const initial   = (user.displayName || user.email || "?")[0].toUpperCase();

      /* ── Step 1: instant paint — no admin link yet ──────────────
         Uses EXACT same CSS classes as original auth-ui.js.
         No extra Cart button — cart is already in the nav HTML.  */
      nav.innerHTML = `
        <a class="nav-auth-identity" href="account.html" title="${safeEmail}" aria-label="My account">
          <span class="nav-auth-avatar">${escapeHtml(initial)}</span>
          <span class="nav-auth-meta">
            <span class="nav-auth-name">${safeName}</span>
            <span class="nav-auth-greeting">Welcome back</span>
          </span>
        </a>
        <span id="navAdminSlot"></span>
        <button id="navLogoutBtn" class="nav-auth-logout" aria-label="Sign out" title="Sign out">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      `;

      /* ── Step 2: async Firestore check → patch admin link ─────── */
      try {
        const adminVerified = await checkAdminInFirestore(user.uid);
        const adminSlot     = document.getElementById("navAdminSlot");
        const acctLink      = nav.querySelector(".nav-auth-identity");

        /* Store role for mobile bottom-nav */
        try {
          sessionStorage.setItem("cc_user_role", adminVerified ? "admin" : "customer");
        } catch (_) {}

        if (adminVerified) {
          /* Admin → account pill links to admin.html + show admin badge */
          if (acctLink)   acctLink.href = "admin.html";
          if (adminSlot)  adminSlot.innerHTML =
            `<a href="admin.html" class="nav-auth-admin" title="Admin Panel">Admin</a>`;
        } else {
          /* Customer → keep account.html, no badge */
          if (adminSlot)  adminSlot.innerHTML = "";
        }

        /* Notify mobile-app.js to update bottom-nav Account tab */
        window.dispatchEvent(new CustomEvent("cc-role-resolved", {
          detail: { role: adminVerified ? "admin" : "customer", uid: user.uid }
        }));

      } catch (err) {
        console.warn("[auth-ui] Admin slot update failed:", err.message);
      }

    } else {
      /* ── Logged-out nav (original structure, no cart button added) ── */
      try { sessionStorage.removeItem("cc_user_role"); } catch (_) {}
      nav.innerHTML = `<a href="auth.html" class="btn btn-nav">Login</a>`;
    }

    /* ── Hamburger / drawer (unchanged from original) ────────────── */
    const hamburger = document.getElementById("hamburger");
    const navLinks  = document.getElementById("navLinks");
    if (hamburger && navLinks) {
      hamburger.addEventListener("click", () => {
        const open = navLinks.classList.toggle("open");
        hamburger.setAttribute("aria-expanded", String(open));
        document.body.classList.toggle("d7-menu-open", open);
      });
      navLinks.addEventListener("click", (e) => {
        const panelWidth = Math.min(320, window.innerWidth * 0.88);
        if (e.clientX < window.innerWidth - panelWidth) {
          navLinks.classList.remove("open");
          hamburger.setAttribute("aria-expanded", "false");
          document.body.classList.remove("d7-menu-open");
        }
      });
    }

    /* ── Logout ──────────────────────────────────────────────────── */
    const logoutBtn = document.getElementById("navLogoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        if (user) clearCached(user.uid);
        try { sessionStorage.removeItem("cc_user_role"); } catch (_) {}
        await signOut(auth);
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userId");
        window.location.href = "index.html";
      });
    }
  });
}
