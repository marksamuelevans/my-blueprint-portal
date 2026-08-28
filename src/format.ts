/* Plain-language formatting. Patients read "Thursday, September 3", never
   "09/03/26" and never a 24-hour clock. */

const DAY = 86_400_000;
const NB = "\u00A0";

/* Dates and times are single units: "September 2" and "3:00 PM" must never
   break across lines. Large display type on a 320px screen will split them
   otherwise, which reads as two facts instead of one. */
const glueTrailingNumber = (s: string) => s.replace(/ (\d+)$/, NB + "$1");
const glueMeridiem = (s: string) => s.replace(/[\s\u202F](AM|PM|am|pm)$/, NB + "$1");

export const money = (cents: number) =>
  (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });

export const time = (iso: string) =>
  glueMeridiem(new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }));

export const longDate = (iso: string) =>
  glueTrailingNumber(new Date(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }));

export const shortDate = (iso: string) =>
  glueTrailingNumber(new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }));

/** "in 8 minutes" · "tomorrow" · "in 6 days" — never a raw countdown. */
export function until(iso: string): string {
  const ms = Date.parse(iso) - Date.now();
  if (ms < 0) return "now";
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `in ${mins} minute${mins === 1 ? "" : "s"}`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(ms / DAY);
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

/** The waiting room opens 5 minutes before the hour. Earlier than that and
    there is nothing to wait in; later and people think they are late. */
export const JOIN_WINDOW_MS = 5 * 60_000;
export const joinable = (iso: string) => Date.parse(iso) - Date.now() < JOIN_WINDOW_MS;

export const initials = (first: string, last: string) =>
  (first[0] ?? "").toUpperCase() + (last[0] ?? "").toUpperCase();

/** "Bailey Dryden" -> "BD". Falls back gracefully on single-word names. */
export function nameInitials(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
