/* ============================================================
   checkout-prefill.js — Chic Charms
   Pre-fills checkout form with:
     1. User email (from Firebase Auth)
     2. Default saved address (from Firestore "addresses" collection)

   Include at bottom of checkout.html AFTER your main script:
     <script type="module" src="checkout-prefill.js"></script>

   Requires:
     - auth.js (single Firebase init)
     - Firestore "addresses" collection with {userEmail, isDefault, ...}
     - Input IDs: #checkoutEmail, #checkoutName, #checkoutPhone,
                  #checkoutAddress, #checkoutPincode (adjust to match yours)
   ============================================================ */

import { auth, onAuthStateChanged }
  from "./auth.js";
import {
  getFirestore, collection, query, where, getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

/* ── Field ID map — adjust to match your checkout.html input IDs ── */
const FIELDS = {
  email:   'checkoutEmail',   // or 'email'
  name:    'checkoutName',    // or 'name'
  phone:   'checkoutPhone',   // or 'phone'
  address: 'checkoutAddress', // or 'address'
  pincode: 'checkoutPincode', // or 'pincode'
};

function fillField(id, value) {
  const el = document.getElementById(id);
  if (!el || !value) return;
  /* Only prefill if field is currently empty */
  if (!el.value.trim()) el.value = value;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  console.log('[checkout-prefill] User:', user.email);

  /* ── 1. Prefill email ── */
  fillField(FIELDS.email, user.email);

  /* ── 2. Load default address from Firestore ── */
  try {
    const q    = query(collection(db, 'addresses'),
                   where('userEmail', '==', user.email),
                   where('isDefault', '==', true));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const addr = snap.docs[0].data();
      console.log('[checkout-prefill] Default address found:', addr.city);
      fillField(FIELDS.name,    addr.name);
      fillField(FIELDS.phone,   addr.phone);
      fillField(FIELDS.address, addr.address + ', ' + addr.city);
      fillField(FIELDS.pincode, addr.pincode);
    } else {
      /* Fallback: try any address for this user */
      const q2   = query(collection(db, 'addresses'), where('userEmail','==',user.email));
      const s2   = await getDocs(q2);
      if (!s2.empty) {
        const addr = s2.docs[0].data();
        fillField(FIELDS.name,    addr.name);
        fillField(FIELDS.phone,   addr.phone);
        fillField(FIELDS.address, addr.address + ', ' + addr.city);
        fillField(FIELDS.pincode, addr.pincode);
      }
    }
  } catch (err) {
    console.warn('[checkout-prefill] Could not load address:', err.message);
  }
});
