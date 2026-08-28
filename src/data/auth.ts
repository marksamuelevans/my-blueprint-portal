/* ============================================================
   SANDBOX SIGN-IN — a demo gate, not security.

   There is no server here. This module compares a string in the browser,
   which means the demo password is readable by anyone who opens the
   bundle. That is acceptable only because this build contains no real
   patient data: every screen reads the fixtures in ./fixtures.ts.

   When My Blueprint moves off Tebra onto real records, this file is
   deleted, not extended — patient authentication belongs on the server,
   with per-patient credentials, rate limiting, and an access log. The
   only thing that should survive is the shape of signIn()/signOut(), so
   the screens don't have to change.
   ============================================================ */

const SESSION_KEY = "mb_demo_session";

export const DEMO_EMAIL = "mark@blueprintmental.health";
const DEMO_PASSWORD = "T3st3r!";

/** Shown on the sign-in card — the credential is in the bundle anyway,
    and a demo nobody can get into is worse than useless. */
export const DEMO_HINT = { email: DEMO_EMAIL, password: DEMO_PASSWORD };

export type SignInResult = { ok: true } | { ok: false; error: string };

export async function signIn(email: string, password: string): Promise<SignInResult> {
  await new Promise((r) => setTimeout(r, 420));            // the wait a real call would cost
  const match =
    email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
  if (!match) return { ok: false, error: "That email and password don't match." };
  try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* private mode */ }
  return { ok: true };
}

/** Session-scoped on purpose: closing the tab signs you out, which is what
    a health portal should do on a shared or borrowed device. */
export function isSignedIn(): boolean {
  try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; }
}

export function signOut(): void {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* private mode */ }
}
