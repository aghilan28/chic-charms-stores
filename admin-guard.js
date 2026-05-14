/* ============================================================
   admin-guard.js — Chic Charms
   Firestore-role edition.

   Replaces the old hardcoded ADMIN_EMAILS array with a live
   Firestore lookup against the "admins" collection.

   Document structure:
     admins/<firebase-auth-uid>
       email: "cvmun28@gmail.com"   ← optional label, for readability

   To add an admin  → create admins/<uid> in Firebase Console
   To revoke access → delete that document
   To change password → Firebase Console → Authentication → Users

   Usage (unchanged from before):
     import { createAdminGuard } from "./admin-guard.js";
     const _guard = createAdminGuard({ app, nextPage, onGranted });
     _guard.start();
============================================================ */

import {
  getAuth,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ── Firestore admin role check (by UID — O(1) document read) ── */
async function checkAdminRole(db, uid) {
  try {
    const snap = await getDoc(doc(db, "admins", uid));
    return snap.exists();
  } catch (err) {
    /* Re-throw so the caller can show the correct error UI */
    throw err;
  }
}

/* ── Admin role cache key (per-UID, lives for the browser session) ──
   The Firestore getDoc is only skipped when:
     • the same UID was already verified in THIS browser session, AND
     • the cached value is "1" (granted)
   The cache is cleared on signOut and on any denial/error, so it
   cannot be used to bypass security — it only short-circuits the
   network round-trip for already-verified admins navigating between
   admin.html and index.html. ── */
const ADMIN_CACHE_KEY = (uid) => `cc_admin_verified_${uid}`;

function setCachedAdmin(uid) {
  try { sessionStorage.setItem(ADMIN_CACHE_KEY(uid), "1"); } catch (_) {}
}
function hasCachedAdmin(uid) {
  try { return sessionStorage.getItem(ADMIN_CACHE_KEY(uid)) === "1"; } catch (_) { return false; }
}
function clearCachedAdmin(uid) {
  try { sessionStorage.removeItem(ADMIN_CACHE_KEY(uid)); } catch (_) {}
}

/**
 * createAdminGuard({ app, nextPage, onGranted })
 *
 * Returns { auth, start(), cleanup() }
 *
 * start()   → begins onAuthStateChanged watch; shows overlay while verifying,
 *             calls onGranted(user) on success, shows denied/error state on failure.
 * cleanup() → unsubscribes the listener (call on beforeunload).
 */
export function createAdminGuard({ app, nextPage = "admin.html", onGranted }) {
  const auth = getAuth(app);
  const db   = getFirestore(app);
  let   unsub = null;

  /* ── Guarantee LOCAL persistence so the session survives
     storefront ↔ admin navigation without re-login ── */
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("[AdminGuard] Could not set auth persistence:", err);
  });

  /* ── Overlay helpers ── */
  const overlay = document.getElementById("adminAuthOverlay");
  const titleEl = document.getElementById("adminAuthTitle");
  const copyEl  = document.getElementById("adminAuthCopy");

  function setOverlay(phase, title, copy) {
    if (overlay)  overlay.dataset.phase = phase;
    if (titleEl)  titleEl.textContent   = title;
    if (copyEl)   copyEl.textContent    = copy;
  }

  function hideOverlay() {
    if (overlay) {
      overlay.classList.add("hide");
      setTimeout(() => { overlay.style.display = "none"; }, 400);
    }
    document.body.classList.remove("admin-auth-loading");
  }

  function showDenied(uid) {
    if (uid) clearCachedAdmin(uid);
    document.body.classList.remove("admin-auth-loading");
    document.body.classList.add("admin-denied");
    setOverlay(
      "denied",
      "Access denied",
      "This area is restricted to authorised administrators. You will be redirected."
    );
    setTimeout(async () => {
      await signOut(auth).catch(() => {});
      window.location.href = "index.html";
    }, 3000);
  }

  function showError(message, uid) {
    if (uid) clearCachedAdmin(uid);
    document.body.classList.remove("admin-auth-loading");
    document.body.classList.add("admin-denied");
    if (overlay)  overlay.dataset.phase = "error";
    if (titleEl)  titleEl.textContent   = "Verification failed";
    if (copyEl) {
      copyEl.innerHTML =
        (message || "Authentication error. Please try again.") +
        ' <a href="auth.html" style="color:var(--rose-dark,#e8809a);text-decoration:underline;margin-left:6px;">Sign in again</a>';
    }
  }

  function start() {
    setOverlay(
      "verifying",
      "Checking admin access…",
      "Please wait while we verify your permissions."
    );

    unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        /* Not signed in → send to login */
        window.location.href = "auth.html";
        return;
      }

      /* ── Fast path: already verified in this browser session ──
         Skip the Firestore round-trip. The cache is only set after
         a successful getDoc("admins/<uid>") check, and is cleared
         on any denial, error, or sign-out — so this is safe. ── */
      if (hasCachedAdmin(user.uid)) {
        hideOverlay();
        if (typeof onGranted === "function") onGranted(user);
        return;
      }

      try {
        const isAdmin = await checkAdminRole(db, user.uid);

        if (!isAdmin) {
          showDenied(user.uid);
          return;
        }

        /* ✓ Verified admin — cache the result and reveal the page */
        setCachedAdmin(user.uid);
        hideOverlay();
        if (typeof onGranted === "function") onGranted(user);

      } catch (err) {
        console.error("Admin guard error:", err);
        if (err?.code === "permission-denied") {
          showError("Permission denied. Contact your administrator.", user.uid);
        } else if (err?.code === "unavailable" || err?.code === "failed-precondition") {
          showError("Could not reach the server. Check your connection.", user.uid);
        } else {
          showError("Access verification failed. Please try again.", user.uid);
        }
      }
    });
  }

  function cleanup() {
    if (unsub) unsub();
  }

  return { auth, start, cleanup };
}
