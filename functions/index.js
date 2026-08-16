/* ============================================================
   functions/index.js — Chic Charms Firebase Cloud Functions
   Handles: coupon validation, order creation, payment verification
   Region: asia-south1 (Mumbai)
   ============================================================ */

const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const admin         = require('firebase-admin');
const Razorpay      = require('razorpay');
const crypto        = require('crypto');

admin.initializeApp();
const db = admin.firestore();

/* ── Config ──────────────────────────────────────────────────────── */
const VALID_COUPON    = /^CIT2026[A-Z0-9]{2}$/i;
const CAMPUS_DISCOUNT = 50;

/*
 * ┌─────────────────────────────────────────────────────────────┐
 * │  ⚠️  FILL IN YOUR RAZORPAY CREDENTIALS BELOW               │
 * │  Get them from: https://dashboard.razorpay.com/app/keys    │
 * │                                                             │
 * │  TOKEN_1  →  YOUR_RAZORPAY_KEY_ID                          │
 * │             (starts with rzp_live_ or rzp_test_)            │
 * │                                                             │
 * │  TOKEN_2  →  YOUR_RAZORPAY_KEY_SECRET                      │
 * │             (long alphanumeric string, never expose client) │
 * └─────────────────────────────────────────────────────────────┘
 */
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID || 'TOKEN_1',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'TOKEN_2',
});

/* ── CORS helper ──────────────────────────────────────────────────── */
function setCors(res) {
  res.set('Access-Control-Allow-Origin',  '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/* ── Auth / session helpers ───────────────────────────────────────── */
function cleanSessionId(value) {
  const id = String(value || '').trim();
  return /^[A-Za-z0-9_-]{8,120}$/.test(id) ? id : '';
}

async function getUserIdFromAuthHeader(req) {
  const header = req.get('Authorization') || '';
  const match  = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(match[1]);
    return decoded.uid || null;
  } catch { return null; }
}

async function getSessionDocRef(req, body) {
  const uid = await getUserIdFromAuthHeader(req);
  if (uid) return db.collection('couponSessions').doc(`user_${uid}`);
  const sessionId = cleanSessionId((body && body.sessionId) || req.query.sessionId);
  if (!sessionId) return null;
  return db.collection('couponSessions').doc(`anon_${sessionId}`);
}

function successPayload(code, extra = {}) {
  return { valid: true, couponCode: code, couponType: 'campus', discountAmount: CAMPUS_DISCOUNT, ...extra };
}

/* ── Order ID generator ───────────────────────────────────────────── */
function genOrderRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'CC';
  for (let i = 0; i < 8; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  1. VALIDATE COUPON  (existing — unchanged)                         */
/* ─────────────────────────────────────────────────────────────────── */
exports.validateCoupon = onRequest({ region: 'asia-south1' }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ valid: false, message: 'Method not allowed' });

  try {
    const input = String((req.body && req.body.couponCode) || '').trim().toUpperCase();
    if (!VALID_COUPON.test(input)) return res.status(200).json({ valid: false, message: 'Invalid coupon code' });

    const ref = await getSessionDocRef(req, req.body || {});
    if (!ref) return res.status(400).json({ valid: false, message: 'Invalid checkout session' });

    const data = {
      couponApplied: true, couponCode: input, couponType: 'campus',
      discountAmount: CAMPUS_DISCOUNT,
      validatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt:   admin.firestore.FieldValue.serverTimestamp(),
    };
    await ref.set(data, { merge: true });
    return res.status(200).json(successPayload(input, { validatedAt: new Date().toISOString() }));
  } catch (err) {
    console.error('[validateCoupon] failed', err);
    return res.status(500).json({ valid: false, message: 'Unable to validate coupon' });
  }
});

/* ─────────────────────────────────────────────────────────────────── */
/*  2. COUPON SESSION  (existing — unchanged)                          */
/* ─────────────────────────────────────────────────────────────────── */
exports.couponSession = onRequest({ region: 'asia-south1' }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ valid: false, message: 'Method not allowed' });

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

/* ─────────────────────────────────────────────────────────────────── */
/*  3. CREATE ORDER  →  POST /createOrder                              */
/*     Creates a pending order in Firestore + a Razorpay order.        */
/*     Returns: { orderId, razorpayOrderId, amount, currency }         */
/* ─────────────────────────────────────────────────────────────────── */
exports.createOrder = onRequest({ region: 'asia-south1' }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};

    /* ── Validate required fields ── */
    const { customerInfo, deliveryInfo, cartItems, couponInfo,
            studentInfo, paymentMethod, subtotal, discount, deliveryCharge, total } = body;

    if (!cartItems || !cartItems.length)          return res.status(400).json({ error: 'Cart is empty' });
    if (!total || Number(total) <= 0)             return res.status(400).json({ error: 'Invalid total amount' });
    if (!paymentMethod)                           return res.status(400).json({ error: 'Payment method required' });

    /* ── Prevent duplicate orders: idempotency key ── */
    const idempotencyKey = body.idempotencyKey || null;
    if (idempotencyKey) {
      const dupSnap = await db.collection('orders')
        .where('idempotencyKey', '==', idempotencyKey)
        .limit(1).get();
      if (!dupSnap.empty) {
        const existing = dupSnap.docs[0].data();
        return res.status(200).json({
          orderId:         dupSnap.docs[0].id,
          razorpayOrderId: existing.razorpayOrderId,
          amount:          existing.total,
          currency:        'INR',
          duplicate:       true,
        });
      }
    }

    /* ── Create Razorpay order (amount in paise) ── */
    const amountPaise = Math.round(Number(total) * 100);
    if (amountPaise < 100) {
      return res.status(400).json({ error: 'Amount must be at least 100 paise (₹1.00)' });
    }

    let rzpOrder;
    try {
      rzpOrder = await razorpay.orders.create({
        amount:   amountPaise,
        currency: 'INR',
        receipt:  genOrderRef(),
        notes: {
          customerName:  customerInfo?.fullName  || '',
          customerPhone: customerInfo?.phone     || '',
          paymentMethod: paymentMethod           || '',
        },
      });
    } catch (rzpErr) {
      console.error('[createOrder] Razorpay API call failed:', rzpErr);
      const status = rzpErr.statusCode || rzpErr.status || 500;
      if (status === 401) {
        return res.status(401).json({ error: 'Razorpay authentication failed. Please check backend keys.' });
      }
      return res.status(500).json({ error: rzpErr.description || rzpErr.message || 'Razorpay order creation failed.' });
    }

    /* ── Write pending order to Firestore ── */
    const orderRef  = db.collection('orders').doc();
    const orderData = {
      orderId:         orderRef.id,
      orderRef:        rzpOrder.receipt,
      razorpayOrderId: rzpOrder.id,

      customerInfo:  customerInfo  || {},
      deliveryInfo:  deliveryInfo  || {},
      cartItems:     cartItems     || [],
      couponInfo:    couponInfo    || null,
      studentInfo:   studentInfo   || null,
      paymentMethod: paymentMethod || '',

      subtotal:       Number(subtotal)       || 0,
      discount:       Number(discount)       || 0,
      deliveryCharge: Number(deliveryCharge) || 0,
      total:          Number(total)          || 0,

      status:        'pending_payment',
      paymentStatus: 'pending',

      idempotencyKey: idempotencyKey || null,
      createdAt:      admin.firestore.FieldValue.serverTimestamp(),
      updatedAt:      admin.firestore.FieldValue.serverTimestamp(),
    };

    await orderRef.set(orderData);

    return res.status(200).json({
      orderId:         orderRef.id,
      razorpayOrderId: rzpOrder.id,
      amount:          Number(total),
      currency:        'INR',
    });

  } catch (err) {
    console.error('[createOrder] failed', err);
    return res.status(500).json({ error: 'Failed to create order. Please try again.' });
  }
});

/* ─────────────────────────────────────────────────────────────────── */
/*  4. VERIFY PAYMENT  →  POST /verifyPayment                         */
/*     Verifies Razorpay HMAC signature — backend is source of truth. */
/*     On success: marks order paid. On failure: marks failed.         */
/* ─────────────────────────────────────────────────────────────────── */
exports.verifyPayment = onRequest({ region: 'asia-south1' }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderId,              // our Firestore order doc ID
    } = req.body || {};

    /* ── Validate inputs ── */
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ success: false, error: 'Missing payment verification fields' });
    }

    /* ── Fetch our pending order ── */
    const orderRef  = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    const orderData = orderSnap.data();

    /* ── Guard: already verified → idempotent success ── */
    if (orderData.status === 'paid') {
      return res.status(200).json({ success: true, orderId, alreadyVerified: true });
    }

    /* ── HMAC-SHA256 signature verification ── */
    /*
     * TOKEN_2 is your Razorpay Key Secret (same as used in razorpay init above).
     * The signature is: HMAC_SHA256( razorpay_order_id + "|" + razorpay_payment_id )
     */
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'TOKEN_2')  // ← SAME secret as above — will auto-match when you fill TOKEN_2
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      /* ── Signature mismatch: mark failed ── */
      await orderRef.update({
        status:        'pending_payment',
        paymentStatus: 'failed',
        failedAt:      admin.firestore.FieldValue.serverTimestamp(),
        updatedAt:     admin.firestore.FieldValue.serverTimestamp(),
        failureReason: 'Signature verification failed',
      });
      return res.status(400).json({ success: false, error: 'Payment verification failed. Signature mismatch.' });
    }

    /* ── Signature valid: mark order as paid ── */
    const updatedFields = {
      status:           'paid',
      paymentStatus:    'success',
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      transactionId:    razorpay_payment_id,
      paidAt:           admin.firestore.FieldValue.serverTimestamp(),
      updatedAt:        admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!orderData.telegram_notification_sent) {
      try {
        const { sendTelegramMessage, formatOrderMessage } = require('./telegram');
        console.log(`[Telegram] Sending order notification for ${orderData.orderRef || orderId}`);
        const fullOrder = { ...orderData, ...updatedFields, orderId };
        const msg = formatOrderMessage(fullOrder);
        const result = await sendTelegramMessage(msg);
        if (result.success) {
          updatedFields.telegram_notification_sent = true;
          console.log(`[Telegram] Notification sent successfully for ${orderData.orderRef || orderId}`);
        } else {
          console.error(`[Telegram] Failed to send notification for ${orderData.orderRef || orderId}:`, result.error);
        }
      } catch (tgErr) {
        console.error(`[Telegram] Error sending notification for ${orderData.orderRef || orderId}:`, tgErr);
      }
    }

    await orderRef.update(updatedFields);

    return res.status(200).json({ success: true, orderId });

  } catch (err) {
    console.error('[verifyPayment] failed', err);
    return res.status(500).json({ success: false, error: 'Payment verification error. Please contact support.' });
  }
});

/* ─────────────────────────────────────────────────────────────────── */
/*  5. RAZORPAY CONFIG  →  GET /razorpayConfig                         */
/*     Returns the public key ID dynamically.                          */
/* ─────────────────────────────────────────────────────────────────── */
exports.razorpayConfig = onRequest({ region: 'asia-south1' }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json({ keyId: process.env.RAZORPAY_KEY_ID || '' });
});

/* ─────────────────────────────────────────────────────────────────── */
/*  6. FIRESTORE ORDER TRIGGER                                        */
/*     Triggers on order creation/update to notify admin via Telegram */
/* ─────────────────────────────────────────────────────────────────── */
exports.onOrderWritten = onDocumentWritten({
  region: 'asia-south1',
  document: 'orders/{orderId}'
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) return null;

  const orderData = snapshot.after.data();
  if (!orderData) return null;

  const orderId = event.params.orderId;
  const status = orderData.status;

  if ((status === 'paid' || status === 'Placed') && !orderData.telegram_notification_sent) {
    try {
      const { sendTelegramMessage, formatOrderMessage } = require('./telegram');
      console.log(`[Telegram Trigger] Sending order notification for ${orderData.orderRef || orderId}`);
      
      const fullOrder = { ...orderData, orderId };
      const msg = formatOrderMessage(fullOrder);
      const result = await sendTelegramMessage(msg);
      
      if (result.success) {
        console.log(`[Telegram Trigger] Notification sent successfully for ${orderData.orderRef || orderId}`);
        await snapshot.after.ref.update({
          telegram_notification_sent: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        console.error(`[Telegram Trigger] Failed to send notification for ${orderData.orderRef || orderId}:`, result.error);
      }
    } catch (tgErr) {
      console.error(`[Telegram Trigger] Error sending notification for ${orderData.orderRef || orderId}:`, tgErr);
    }
  }
  return null;
});
