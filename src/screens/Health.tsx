import { useState } from "react";
import * as api from "../data/api";
import { useAsync } from "../data/useAsync";
import { href } from "../router";
import { ActionRow, Empty, ErrorNote, Loading, SectionTitle } from "../ui/bits";
import { shortDate } from "../format";

export default function Health() {
  const [tick, setTick] = useState(0);
  const { data, loading, error } = useAsync(() => api.getMedications(), [tick]);
  const [busy, setBusy] = useState<string | null>(null);

  const refill = async (id: string) => {
    setBusy(id);
    await api.requestRefill(id);
    setBusy(null);
    setTick((t) => t + 1);
  };

  if (loading) return <Loading />;
  if (error) return <ErrorNote message={error} />;

  return (
    <>
      <h1>Health</h1>
      <SectionTitle>Your medications</SectionTitle>

      {data?.length ? (
        data.map((m) => (
          <section className="card" key={m.id}>
            <strong style={{ fontFamily: "var(--bp-font-display)", fontSize: 17 }}>
              {m.name} {m.strength}
            </strong>
            <p className="muted" style={{ marginTop: 2 }}>{m.sig} · {m.prescriber}</p>

            {m.refill ? (
              <p className="chip info" style={{ marginTop: 12 }}>
                Refill requested {shortDate(m.refill.requestedAt)} · allow 2 business days
              </p>
            ) : m.controlled ? (
              <>
                {/* Controlled substances behave differently — say so before the
                    patient taps, rather than failing the request afterwards. */}
                <p className="muted" style={{ marginTop: 12 }}>
                  This medication needs a visit before it can be refilled.
                </p>
                <a className="btn ghost" href={href("visits")} style={{ marginTop: 10 }}>
                  Request an appointment
                </a>
              </>
            ) : (
              <button
                className="btn"
                style={{ marginTop: 12 }}
                onClick={() => refill(m.id)}
                disabled={busy === m.id}
              >
                {busy === m.id ? "Sending…" : "Request refill"}
              </button>
            )}
          </section>
        ))
      ) : (
        <Empty>No medications on file.</Empty>
      )}

      <SectionTitle>Check-ins</SectionTitle>
      <ActionRow
        title="How you've been feeling"
        meta="About 3 minutes · before your next visit"
        onClick={() => {}}
      />

      <SectionTitle>Your information</SectionTitle>
      <ActionRow quiet title="Profile and contact details" to={href("account")} />
      <ActionRow quiet title="Documents" to={href("account")} />
    </>
  );
}
