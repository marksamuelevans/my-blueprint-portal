import { useState } from "react";
import { DEMO_HINT, signIn } from "./data/auth";

/* Sign-in. Same frame as the BlueprintOS login — brand lockup on the navy
   shell, one card, one job — with patient-sized type and targets, and the
   crisis number in reach before anyone has signed in. Someone in trouble
   should never have to get past a password first. */

export default function Login({ onDone }: { onDone: () => void }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setErr("");
    const res = await signIn(String(fd.get("email")), String(fd.get("password")));
    setBusy(false);
    if (res.ok) onDone();
    else setErr(res.error);
  };

  return (
    <div className="login-wrap">
      <div className="login-brand">
        <span className="mark" aria-hidden="true" />
        <span className="wordmark"><span className="my">MY</span> BLUEPRINT</span>
      </div>

      <form className="login-card" onSubmit={submit}>
        <h1>Sign in</h1>

        <label htmlFor="li-email">Email</label>
        <input
          id="li-email" name="email" type="email"
          autoComplete="username" inputMode="email"
          defaultValue={DEMO_HINT.email} required autoFocus
        />

        <label htmlFor="li-password">Password</label>
        <input id="li-password" name="password" type="password" autoComplete="current-password" required />

        {err && <p className="login-err" role="alert">{err}</p>}

        <button className="btn" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>

        <p className="login-demo">
          <strong>Demo sign-in</strong>
          {DEMO_HINT.email} · {DEMO_HINT.password}
        </p>
      </form>

      <p className="login-foot">
        In a crisis, call or text <a href="tel:988">988</a>, or call <a href="tel:911">911</a>.
      </p>
    </div>
  );
}
