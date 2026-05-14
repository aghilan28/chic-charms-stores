/* ============================================================
   admin-session-ux.js — Chic Charms
   Provides UX helpers used by admin.html:
     AdminToast, AdminSessionStatus, AdminSessionTimer, adminReveal
============================================================ */

/**
 * adminReveal(selectors)
 * Fades in the listed elements after the auth guard grants access.
 */
export function adminReveal(selectors = []) {
  selectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      el.style.opacity    = "0";
      el.style.transition = "opacity 0.4s ease";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { el.style.opacity = "1"; });
      });
    });
  });
}

/**
 * AdminToast — simple toast notifications for the admin panel.
 * Usage: AdminToast.show("Saved!", "success")
 * Types: "success" | "error" | "info"
 */
export const AdminToast = {
  show(message, type = "info", duration = 3000) {
    const el = document.getElementById("adminToast");
    if (!el) return;
    el.textContent  = message;
    el.dataset.type = type;
    el.classList.add("visible");
    clearTimeout(AdminToast._t);
    AdminToast._t = setTimeout(() => el.classList.remove("visible"), duration);
  },
  _t: null,
};

/**
 * AdminSessionStatus — updates a [data-state] badge in the admin bar.
 * Usage: AdminSessionStatus.set("live") | AdminSessionStatus.set("idle")
 */
export const AdminSessionStatus = {
  set(state = "live") {
    document.querySelectorAll(".admin-session-status").forEach((el) => {
      el.dataset.state = state;
      el.setAttribute("aria-label", `Session status: ${state}`);
    });
  },
};

/**
 * AdminSessionTimer — shows elapsed session time in the sidebar footer.
 * Usage: AdminSessionTimer.start(".admin-side-footer")
 */
export const AdminSessionTimer = {
  _interval: null,
  _start:    null,

  start(containerSelector) {
    this._start = Date.now();

    /* Inject timer element */
    const container = document.querySelector(containerSelector);
    if (container && !document.getElementById("adminSessionTimer")) {
      const el = document.createElement("div");
      el.id        = "adminSessionTimer";
      el.className = "admin-session-timer";
      el.style.cssText =
        "font-size:0.68rem;color:var(--muted,#9b7b85);padding:6px 0 0;letter-spacing:0.04em;";
      container.appendChild(el);
    }

    this._interval = setInterval(() => {
      const el = document.getElementById("adminSessionTimer");
      if (!el) return;
      const secs  = Math.floor((Date.now() - this._start) / 1000);
      const m     = String(Math.floor(secs / 60)).padStart(2, "0");
      const s     = String(secs % 60).padStart(2, "0");
      el.textContent = `Session: ${m}:${s}`;
    }, 1000);
  },

  stop() {
    clearInterval(this._interval);
  },
};
