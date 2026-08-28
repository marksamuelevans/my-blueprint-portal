import { useState } from "react";
import * as api from "../data/api";
import { useAsync } from "../data/useAsync";
import { href } from "../router";
import { Empty, ErrorNote, Loading } from "../ui/bits";
import { Icon } from "../ui/icons";
import { shortDate } from "../format";

export default function Health() {
  const [tick, setTick] = useState(0);
  const { data, loading, error } = useAsync(() => api.getMedications(), [tick]);
  const [busy, setBusy] = useState<string | null>(null);

  const refill = async (id: string) => {
    setBusy(id);
    await api.requestRefill(id);
    setBusy(null);
    setTick((t) => t + 1);
  };

  if (loading) return <Loading />;
  if (error) return <ErrorNote message={error} />;

  return (
    <>
      <h1 className="hello">Health</h1>

      {data?.length ? (
        data.map((m) => (
          <section className="pcard" key={m.id}>
            <div className="pcard-head">
              <span className="lbl">Prescribed by {m.prescriber}</span>
            </div>

            <h2 className="headline sm"><b>{m.name}</b> {m.strength}</h2>
            <p className="body muted">{m.sig}</p>

            {m.refill ? (
              <div className="pcard-foot">
                <span className="chip info">
                  Refill requested {shortDate(m.refill.requestedAt)} · allow 2 business days
                </span>
              </div>
            ) : m.controlled ? (
              <>
                {/* Controlled substances behave differently — say so before the
                    patient taps, rather than failing the request afterwards. */}
                <p className="body muted">
                  This medication needs a visit before it can be refilled.
                </p>
                <a className="btn ghost" href={href("visits")}>Request an appointment</a>
              </>
            ) : (
              <button className="btn" onClick={() => refill(m.id)} disabled={busy === m.id}>
                {busy === m.id ? "Sending…" : "Request refill"}
              </button>
            )}
          </section>
        ))
      ) : (
        <Empty>No medications on file.</Empty>
      )}

      <section className="pcard sand">
        <div className="pcard-head">
          <span className="lbl">Check-in</span>
          <span className="sp" />
          <button className="iconbtn solid" onClick={() => {}} aria-label="Start the check-in">
            <Icon name="arrow" size={19} />
          </button>
        </div>
        <h2 className="headline sm">How you've been feeling</h2>
        <p className="body muted">About 3 minutes · before your next visit</p>
      </section>

      <section className="pcard">
        <div className="pcard-head"><span className="lbl">Your information</span></div>
        <div className="tlist">
          <a className="trow" href={href("account")}>
            <span className="grow"><strong>Profile and contact details</strong></span>
            <span className="chev"><Icon name="chevron" size={18} /></span>
          </a>
          <a className="trow" href={href("account")}>
            <span className="grow"><strong>Documents</strong></span>
            <span className="chev"><Icon name="chevron" size={18} /></span>
          </a>
        </div>
      </section>
    </>
  );
}
