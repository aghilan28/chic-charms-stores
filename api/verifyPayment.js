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

    const body = req.body || {};
    const query = req.query || {};

    const razorpay_payment_id = body.razorpay_payment_id || query.razorpay_payment_id;
    const razorpay_order_id   = body.razorpay_order_id   || query.razorpay_order_id;
    const razorpay_signature  = body.razorpay_signature  || query.razorpay_signature;
    const orderId             = body.orderId             || query.orderId;
    const redirectDomain      = query.redirect_domain    || body.redirect_domain;

    function handleResult(statusCode, success, payload) {
      if (redirectDomain) {
        const dest = success 
          ? `${redirectDomain}/confirmation.html?orderId=${encodeURIComponent(orderId)}`
          : `${redirectDomain}/checkout-review.html?error=${encodeURIComponent(payload)}`;
        res.writeHead(302, { Location: dest });
        return res.end();
      } else {
        if (success) {
          return res.status(statusCode).json({ success: true, orderId: payload });
        } else {
          return res.status(statusCode).json({ success: false, error: payload });
        }
      }
    }

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !orderId) {
      return handleResult(400, false, 'Missing payment verification fields');
    }

    const orderRef  = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return handleResult(404, false, 'Order not found');
    }
    const orderData = orderSnap.data();

    if (orderData.status === 'paid') {
      return handleResult(200, true, orderId);
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
      return handleResult(400, false, 'Payment verification failed. Signature mismatch.');
    }

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

    return handleResult(200, true, orderId);

  } catch (err) {
    console.error('[verifyPayment] failed', err);
    // Try to safely redirect on fatal catch too
    const redirectDomain = (req.query && req.query.redirect_domain) || (req.body && req.body.redirect_domain);
    if (redirectDomain) {
      res.writeHead(302, { Location: `${redirectDomain}/checkout-review.html?error=Payment+Verification+Error` });
      return res.end();
    }
    return res.status(500).json({ success: false, error: 'Payment verification error. Please contact support.' });
  }
};
