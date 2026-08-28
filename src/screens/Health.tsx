import { useState } from "react";
import * as api from "../data/api";
import { useAsync } from "../data/useAsync";
import { href, useRoute } from "../router";
import { ErrorNote, Loading } from "../ui/bits";
import { Icon } from "../ui/icons";
import { shortDate } from "../format";
import type { PracticeItem } from "../data/types";

import Checkin from "./Checkin";

export default function Health() {
  const route = useRoute();
  if (route.path[0] === "checkin") return <Checkin />;
  return <HealthHome />;
}

function HealthHome() {
  const plan = useAsync(() => api.getTherapyPlan(), []);
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
        <>
        <p className="tracklead">
          <Icon name="capsule" size={16} /> Medication · {data[0].prescriber}
        </p>
        {data.map((m) => (
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
        ))}
        </>
      ) : null}

      {plan.data?.therapist && (
        <>
          <p className="tracklead">
            <Icon name="people" size={16} /> Therapy · {plan.data.therapist.name}
          </p>

          <section className="pcard">
            <div className="pcard-head">
              <span className="lbl">What you're working on</span>
              {plan.data.reviewedAt && (
                <><span className="sp" /><span className="chip info">Reviewed {shortDate(plan.data.reviewedAt)}</span></>
              )}
            </div>
            {plan.data.goals.length ? (
              <div className="tlist">
                {plan.data.goals.map((g) => (
                  <div className="trow static" key={g.id}>
                    <span className="grow">
                      <strong>{g.title}</strong>
                      <span className="meta">{g.detail}</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="body muted">You and {plan.data.therapist.name.split(" ")[0]} will set these together.</p>
            )}
          </section>

          {plan.data.practice.length > 0 && (
            <section className="pcard">
              <div className="pcard-head"><span className="lbl">Between sessions</span></div>
              <div className="tlist">
                {plan.data.practice.map((it) => (
                  <PracticeRow key={it.id} item={it} onChange={() => {}} />
                ))}
              </div>
              <div className="pcard-foot">
                <span>Nothing here is graded. It's a place to notice what happened, not a test.</span>
              </div>
            </section>
          )}
        </>
      )}

      <section className="pcard sand">
        <div className="pcard-head">
          <span className="lbl">Check-in</span>
          <span className="sp" />
          <a className="iconbtn solid" href={href("health", "checkin")} aria-label="Start the check-in">
            <Icon name="arrow" size={19} />
          </a>
        </div>
        <a href={href("health", "checkin")} className="plain">
          <h2 className="headline sm">How you've been feeling</h2>
          <p className="body muted">About 3 minutes · before your next visit</p>
        </a>
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

/* Ticking something off is the patient's own record, not a report to anyone.
   It says "done", never "complete" — and nothing counts a streak. */
function PracticeRow({ item, onChange }: { item: PracticeItem; onChange: () => void }) {
  const [done, setDone] = useState(item.done);
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    const next = !done;
    setDone(next); setBusy(true);
    await api.setPracticeDone(item.id, next);
    setBusy(false); onChange();
  };
  return (
    <button className={`trow pickable${done ? " on" : ""}`} onClick={toggle} aria-pressed={done} disabled={busy}>
      <span className="pick" aria-hidden="true">{done && <Icon name="check" size={15} />}</span>
      <span className="grow">
        <strong className={done ? "struck" : undefined}>{item.title}</strong>
        <span className="meta">{item.detail}</span>
      </span>
    </button>
  );
}
