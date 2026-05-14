/* ============================================================
   google-auth.js — Chic Charms
   Handles the "Continue with Google" button logic.

   Drop this into ANY page that has a Google Sign-In button.
   It plugs straight into the existing auth system — nothing
   else needs to change.

   Usage in auth.html (or any login/signup page):
     <script type="module" src="./google-auth.js"></script>
     <button id="googleSignInBtn">Continue with Google</button>

   ── What this file does ───────────────────────────────────
   1. Listens for clicks on #googleSignInBtn
   2. Opens the Google popup via signInWithGoogle() from auth.js
   3. For NEW users  → creates the users/{uid} Firestore doc
   4. For returning users → leaves their existing Firestore doc alone
   5. Redirects to account.html (or wherever the rest of the app does)
   6. Shows user-friendly errors for every failure scenario
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

/* ── Utility: show an inline error message ─────────────────
   Looks for #googleAuthMsg — add this div next to your button.
   Falls back to a toast/console if the element doesn't exist.  */
function showGoogleError(text) {
  const el = document.getElementById("googleAuthMsg");
  if (el) {
    el.textContent = text;
    el.style.display = "block";
    // Auto-hide after 5 s
    setTimeout(() => { el.style.display = "none"; }, 5000);
  } else {
    console.warn("[Google Auth]", text);
  }
}

function hideGoogleError() {
  const el = document.getElementById("googleAuthMsg");
  if (el) el.style.display = "none";
}

/* ── Map Firebase error codes to human-friendly messages ── */
function friendlyError(code) {
  const map = {
    "auth/popup-closed-by-user":      "Sign-in cancelled. Please try again.",
    "auth/cancelled-popup-request":   "Only one sign-in popup at a time. Please wait.",
    "auth/popup-blocked":             "Popup was blocked. Please allow popups for this site.",
    "auth/network-request-failed":    "Network error. Check your connection and try again.",
    "auth/account-exists-with-different-credential":
      "An account already exists with this email. Try logging in with email & password instead.",
    "auth/user-disabled":             "This account has been disabled. Please contact support.",
    "auth/operation-not-allowed":      "Google sign-in is not enabled for this Firebase project.",
    "auth/unauthorized-domain":        "This domain is not authorized in Firebase Authentication.",
    "auth/internal-error":            "Something went wrong. Please try again.",
  };
  return map[code] || "Sign-in failed. Please try again.";
}

/* ── Save user to Firestore (only on first Google sign-in) ─
   Does NOT overwrite existing documents — safe to call every
   time because it uses setDoc with { merge: true } for
   timestamp/provider tracking and plain setDoc for brand-new docs. */
async function upsertGoogleUser(firebaseUser) {
  const ref = doc(db, "users", firebaseUser.uid);

  try {
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      // Brand-new user — create the doc with sensible defaults
      await setDoc(ref, {
        uid:         firebaseUser.uid,
        name:        firebaseUser.displayName  || "",
        email:       firebaseUser.email        || "",
        photoURL:    firebaseUser.photoURL     || "",
        provider:    "google",
        createdAt:   serverTimestamp(),
        // Leave phone / address blank — user fills these later
        phone:       "",
        address:     "",
        pincode:     "",
      });
      console.log("[google-auth] New Google user doc created:", firebaseUser.uid);
    } else {
      // Returning user — only update photoURL / provider metadata, never
      // overwrite name/phone/address the user may have edited manually.
      // Using setDoc + merge so we don't clobber existing fields.
      await setDoc(ref, {
        provider:  snap.data().provider || "google", // keep original if set
        photoURL:  firebaseUser.photoURL || snap.data().photoURL || "",
        lastLogin: serverTimestamp(),
      }, { merge: true });
      console.log("[google-auth] Returning Google user doc updated:", firebaseUser.uid);
    }
  } catch (err) {
    // Firestore write failure is non-fatal — the user is still authenticated.
    console.warn("[google-auth] Firestore upsert failed:", err.message);
  }
}

/* ── Main: attach click handler ───────────────────────────── */
function initGoogleSignIn() {
  const btn = document.getElementById("googleSignInBtn");
  if (!btn) return; // button not on this page — exit silently

  btn.addEventListener("click", async () => {
    hideGoogleError();
    btn.disabled = true;

    // Show a loading state on the button itself
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:8px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             xmlns="http://www.w3.org/2000/svg" style="animation:spin .8s linear infinite">
          <circle cx="12" cy="12" r="10" stroke="currentColor"
                  stroke-width="3" stroke-dasharray="40" stroke-dashoffset="10"/>
        </svg>
        Connecting…
      </span>`;

    try {
      const credential = await signInWithGoogle();
      const firebaseUser = credential.user;

      // Persist uid/email for any legacy code that reads localStorage
      localStorage.setItem("userId",    firebaseUser.uid);
      localStorage.setItem("userEmail", firebaseUser.email);

      // Write/merge Firestore user doc
      await upsertGoogleUser(firebaseUser);

      // ── Redirect ──────────────────────────────────────────
      // Change the target URL if your redirect is different
      const redirect = new URLSearchParams(window.location.search).get("next")
                       || "account.html";
      window.location.href = redirect;

    } catch (err) {
      console.error(err);
      console.error(err.code);
      console.error(err.message);
      console.error("[google-auth] Sign-in error:", err.code, err.message);
      showGoogleError(friendlyError(err.code));
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  });
}

/* ── Auto-run when DOM is ready ───────────────────────────── */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGoogleSignIn);
} else {
  initGoogleSignIn();
}
