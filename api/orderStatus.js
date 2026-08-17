const admin = require('firebase-admin');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!admin.apps.length) {
      const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.SERVICE_ACCOUNT_KEY;
      if (!serviceAccountStr) {
        return res.status(500).json({ error: 'Missing FIREBASE_SERVICE_ACCOUNT or SERVICE_ACCOUNT_KEY environment variable' });
      }
      const serviceAccount = JSON.parse(serviceAccountStr);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    const db = admin.firestore();

    const orderId = req.query.orderId;
    if (!orderId) return res.status(400).json({ error: 'orderId required' });

    const ref = db.collection('orders').doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Order not found' });

    const data = snap.data();
    return res.status(200).json({
      orderId: orderId,
      status: data.status || null,
      paymentStatus: data.paymentStatus || null,
      updatedAt: data.updatedAt || null,
    });
  } catch (err) {
    console.error('[orderStatus] failed', err);
    return res.status(500).json({ error: 'Failed to fetch order status' });
  }
};
