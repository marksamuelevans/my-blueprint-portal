import * as api from "../data/api";
import { useAsync } from "../data/useAsync";
import { href, useRoute } from "../router";
import { Empty, ErrorNote, Loading } from "../ui/bits";
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

  const unread = data?.filter((t) => t.unread).length ?? 0;

  return (
    <>
      <h1 className="hello">Messages</h1>

      {/* SLA and crisis routing sit above the list, never buried in a footer.
          The panel stays white — a red card would alarm the people least able
          to afford it — and only the label carries the tone. */}
      <section className="pcard">
        <div className="pcard-head">
          <span className="lbl alert">Messages aren't for emergencies</span>
        </div>
        <p className="body">
          We reply within one business day. If something is urgent, call{" "}
          <a href="tel:+16155550100">(615) 555-0100</a>. If you're in crisis,{" "}
          <a href={href("crisis")}>get help now</a>.
        </p>
      </section>

      {data?.length ? (
        <section className="pcard">
          <div className="pcard-head">
            <span className="lbl">Your conversations</span>
            {unread > 0 && (
              <>
                <span className="sp" />
                <span className="chip warn">{unread} new</span>
              </>
            )}
          </div>
          <div className="tlist">
            {data.map((t) => (
              <a className="trow" key={t.id} href={href("messages", t.id)}>
                <span className="grow">
                  <strong>{t.subject}</strong>
                  <span className="meta">
                    {shortDate(t.updatedAt)}{t.unread ? " · New reply" : ""}
                  </span>
                </span>
                <span className="chev"><Icon name="chevron" size={18} /></span>
              </a>
            ))}
          </div>
        </section>
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
      <a className="backlink" href={href("messages")}>
        <Icon name="back" size={16} /> Messages
      </a>
      <h1 className="hello">{data.subject}</h1>

      {data.messages.map((m) => (
        <section className={`pcard${m.from === "patient" ? " mine" : ""}`} key={m.id}>
          <div className="pcard-head">
            <span className="lbl">
              {m.from === "patient" ? "You" : m.authorName} · {shortDate(m.sentAt)} at {time(m.sentAt)}
            </span>
          </div>
          <p className="body">{m.body}</p>
        </section>
      ))}

      <a className="btn ghost" href={href("messages", "new")}>Reply</a>
    </>
  );
}
