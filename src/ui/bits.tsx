import type { ReactNode } from "react";

/* Small shared pieces. Kept deliberately few — My Blueprint should look the
   same everywhere, and a large component kit invites drift. */

function Skeleton({ h = 20, w = "100%" }: { h?: number; w?: number | string }) {
  return <div className="skel" style={{ height: h, width: w }} aria-hidden="true" />;
}

export function Loading({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-busy="true" aria-live="polite">
      <span className="sr-only" style={{ position: "absolute", left: -9999 }}>Loading</span>
      {Array.from({ length: lines }, (_, i) => <Skeleton key={i} h={i === 0 ? 76 : 56} />)}
    </div>
  );
}

/** Never dead-end: every failure offers a human. */
export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="pcard">
      <strong>{message}</strong>
      <p className="muted" style={{ marginTop: 6 }}>
        Try again in a moment. If you need us now, call <a href="tel:+16155550100">(615) 555-0100</a>.
      </p>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="pcard"><p className="empty" style={{ padding: "22px 8px" }}>{children}</p></div>;
}

