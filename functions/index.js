const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const VALID_COUPON = /^CIT2026[A-Z0-9]{2}$/i;
const CAMPUS_DISCOUNT = 50;

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function cleanSessionId(value) {
  const id = String(value || '').trim();
  return /^[A-Za-z0-9_-]{8,120}$/.test(id) ? id : '';
}

async function getUserIdFromAuthHeader(req) {
  const header = req.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(match[1]);
    return decoded.uid || null;
  } catch (err) {
    return null;
  }
}

async function getSessionDocRef(req, body) {
  const uid = await getUserIdFromAuthHeader(req);
  if (uid) return db.collection('couponSessions').doc(`user_${uid}`);

  const sessionId = cleanSessionId((body && body.sessionId) || req.query.sessionId);
  if (!sessionId) return null;
  return db.collection('couponSessions').doc(`anon_${sessionId}`);
}

function successPayload(code, extra = {}) {
  return {
    valid: true,
    couponCode: code,
    couponType: 'campus',
    discountAmount: CAMPUS_DISCOUNT,
    ...extra,
  };
}

exports.validateCoupon = onRequest({ region: 'asia-south1' }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ valid: false, message: 'Method not allowed' });

  try {
    const input = String((req.body && req.body.couponCode) || '').trim().toUpperCase();
    if (!VALID_COUPON.test(input)) {
      return res.status(200).json({ valid: false, message: 'Invalid coupon code' });
    }

    const ref = await getSessionDocRef(req, req.body || {});
    if (!ref) {
      return res.status(400).json({ valid: false, message: 'Invalid checkout session' });
    }

    const data = {
      couponApplied: true,
      couponCode: input,
      couponType: 'campus',
      discountAmount: CAMPUS_DISCOUNT,
      validatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await ref.set(data, { merge: true });
    return res.status(200).json(successPayload(input, { validatedAt: new Date().toISOString() }));
  } catch (err) {
    console.error('[validateCoupon] failed', err);
    return res.status(500).json({ valid: false, message: 'Unable to validate coupon' });
  }
});

exports.couponSession = onRequest({ region: 'asia-south1' }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ valid: false, message: 'Method not allowed' });
  }

  try {
    const ref = await getSessionDocRef(req, req.body || {});
    if (!ref) return res.status(200).json({ valid: false, message: 'No coupon session' });

    const snap = await ref.get();
    if (!snap.exists) return res.status(200).json({ valid: false, message: 'No coupon session' });

    const data = snap.data() || {};
    if (data.couponApplied !== true || data.couponType !== 'campus' || !VALID_COUPON.test(String(data.couponCode || ''))) {
      return res.status(200).json({ valid: false, message: 'No valid coupon session' });
    }

    return res.status(200).json(successPayload(String(data.couponCode).toUpperCase(), {
      validatedAt: data.validatedAt && data.validatedAt.toDate ? data.validatedAt.toDate().toISOString() : null,
    }));
  } catch (err) {
    console.error('[couponSession] failed', err);
    return res.status(500).json({ valid: false, message: 'Unable to read coupon session' });
  }
});
