import * as api from "../data/api";
import { useAsync } from "../data/useAsync";
import { href, useRoute } from "../router";
import { Empty, ErrorNote, Loading } from "../ui/bits";
import { Icon } from "../ui/icons";
import { joinable, longDate, nameInitials, time, until } from "../format";
import type { Visit } from "../data/types";
import VisitJoin from "./VisitJoin";
import { downloadIcs } from "../calendar";
import { useState } from "react";

export default function Visits() {
  const route = useRoute();
  const [id, sub] = route.path;
  if (id && sub === "join") return <VisitJoin id={id} />;
  return id ? <VisitDetail id={id} /> : <VisitList />;
}

function VisitList() {
  const upcoming = useAsync(() => api.getUpcomingVisits(), []);
  const past = useAsync(() => api.getPastVisits(), []);
  if (upcoming.loading) return <Loading />;
  if (upcoming.error) return <ErrorNote message={upcoming.error} />;

  const [next, ...later] = upcoming.data ?? [];

  return (
    <>
      <h1 className="hello">Visits</h1>

      {next ? <VisitPanel visit={next} /> : <Empty>Nothing booked yet.</Empty>}

      {later.length > 0 && (
        <section className="pcard">
          <div className="pcard-head"><span className="lbl">Also coming up</span></div>
          <div className="tlist">
            {later.map((v) => <VisitRow key={v.id} visit={v} />)}
          </div>
        </section>
      )}

      <a className="btn ghost" href={href("messages")}>Request an appointment</a>

      <section className="pcard">
        <div className="pcard-head"><span className="lbl">Past visits</span></div>
        {past.data?.length ? (
          <div className="tlist">
            {past.data.map((v) => <VisitRow key={v.id} visit={v} showKind />)}
          </div>
        ) : (
          <p className="muted" style={{ marginTop: 6 }}>Your past visits will appear here.</p>
        )}
      </section>
    </>
  );
}

/** The next visit gets the same panel it has on Home — one visual idea for
    one fact, wherever the patient meets it. */
function VisitPanel({ visit }: { visit: Visit }) {
  const canJoin = joinable(visit.startAt);
  return (
    <section className="pcard blue">
      <div className="pcard-head">
        <span className="lbl">
          <Icon name={visit.track === "therapy" ? "people" : "capsule"} size={16} />
          {visit.kind} · {until(visit.startAt)}
        </span>
        <span className="sp" />
        <a className="iconbtn solid" href={href("visits", visit.id)} aria-label="Visit details">
          <Icon name="arrow" size={19} />
        </a>
      </div>

      <h2 className="headline">
        {canJoin
          ? <>Starting <b>{until(visit.startAt)}</b></>
          : <><b>{longDate(visit.startAt)}</b> at <b>{time(visit.startAt)}</b></>}
        {visit.telehealth && <span className="inline-pill"><Icon name="video" size={14} /> Video</span>}
      </h2>

      <p className="who">
        <span className="inline-face" aria-hidden="true">{nameInitials(visit.provider.name)}</span>
        {visit.provider.name}, {visit.provider.credential}
      </p>

      {canJoin && (
        <a className="btn" href={href("visits", visit.id, "join")} style={{ marginTop: 18 }}>
          <Icon name="video" size={20} /> Join visit
        </a>
      )}

      <div className="pcard-foot">
        <span>{visit.provider.credential}</span>
        {visit.status === "confirmed"
          ? <span className="chip ok">Confirmed</span>
          : <span className="chip warn">Not confirmed yet</span>}
      </div>
    </section>
  );
}

function VisitRow({ visit, showKind }: { visit: Visit; showKind?: boolean }) {
  return (
    <a className="trow" href={href("visits", visit.id)}>
      <span className="grow">
        <strong>{longDate(visit.startAt)}</strong>
        <span className="meta">
          {showKind ? visit.kind : time(visit.startAt)} · {visit.provider.name}
          {visit.telehealth && !showKind ? " · Video" : ""}
        </span>
      </span>
      <span className="chev"><Icon name="chevron" size={18} /></span>
    </a>
  );
}

function VisitDetail({ id }: { id: string }) {
  const { data: visit, loading, error } = useAsync(() => api.getVisit(id), [id]);
  if (loading) return <Loading lines={2} />;
  if (error) return <ErrorNote message={error} />;
  if (!visit) return <Empty>We couldn't find that visit.</Empty>;

  const cancelled = visit.status === "cancelled";
  const isPast = visit.status === "completed" || cancelled;
  const canJoin = !isPast && joinable(visit.startAt);

  return (
    <>
      <a className="backlink" href={href("visits")}>
        <Icon name="back" size={16} /> All visits
      </a>
      <h1 className="sr-only">{visit.kind} on {longDate(visit.startAt)}</h1>

      <section className={`pcard${isPast ? "" : " blue"}`}>
        <div className="pcard-head">
          <span className="lbl">
            <Icon name={visit.track === "therapy" ? "people" : "capsule"} size={16} />
            {visit.kind} · {isPast ? longDate(visit.startAt) : until(visit.startAt)}
          </span>
          {cancelled && <><span className="sp" /><span className="chip warn">Cancelled</span></>}
        </div>

        <h2 className="headline">
          <b>{longDate(visit.startAt)}</b> at <b>{time(visit.startAt)}</b>
          {visit.telehealth && <span className="inline-pill"><Icon name="video" size={14} /> Video</span>}
        </h2>

        <p className="who">
          <span className="inline-face" aria-hidden="true">{nameInitials(visit.provider.name)}</span>
          {visit.provider.name}, {visit.provider.credential}
        </p>

        {canJoin && (
          <a className="btn" href={href("visits", visit.id, "join")} style={{ marginTop: 18 }}>
            <Icon name="video" size={20} /> Enter the waiting room
          </a>
        )}

        <div className="pcard-foot"><span>{longDate(visit.startAt)} at {time(visit.startAt)}</span></div>
      </section>

      {/* A purpose-written patient artifact — deliberately not the clinical note. */}
      {visit.afterVisitSummary && (
        <section className="pcard">
          <div className="pcard-head">
            <span className="lbl">
              {visit.track === "therapy" ? "What we worked on" : "What we decided"}
            </span>
          </div>
          <p className="body">{visit.afterVisitSummary}</p>
        </section>
      )}

      {!isPast && (
        <section className="pcard">
          <div className="pcard-head"><span className="lbl">Change this visit</span></div>
          <div className="tlist">
            <a className="trow" href={href("messages")}>
              <span className="grow"><strong>Reschedule or cancel</strong>
                <span className="meta">We'll reply within one business day</span></span>
              <span className="chev"><Icon name="chevron" size={18} /></span>
            </a>
            <AddToCalendar visit={visit} />
          </div>
        </section>
      )}

      <p className="muted" style={{ textAlign: "center" }}>
        Having trouble? Call <a href="tel:+16155550100">(615) 555-0100</a>
      </p>
    </>
  );
}

/* The discreet entry is the default: a calendar syncs to places the patient
   does not control, and "Medication follow-up with Bailey Dryden" on a shared
   phone tells whoever picks it up more than they chose to share. */
function AddToCalendar({ visit }: { visit: Visit }) {
  const [detailed, setDetailed] = useState(false);
  return (
    <div className="cal">
      <button className="trow" onClick={() => downloadIcs(visit, detailed)}>
        <span className="grow">
          <strong>Add to your calendar</strong>
          <span className="meta">
            {detailed
              ? `Saves as "${visit.kind} with ${visit.provider.name}"`
              : 'Saves as "Appointment", with no details'}
          </span>
        </span>
        <span className="chev"><Icon name="arrow" size={18} /></span>
      </button>
      <label className="opt">
        <input type="checkbox" checked={detailed} onChange={(e) => setDetailed(e.target.checked)} />
        <span>Include who it's with and what it's for</span>
      </label>
    </div>
  );
}
