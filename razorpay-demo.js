/* ============================================================
   razorpay-demo.js — ChicCharms Demo Payment System
   ⚠️  TEST MODE ONLY — DO NOT use in production without
       replacing placeholder keys with live Razorpay credentials.
   ============================================================ */

/* ============================================================
   RAZORPAY TEST KEY CONFIGURATION
   Replace with live Razorpay keys before going to production.
   ============================================================ */
window.RAZORPAY_DEMO_CONFIG = {
  // ⚠️ PLACEHOLDER — Replace with your live key before production:
  keyId: 'rzp_test_xxxxxxxxxxxx',
  currency: 'INR',
  brandName: 'Chic Charms',
  brandColor: '#e8809a',
  logo: '',                // Optional: your logo URL
  isDemoMode: true,        // Set false in production
};

/* ============================================================
   TEST CARD DETAILS (visible only in demo mode)
   Remove this block entirely before going to production.
   ============================================================ */
window.RAZORPAY_TEST_CARDS = {
  card:    { number: '4111 1111 1111 1111', expiry: 'Any future date', cvv: '123' },
  upi:     'success@razorpay',
  note:    'Use failure@razorpay to simulate a payment failure.',
};

/* ============================================================
   DEMO ORDER GENERATOR
   Creates realistic fake order IDs and delivery estimates.
   ============================================================ */
function generateDemoOrderId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'CC';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function generateDemoDelivery() {
  const now   = new Date();
  const days  = Math.floor(Math.random() * 3) + 3; // 3–5 days
  now.setDate(now.getDate() + days);
  return now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

function generateDemoPaymentId() {
  return 'pay_DEMO_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

/* ============================================================
   DEMO MODE BANNER INJECTION
   Shows test card info in a subtle collapsible banner.
   Remove <div id="rzpDemoBanner"> from HTML before production.
   ============================================================ */
function injectDemoBanner() {
  if (!window.RAZORPAY_DEMO_CONFIG.isDemoMode) return;
  const existing = document.getElementById('rzpDemoBanner');
  if (existing) return;

  const banner = document.createElement('div');
  banner.id = 'rzpDemoBanner';
  banner.className = 'rzp-demo-banner';
  banner.innerHTML = `
    <div class="rzp-demo-banner-header" onclick="this.parentElement.classList.toggle('rzp-demo-expanded')" aria-expanded="false" role="button" tabindex="0">
      <span class="rzp-demo-badge">🧪 TEST MODE</span>
      <span class="rzp-demo-banner-title">Demo Payment — No real money charged</span>
      <span class="rzp-demo-chevron">▾</span>
    </div>
    <div class="rzp-demo-banner-body">
      <div class="rzp-demo-row">
        <span class="rzp-demo-label">Test Card</span>
        <span class="rzp-demo-value rzp-demo-copy" data-copy="4111111111111111" title="Click to copy">
          4111 1111 1111 1111 <span class="rzp-demo-copy-icon">⎘</span>
        </span>
      </div>
      <div class="rzp-demo-row">
        <span class="rzp-demo-label">Expiry / CVV</span>
        <span class="rzp-demo-value">Any future date &nbsp;·&nbsp; 123</span>
      </div>
      <div class="rzp-demo-row">
        <span class="rzp-demo-label">UPI ID</span>
        <span class="rzp-demo-value rzp-demo-copy" data-copy="success@razorpay" title="Click to copy">
          success@razorpay <span class="rzp-demo-copy-icon">⎘</span>
        </span>
      </div>
      <div class="rzp-demo-row rzp-demo-hint">
        Use <strong>failure@razorpay</strong> to simulate a payment failure.
      </div>
    </div>
  `;

  // Insert after trust-banner or at start of form-card
  const trustBanner = document.querySelector('.trust-banner');
  if (trustBanner) {
    trustBanner.after(banner);
  } else {
    const formCard = document.querySelector('.form-card');
    if (formCard) formCard.prepend(banner);
  }

  // Copy-to-clipboard on click
  banner.querySelectorAll('.rzp-demo-copy').forEach(el => {
    el.addEventListener('click', () => {
      navigator.clipboard.writeText(el.dataset.copy).then(() => {
        const orig = el.querySelector('.rzp-demo-copy-icon').textContent;
        el.querySelector('.rzp-demo-copy-icon').textContent = '✓';
        setTimeout(() => { el.querySelector('.rzp-demo-copy-icon').textContent = orig; }, 1500);
      });
    });
  });
}

/* ============================================================
   SECURE TRUST SECTION — Inject into order summary sidebar
   ============================================================ */
function injectTrustSection() {
  const summary = document.querySelector('.checkout-summary');
  if (!summary || summary.querySelector('.rzp-trust-section')) return;

  const trust = document.createElement('div');
  trust.className = 'rzp-trust-section';
  trust.innerHTML = `
    <div class="rzp-trust-badges">
      <div class="rzp-trust-badge">
        <span class="rzp-trust-icon">🔐</span>
        <span class="rzp-trust-text">256-bit Encrypted</span>
      </div>
      <div class="rzp-trust-badge">
        <span class="rzp-trust-icon">✅</span>
        <span class="rzp-trust-text">PCI DSS Compliant</span>
      </div>
      <div class="rzp-trust-badge">
        <span class="rzp-trust-icon">💳</span>
        <span class="rzp-trust-text">UPI • Cards • Wallets</span>
      </div>
    </div>
    <div class="rzp-secured-by">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z" fill="#3395FF"/>
      </svg>
      <span>Secured by <strong>Razorpay</strong></span>
    </div>
  `;
  summary.appendChild(trust);
}

/* ============================================================
   PAYMENT SUCCESS MODAL
   Luxury animated confirmation overlay.
   ============================================================ */
function showPaymentSuccessModal(paymentId, orderId, deliveryDate, totalAmount) {
  // Remove any existing modal
  const existing = document.getElementById('rzpSuccessModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'rzpSuccessModal';
  modal.className = 'rzp-modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Order Confirmed');

  modal.innerHTML = `
    <div class="rzp-modal-card rzp-success-card">
      <div class="rzp-success-anim">
        <div class="rzp-success-ring rzp-ring-1"></div>
        <div class="rzp-success-ring rzp-ring-2"></div>
        <div class="rzp-success-ring rzp-ring-3"></div>
        <div class="rzp-success-checkmark">
          <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
            <circle class="rzp-check-circle" cx="26" cy="26" r="25" fill="none" stroke="#e8809a" stroke-width="2"/>
            <path class="rzp-check-mark" fill="none" stroke="#e8809a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M14 26 L22 34 L38 18"/>
          </svg>
        </div>
      </div>
      <p class="rzp-success-eyebrow">Order Confirmed ✨</p>
      <h2 class="rzp-success-title">Thank you for your order!</h2>
      <p class="rzp-success-subtitle">Your ChicCharms pieces are being lovingly packed.</p>

      <div class="rzp-order-details">
        <div class="rzp-order-row">
          <span class="rzp-order-label">Order ID</span>
          <span class="rzp-order-value rzp-order-id">${orderId}</span>
        </div>
        <div class="rzp-order-row">
          <span class="rzp-order-label">Amount Paid</span>
          <span class="rzp-order-value">₹${Number(totalAmount).toLocaleString('en-IN')}</span>
        </div>
        <div class="rzp-order-row">
          <span class="rzp-order-label">Estimated Delivery</span>
          <span class="rzp-order-value">${deliveryDate}</span>
        </div>
        <div class="rzp-order-row">
          <span class="rzp-order-label">Payment ID</span>
          <span class="rzp-order-value rzp-payment-id">${paymentId}</span>
        </div>
      </div>

      <div class="rzp-success-actions">
        <button class="rzp-btn-continue" id="rzpContinueShopping">Continue Shopping</button>
      </div>

      <p class="rzp-success-note">A confirmation has been sent to your email. 🌸</p>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.classList.add('rzp-modal-open');

  // Animate in
  requestAnimationFrame(() => modal.classList.add('rzp-modal-visible'));

  // Trigger confetti-like particles
  spawnSuccessParticles(modal);

  // Button
  document.getElementById('rzpContinueShopping').addEventListener('click', () => {
    modal.classList.remove('rzp-modal-visible');
    setTimeout(() => {
      modal.remove();
      document.body.classList.remove('rzp-modal-open');
    }, 350);
  });
}

/* ============================================================
   PAYMENT FAILURE MODAL
   Elegant error UI with retry CTA.
   ============================================================ */
function showPaymentFailureModal(errorMsg, onRetry) {
  const existing = document.getElementById('rzpFailureModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'rzpFailureModal';
  modal.className = 'rzp-modal-overlay';
  modal.setAttribute('role', 'alertdialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Payment Failed');

  modal.innerHTML = `
    <div class="rzp-modal-card rzp-failure-card">
      <div class="rzp-failure-icon">
        <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
          <circle cx="26" cy="26" r="25" fill="none" stroke="#e57373" stroke-width="2"/>
          <path fill="none" stroke="#e57373" stroke-width="3" stroke-linecap="round" d="M18 18 L34 34 M34 18 L18 34"/>
        </svg>
      </div>
      <h2 class="rzp-failure-title">Payment Unsuccessful</h2>
      <p class="rzp-failure-msg">${errorMsg || 'Your payment could not be processed. No amount was charged.'}</p>
      <div class="rzp-failure-actions">
        <button class="rzp-btn-retry" id="rzpRetryBtn">Try Again</button>
        <button class="rzp-btn-cancel" id="rzpCancelBtn">Cancel</button>
      </div>
      <p class="rzp-failure-note">Need help? <a href="mailto:support@chiccharms.in">Contact Support</a></p>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.classList.add('rzp-modal-open');
  requestAnimationFrame(() => modal.classList.add('rzp-modal-visible'));

  document.getElementById('rzpRetryBtn').addEventListener('click', () => {
    modal.classList.remove('rzp-modal-visible');
    setTimeout(() => {
      modal.remove();
      document.body.classList.remove('rzp-modal-open');
      if (typeof onRetry === 'function') onRetry();
    }, 300);
  });

  document.getElementById('rzpCancelBtn').addEventListener('click', () => {
    modal.classList.remove('rzp-modal-visible');
    setTimeout(() => {
      modal.remove();
      document.body.classList.remove('rzp-modal-open');
    }, 300);
  });
}

/* ============================================================
   SUCCESS PARTICLE EFFECT
   Lightweight CSS-driven confetti burst.
   ============================================================ */
function spawnSuccessParticles(container) {
  const colors = ['#e8809a','#f4a7b9','#ffd6e0','#ffb3c6','#c04060','#ffe4ec'];
  const count  = 18;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'rzp-particle';
    p.style.cssText = `
      background: ${colors[i % colors.length]};
      left: ${Math.random() * 100}%;
      animation-delay: ${Math.random() * 0.4}s;
      animation-duration: ${0.9 + Math.random() * 0.5}s;
      width: ${5 + Math.random() * 7}px;
      height: ${5 + Math.random() * 7}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
    `;
    container.appendChild(p);
  }
}

/* ============================================================
   TOAST NOTIFICATION SYSTEM
   ============================================================ */
function showToast(message, type = 'success', duration = 3500) {
  const toast = document.createElement('div');
  toast.className = `rzp-toast rzp-toast-${type}`;
  toast.innerHTML = `
    <span class="rzp-toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span class="rzp-toast-msg">${message}</span>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('rzp-toast-visible'));
  setTimeout(() => {
    toast.classList.remove('rzp-toast-visible');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

/* ============================================================
   RAZORPAY CHECKOUT INITIALIZER
   Call this instead of the inline payWithRazorpay to use
   the enhanced demo experience.
   ============================================================ */
window.RazorpayDemo = {

  /**
   * Opens Razorpay popup in test mode.
   * @param {Object} opts - { amount (INR, no paise), name, phone, address, onSuccess, onFailure }
   */
  open: async function (opts) {
    const config  = window.RAZORPAY_DEMO_CONFIG;
    const amount  = opts.amount; // in INR — we convert to paise below

    if (typeof Razorpay === 'undefined') {
      showToast('Payment gateway is loading. Please try again in a moment.', 'error');
      return;
    }

    if (!config.keyId || config.keyId === 'rzp_test_xxxxxxxxxxxx') {
      try {
        const FUNCTIONS_BASE = (
          window.location.hostname.includes('vercel.app') ||
          window.location.hostname.includes('chiccharms.beauty') ||
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1'
        ) ? '/api' : 'https://chiccharms.beauty/api';
        const resp = await fetch(`${FUNCTIONS_BASE}/razorpayConfig`);
        if (resp.ok) {
          const data = await resp.json();
          config.keyId = data.keyId;
        }
      } catch (err) {
        console.error('[RazorpayDemo] On-demand key fetch failed:', err);
      }
    }

    if (!config.keyId || config.keyId === 'rzp_test_xxxxxxxxxxxx') {
      showToast('Payment gateway credentials not loaded. Please try again.', 'error');
      return;
    }

    const options = {
      // ⚠️  REPLACE key with live Razorpay key before production:
      key:         config.keyId,
      amount:      Math.round(amount * 100), // Razorpay expects paise
      currency:    config.currency,
      name:        config.brandName,
      description: 'Order Payment',
      image:       config.logo || '',
      prefill: {
        name:    opts.name    || '',
        contact: opts.phone   || '',
        email:   opts.email   || '',
      },
      notes: {
        address: opts.address || '',
        demo:    config.isDemoMode ? 'TEST_MODE' : 'LIVE',
      },
      theme:       { color: config.brandColor },

      handler: function (response) {
        const paymentId  = response.razorpay_payment_id || generateDemoPaymentId();
        const orderId    = generateDemoOrderId();
        const deliveryDt = generateDemoDelivery();

        showToast('Payment successful! 🎉 Order confirmed.', 'success', 3000);

        if (typeof opts.onSuccess === 'function') {
          opts.onSuccess({
            paymentId,
            orderId,
            deliveryDate: deliveryDt,
            amount,
          });
        }

        // Show the luxury success modal
        showPaymentSuccessModal(paymentId, orderId, deliveryDt, amount);
      },

      modal: {
        ondismiss: function () {
          if (typeof opts.onDismiss === 'function') opts.onDismiss();
        },
      },
    };

    const rzp = new Razorpay(options);

    rzp.on('payment.failed', function (response) {
      const errMsg = response.error?.description || 'Payment could not be completed.';
      showPaymentFailureModal(errMsg, () => {
        // Retry: reopen Razorpay
        window.RazorpayDemo.open(opts);
      });
      if (typeof opts.onFailure === 'function') opts.onFailure(response.error);
    });

    rzp.open();
  },

  showSuccess:  showPaymentSuccessModal,
  showFailure:  showPaymentFailureModal,
  showToast,
};

/* ============================================================
   AUTO-INIT: Enhance checkout page on DOM ready
   ============================================================ */
async function rzpDemoInit() {
  if (!document.querySelector('.checkout-page')) return;
  // Removed automatic demo banner injection to avoid showing test cards/log panel in production.
  // injectDemoBanner();
  injectTrustSection();

  try {
    const config = window.RAZORPAY_DEMO_CONFIG;
    if (!config.keyId || config.keyId === 'rzp_test_xxxxxxxxxxxx') {
      const FUNCTIONS_BASE = (
        window.location.hostname.includes('vercel.app') ||
        window.location.hostname.includes('chiccharms.beauty') ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      ) ? '/api' : 'https://chiccharms.beauty/api';
      const resp = await fetch(`${FUNCTIONS_BASE}/razorpayConfig`);
      if (resp.ok) {
        const data = await resp.json();
        config.keyId = data.keyId;
        console.log('[RazorpayDemo] Loaded key ID successfully.');
      }
    }
  } catch (err) {
    console.error('[RazorpayDemo] Failed to load key ID:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', rzpDemoInit);
} else {
  rzpDemoInit();
}
