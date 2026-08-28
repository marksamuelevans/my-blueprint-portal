import * as api from "../data/api";
import { useAsync } from "../data/useAsync";
import { href } from "../router";
import { ErrorNote, Loading } from "../ui/bits";
import { Icon } from "../ui/icons";
import { shortDate } from "../format";
import { signOut } from "../data/auth";

type RowProps = { title: string; meta?: React.ReactNode; to?: string };

function Row({ title, meta, to }: RowProps) {
  const inner = (
    <>
      <span className="grow">
        <strong>{title}</strong>
        {meta && <span className="meta">{meta}</span>}
      </span>
      <span className="chev"><Icon name="chevron" size={18} /></span>
    </>
  );
  return to
    ? <a className="trow" href={to}>{inner}</a>
    : <button className="trow" onClick={() => {}}>{inner}</button>;
}

export default function Account({ onSignOut }: { onSignOut: () => void }) {
  const { data, loading, error } = useAsync(() => api.getHomeSummary(), []);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "We couldn't load your account."} />;
  const p = data.patient;

  return (
    <>
      <a className="backlink" href={href("home")}>
        <Icon name="back" size={16} /> Home
      </a>

      <section className="pcard">
        <div className="pcard-head"><span className="lbl">Born {shortDate(p.dob)}</span></div>
        <h2 className="headline sm">{p.preferredName ?? p.firstName} {p.lastName}</h2>
        <div className="tlist">
          <Row title="Contact information" meta={<>{p.mobile}<br />{p.email}</>} />
          <Row title="Insurance on file" to={href("billing")} />
          <Row title="Documents and forms" />
        </div>
      </section>

      <section className="pcard">
        <div className="pcard-head"><span className="lbl">Notifications</span></div>
        <div className="tlist">
          <Row title="How we reach you" meta="Text, email, and app alerts" />
        </div>
        <div className="pcard-foot">
          <span>
            We never include health details in text messages or lock-screen alerts —
            only that something is waiting for you here.
          </span>
        </div>
      </section>

      <section className="pcard">
        <div className="pcard-head"><span className="lbl">Security</span></div>
        <div className="tlist">
          <Row title="Password and two-step sign-in" />
          <Row title="Where you're signed in" />
        </div>
      </section>

      <section className="pcard">
        <div className="pcard-head"><span className="lbl">Help</span></div>
        <div className="tlist">
          <Row title="Getting help now" to={href("crisis")} />
          <Row title="Contact the office" meta="(615) 555-0100" />
        </div>
      </section>

      <button className="btn ghost" onClick={() => { signOut(); onSignOut(); }}>
        Sign out
      </button>
    </>
  );
}
