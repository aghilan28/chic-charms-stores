const admin = require('firebase-admin');
const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        return res.status(500).json({ error: 'Missing FIREBASE_SERVICE_ACCOUNT environment variable on Vercel' });
      }
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    const db = admin.firestore();

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderId,
    } = req.body || {};

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ success: false, error: 'Missing payment verification fields' });
    }

    const orderRef  = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    const orderData = orderSnap.data();

    if (orderData.status === 'paid') {
      return res.status(200).json({ success: true, orderId, alreadyVerified: true });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await orderRef.update({
        status:        'pending_payment',
        paymentStatus: 'failed',
        failedAt:      admin.firestore.FieldValue.serverTimestamp(),
        updatedAt:     admin.firestore.FieldValue.serverTimestamp(),
        failureReason: 'Signature verification failed',
      });
      return res.status(400).json({ success: false, error: 'Payment verification failed. Signature mismatch.' });
    }

    await orderRef.update({
      status:           'paid',
      paymentStatus:    'success',
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      transactionId:    razorpay_payment_id,
      paidAt:           admin.firestore.FieldValue.serverTimestamp(),
      updatedAt:        admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ success: true, orderId });

  } catch (err) {
    console.error('[verifyPayment] failed', err);
    return res.status(500).json({ success: false, error: 'Payment verification error. Please contact support.' });
  }
};
