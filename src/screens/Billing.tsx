import * as api from "../data/api";
import { useAsync } from "../data/useAsync";
import { ActionRow, Empty, ErrorNote, Loading, SectionTitle } from "../ui/bits";
import { money, shortDate } from "../format";

export default function Billing() {
  const bill = useAsync(() => api.getBilling(), []);
  const ins = useAsync(() => api.getInsurance(), []);

  if (bill.loading) return <Loading />;
  if (bill.error || !bill.data) return <ErrorNote message={bill.error ?? "We couldn't load billing."} />;
  const b = bill.data;

  return (
    <>
      <h1>Billing</h1>

      {b.balanceCents > 0 ? (
        <section className="hero">
          <span className="eyebrow">Balance due</span>
          <h2>{money(b.balanceCents)}</h2>
          <p className="sub">
            {b.cardOnFile ? `${b.cardOnFile.brand} ending ${b.cardOnFile.last4} on file` : "No card on file"}
          </p>
          <button className="btn" style={{ marginTop: 16, background: "#fff", color: "var(--bp-ink-900)" }}>
            Pay {money(b.balanceCents)}
          </button>
        </section>
      ) : (
        <section className="card">
          <strong>You're all paid up</strong>
          <p className="muted" style={{ marginTop: 4 }}>Nothing is due right now.</p>
        </section>
      )}

      <SectionTitle>Statements</SectionTitle>
      {b.statements.length ? (
        b.statements.map((s) => (
          <ActionRow
            key={s.id}
            quiet={s.paid}
            title={`${s.description} — ${money(s.amountCents)}`}
            meta={`${shortDate(s.date)}${s.paid ? " · Paid" : " · Due"}`}
            onClick={() => {}}
          />
        ))
      ) : (
        <Empty>No statements yet.</Empty>
      )}

      <SectionTitle>Insurance</SectionTitle>
      {ins.data ? (
        <section className="card">
          <strong>{ins.data.payer}</strong>
          <p className="muted" style={{ marginTop: 2 }}>Member {ins.data.memberId}</p>
          <p className={`chip ${ins.data.status === "active" ? "ok" : "warn"}`} style={{ marginTop: 10 }}>
            {ins.data.status === "active" ? "Active coverage" : "Coverage needs checking"}
          </p>
          {ins.data.copayCents !== null && (
            <p className="muted" style={{ marginTop: 8 }}>
              Your visit copay is {money(ins.data.copayCents)}
              {ins.data.checkedAt ? ` · checked ${shortDate(ins.data.checkedAt)}` : ""}
            </p>
          )}
        </section>
      ) : (
        <Loading lines={1} />
      )}

      <ActionRow quiet title="Payment methods" onClick={() => {}} />
      <ActionRow quiet title="Download a superbill" meta="For out-of-network reimbursement" onClick={() => {}} />
    </>
  );
}
