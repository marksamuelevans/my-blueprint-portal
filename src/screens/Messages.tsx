import * as api from "../data/api";
import { useAsync } from "../data/useAsync";
import { href, useRoute } from "../router";
import { ActionRow, Empty, ErrorNote, Loading } from "../ui/bits";
import { Icon } from "../ui/icons";
import { shortDate, time } from "../format";

export default function Messages() {
  const route = useRoute();
  return route.path[0] ? <ThreadView id={route.path[0]} /> : <ThreadList />;
}

function ThreadList() {
  const { data, loading, error } = useAsync(() => api.getThreads(), []);
  if (loading) return <Loading />;
  if (error) return <ErrorNote message={error} />;

  return (
    <>
      <h1>Messages</h1>

      {/* SLA and crisis routing sit above the list, never buried in a footer. */}
      <section className="card" style={{ borderLeft: "3px solid var(--bp-critical)" }}>
        <strong>Messages aren't for emergencies</strong>
        <p className="muted" style={{ marginTop: 4 }}>
          We reply within one business day. If something is urgent, call{" "}
          <a href="tel:+16155550100">(615) 555-0100</a>. If you're in crisis,{" "}
          <a href={href("crisis")}>get help now</a>.
        </p>
      </section>

      {data?.length ? (
        data.map((t) => (
          <ActionRow
            key={t.id}
            quiet={!t.unread}
            title={t.subject}
            meta={`${shortDate(t.updatedAt)}${t.unread ? " · New reply" : ""}`}
            to={href("messages", t.id)}
          />
        ))
      ) : (
        <Empty>No messages yet.</Empty>
      )}

      <a className="btn" href={href("messages", "new")}>Send a message</a>
    </>
  );
}

function ThreadView({ id }: { id: string }) {
  const { data, loading, error } = useAsync(() => api.getThread(id), [id]);
  if (loading) return <Loading lines={2} />;
  if (error) return <ErrorNote message={error} />;
  if (!data) return <Empty>We couldn't find that conversation.</Empty>;

  return (
    <>
      <a className="muted" href={href("messages")} style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
        <Icon name="back" size={16} /> Messages
      </a>
      <h1>{data.subject}</h1>
      {data.messages.map((m) => (
        <section key={m.id} className="card" style={m.from === "patient" ? { background: "var(--bp-brand-100)", borderColor: "transparent" } : undefined}>
          <span className="eyebrow-s">{m.authorName} · {shortDate(m.sentAt)} at {time(m.sentAt)}</span>
          <p style={{ marginTop: 8 }}>{m.body}</p>
        </section>
      ))}
    </>
  );
}
