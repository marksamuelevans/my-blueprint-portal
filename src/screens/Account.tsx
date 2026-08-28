import * as api from "../data/api";
import { useAsync } from "../data/useAsync";
import { href } from "../router";
import { ActionRow, ErrorNote, Loading, SectionTitle } from "../ui/bits";
import { Icon } from "../ui/icons";
import { shortDate } from "../format";

export default function Account() {
  const { data, loading, error } = useAsync(() => api.getHomeSummary(), []);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorNote message={error ?? "We couldn't load your account."} />;
  const p = data.patient;

  return (
    <>
      <a className="muted" href={href("home")} style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
        <Icon name="back" size={16} /> Home
      </a>

      <h1>{p.preferredName ?? p.firstName} {p.lastName}</h1>
      <p className="muted">Born {shortDate(p.dob)}</p>

      <SectionTitle>Your details</SectionTitle>
      <ActionRow quiet title="Contact information" meta={<>{p.mobile}<br />{p.email}</>} onClick={() => {}} />
      <ActionRow quiet title="Insurance on file" to={href("billing")} />
      <ActionRow quiet title="Documents and forms" onClick={() => {}} />

      <SectionTitle>Notifications</SectionTitle>
      <ActionRow quiet title="How we reach you" meta="Text, email, and app alerts" onClick={() => {}} />
      <p className="muted">
        We never include health details in text messages or lock-screen alerts — only that
        something is waiting for you here.
      </p>

      <SectionTitle>Security</SectionTitle>
      <ActionRow quiet title="Password and two-step sign-in" onClick={() => {}} />
      <ActionRow quiet title="Where you're signed in" onClick={() => {}} />

      <SectionTitle>Help</SectionTitle>
      <ActionRow quiet title="Getting help now" to={href("crisis")} />
      <ActionRow quiet title="Contact the office" meta="(615) 555-0100" onClick={() => {}} />
    </>
  );
}
