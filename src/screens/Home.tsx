import { useState } from "react";
import * as api from "../data/api";
import { useAsync } from "../data/useAsync";
import { href } from "../router";
import { ActionRow, ErrorNote, Loading } from "../ui/bits";
import { Icon } from "../ui/icons";
import { greeting, joinable, longDate, money, time, until } from "../format";

/* The dashboard answers one question — what do I need to do right now —
   and shows nothing that isn't an answer to it. */

export default function Home() {
  const [tick, setTick] = useState(0);
  const { data, loading, error } = useAsync(() => api.getHomeSummary(), [tick]);
  const [confirming, setConfirming] = useState(false);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "We couldn't load your home page."} />;

  const { patient, nextVisit, formsDue, balanceCents, unreadMessages, lastVisit } = data;
  const name = patient.preferredName ?? patient.firstName;
  const canJoin = nextVisit ? joinable(nextVisit.startAt) : false;
  const nothingDue = !formsDue.length && balanceCents === 0 && unreadMessages === 0;

  const confirm = async () => {
    if (!nextVisit) return;
    setConfirming(true);
    await api.confirmVisit(nextVisit.id);
    setConfirming(false);
    setTick((t) => t + 1);
  };

  return (
    <>
      <h1>{greeting()}, {name}</h1>

      {nextVisit ? (
        <section className="hero">
          <span className="eyebrow">{canJoin ? `Starts ${until(nextVisit.startAt)}` : "Your next visit"}</span>
          <h2>{longDate(nextVisit.startAt)}</h2>
          <p className="sub">
            {time(nextVisit.startAt)} · {nextVisit.provider.name}, {nextVisit.provider.credential}
            {nextVisit.telehealth ? " · Video visit" : ""}
          </p>
          <div className="btn-row" style={{ marginTop: 16 }}>
            {canJoin ? (
              <a className="btn" href={href("visits", nextVisit.id)}>
                <Icon name="video" size={20} /> Join visit
              </a>
            ) : nextVisit.status === "confirmed" ? (
              <a className="btn on-dark" href={href("visits", nextVisit.id)}>View details</a>
            ) : (
              <>
                <button className="btn on-dark" onClick={confirm} disabled={confirming}>
                  {confirming ? "Confirming…" : "Confirm"}
                </button>
                <a className="btn on-dark" href={href("visits", nextVisit.id)}>Reschedule</a>
              </>
            )}
          </div>
          {nextVisit.status === "confirmed" && (
            <p className="sub" style={{ marginTop: 12 }}>Confirmed — we'll see you then.</p>
          )}
        </section>
      ) : (
        <section className="card">
          <h2>No visits booked</h2>
          <p className="muted" style={{ margin: "6px 0 16px" }}>When you're ready, we'll find a time that works.</p>
          <a className="btn" href={href("visits")}>Request an appointment</a>
        </section>
      )}

      {formsDue.map((f) => (
        <ActionRow
          key={f.id}
          title={f.title}
          meta={`Before your visit · about ${f.minutes} minutes`}
          to={href("health")}
        />
      ))}

      {balanceCents > 0 && (
        <ActionRow title={`Balance ${money(balanceCents)}`} meta="Tap to review or pay" to={href("billing")} />
      )}

      {unreadMessages > 0 && (
        <ActionRow
          title={unreadMessages === 1 ? "New message from your care team" : `${unreadMessages} new messages`}
          to={href("messages")}
        />
      )}

      {nothingDue && (
        <div className="card">
          <strong>Nothing needs your attention</strong>
          <p className="muted" style={{ marginTop: 4 }}>We'll let you know if that changes.</p>
        </div>
      )}

      {lastVisit?.afterVisitSummary && (
        <ActionRow
          quiet
          title="Your last visit summary"
          meta={longDate(lastVisit.startAt)}
          to={href("visits", lastVisit.id)}
        />
      )}
    </>
  );
}
