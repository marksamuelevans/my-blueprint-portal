import type { ReactNode } from "react";

/* Small shared pieces. Kept deliberately few — My Blueprint should look the
   same everywhere, and a large component kit invites drift. */

function Skeleton({ h = 20, w = "100%" }: { h?: number; w?: number | string }) {
  return <div className="skel" style={{ height: h, width: w }} aria-hidden="true" />;
}

/* aria-busy on a live region tells AT to withhold it, and this whole subtree
   is unmounted when the data lands, so nothing was ever announced. The
   announcement now lives in the persistent region in Shell; this is just the
   visual placeholder. */
export function Loading({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-busy="true">
      {Array.from({ length: lines }, (_, i) => <Skeleton key={i} h={i === 0 ? 76 : 56} />)}
    </div>
  );
}

/** Never dead-end: every failure offers a human. */
export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="pcard" role="alert">
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

