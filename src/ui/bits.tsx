import type { ReactNode } from "react";
import { Icon } from "./icons";
import { href } from "../router";

/* Small shared pieces. Kept deliberately few — My Blueprint should look the
   same everywhere, and a large component kit invites drift. */

export function Skeleton({ h = 20, w = "100%" }: { h?: number; w?: number | string }) {
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
    <div className="card">
      <strong>{message}</strong>
      <p className="muted" style={{ marginTop: 6 }}>
        Try again in a moment. If you need us now, call <a href="tel:+16155550100">(615) 555-0100</a>.
      </p>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card"><p className="empty" style={{ padding: "28px 8px" }}>{children}</p></div>;
}

export function ActionRow({
  title, meta, to, onClick, quiet,
}: { title: string; meta?: ReactNode; to?: string; onClick?: () => void; quiet?: boolean }) {
  const inner = (
    <>
      <span className="grow"><strong>{title}</strong>{meta && <span className="meta">{meta}</span>}</span>
      <span className="chev"><Icon name="chevron" size={18} /></span>
    </>
  );
  const cls = `action${quiet ? " quiet" : ""}`;
  return to ? <a className={cls} href={to}>{inner}</a> : <button className={cls} onClick={onClick}>{inner}</button>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 style={{ marginTop: 6 }}>{children}</h2>;
}

export const crisisHref = href("crisis");
