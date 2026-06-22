/* ============================================================
   google-auth.js — Chic Charms
   Handles "Continue with Google" on auth.html.

   ONLY CHANGE vs original:
     After successful sign-in, checks Firestore admins/{uid}
     before redirecting. Admin → admin.html. Customer → account.html.
     Everything else (error handling, upsert logic) is identical.

   NO hardcoded emails. Backend is source of truth.
   ============================================================ */

import { auth, onAuthStateChanged, signInWithGoogle } from "./auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

/* ── Error display (unchanged) ───────────────────────────────── */
function showGoogleError(text) {
  const el = document.getElementById("googleAuthMsg");
  if (el) {
    el.textContent = text;
    el.style.display = "block";
    setTimeout(() => { el.style.display = "none"; }, 5000);
  } else {
    console.warn("[Google Auth]", text);
  }
}
function hideGoogleError() {
  const el = document.getElementById("googleAuthMsg");
  if (el) el.style.display = "none";
}

/* ── Friendly errors (unchanged) ─────────────────────────────── */
function friendlyError(code) {
  const map = {
    "auth/popup-closed-by-user":                    "Sign-in cancelled. Please try again.",
    "auth/cancelled-popup-request":                  "Only one sign-in popup at a time. Please wait.",
    "auth/popup-blocked":                            "Popup was blocked. Please allow popups for this site.",
    "auth/network-request-failed":                   "Network error. Check your connection and try again.",
    "auth/account-exists-with-different-credential": "An account already exists with this email. Try logging in with email & password instead.",
    "auth/user-disabled":                            "This account has been disabled. Please contact support.",
    "auth/operation-not-allowed":                    "Google sign-in is not enabled for this Firebase project.",
    "auth/unauthorized-domain":                      "This domain is not authorized in Firebase Authentication.",
    "auth/internal-error":                           "Something went wrong. Please try again.",
  };
  return map[code] || "Sign-in failed. Please try again.";
}

/* ── Upsert users/{uid} (unchanged) ──────────────────────────── */
async function upsertGoogleUser(firebaseUser) {
  const ref = doc(db, "users", firebaseUser.uid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid:      firebaseUser.uid,
        name:     firebaseUser.displayName || "",
        email:    firebaseUser.email       || "",
        photoURL: firebaseUser.photoURL    || "",
        provider: "google",
        createdAt: serverTimestamp(),
        phone: "", address: "", pincode: "",
      });
      console.log("[google-auth] New Google user doc created:", firebaseUser.uid);
    } else {
      await setDoc(ref, {
        provider:  snap.data().provider || "google",
        photoURL:  firebaseUser.photoURL || snap.data().photoURL || "",
        lastLogin: serverTimestamp(),
      }, { merge: true });
      console.log("[google-auth] Returning Google user doc updated:", firebaseUser.uid);
    }
  } catch (err) {
    console.warn("[google-auth] Firestore upsert failed:", err.message);
  }
}

/* ── NEW: Check Firestore admins/{uid} for role ──────────────────
   Same logic as admin-guard.js checkAdminRole().
   Returns true if the user has an active doc in admins/{uid}.  ── */
async function isAdminUser(uid) {
  try {
    const snap = await getDoc(doc(db, "admins", uid));
    if (!snap.exists()) return false;
    const d = snap.data() || {};
    return !("active" in d) || d.active === true;
  } catch (err) {
    console.warn("[google-auth] Admin check failed:", err.message);
    return false;  // fail-safe — never grant admin on error
  }
}

/* ── Main click handler ──────────────────────────────────────── */
function initGoogleSignIn() {
  const btn = document.getElementById("googleSignInBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    hideGoogleError();
    btn.disabled = true;

    const originalHTML = btn.innerHTML;
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"
           style="animation:spin .7s linear infinite;flex-shrink:0">
        <circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="2.5"
                fill="none" stroke-dasharray="30" stroke-dashoffset="10"/>
      </svg>
      Connecting…`;

    try {
      const credential   = await signInWithGoogle();
      const firebaseUser = credential.user;

      /* Persist for legacy code */
      localStorage.setItem("userId",    firebaseUser.uid);
      localStorage.setItem("userEmail", firebaseUser.email);

      /* Upsert Firestore user doc */
      await upsertGoogleUser(firebaseUser);

      /* ── Role check → redirect ────────────────────────────────
         Check admins/{uid} in Firestore. Backend is source of truth.
         Admin  → admin.html
         Customer → account.html (or ?next= param)             ── */
      const adminVerified = await isAdminUser(firebaseUser.uid);

      /* Cache for mobile bottom-nav */
      try {
        sessionStorage.setItem("cc_user_role",          adminVerified ? "admin" : "customer");
        sessionStorage.setItem(`cc_admin_verified_${firebaseUser.uid}`, adminVerified ? "1" : "");
      } catch (_) {}

      if (adminVerified) {
        window.location.href = "admin.html";
        return;
      }

      /* Customer — honour ?next= but block admin routes */
      const next     = new URLSearchParams(window.location.search).get("next") || "";
      const safeNext = next && !next.toLowerCase().includes("admin") ? next : "account.html";
      window.location.href = safeNext;

    } catch (err) {
      console.error("[google-auth] Sign-in error:", err.code, err.message);
      showGoogleError(friendlyError(err.code));
      btn.disabled  = false;
      btn.innerHTML = originalHTML;
    }
  });
}

/* ── Auto-run when DOM is ready (unchanged) ──────────────────── */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGoogleSignIn);
} else {
  initGoogleSignIn();
}
