import { useMemo, useState } from "react";
import * as api from "../data/api";
import { useAsync } from "../data/useAsync";
import { href, navigate } from "../router";
import { ErrorNote, Loading } from "../ui/bits";
import { Icon } from "../ui/icons";
import type { CheckinAnswer, CheckinResult } from "../data/types";

/* ============================================================
   "HOW YOU'VE BEEN FEELING" — PHQ-9 and GAD-7 before a visit.

   The whole design turns on one question. PHQ-9 item 9 asks about thoughts
   of being better off dead. If a patient endorses it, the screen has to
   respond THEN — while they are still holding the phone — not on submit and
   not in a clinician's queue on Monday morning.

   So: answering item 9 above "Not at all" opens crisis routing inline,
   immediately, without blocking the rest of the form and without a modal
   that has to be dismissed. The patient is also told, in plain words, that
   the office will see it and when. Never "someone will be in touch" — a
   patient in that moment deserves to know exactly what happens next.

   The other 15 questions are ordinary. One screen, thumb-reachable options,
   progress that never scolds.
   ============================================================ */

const OPTIONS = [
  { v: 0 as const, label: "Not at all" },
  { v: 1 as const, label: "Several days" },
  { v: 2 as const, label: "More than half the days" },
  { v: 3 as const, label: "Nearly every day" },
];

export default function Checkin() {
  const { data: questions, loading, error } = useAsync(() => api.getCheckinQuestions(), []);
  const [answers, setAnswers] = useState<Record<string, 0 | 1 | 2 | 3>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<CheckinResult | null>(null);

  const answered = Object.keys(answers).length;
  const total = questions?.length ?? 0;
  const safetyQ = useMemo(() => questions?.find((q) => q.safety), [questions]);
  const safetyEndorsed = safetyQ ? (answers[safetyQ.id] ?? 0) > 0 : false;

  if (loading) return <Loading />;
  if (error || !questions) return <ErrorNote message={error ?? "We couldn't load the check-in."} />;

  if (done) return <Submitted result={done} />;

  const submit = async () => {
    setBusy(true);
    const payload: CheckinAnswer[] = Object.entries(answers).map(([id, value]) => ({ id, value }));
    const res = await api.submitCheckin(payload);
    setBusy(false);
    setDone(res);
  };

  return (
    <>
      <a className="backlink" href={href("health")}>
        <Icon name="back" size={16} /> Health
      </a>
      <h1 className="hello">How you've been feeling</h1>

      <section className="pcard">
        <div className="pcard-head"><span className="lbl">Over the last 2 weeks</span></div>
        <p className="body">
          How often have you been bothered by any of the following? There are no
          wrong answers, and you can stop and come back.
        </p>
        <div className="pcard-foot">
          <span>{answered} of {total} answered · about 3 minutes</span>
        </div>
      </section>

      {questions.map((q, i) => {
        const value = answers[q.id];
        return (
          <section className="pcard" key={q.id}>
            <div className="pcard-head">
              <span className="lbl">Question {i + 1}</span>
              {value !== undefined && <><span className="sp" /><span className="chip ok">Answered</span></>}
            </div>

            <fieldset className="qset">
              <legend className="qtext">{q.text}</legend>
              <div className="opts">
                {OPTIONS.map((o) => (
                  <label className={`opt-btn${value === o.v ? " on" : ""}`} key={o.v}>
                    <input
                      type="radio" name={q.id} value={o.v}
                      checked={value === o.v}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.v }))}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Not a modal, not on submit — here, now, and it does not block
                the rest of the form. */}
            {q.safety && safetyEndorsed && (
              <div className="safety" role="alert">
                <strong>Thank you for saying that.</strong>
                <p>
                  You don't have to wait for your visit. If you're thinking about hurting
                  yourself, talk to someone now — it's free, confidential, and open all day,
                  every day.
                </p>
                <a className="btn" href="tel:988" style={{ background: "var(--bp-critical)" }}>
                  Call or text 988
                </a>
                <a className="btn ghost" href={href("crisis")}>Other ways to get help</a>
                <p className="fine">
                  Blueprint will see this answer when you send the check-in, and the office
                  will reach out on the next business day. If you need someone before then,
                  call <a href="tel:+16155550100">(615) 555-0100</a> or use 988 above.
                </p>
              </div>
            )}
          </section>
        );
      })}

      <button className="btn" onClick={submit} disabled={busy || answered === 0}>
        {busy ? "Sending…" : answered < total ? `Send what I've answered (${answered}/${total})` : "Send my check-in"}
      </button>
      <p className="muted" style={{ textAlign: "center" }}>
        Your answers go to your care team, not to anyone else.
      </p>
    </>
  );
}

function Submitted({ result }: { result: CheckinResult }) {
  return (
    <>
      <section className={`pcard ${result.flagged ? "" : "mint"}`}>
        <div className="pcard-head">
          <span className={`lbl ${result.flagged ? "alert" : "ok"}`}>
            {!result.flagged && <Icon name="check" size={16} />} Check-in sent
          </span>
        </div>
        <h2 className="headline sm">
          {result.flagged ? <>We've got this, and we've read it.</> : <>Thanks — that's done.</>}
        </h2>
        <p className="body muted">
          {result.flagged
            ? "Because of one of your answers, the office has been notified and will reach out on the next business day. If you need someone sooner, call or text 988 — any time, day or night."
            : "Your care team will look at this before your visit, so you won't have to start from the beginning."}
        </p>
        {result.flagged && (
          <a className="btn" href="tel:988" style={{ background: "var(--bp-critical)" }}>
            Call or text 988
          </a>
        )}
      </section>

      <section className="pcard">
        <div className="pcard-head"><span className="lbl">What happens next</span></div>
        <div className="tlist">
          <button className="trow" onClick={() => navigate("visits")}>
            <span className="grow"><strong>See your next visit</strong>
              <span className="meta">Your answers will be there too</span></span>
            <span className="chev"><Icon name="chevron" size={18} /></span>
          </button>
          <button className="trow" onClick={() => navigate("messages", "new")}>
            <span className="grow"><strong>Add something in a message</strong>
              <span className="meta">If there's more you want us to know</span></span>
            <span className="chev"><Icon name="chevron" size={18} /></span>
          </button>
        </div>
      </section>
    </>
  );
}
