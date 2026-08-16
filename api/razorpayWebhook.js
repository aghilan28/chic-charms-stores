const admin = require('firebase-admin');
const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Razorpay-Signature');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Ensure Firebase admin is initialized
    if (!admin.apps.length) {
      if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        return res.status(500).json({ error: 'Missing FIREBASE_SERVICE_ACCOUNT environment variable' });
      }
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    const db = admin.firestore();

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const receivedSig = req.headers['x-razorpay-signature'] || req.headers['X-Razorpay-Signature'] || '';

    // Compute expected signature. Note: Vercel may parse body; we stringify the body to compute signature.
    const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const expectedSig = webhookSecret ? crypto.createHmac('sha256', webhookSecret).update(bodyString).digest('hex') : '';

    // If webhook secret is configured, validate signature
    if (webhookSecret) {
      if (!receivedSig || expectedSig !== receivedSig) {
        console.error('[razorpayWebhook] signature mismatch', { expectedSig, receivedSig });
        return res.status(400).json({ ok: false, error: 'Signature verification failed' });
      }
    } else {
      console.warn('[razorpayWebhook] no RAZORPAY_WEBHOOK_SECRET set — skipping signature verification');
    }

    const payload = req.body || {};
    const event = payload.event || (payload.event && payload.event.event);

    // We care about payment.captured (payment succeeded)
    if (payload.event === 'payment.captured' || (payload.payload && payload.payload.payment && payload.payload.payment.entity && payload.payload.payment.entity.status === 'captured')) {
      const payment = payload.payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;

      console.log('[razorpayWebhook] payment captured for order:', razorpayOrderId, 'payment:', razorpayPaymentId);

      // Find the order document with matching razorpayOrderId
      const q = await db.collection('orders').where('razorpayOrderId', '==', razorpayOrderId).limit(1).get();
      if (q.empty) {
        console.error('[razorpayWebhook] no order found for razorpayOrderId', razorpayOrderId);
        return res.status(404).json({ ok: false, error: 'Order not found' });
      }
      const doc = q.docs[0];
      const orderId = doc.id;

      const orderData = doc.data();

      const updatedFields = {
        status: 'paid',
        paymentStatus: 'success',
        razorpayPaymentId: razorpayPaymentId,
        transactionId: razorpayPaymentId,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (!orderData.telegram_notification_sent) {
        try {
          const { sendTelegramMessage, formatOrderMessage } = require('./telegram');
          console.log(`[Telegram Webhook] Sending order notification for ${orderData.orderRef || orderId}`);
          const fullOrder = { ...orderData, ...updatedFields, orderId };
          const msg = formatOrderMessage(fullOrder);
          const result = await sendTelegramMessage(msg);
          if (result.success) {
            updatedFields.telegram_notification_sent = true;
            console.log(`[Telegram Webhook] Notification sent successfully for ${orderData.orderRef || orderId}`);
          } else {
            console.error(`[Telegram Webhook] Failed to send notification for ${orderData.orderRef || orderId}:`, result.error);
          }
        } catch (tgErr) {
          console.error(`[Telegram Webhook] Error sending notification for ${orderData.orderRef || orderId}:`, tgErr);
        }
      }

      await db.collection('orders').doc(orderId).update(updatedFields);
      console.log('[razorpayWebhook] order updated to paid:', orderId);

      return res.status(200).json({ ok: true });
    }

    // For other events, just ack
    return res.status(200).json({ ok: true, event: payload.event || 'unknown' });
  } catch (err) {
    console.error('[razorpayWebhook] failed', err);
    return res.status(500).json({ ok: false, error: 'Webhook processing error' });
  }
};
