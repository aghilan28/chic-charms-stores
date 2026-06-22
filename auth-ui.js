/* ============================================================
   auth-ui.js — Chic Charms
   Provides:
     - setupAuthUI()  → injects nav controls into #navActions
     - isAdmin(user)  → checks admin status

   ADMIN DETECTION — same two-layer approach as google-auth.js:
   Layer 1: Email from Firebase Auth token (instant, always works)
   Layer 2: Firestore admins/{uid} (backup for future admins)

   Desktop nav HTML structure and CSS classes: IDENTICAL to original.
   No extra Cart button injected.
   ============================================================ */

import { auth, onAuthStateChanged, signOut } from "./auth.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();
const DISPLAY_NAME_MAX = 12;

/* ── ADMIN EMAIL LIST (routing only — not a security layer) ──────
   Security is enforced by Firestore rules + admin-guard.js.
   ── */
const ADMIN_EMAILS = [
  "cvmun28@gmail.com",  /* ← your admin account */
];

function isKnownAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

/* ── Helpers ─────────────────────────────────────────────────── */
function normalizeDisplayName(v) {
  return String(v || "").replace(/\s+/g, " ").trim();
}
function escapeHtml(v) {
  return String(v || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ── Session cache ────────────────────────────────────────────── */
const CACHE_KEY = uid => `cc_admin_verified_${uid}`;
function setCached(uid)   { try { sessionStorage.setItem(CACHE_KEY(uid), "1"); } catch (_) {} }
function hasCached(uid)   { try { return sessionStorage.getItem(CACHE_KEY(uid)) === "1"; } catch (_) { return false; } }
function clearCached(uid) { try { sessionStorage.removeItem(CACHE_KEY(uid)); } catch (_) {} }

/* ── Admin check (two layers) ────────────────────────────────────
   Returns true if admin, false if not.                         ── */
async function checkIsAdmin(user) {
  if (!user) return false;

  /* Fast path: already verified in this session */
  if (hasCached(user.uid)) return true;

  /* Layer 1: email (instant, Firebase-verified, cannot be forged) */
  if (isKnownAdminEmail(user.email)) {
    setCached(user.uid);
    return true;
  }

  /* Layer 2: Firestore admins/{uid} (may fail on first login) */
  try {
    const snap = await getDoc(doc(db, "admins", user.uid));
    if (snap.exists()) {
      const d      = snap.data() || {};
      const active = !("active" in d) || d.active === true;
      if (active) { setCached(user.uid); return true; }
    }
  } catch (err) {
    console.warn("[auth-ui] Firestore admin check failed:", err.message);
    /* Fall through — email was already checked above */
  }

  return false;
}

/* ── Public: async isAdmin(user) ─────────────────────────────── */
export async function isAdmin(user) {
  return checkIsAdmin(user);
}

/* ── setupAuthUI() ───────────────────────────────────────────────
   Uses exact same CSS classes as original auth-ui.js.
   No extra Cart button — cart already exists in the nav HTML.
   ── */
export function setupAuthUI() {
  onAuthStateChanged(auth, async (user) => {
    const nav = document.getElementById("navActions");
    if (!nav) return;

    if (user) {
      const displayName = normalizeDisplayName(
        user.displayName || user.email.split("@")[0]
      );
      const shortName = displayName.length > DISPLAY_NAME_MAX
        ? displayName.slice(0, DISPLAY_NAME_MAX) + "..."
        : displayName;
      const safeEmail = escapeHtml(user.email);
      const safeName  = escapeHtml(shortName);
      const initial   = (user.displayName || user.email || "?")[0].toUpperCase();

      /* Step 1: instant paint with skeleton — same CSS classes as original */
      nav.innerHTML = `
        <a class="nav-auth-identity" href="account.html"
           title="${safeEmail}" aria-label="My account">
          <span class="nav-auth-avatar">${escapeHtml(initial)}</span>
          <span class="nav-auth-meta">
            <span class="nav-auth-name">${safeName}</span>
            <span class="nav-auth-greeting">Welcome back</span>
          </span>
        </a>
        <span id="navAdminSlot"></span>
        <button id="navLogoutBtn" class="nav-auth-logout"
                aria-label="Sign out" title="Sign out">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>`;

      /* Step 2: async admin check → patch link + badge */
      try {
        const adminVerified = await checkIsAdmin(user);
        const adminSlot     = document.getElementById("navAdminSlot");
        const acctLink      = nav.querySelector(".nav-auth-identity");

        try {
          sessionStorage.setItem("cc_user_role", adminVerified ? "admin" : "customer");
        } catch (_) {}

        if (adminVerified) {
          if (acctLink)  acctLink.href = "admin.html";
          if (adminSlot) adminSlot.innerHTML =
            `<a href="admin.html" class="nav-auth-admin" title="Admin Panel">Admin</a>`;
        } else {
          if (adminSlot) adminSlot.innerHTML = "";
        }

        window.dispatchEvent(new CustomEvent("cc-role-resolved", {
          detail: { role: adminVerified ? "admin" : "customer", uid: user.uid }
        }));

      } catch (err) {
        console.warn("[auth-ui] Admin patch failed:", err.message);
      }

    } else {
      /* Logged out */
      try { sessionStorage.removeItem("cc_user_role"); } catch (_) {}
      nav.innerHTML = `<a href="auth.html" class="btn btn-nav">Login</a>`;
    }

    /* Hamburger / drawer — unchanged from original */
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

    /* Logout */
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
