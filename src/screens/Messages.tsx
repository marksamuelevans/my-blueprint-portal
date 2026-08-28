import { useEffect, useRef, useState } from "react";
import * as api from "../data/api";
import { useAsync } from "../data/useAsync";
import { href, navigate, useRoute } from "../router";
import { Empty, ErrorNote, Loading } from "../ui/bits";
import { Icon } from "../ui/icons";
import { nameInitials, shortDate, time } from "../format";
import type { MessageRecipient, Thread } from "../data/types";

export default function Messages() {
  const route = useRoute();
  const first = route.path[0];
  if (first === "new") return <Compose />;
  return first ? <ThreadView id={first} /> : <ThreadList />;
}

/* ---------------------------------------------------------------- list */

function ThreadList() {
  const { data, loading, error } = useAsync(() => api.getThreads(), []);
  if (loading && !data) return <Loading />;
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
            {unread > 0 && <><span className="sp" /><span className="chip warn">{unread} new</span></>}
          </div>
          <div className="tlist">
            {data.map((t) => (
              <a className="trow" key={t.id} href={href("messages", t.id)}>
                <span className="grow">
                  <strong>{t.subject}</strong>
                  <span className="meta">
                    {t.withName} · {shortDate(t.updatedAt)}
                    {t.awaitingReply ? " · Sent" : t.unread ? " · New reply" : ""}
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

      <a className="btn" href={href("messages", "new")}>
        <Icon name="send" size={19} /> Send a message
      </a>
    </>
  );
}

/* ------------------------------------------------------------- compose */

function Compose() {
  const { data: recipients, loading } = useAsync(() => api.getRecipients(), []);
  const [to, setTo] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  if (loading || !recipients) return <Loading />;

  const chosen = to ?? recipients[0]?.id ?? "office";
  const canSend = body.trim().length > 1 && !sending;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setSending(true); setErr("");
    try {
      const t = await api.createThread({ recipientId: chosen, subject, body });
      navigate("messages", t.id);
    } catch {
      setSending(false);
      setErr("We couldn't send that. Try again, or call (615) 555-0100.");
    }
  };

  return (
    <form onSubmit={send} style={{ display: "contents" }}>
      <a className="backlink" href={href("messages")}>
        <Icon name="back" size={16} /> Messages
      </a>
      <h1 className="hello">New message</h1>

      {/* The track model earns its keep here: the patient picks a person and a
          purpose, not a department, and never has to know which clinician owns
          which kind of question. */}
      <section className="pcard">
        <div className="pcard-head"><span className="lbl">Who is this for?</span></div>
        <div className="tlist">
          {recipients.map((r) => (
            <RecipientRow key={r.id} r={r} on={chosen === r.id} pick={() => setTo(r.id)} />
          ))}
        </div>
      </section>

      <section className="pcard">
        <div className="pcard-head"><span className="lbl">Your message</span></div>

        <label className="fld" htmlFor="m-subject">What's it about?</label>
        <input
          id="m-subject" className="inp" value={subject} maxLength={80}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="A few words"
        />

        <label className="fld" htmlFor="m-body">Message</label>
        <textarea
          id="m-body" className="inp ta" value={body} rows={6} maxLength={2000}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Take as much space as you need."
        />
        <p className="cnt">{body.length}/2000</p>

        {err && <p className="login-err" role="alert">{err}</p>}

        <button className="btn" disabled={!canSend}>
          {sending ? "Sending…" : "Send"}
        </button>

        <div className="pcard-foot">
          <span>
            We reply within one business day. This isn't the place for anything
            urgent — call <a href="tel:+16155550100">(615) 555-0100</a> instead.
          </span>
        </div>
      </section>
    </form>
  );
}

function RecipientRow({ r, on, pick }: { r: MessageRecipient; on: boolean; pick: () => void }) {
  return (
    <button type="button" className={`trow pickable${on ? " on" : ""}`} onClick={pick} aria-pressed={on}>
      <span className="pick" aria-hidden="true">{on && <Icon name="check" size={15} />}</span>
      <span className="grow">
        <strong>{r.name} <span className="role">{r.role}</span></strong>
        <span className="meta">{r.good_for}</span>
      </span>
    </button>
  );
}

/* -------------------------------------------------------------- thread */

function ThreadView({ id }: { id: string }) {
  const [thread, setThread] = useState<Thread | null | undefined>(undefined);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { void api.getThread(id).then(setThread); }, [id]);

  /* The sandbox answers after a few seconds; poll only while one is expected
     so an idle thread costs nothing. */
  useEffect(() => {
    if (!thread?.awaitingReply) return;
    const t = window.setInterval(() => { void api.getThread(id).then(setThread); }, 1500);
    return () => window.clearInterval(t);
  }, [id, thread?.awaitingReply]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); },
    [thread?.messages.length]);

  if (thread === undefined) return <Loading lines={2} />;
  if (thread === null) return <Empty>We couldn't find that conversation.</Empty>;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reply.trim().length < 2 || sending) return;
    setSending(true);
    const t = await api.sendReply(id, reply);
    setReply(""); setSending(false);
    if (t) setThread(t);
  };

  return (
    <>
      <a className="backlink" href={href("messages")}>
        <Icon name="back" size={16} /> Messages
      </a>
      <h1 className="hello">{thread.subject}</h1>
      <p className="muted" style={{ marginTop: -6 }}>With {thread.withName}</p>

      {thread.messages.map((m) => (
        <section className={`pcard${m.from === "patient" ? " mine" : ""}`} key={m.id}>
          <div className="pcard-head">
            <span className="lbl">
              {m.from === "patient" ? (
                <>You · {shortDate(m.sentAt)} at {time(m.sentAt)}</>
              ) : (
                <>
                  <span className="inline-face sm" aria-hidden="true">{nameInitials(m.authorName)}</span>
                  {m.authorName} · {shortDate(m.sentAt)} at {time(m.sentAt)}
                </>
              )}
            </span>
          </div>
          <p className="body">{m.body}</p>
        </section>
      ))}

      {thread.awaitingReply && (
        <p className="await" role="status">
          <span className="typing" aria-hidden="true"><i /><i /><i /></span>
          Sent — {thread.withName.split(" ")[0]} usually replies within one business day.
        </p>
      )}

      <div ref={endRef} />

      <form className="pcard composer" onSubmit={send}>
        <label className="fld" htmlFor="m-reply">Reply</label>
        <textarea
          id="m-reply" className="inp ta" rows={3} value={reply} maxLength={2000}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write back…"
        />
        <button className="btn" disabled={reply.trim().length < 2 || sending}>
          {sending ? "Sending…" : <><Icon name="send" size={19} /> Send</>}
        </button>
      </form>
    </>
  );
}
