const admin = require('firebase-admin');
const Razorpay = require('razorpay');

function genOrderRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'CC';
  for (let i = 0; i < 8; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Firebase Admin using credentials from environment variable
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

    // Initialize Razorpay client using environment variables
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const body = req.body || {};
    const { customerInfo, deliveryInfo, cartItems, couponInfo,
            studentInfo, paymentMethod, subtotal, discount, deliveryCharge, total } = body;

    if (!cartItems || !cartItems.length)          return res.status(400).json({ error: 'Cart is empty' });
    if (!total || Number(total) <= 0)             return res.status(400).json({ error: 'Invalid total amount' });
    if (!paymentMethod)                           return res.status(400).json({ error: 'Payment method required' });

    // Validate stock for all items in the cart
    for (const item of cartItems) {
      if (!item.productId) {
        return res.status(400).json({ error: `Invalid product ID for item: ${item.name || 'Unknown'}` });
      }
      const productSnap = await db.collection('products').doc(item.productId).get();
      if (!productSnap.exists) {
        return res.status(400).json({ error: `Product "${item.name || item.productId}" not found` });
      }
      const productData = productSnap.data();
      const currentStock = Number(productData.stock ?? 0);
      const requestedQty = Number(item.quantity || 1);
      if (currentStock < requestedQty) {
        return res.status(400).json({ error: `"${productData.name || item.name}" is out of stock or does not have enough quantity available.` });
      }
    }

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
};
