const admin = require('firebase-admin');
const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Accept both POST (client callback) and GET (Razorpay redirect) methods.
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.SERVICE_ACCOUNT_KEY;
      if (!serviceAccountStr) {
        return res.status(500).json({ error: 'Missing FIREBASE_SERVICE_ACCOUNT or SERVICE_ACCOUNT_KEY environment variable' });
      }
      const serviceAccount = JSON.parse(serviceAccountStr);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    const db = admin.firestore();

    const body = req.body || {};
    const query = req.query || {};

    // Support both POST body and GET query parameters (Razorpay redirect)
    const razorpay_payment_id = body.razorpay_payment_id || query.razorpay_payment_id;
    const razorpay_order_id   = body.razorpay_order_id   || query.razorpay_order_id;
    const razorpay_signature  = body.razorpay_signature  || query.razorpay_signature;
    const orderId             = body.orderId             || query.orderId;
    const redirectDomain      = query.redirect_domain    || body.redirect_domain;

    // Log incoming verification attempts (query/body) for debugging.
    console.log('[verifyPayment] incoming method=', req.method, 'orderId=', orderId, 'razorpay_order_id=', razorpay_order_id);

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

    // Fetch payment contact information directly from Razorpay API
    let razorpayPhone = null;
    let razorpayEmail = null;
    try {
      const RazorpayObj = require('razorpay');
      const rzpInstance = new RazorpayObj({
        key_id:     process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const paymentDetails = await rzpInstance.payments.fetch(razorpay_payment_id);
      if (paymentDetails) {
        razorpayPhone = paymentDetails.contact || null;
        razorpayEmail = paymentDetails.email || null;
      }
    } catch (payErr) {
      console.warn('[verifyPayment] Failed to fetch payment details:', payErr);
    }

    const updatedFields = {
      status:           'paid',
      paymentStatus:    'success',
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      transactionId:    razorpay_payment_id,
      paidAt:           admin.firestore.FieldValue.serverTimestamp(),
      updatedAt:        admin.firestore.FieldValue.serverTimestamp(),
      razorpayPhone:    razorpayPhone,
      razorpayEmail:    razorpayEmail,
    };

    // Execute stock check and decrement inside an atomic transaction
    let stockError = null;
    try {
      await db.runTransaction(async (transaction) => {
        const orderDoc = await transaction.get(orderRef);
        const oData = orderDoc.data();
        if (oData.status === 'paid') return;

        const rawItems = oData.cartItems || oData.items || [];
        const productUpdates = [];

        for (const item of rawItems) {
          if (!item.productId) continue;
          const pRef = db.collection('products').doc(item.productId);
          const pSnap = await transaction.get(pRef);
          if (!pSnap.exists) {
            stockError = `Product "${item.name}" not found`;
            throw new Error(stockError);
          }
          const pData = pSnap.data();
          const currentStock = Number(pData.stock ?? 0);
          const requestedQty = Number(item.quantity || 1);
          if (currentStock < requestedQty) {
            stockError = `Insufficient stock for product "${pData.name || item.name}" (Requested: ${requestedQty}, Available: ${currentStock})`;
            throw new Error(stockError);
          }
          productUpdates.push({
            pRef,
            newStock: currentStock - requestedQty
          });
        }

        // Deduct stock for all items
        for (const update of productUpdates) {
          transaction.update(update.pRef, {
            stock: update.newStock,
            outOfStock: update.newStock === 0
          });
        }

        transaction.update(orderRef, updatedFields);
      });
    } catch (txErr) {
      console.error('[verifyPayment] Transaction failed:', txErr.message);
      if (!stockError) stockError = txErr.message;
    }

    if (stockError) {
      // Stock allocation failed. Flag order for manual review but mark payment success.
      const failFields = {
        ...updatedFields,
        status: 'manual_reconciliation_needed',
        manualReconciliationReason: stockError,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await orderRef.update(failFields);

      try {
        const { sendTelegramMessage, formatOrderMessage } = require('./telegram');
        const fullOrder = { ...orderData, ...failFields, orderId };
        let msg = formatOrderMessage(fullOrder);
        msg = `⚠️ <b>ATTENTION: STOCK ALLOCATION FAILED (MANUAL RECONCILIATION NEEDED)</b>\nReason: ${stockError}\n\n` + msg;
        await sendTelegramMessage(msg);
      } catch (tgErr) {
        console.error('[verifyPayment] Telegram fail notification error:', tgErr);
      }

      return handleResult(400, false, `Stock allocation failed: ${stockError}. The admin has been notified.`);
    }

    if (!orderData.telegram_notification_sent) {
      try {
        const { sendTelegramMessage, formatOrderMessage } = require('./telegram');
        console.log(`[Telegram] Sending order notification for ${orderData.orderRef || orderId}`);
        const fullOrder = { ...orderData, ...updatedFields, orderId };
        const msg = formatOrderMessage(fullOrder);
        const result = await sendTelegramMessage(msg);
        if (result.success) {
          await orderRef.update({ telegram_notification_sent: true });
          console.log(`[Telegram] Notification sent successfully for ${orderData.orderRef || orderId}`);
        } else {
          console.error(`[Telegram] Failed to send notification for ${orderData.orderRef || orderId}:`, result.error);
        }
      } catch (tgErr) {
        console.error(`[Telegram] Error sending notification for ${orderData.orderRef || orderId}:`, tgErr);
      }
    }

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
