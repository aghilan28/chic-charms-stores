/* ============================================================
   auth-role-router.js — Chic Charms
   Drop-in role-based redirect for auth.html login/signup forms.

   Replaces the old  window.location.href = "account.html"  calls.
   Import this module at the bottom of auth.html's <script type="module">.

   Exports one function:
     redirectByRole(firebaseUser) → Promise<void>
       Reads role from Firestore backend → redirects accordingly.
       Admin  → admin.html
       Customer → account.html (or ?next= param, excluding admin pages)

   NO hardcoded emails. NO frontend role lists.
   Backend (Firestore admins/{uid} collection) is source of truth.
   ============================================================ */

import { resolveUserRole } from "./auth.js";

/**
 * redirectByRole(user)
 * Call after any successful Firebase Auth action (login / signup / Google).
 * Reads the user's role from Firestore and redirects to the correct page.
 *
 * @param {import("firebase/auth").User} user - Firebase Auth user object
 */
export async function redirectByRole(user) {
  if (!user?.uid) {
    window.location.href = "auth.html";
    return;
  }

  try {
    const role = await resolveUserRole(user.uid);

    /* Cache role for mobile-app.js bottom-nav (same session) */
    try { sessionStorage.setItem("cc_user_role", role); } catch (_) {}

    if (role === "admin") {
      window.location.href = "admin.html";
      return;
    }

    /* Customer — honour ?next= param but NEVER allow admin routes */
    let next = new URLSearchParams(window.location.search).get("next") || "";
    if (!next && sessionStorage.getItem("authRedirect")) {
      next = sessionStorage.getItem("authRedirect");
      sessionStorage.removeItem("authRedirect");
    }
    const safeNext = next && !next.includes("admin") && next.startsWith("/") === false
      ? next
      : "account.html";

    window.location.href = safeNext || "account.html";

  } catch (err) {
    console.error("[auth-role-router] redirect failed:", err);
    /* Fail-safe: send to account page, not admin */
    window.location.href = "account.html";
  }
}
