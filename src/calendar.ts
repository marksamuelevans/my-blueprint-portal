import type { Visit } from "./data/types";

/* ============================================================
   CALENDAR EXPORT

   A calendar entry leaves the portal and lands somewhere we don't control —
   a phone on a kitchen counter, a work account, a calendar shared with a
   partner or a parent. "Psychiatry medication follow-up with Bailey Dryden,
   PMHNP-BC" on a shared calendar discloses a diagnosis-adjacent fact to
   whoever glances at the screen.

   So the discreet version is the DEFAULT and the detailed one is opt-in,
   rather than the other way round.
   ============================================================ */

const pad = (n: number) => String(n).padStart(2, "0");

/** ICS wants UTC as YYYYMMDDTHHMMSSZ. */
function utc(iso: string): string {
  const d = new Date(iso);
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" +
    pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z"
  );
}

/** RFC 5545: escape, then fold at 75 octets. */
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

function fold(line: string): string {
  if (line.length <= 75) return line;
  const out = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) { out.push(" " + rest.slice(0, 74)); rest = rest.slice(74); }
  if (rest) out.push(" " + rest);
  return out.join("\r\n");
}

export function buildIcs(visit: Visit, opts: { detailed: boolean; joinUrl: string }): string {
  const title = opts.detailed
    ? `${visit.kind} with ${visit.provider.name}`
    : "Appointment";
  const description = opts.detailed
    ? `${visit.kind} with ${visit.provider.name}, ${visit.provider.credential}. ` +
      (visit.telehealth ? `Join from My Blueprint: ${opts.joinUrl}` : "In the office.")
    : `Open My Blueprint when it's time: ${opts.joinUrl}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Blueprint Integrative Mental Health//My Blueprint//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${visit.id}@blueprintmental.health`,
    `DTSTAMP:${utc(new Date().toISOString())}`,
    `DTSTART:${utc(visit.startAt)}`,
    `DTEND:${utc(visit.endAt)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(description)}`,
    `LOCATION:${esc(visit.telehealth ? "Video visit" : "Blueprint Integrative Mental Health")}`,
    `URL:${esc(opts.joinUrl)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(opts.detailed ? title : "Appointment")}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function downloadIcs(visit: Visit, detailed: boolean): void {
  const joinUrl = `${location.origin}${location.pathname}#/visits/${visit.id}/join`;
  const blob = new Blob([buildIcs(visit, { detailed, joinUrl })], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `appointment-${visit.startAt.slice(0, 10)}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
