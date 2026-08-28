import { useState } from "react";
import * as api from "../data/api";
import { useAsync } from "../data/useAsync";
import { href } from "../router";
import { ErrorNote, Loading } from "../ui/bits";
import { Icon } from "../ui/icons";
import { greeting, joinable, longDate, money, nameInitials, time, until } from "../format";

/* The dashboard answers one question — what do I need to do right now —
   and shows nothing that isn't an answer to it.

   Three panels at most, and the tint says which is which before a word is
   read: pale blue is the visit, sand is the short list of things waiting on
   you, mint means there is nothing. Everything else is one tap away. */

export default function Home() {
  const [tick, setTick] = useState(0);
  const { data, loading, error } = useAsync(() => api.getHomeSummary(), [tick]);
  const [confirming, setConfirming] = useState(false);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "We couldn't load your home page."} />;

  const { patient, careTeam, nextVisit, formsDue, balanceCents, unreadMessages, lastVisit } = data;
  const name = patient.preferredName ?? patient.firstName;
  const canJoin = nextVisit ? joinable(nextVisit.startAt) : false;

  const todo =
    formsDue.length + (balanceCents > 0 ? 1 : 0) + (unreadMessages > 0 ? 1 : 0);
  const minutes = formsDue.reduce((sum, f) => sum + f.minutes, 0);

  const confirm = async () => {
    if (!nextVisit) return;
    setConfirming(true);
    await api.confirmVisit(nextVisit.id);
    setConfirming(false);
    setTick((t) => t + 1);
  };

  return (
    <>
      <h1 className="hello">{greeting()}, {name}</h1>

      {nextVisit ? (
        <section className="pcard blue">
          <div className="pcard-head">
            <span className="lbl">
              <Icon name={nextVisit.track === "therapy" ? "people" : "capsule"} size={16} />
              {nextVisit.kind} · {until(nextVisit.startAt)}
            </span>
            <span className="sp" />
            <a className="iconbtn solid" href={href("visits", nextVisit.id)} aria-label="Visit details">
              <Icon name="arrow" size={19} />
            </a>
          </div>

          <h2 className="headline">
            {canJoin ? (
              <>Starting <b>{until(nextVisit.startAt)}</b></>
            ) : (
              <><b>{longDate(nextVisit.startAt)}</b> at <b>{time(nextVisit.startAt)}</b></>
            )}
            {nextVisit.telehealth && (
              <span className="inline-pill"><Icon name="video" size={14} /> Video</span>
            )}
          </h2>

          <p className="who">
            <span className="inline-face" aria-hidden="true">
              {nameInitials(nextVisit.provider.name)}
            </span>
            {nextVisit.provider.name}, {nextVisit.provider.credential}
          </p>

          <div className="btn-row" style={{ marginTop: 18 }}>
            {canJoin ? (
              <a className="btn" href={href("visits", nextVisit.id, "join")}>
                <Icon name="video" size={20} /> Enter the waiting room
              </a>
            ) : nextVisit.status === "confirmed" ? (
              <a className="btn white" href={href("visits", nextVisit.id)}>View details</a>
            ) : (
              <>
                <button className="btn" onClick={confirm} disabled={confirming}>
                  {confirming ? "Confirming…" : "Confirm"}
                </button>
                <a className="btn white" href={href("visits", nextVisit.id)}>Reschedule</a>
              </>
            )}
          </div>

          <div className="pcard-foot">
            {nextVisit.status === "confirmed" ? (
              <span className="chip ok">Confirmed — we'll see you then</span>
            ) : (
              <span className="chip warn">Not confirmed yet</span>
            )}
          </div>
        </section>
      ) : (
        <section className="pcard">
          <div className="pcard-head">
            <span className="lbl"><Icon name="calendar" size={16} /> Appointments</span>
          </div>
          <h2 className="headline sm">You don't have a visit booked.</h2>
          <p className="muted" style={{ marginTop: 8 }}>When you're ready, we'll find a time that works.</p>
          <div style={{ marginTop: 18 }}>
            <a className="btn" href={href("visits")}>Request an appointment</a>
          </div>
        </section>
      )}

      {todo > 0 ? (
        <section className="pcard sand">
          <div className="pcard-head">
            <span className="lbl">Waiting on you</span>
          </div>

          <h2 className="headline sm">
            <b>{todo} thing{todo === 1 ? "" : "s"}</b> need{todo === 1 ? "s" : ""} you
            {minutes > 0 && (
              <span className="inline-pill"><Icon name="clock" size={14} /> about {minutes} min</span>
            )}
          </h2>

          <div className="tlist">
            {formsDue.map((f) => (
              <a className="trow" key={f.id} href={f.id === "f-1" ? href("health", "checkin") : href("health")}>
                <span className="grow">
                  <strong>{f.title}</strong>
                  <span className="meta">Before your visit · about {f.minutes} minutes</span>
                </span>
                <span className="chev"><Icon name="chevron" size={18} /></span>
              </a>
            ))}

            {balanceCents > 0 && (
              <a className="trow" href={href("billing")}>
                <span className="grow">
                  <strong>Balance {money(balanceCents)}</strong>
                  <span className="meta">Review or pay</span>
                </span>
                <span className="chev"><Icon name="chevron" size={18} /></span>
              </a>
            )}

            {unreadMessages > 0 && (
              <a className="trow" href={href("messages")}>
                <span className="grow">
                  <strong>
                    {unreadMessages === 1 ? "New message from your care team" : `${unreadMessages} new messages`}
                  </strong>
                  <span className="meta">Replies come within one business day</span>
                </span>
                <span className="chev"><Icon name="chevron" size={18} /></span>
              </a>
            )}
          </div>
        </section>
      ) : (
        <section className="pcard mint">
          <div className="pcard-head">
            <span className="lbl"><Icon name="check" size={16} /> All set</span>
          </div>
          <h2 className="headline sm">Nothing needs your attention.</h2>
          <p className="muted" style={{ marginTop: 8 }}>We'll let you know if that changes.</p>
        </section>
      )}

      {careTeam.length > 0 && (
        <section className="pcard">
          <div className="pcard-head"><span className="lbl">Your care team</span></div>
          <div className="tlist">
            {careTeam.map((m) => (
              <a className="trow" key={m.id} href={href("messages", "new")}>
                <span className="inline-face" aria-hidden="true">{nameInitials(m.name)}</span>
                <span className="grow">
                  <strong>{m.name} <span className="role">{m.role}</span></strong>
                  <span className="meta">{m.credential} · {m.cadence}</span>
                </span>
                <span className="chev"><Icon name="chevron" size={18} /></span>
              </a>
            ))}
          </div>
        </section>
      )}

      {lastVisit?.afterVisitSummary && (
        <section className="pcard">
          <div className="pcard-head">
            <span className="lbl">Your last visit · {longDate(lastVisit.startAt)}</span>
            <span className="sp" />
            <a className="iconbtn" href={href("visits", lastVisit.id)} aria-label="Read your last visit summary">
              <Icon name="arrow" size={19} />
            </a>
          </div>
          <h2 className="headline sm">
            {lastVisit.track === "therapy" ? "What we worked on" : "What we decided"}
          </h2>
          <p className="excerpt">{lastVisit.afterVisitSummary}</p>
        </section>
      )}
    </>
  );
}
