import * as api from "../data/api";
import { useAsync } from "../data/useAsync";
import { href, useRoute } from "../router";
import { ActionRow, Empty, ErrorNote, Loading, SectionTitle } from "../ui/bits";
import { Icon } from "../ui/icons";
import { joinable, longDate, time, until } from "../format";

export default function Visits() {
  const route = useRoute();
  return route.path[0] ? <VisitDetail id={route.path[0]} /> : <VisitList />;
}

function VisitList() {
  const upcoming = useAsync(() => api.getUpcomingVisits(), []);
  const past = useAsync(() => api.getPastVisits(), []);
  if (upcoming.loading) return <Loading />;
  if (upcoming.error) return <ErrorNote message={upcoming.error} />;

  return (
    <>
      <h1>Visits</h1>
      <SectionTitle>Coming up</SectionTitle>
      {upcoming.data?.length ? (
        upcoming.data.map((v) => (
          <ActionRow
            key={v.id}
            title={longDate(v.startAt)}
            meta={`${time(v.startAt)} · ${v.provider.name}${v.telehealth ? " · Video" : ""}`}
            to={href("visits", v.id)}
          />
        ))
      ) : (
        <Empty>Nothing booked yet.</Empty>
      )}

      <a className="btn ghost" href={href("messages")}>Request an appointment</a>

      <SectionTitle>Past visits</SectionTitle>
      {past.data?.length ? (
        past.data.map((v) => (
          <ActionRow
            key={v.id}
            quiet
            title={longDate(v.startAt)}
            meta={`${v.kind} · ${v.provider.name}`}
            to={href("visits", v.id)}
          />
        ))
      ) : (
        <Empty>Your past visits will appear here.</Empty>
      )}
    </>
  );
}

function VisitDetail({ id }: { id: string }) {
  const { data: visit, loading, error } = useAsync(() => api.getVisit(id), [id]);
  if (loading) return <Loading lines={2} />;
  if (error) return <ErrorNote message={error} />;
  if (!visit) return <Empty>We couldn't find that visit.</Empty>;

  const canJoin = visit.status !== "completed" && joinable(visit.startAt);
  const isPast = visit.status === "completed";

  return (
    <>
      <a className="muted" href={href("visits")} style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
        <Icon name="back" size={16} /> All visits
      </a>

      <section className="hero">
        <span className="eyebrow">{isPast ? "Past visit" : canJoin ? `Starts ${until(visit.startAt)}` : "Upcoming"}</span>
        <h2>{longDate(visit.startAt)}</h2>
        <p className="sub">
          {time(visit.startAt)} · {visit.provider.name}, {visit.provider.credential} · {visit.kind}
        </p>
      </section>

      {canJoin && (
        <a className="btn" href={href("visits", visit.id, "join")}>
          <Icon name="video" size={20} /> Join visit
        </a>
      )}

      {/* A purpose-written patient artifact — deliberately not the clinical note. */}
      {visit.afterVisitSummary && (
        <section className="card">
          <span className="eyebrow-s">What we decided</span>
          <p style={{ marginTop: 8 }}>{visit.afterVisitSummary}</p>
        </section>
      )}

      {!isPast && (
        <>
          <ActionRow quiet title="Reschedule or cancel" to={href("messages")} />
          <ActionRow quiet title="Add to your calendar" onClick={() => {}} />
        </>
      )}

      <p className="muted" style={{ textAlign: "center" }}>
        Having trouble? Call <a href="tel:+16155550100">(615) 555-0100</a>
      </p>
    </>
  );
}
