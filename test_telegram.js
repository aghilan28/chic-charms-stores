const https = require('https');

const token = '8838828418:AAGo0nTRpuz1LnQo2ipIrKtInmEpehk5Vys';
const chatId = '8723789291';

const payload = JSON.stringify({
  chat_id: chatId,
  text: '✨ CHICCHARMS\n\nTelegram Bot Test Message! ✅',
  parse_mode: 'HTML'
});

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
      console.log('Status Code:', res.statusCode);
      console.log('Body:', body);
    });
  }
);

req.on('error', (err) => {
  console.error('Error:', err);
});

req.write(payload);
req.end();
