/* ============================================================
   auth.js — Chic Charms
   SINGLE Firebase initialization for the entire project.
   Import auth from here — NEVER call initializeApp() elsewhere.

   Additions vs original:
     - resolveUserRole(uid) exported for role-based routing
       (used by google-auth.js and auth.html login handler)
     - sendPasswordResetEmail exported (already needed by auth.html)
   ============================================================ */

import { initializeApp, getApps }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  connectAuthEmulator,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  connectFirestoreEmulator,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ── Firebase config (one place, one truth) ── */
const firebaseConfig = {
  apiKey:            "AIzaSyA5Bh77_4HE3yQF0hi5ddvbFLZC7rEerxg",
  authDomain:        "chic-charms-store.firebaseapp.com",
  projectId:         "chic-charms-store",
  storageBucket:     "chic-charms-store.firebasestorage.app",
  messagingSenderId: "342514318589",
  appId:             "1:342514318589:web:31c3490c10731e46d75294",
};

/* ── Safe init ── */
const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

/* ── Persistence ── */
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("[ChicCharms] Could not set auth persistence:", err);
});

/* ── Google provider ── */
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

/* ── resolveUserRole(uid) ────────────────────────────────────────
   Reads role from Firestore backend — no hardcoded lists.
   1. admins/{uid} exists + active  → "admin"
   2. users/{uid}.role === "admin"  → "admin"
   3. Default                       → "customer"

   Session-cached per uid to avoid repeated Firestore reads.
   Returns: "admin" | "customer". Never throws.               ── */
export async function resolveUserRole(uid) {
  if (!uid) return "customer";

  const cacheKey = `cc_role_${uid}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached === "admin" || cached === "customer") return cached;
  } catch (_) {}

  try {
    /* 1. admins collection (matches admin-guard.js + Firestore rules) */
    const adminSnap = await getDoc(doc(db, "admins", uid));
    if (adminSnap.exists()) {
      const d      = adminSnap.data() || {};
      const active = !("active" in d) || d.active === true;
      if (active) {
        try { sessionStorage.setItem(cacheKey, "admin"); } catch (_) {}
        return "admin";
      }
    }
    /* 2. users doc role field */
    const userSnap = await getDoc(doc(db, "users", uid));
    if (userSnap.exists()) {
      const r        = userSnap.data()?.role || "customer";
      const resolved = r === "admin" ? "admin" : "customer";
      try { sessionStorage.setItem(cacheKey, resolved); } catch (_) {}
      return resolved;
    }
    try { sessionStorage.setItem(cacheKey, "customer"); } catch (_) {}
    return "customer";
  } catch (err) {
    console.warn("[auth] resolveUserRole failed:", err.message);
    return "customer"; /* fail-safe */
  }
}

export {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithGoogle,
  sendPasswordResetEmail,
};
