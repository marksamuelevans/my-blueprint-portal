import * as api from "../data/api";
import { useAsync } from "../data/useAsync";
import { Empty, ErrorNote, Loading } from "../ui/bits";
import { Icon } from "../ui/icons";
import { money, shortDate } from "../format";

export default function Billing() {
  const bill = useAsync(() => api.getBilling(), []);
  const ins = useAsync(() => api.getInsurance(), []);

  if (bill.loading) return <Loading />;
  if (bill.error || !bill.data) return <ErrorNote message={bill.error ?? "We couldn't load billing."} />;
  const b = bill.data;

  return (
    <>
      <h1 className="hello">Billing</h1>

      {b.balanceCents > 0 ? (
        /* Money owed is the one thing on this screen waiting on the patient,
           so it takes the same sand panel it has on Home. */
        <section className="pcard sand">
          <div className="pcard-head"><span className="lbl">Balance due</span></div>
          <p className="bignum">{money(b.balanceCents)}</p>
          <p className="body muted">
            {b.cardOnFile ? `${b.cardOnFile.brand} ending ${b.cardOnFile.last4} on file` : "No card on file"}
          </p>
          <button className="btn">Pay {money(b.balanceCents)}</button>
          <div className="pcard-foot">
            <span>Questions about a charge? Call <a href="tel:+16155550100">(615) 555-0100</a></span>
          </div>
        </section>
      ) : (
        <section className="pcard mint">
          <div className="pcard-head">
            <span className="lbl ok"><Icon name="check" size={16} /> All paid up</span>
          </div>
          <h2 className="headline sm">Nothing is due right now.</h2>
        </section>
      )}

      <section className="pcard">
        <div className="pcard-head"><span className="lbl">Statements</span></div>
        {b.statements.length ? (
          <div className="tlist">
            {b.statements.map((s) => (
              <button className="trow" key={s.id} onClick={() => {}}>
                <span className="grow">
                  <strong>{s.description} — {money(s.amountCents)}</strong>
                  <span className="meta">{shortDate(s.date)} · {s.paid ? "Paid" : "Due"}</span>
                </span>
                <span className="chev"><Icon name="chevron" size={18} /></span>
              </button>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ marginTop: 6 }}>No statements yet.</p>
        )}
      </section>

      {ins.data ? (
        <section className="pcard">
          <div className="pcard-head">
            <span className="lbl">Insurance</span>
            <span className="sp" />
            <span className={`chip ${ins.data.status === "active" ? "ok" : "warn"}`}>
              {ins.data.status === "active" ? "Active" : "Needs checking"}
            </span>
          </div>
          <h2 className="headline sm">{ins.data.payer}</h2>
          <p className="body muted">Member {ins.data.memberId}</p>
          {ins.data.copayCents !== null && (
            <div className="pcard-foot">
              <span>
                Your visit copay is {money(ins.data.copayCents)}
                {ins.data.checkedAt ? ` · checked ${shortDate(ins.data.checkedAt)}` : ""}
              </span>
            </div>
          )}
        </section>
      ) : ins.loading ? (
        <Loading lines={1} />
      ) : ins.error ? (
        /* "No insurance on file" is a claim about the patient's coverage.
           A failed request is not that claim. */
        <ErrorNote message="We couldn't load your insurance just now." />
      ) : (
        <Empty>No insurance on file.</Empty>
      )}

      <section className="pcard">
        <div className="pcard-head"><span className="lbl">More</span></div>
        <div className="tlist">
          <button className="trow" onClick={() => {}}>
            <span className="grow"><strong>Payment methods</strong></span>
            <span className="chev"><Icon name="chevron" size={18} /></span>
          </button>
          <button className="trow" onClick={() => {}}>
            <span className="grow">
              <strong>Download a superbill</strong>
              <span className="meta">For out-of-network reimbursement</span>
            </span>
            <span className="chev"><Icon name="chevron" size={18} /></span>
          </button>
        </div>
      </section>
    </>
  );
}
