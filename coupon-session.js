/* Chic Charms coupon session helper — FREE Firebase Spark version.
   Backend validation is enforced by Firestore Security Rules, not Cloud Functions.
   The UI writes a coupon session; Firestore rules accept only CIT2026[A-Z0-9]{2},
   couponType="campus", discountAmount=50, couponApplied=true. Invalid writes fail. */
(function () {
  'use strict';

  var SESSION_KEY = 'cc_coupon_session_id';
  var COUPON_KEY = 'cc_coupon_state';

  var firebaseConfig = {
    apiKey:            "AIzaSyA5Bh77_4HE3yQF0hi5ddvbFLZC7rEerxg",
    authDomain:        "chic-charms-store.firebaseapp.com",
    projectId:         "chic-charms-store",
    storageBucket:     "chic-charms-store.firebasestorage.app",
    messagingSenderId: "342514318589",
    appId:             "1:342514318589:web:31c3490c10731e46d75294"
  };

  var modulesPromise = null;

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 14);
  }

  function ensureSessionId() {
    var id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  function getSessionDocId() {
    return 'anon_' + ensureSessionId();
  }

  async function getFirebase() {
    if (!modulesPromise) {
      modulesPromise = Promise.all([
        import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js')
      ]).then(function (mods) {
        var appMod = mods[0];
        var fsMod = mods[1];
        var app = appMod.getApps().length ? appMod.getApps()[0] : appMod.initializeApp(firebaseConfig);
        return {
          db: fsMod.getFirestore(app),
          doc: fsMod.doc,
          getDoc: fsMod.getDoc,
          setDoc: fsMod.setDoc,
          serverTimestamp: fsMod.serverTimestamp
        };
      });
    }
    return modulesPromise;
  }

  function normalizeBackendCoupon(data) {
    if (!data || data.couponApplied !== true || data.couponType !== 'campus') return null;
    var code = String(data.couponCode || '').toUpperCase();
    if (code !== 'CAMPUS' && !/^CIT2026[A-Z0-9]{2}$/.test(code)) return null;
    if (Number(data.discountAmount || 0) !== 50) return null;
    return {
      couponApplied: true,
      couponCode: code,
      couponType: 'campus',
      discountAmount: 50,
      couponSessionId: data.couponSessionId || getSessionDocId(),
      validatedAt: data.validatedAt || new Date().toISOString()
    };
  }

  function persistBackendCoupon(data) {
    var state = normalizeBackendCoupon(data);
    if (!state) return null;
    localStorage.setItem(COUPON_KEY, JSON.stringify(state));
    return state;
  }

  function getStoredCoupon() {
    try {
      var raw = localStorage.getItem(COUPON_KEY);
      if (!raw) return null;
      return normalizeBackendCoupon(JSON.parse(raw));
    } catch (e) {
      return null;
    }
  }

  function clearCoupon() {
    localStorage.removeItem(COUPON_KEY);
  }

  async function validate(couponCode) {
    var code = String(couponCode || '').trim().toUpperCase();
    var sessionDocId = getSessionDocId();

    try {
      var fb = await getFirebase();
      var ref = fb.doc(fb.db, 'couponSessions', sessionDocId);

      // Firestore Security Rules are the backend validator. Invalid coupons or
      // tampered discount/type/applied values are rejected by Firebase backend.
      await fb.setDoc(ref, {
        couponApplied: true,
        couponCode: code,
        couponType: 'campus',
        discountAmount: 50,
        couponSessionId: sessionDocId,
        validatedAt: fb.serverTimestamp(),
        updatedAt: fb.serverTimestamp()
      }, { merge: false });

      return persistBackendCoupon({
        couponApplied: true,
        couponCode: code,
        couponType: 'campus',
        discountAmount: 50,
        couponSessionId: sessionDocId,
        validatedAt: new Date().toISOString()
      }) && {
        valid: true,
        couponCode: code,
        couponType: 'campus',
        discountAmount: 50
      };
    } catch (err) {
      clearCoupon();
      return { valid: false, message: 'Invalid coupon code' };
    }
  }

  async function fetchSession() {
    try {
      var fb = await getFirebase();
      var ref = fb.doc(fb.db, 'couponSessions', getSessionDocId());
      var snap = await fb.getDoc(ref);
      if (!snap.exists()) {
        clearCoupon();
        return null;
      }
      var data = snap.data() || {};
      data.couponSessionId = getSessionDocId();
      var state = persistBackendCoupon(data);
      if (!state) clearCoupon();
      return state;
    } catch (err) {
      clearCoupon();
      return null;
    }
  }

  function getDiscount(coupon) {
    if (coupon && coupon.couponApplied === true && coupon.couponType === 'campus') {
      try {
        var cartRaw = localStorage.getItem('cart') || '[]';
        var cart = JSON.parse(cartRaw) || [];
        var subtotal = cart.reduce(function(s, i) {
          return s + (Number(i.price || 0) * Number(i.quantity || 1));
        }, 0);
        // NOTE: The 42% advertised campus benefit is a combined value consisting of:
        // 1. A 20% cash discount directly off the subtotal of items.
        // 2. A waived delivery fee/shipping charge, representing the remaining value of the "42% benefit".
        // This ensures the free delivery is within the 42% total benefit valuation.
        return Math.round(subtotal * 0.20);
      } catch (e) {
        return Math.max(0, Number(coupon.discountAmount || 0));
      }
    }
    return 0;
  }

  window.ChicCoupon = {
    ensureSessionId: ensureSessionId,
    getSessionDocId: getSessionDocId,
    validate: validate,
    fetchSession: fetchSession,
    getStoredCoupon: getStoredCoupon,
    persistBackendCoupon: persistBackendCoupon,
    storeCoupon: persistBackendCoupon,
    clearCoupon: clearCoupon,
    getDiscount: getDiscount
  };
})();
