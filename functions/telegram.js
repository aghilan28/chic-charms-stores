const https = require('https');

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function sendTelegramMessage(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error('[Telegram] Missing environment variables: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
    return { success: false, error: 'Missing environment variables' };
  }

  const payload = JSON.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML'
  });

  return new Promise((resolve) => {
    const req = https.request(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('[Telegram] Message sent successfully');
            resolve({ success: true, body });
          } else {
            console.error(`[Telegram] Failed to send message. Status: ${res.statusCode}. Body: ${body}`);
            resolve({ success: false, error: `Status ${res.statusCode}`, body });
          }
        });
      }
    );

    req.on('error', (err) => {
      console.error('[Telegram] Network error sending message:', err);
      resolve({ success: false, error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

function formatOrderMessage(order) {
  const orderRef = escapeHTML(order.orderRef || order.orderId || 'Unknown');
  const customerName = escapeHTML(order.customerInfo?.fullName || order.deliveryInfo?.name || 'N/A');
  
  // Format phone number
  let phone = order.customerInfo?.phone || order.deliveryInfo?.phone || 'N/A';
  if (phone !== 'N/A') {
    phone = escapeHTML(String(phone).replace(/^(\+91|91)/, '').trim());
    phone = `+91 ${phone}`;
  }

  // Format cart items
  const items = (order.cartItems || []).map(item => {
    const name = escapeHTML(item.name || 'Product');
    const qty = item.quantity || 1;
    const price = item.price || 0;
    return `• <b>${name}</b>\n  Qty: ${qty} × ₹${price}`;
  }).join('\n\n');

  // Format delivery info
  let deliveryStr = 'N/A';
  if (order.couponInfo?.couponType === 'campus') {
    const dept = escapeHTML(order.studentInfo?.dept || '');
    const year = escapeHTML(order.studentInfo?.year || '');
    deliveryStr = `Campus Delivery (CIT)\nStudent: ${customerName}\nDetails: ${[year, dept].filter(Boolean).join(' · ')}`;
  } else if (order.deliveryInfo) {
    const addr = escapeHTML(order.deliveryInfo.address || '');
    const city = escapeHTML(order.deliveryInfo.city || '');
    const state = escapeHTML(order.deliveryInfo.state || '');
    const pin = escapeHTML(order.deliveryInfo.pincode || '');
    deliveryStr = `${addr}, ${city}, ${state} - ${pin}`;
  }

  // Format order creation time
  let orderTimeStr = 'N/A';
  if (order.createdAt) {
    let dateObj;
    if (order.createdAt.toDate) {
      dateObj = order.createdAt.toDate();
    } else if (order.createdAt._seconds) {
      dateObj = new Date(order.createdAt._seconds * 1000);
    } else {
      dateObj = new Date(order.createdAt);
    }
    if (!isNaN(dateObj.getTime())) {
      orderTimeStr = dateObj.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    }
  } else {
    orderTimeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  }

  // Format payment method
  let paymentMethodStr = escapeHTML(order.paymentMethod || 'Online');
  if (paymentMethodStr.toLowerCase() === 'cod') {
    paymentMethodStr = 'Cash on Delivery (COD)';
  } else {
    paymentMethodStr = `Online (${paymentMethodStr.toUpperCase()})`;
  }

  return `✨ <b>CHICCHARMS</b>
━━━━━━━━━━━━━━━━━━━━

🔔 <b>NEW ORDER RECEIVED</b>

Order ID: #${orderRef}

👤 <b>CUSTOMER</b>
Name: ${customerName}
Phone: ${phone}

📦 <b>ORDER ITEMS</b>

${items}

━━━━━━━━━━━━━━━━━━━━

💰 <b>TOTAL: ₹${order.total || 0}</b>

💳 <b>PAYMENT</b>
${paymentMethodStr}

📍 <b>DELIVERY</b>
${deliveryStr}

🕐 <b>ORDER TIME</b>
${orderTimeStr}

━━━━━━━━━━━━━━━━━━━━

🟢 <b>ORDER RECEIVED</b>
Please process this order.`;
}

module.exports = {
  sendTelegramMessage,
  formatOrderMessage,
  escapeHTML
};
