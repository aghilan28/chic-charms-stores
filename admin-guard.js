/* ============================================================
   admin-guard.js — Chic Charms
   Firestore-role edition — with email fallback.

   Admin verification uses TWO layers:
   Layer 1: Email from Firebase Auth token (instant, no Firestore needed)
            Works even when Firestore rules block the admins collection read.
   Layer 2: Firestore admins/{uid} doc (used when email not in known list)

   To add an admin via email  → add to ADMIN_EMAILS below + create
                                admins/{uid} doc in Firebase Console
   To add an admin Firestore-only → create admins/{uid} doc only
   To revoke access → remove from ADMIN_EMAILS AND delete admins/{uid}
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

/* ── ADMIN EMAIL LIST (routing + guard layer 1) ──────────────────
   Same email used in google-auth.js and firestore.rules.
   This is the primary check — it works without any Firestore read.
   ── */
const ADMIN_EMAILS = [
  "cvmun28@gmail.com",  /* ← your admin Google account */
];

function isKnownAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

/* ── Firestore admin check (Layer 2 — graceful fallback) ─────────
   If Firestore rules deny the read, returns false silently.
   Does NOT throw — admin-guard shows "denied" UI on false, not
   an error screen, giving the email check a chance to pass first.
   ── */
async function checkAdminRole(db, uid) {
  try {
    const snap = await getDoc(doc(db, "admins", uid));
    return snap.exists();
  } catch (err) {
    /* permission-denied = rules blocked it; treat as "not found" */
    console.warn("[AdminGuard] Firestore check blocked:", err.code, "- using email fallback");
    return false;
  }
}

/* ── Session cache (unchanged) ───────────────────────────────────*/
const ADMIN_CACHE_KEY = (uid) => `cc_admin_verified_${uid}`;
function setCachedAdmin(uid)   { try { sessionStorage.setItem(ADMIN_CACHE_KEY(uid), "1"); } catch (_) {} }
function hasCachedAdmin(uid)   { try { return sessionStorage.getItem(ADMIN_CACHE_KEY(uid)) === "1"; } catch (_) { return false; } }
function clearCachedAdmin(uid) { try { sessionStorage.removeItem(ADMIN_CACHE_KEY(uid)); } catch (_) {} }

/* ── createAdminGuard ────────────────────────────────────────────
   Returns { auth, start(), cleanup() }
   start() → watches auth state; grants/denies admin access.
   ── */
export function createAdminGuard({ app, nextPage = "admin.html", onGranted }) {
  const auth = getAuth(app);
  const db   = getFirestore(app);
  let unsub  = null;

  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("[AdminGuard] Could not set auth persistence:", err);
  });

  /* ── Overlay helpers (unchanged) ── */
  const overlay = document.getElementById("adminAuthOverlay");
  const titleEl = document.getElementById("adminAuthTitle");
  const copyEl  = document.getElementById("adminAuthCopy");

  function setOverlay(phase, title, copy) {
    if (overlay) overlay.dataset.phase = phase;
    if (titleEl) titleEl.textContent = title;
    if (copyEl)  copyEl.textContent  = copy;
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
    if (overlay) overlay.dataset.phase = "error";
    if (titleEl) titleEl.textContent = "Verification failed";
    if (copyEl) {
      copyEl.innerHTML =
        (message || "Authentication error. Please try again.") +
        ' <a href="auth.html" style="color:inherit;font-weight:700;">Sign in again</a>';
    }
  }

  function start() {
    setOverlay(
      "verifying",
      "Checking admin access…",
      "Please wait while we verify your permissions."
    );

    unsub = onAuthStateChanged(auth, async (user) => {
      /* Not signed in → send to login */
      if (!user) {
        window.location.href = "auth.html";
        return;
      }

      /* ── Fast path: already verified in this session ── */
      if (hasCachedAdmin(user.uid)) {
        hideOverlay();
        if (typeof onGranted === "function") onGranted(user);
        return;
      }

      /* ── Layer 1: Email check (instant, no Firestore needed) ──
         The Firebase Auth token email is cryptographically signed
         and cannot be forged. This works even when Firestore rules
         block client reads of the admins collection.             */
      if (isKnownAdminEmail(user.email)) {
        console.log("[AdminGuard] Access granted via email:", user.email);
        setCachedAdmin(user.uid);
        hideOverlay();
        if (typeof onGranted === "function") onGranted(user);
        return;
      }

      /* ── Layer 2: Firestore admins/{uid} check ──
         Used for admins not in the ADMIN_EMAILS list.
         Fails gracefully if Firestore rules block the read.     */
      try {
        const isAdmin = await checkAdminRole(db, user.uid);

        if (!isAdmin) {
          showDenied(user.uid);
          return;
        }

        /* ✓ Verified via Firestore */
        console.log("[AdminGuard] Access granted via Firestore for UID:", user.uid);
        setCachedAdmin(user.uid);
        hideOverlay();
        if (typeof onGranted === "function") onGranted(user);

      } catch (err) {
        /* checkAdminRole never throws now — but keep this as safety net */
        console.error("[AdminGuard] Unexpected error:", err);
        showError("Access verification failed. Please try again.", user.uid);
      }
    });
  }

  function cleanup() {
    if (unsub) unsub();
  }

  return { auth, start, cleanup };
}
