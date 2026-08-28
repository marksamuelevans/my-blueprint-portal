/* Plain-language formatting. Patients read "Thursday, September 3", never
   "09/03/26" and never a 24-hour clock. */

const DAY = 86_400_000;

export const money = (cents: number) =>
  (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });

export const time = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

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

/** Within this window the visit is joinable and the UI shifts to Join. */
export const joinable = (iso: string) => Date.parse(iso) - Date.now() < 15 * 60_000;

export const initials = (first: string, last: string) =>
  (first[0] ?? "").toUpperCase() + (last[0] ?? "").toUpperCase();

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
