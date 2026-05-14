/* ============================================================
   auth.js — Chic Charms
   SINGLE Firebase initialization for the entire project.
   Import auth from here — NEVER call initializeApp() elsewhere.

   Usage:
     import { auth, onAuthStateChanged, signOut } from "./auth.js";
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
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* ── Firebase config (one place, one truth) ── */
const firebaseConfig = {
  apiKey:            "AIzaSyA5Bh77_4HE3yQF0hi5ddvbFLZC7rEerxg",
  authDomain:        "chic-charms-store.firebaseapp.com",
  projectId:         "chic-charms-store",
  storageBucket:     "chic-charms-store.firebasestorage.app",
  messagingSenderId: "342514318589",
  appId:             "1:342514318589:web:31c3490c10731e46d75294",
};

/* ── Safe init: reuse existing app if already initialized ── */
const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

/* ── Explicitly lock persistence to LOCAL so admin sessions survive
   page navigation, refreshes, and storefront ↔ admin transitions.
   browserLocalPersistence is the web default, but setting it
   explicitly prevents any environment or SDK version from silently
   downgrading to SESSION or NONE. ── */
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("[ChicCharms] Could not set auth persistence:", err);
});

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export {
  auth,
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
};
