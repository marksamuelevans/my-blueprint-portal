import { href } from "../router";
import { Icon } from "../ui/icons";

/* Reachable from every screen in one tap.

   Deliberately plain: no imagery, no reassurance copy that delays the phone
   number, immediate actions first and context second. Someone arriving here
   is not reading — they are looking for a button. */

export default function Crisis() {
  return (
    <>
      <a className="backlink" href={href("home")}>
        <Icon name="back" size={16} /> Back
      </a>

      <h1 className="hello">Getting help now</h1>
      <p className="muted">
        If you're in danger or thinking about harming yourself, please use one of these. They're available
        all day, every day.
      </p>

      <a className="btn" href="tel:988" style={{ background: "var(--bp-critical)" }}>
        Call or text 988
      </a>
      <p className="muted" style={{ marginTop: -4 }}>
        The Suicide &amp; Crisis Lifeline — free, confidential, 24/7.
      </p>

      {/* RFC 5724 wants the query to open with "?". "sms:741741&body=HOME" is an
          iOS quirk; Android parses the whole tail as the recipient, so the one
          affordance offered to someone who cannot speak silently fails. */}
      <a className="btn ghost" href="sms:741741?&body=HOME">Text HOME to 741741</a>
      <p className="muted" style={{ marginTop: -4 }}>Crisis Text Line, if talking is hard right now.</p>

      <a className="btn ghost" href="tel:911">Call 911</a>
      <p className="muted" style={{ marginTop: -4 }}>If you or someone else is in immediate physical danger.</p>

      <section className="pcard" style={{ marginTop: 8 }}>
        <div className="pcard-head"><span className="lbl">Reaching Blueprint</span></div>
        <p className="body muted">
          Our office is open weekdays. Call <a href="tel:+16155550100">(615) 555-0100</a>.
          Messages in this app are answered within one business day, so please don't use them
          for anything urgent.
        </p>
      </section>
    </>
  );
}
