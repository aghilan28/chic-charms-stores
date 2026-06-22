/* ============================================================
   google-auth.js — Chic Charms
   Handles "Continue with Google" on auth.html.

   ADMIN REDIRECT LOGIC — TWO-LAYER APPROACH:
   Layer 1 (instant): Firebase Auth token email — already verified
                      by Firebase, cannot be forged, works immediately.
   Layer 2 (backup):  Firestore admins/{uid} check — used only if
                      the email layer doesn't match (future admins).

   This eliminates the Firestore permission-denied race condition
   that caused the redirect failure.
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

/* ── ADMIN EMAIL LIST ────────────────────────────────────────────
   This is NOT a security layer — it is only used for client-side
   ROUTING (which page to redirect to after login).
   Security is enforced by Firestore rules + admin-guard.js on
   every admin page load. Adding an email here without a matching
   Firestore admins/{uid} doc will redirect them to admin.html
   but admin-guard.js will deny access immediately.
   ── */
const ADMIN_EMAILS = [
  "cvmun28@gmail.com",   /* ← your admin Google account */
];

function isKnownAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

/* ── Firestore admin check (secondary, with graceful fallback) ── */
async function checkFirestoreAdmin(uid) {
  try {
    const snap = await getDoc(doc(db, "admins", uid));
    if (!snap.exists()) return false;
    const d = snap.data() || {};
    return !("active" in d) || d.active === true;
  } catch (err) {
    /* Permission-denied or network error — fall back to email check */
    console.warn("[google-auth] Firestore admin check failed:", err.message);
    return null; /* null = inconclusive, don't use this result */
  }
}

/* ── Error display ───────────────────────────────────────────── */
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

/* ── Friendly errors ─────────────────────────────────────────── */
function friendlyError(code) {
  const map = {
    "auth/popup-closed-by-user":                    "Sign-in cancelled. Please try again.",
    "auth/cancelled-popup-request":                  "Only one sign-in popup at a time. Please wait.",
    "auth/popup-blocked":                            "Popup was blocked. Please allow popups for this site.",
    "auth/network-request-failed":                   "Network error. Check your connection and try again.",
    "auth/account-exists-with-different-credential": "An account already exists with this email. Try email & password.",
    "auth/user-disabled":                            "This account has been disabled. Please contact support.",
    "auth/operation-not-allowed":                    "Google sign-in is not enabled for this Firebase project.",
    "auth/unauthorized-domain":                      "This domain is not authorized in Firebase Authentication.",
    "auth/internal-error":                           "Something went wrong. Please try again.",
  };
  return map[code] || "Sign-in failed. Please try again.";
}

/* ── Upsert users/{uid} ──────────────────────────────────────── */
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

/* ── Main ────────────────────────────────────────────────────── */
function initGoogleSignIn() {
  const btn = document.getElementById("googleSignInBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    hideGoogleError();
    btn.disabled = true;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 18 18"
           style="animation:spin .7s linear infinite;flex-shrink:0;vertical-align:middle">
        <circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="2.5"
                fill="none" stroke-dasharray="30" stroke-dashoffset="10"/>
      </svg>
      Connecting…`;

    try {
      const credential   = await signInWithGoogle();
      const firebaseUser = credential.user;
      const userEmail    = (firebaseUser.email || "").toLowerCase().trim();
      const userUid      = firebaseUser.uid;

      /* Persist for legacy code */
      localStorage.setItem("userId",    userUid);
      localStorage.setItem("userEmail", firebaseUser.email);

      /* Upsert Firestore user doc */
      await upsertGoogleUser(firebaseUser);

      /* ── ADMIN DETECTION — two layers ──────────────────────────
         Layer 1: Email check (instant, always works, Firebase-verified)
         Layer 2: Firestore check (may fail on first login due to rules)
         Admin = Layer1 OR (Layer2 === true)                        ── */
      let isAdmin = isKnownAdminEmail(userEmail);

      if (!isAdmin) {
        /* Try Firestore as a secondary check for non-listed admins */
        const firestoreResult = await checkFirestoreAdmin(userUid);
        if (firestoreResult === true) isAdmin = true;
      }

      console.log("[google-auth] Email:", userEmail, "| isAdmin:", isAdmin);

      /* Cache role for mobile bottom-nav and auth-ui.js */
      try {
        sessionStorage.setItem("cc_user_role", isAdmin ? "admin" : "customer");
        if (isAdmin) sessionStorage.setItem(`cc_admin_verified_${userUid}`, "1");
      } catch (_) {}

      /* ── Redirect ── */
      if (isAdmin) {
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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGoogleSignIn);
} else {
  initGoogleSignIn();
}
